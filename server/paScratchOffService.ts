import https from 'https';
import { type ScratchOffGame, type ScratchOffPrizeTier } from './scratchOffService';

// Pennsylvania Lottery remaining prizes
// Source: https://www.palottery.pa.gov/scratch-offs/Print-Scratch-Offs.aspx?gametype=Remaining
// PA publishes: game number, game name, ticket price, top 6 prizes + wins remaining per tier
// Updated on PA's schedule (see page footer — typically weekly)

const PA_URL = 'https://www.palottery.pa.gov/scratch-offs/Print-Scratch-Offs.aspx?gametype=Remaining';
const CACHE_TTL = 3600 * 1000; // 1 hour

let cache: { data: ScratchOffGame[]; fetchedAt: number } | null = null;

export function clearPACache() { cache = null; }

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml',
        'User-Agent': 'Mozilla/5.0 (compatible; LotteryPro/1.0)',
      }
    }, (res) => {
      // Follow redirects
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchHtml(res.headers.location).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
}

function splitBr(html: string): string[] {
  return html.split(/<br\s*\/?>/i).map(s => stripTags(s).trim()).filter(Boolean);
}

function parsePrizeAmount(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/[^0-9.]/g, '');
  return parseFloat(clean) || 0;
}

function parseWins(str: string): number {
  if (!str) return 0;
  const clean = str.replace(/,/g, '').trim();
  return parseInt(clean) || 0;
}

function extractTableRows(html: string): string[][] {
  const rows: string[][] = [];

  // Find the prizes remaining table (skip header row)
  const tableMatch = html.match(/<table[^>]*>([\s\S]*?)<\/table>/gi);
  if (!tableMatch) return rows;

  for (const table of tableMatch) {
    const trMatches = table.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
    for (const tr of trMatches) {
      const tdMatches = tr.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      if (tdMatches.length < 5) continue;
      rows.push(tdMatches.map(td => td.replace(/^<td[^>]*>/i, '').replace(/<\/td>$/i, '')));
    }
  }

  return rows;
}

export async function getPAScratchOffGames(): Promise<ScratchOffGame[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  const html = await fetchHtml(PA_URL);
  const rows = extractTableRows(html);
  const games: ScratchOffGame[] = [];
  const seen = new Set<string>();

  for (const cells of rows) {
    // cells[0] = game number (may have "NEW" text)
    // cells[1] = game name (anchor tag, may have second-chance badge)
    // cells[2] = price
    // cells[3] = top six prize amounts
    // cells[4] = wins remaining for each tier

    const gameNumRaw = stripTags(cells[0]);
    const gameNumMatch = gameNumRaw.match(/(\d{4})/);
    if (!gameNumMatch) continue;
    const gameNumber = gameNumMatch[1];
    if (seen.has(gameNumber)) continue;
    seen.add(gameNumber);

    // Extract game name from anchor tag
    const nameMatch = cells[1].match(/<a[^>]*>([^<]+)<\/a>/i);
    if (!nameMatch) continue;
    const gameName = nameMatch[1].replace(/&amp;/g, '&').trim();

    // Price: "$1", "$2", "$5", "$10", "$20", "$30", "$50"
    const priceRaw = stripTags(cells[2]);
    const priceMatch = priceRaw.match(/\$(\d+)/);
    if (!priceMatch) continue;
    const price = parseInt(priceMatch[1]);

    // Top six prizes and wins remaining (parallel arrays, split by <br>)
    const prizeStrs = splitBr(cells[3]);
    const winsStrs = splitBr(cells[4]);

    if (prizeStrs.length === 0) continue;

    const prizeTiers: ScratchOffPrizeTier[] = [];
    for (let i = 0; i < Math.min(prizeStrs.length, winsStrs.length); i++) {
      const prizeValue = parsePrizeAmount(prizeStrs[i]);
      const unpaid = parseWins(winsStrs[i]);
      if (prizeValue > 0) {
        prizeTiers.push({
          prizeAmount: prizeStrs[i].trim(),
          prizeValue,
          unpaid,
          paid: 0,    // PA doesn't publish paid count
          total: 0,   // PA doesn't publish total count
        });
      }
    }

    if (prizeTiers.length === 0) continue;

    const sortedByValue = [...prizeTiers].sort((a, b) => b.prizeValue - a.prizeValue);
    const topTier = sortedByValue[0];

    const totalRemainingWinners = prizeTiers.reduce((s, t) => s + t.unpaid, 0);
    const totalRemainingValue = prizeTiers.reduce((s, t) => s + t.unpaid * t.prizeValue, 0);
    const bigPrizesLeft = prizeTiers.filter(t => t.prizeValue >= 10_000).reduce((s, t) => s + t.unpaid, 0);

    // Value score: estimated return per dollar (using remaining prize value vs ticket price)
    // PA doesn't give total tickets, so we use a proxy: assume avg ticket has 1-in-3 odds
    const estimatedRemainingTickets = totalRemainingWinners * 3;
    const valueScore = estimatedRemainingTickets > 0
      ? (totalRemainingValue / Math.max(estimatedRemainingTickets, 1)) / price
      : 0;

    let rank: 'top' | 'good' | 'fair' | 'low' = 'low';
    if (bigPrizesLeft >= 5 && topTier.unpaid >= 1 && valueScore >= 0.4) rank = 'top';
    else if (bigPrizesLeft >= 2 && topTier.unpaid >= 1) rank = 'good';
    else if (bigPrizesLeft >= 1 || topTier.unpaid >= 1) rank = 'fair';

    const topPrizeTotal = topTier.total;
    const topPrizePct = topPrizeTotal > 0 ? Math.round((topTier.unpaid / topPrizeTotal) * 100) : 0;

    games.push({
      gameNumber,
      gameName,
      price,
      totalRemainingWinners,
      totalRemainingValue,
      bigPrizesLeft,
      topPrizeRemaining: topTier.unpaid,
      topPrizeTotal,
      topPrizePct,
      topPrizeAmount: topTier.prizeAmount,
      topPrizeValue: topTier.prizeValue,
      prizeTiers: sortedByValue,
      pctRemaining: 0, // not available from PA
      valueScore: Math.round(valueScore * 1000) / 1000,
      oddsOfWinning: 'N/A', // PA doesn't publish overall odds on this page
      rank,
    });
  }

  // Sort: top prizes remaining first, then big prizes left
  games.sort((a, b) => {
    if (b.bigPrizesLeft !== a.bigPrizesLeft) return b.bigPrizesLeft - a.bigPrizesLeft;
    return b.topPrizeRemaining - a.topPrizeRemaining;
  });

  cache = { data: games, fetchedAt: Date.now() };
  return games;
}
