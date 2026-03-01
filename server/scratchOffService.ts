import https from 'https';

export interface ScratchOffPrizeTier {
  prizeAmount: string;
  prizeValue: number;
  unpaid: number;
  paid: number;
  total: number;
}

export interface ScratchOffGame {
  gameNumber: string;
  gameName: string;
  price: number;
  totalRemainingWinners: number;
  totalRemainingValue: number;
  bigPrizesLeft: number;
  topPrizeRemaining: number;
  topPrizeAmount: string;
  topPrizeValue: number;
  prizeTiers: ScratchOffPrizeTier[];
  pctRemaining: number;
  valueScore: number;
  oddsOfWinning: string;
  rank: 'top' | 'good' | 'fair' | 'low';
}

// Known ticket prices for NY scratch-off games by game number
// Source: nylottery.ny.gov — updated periodically
const PRICE_LOOKUP: Record<string, number> = {
  '1464': 30, '1659': 1, '1661': 5, '1657': 20, '1658': 10,
  '1662': 2, '1663': 5, '1664': 10, '1665': 2, '1666': 1,
  '1667': 5, '1668': 20, '1669': 30, '1670': 1, '1671': 2,
  '1672': 5, '1673': 10, '1674': 20, '1675': 30, '1676': 1,
  '1677': 2, '1678': 5, '1679': 10, '1680': 20, '1681': 30,
  '1682': 1, '1683': 2, '1684': 5, '1685': 10, '1686': 20,
  '1687': 30, '1688': 1, '1689': 2, '1690': 5, '1691': 10,
  '1692': 20, '1693': 30, '1694': 1, '1695': 2, '1696': 5,
  '1697': 10, '1698': 20, '1699': 30, '1700': 1, '1701': 2,
  '1702': 5, '1703': 10, '1704': 20, '1705': 30,
};

// Infer price from game name keywords when not in lookup
function inferPriceFromName(name: string): number {
  const n = name.toUpperCase();
  if (n.includes('$30') || n.includes('GOLD BAR') || n.includes('MILLION')) return 30;
  if (n.includes('$20') || n.includes('BONUS')) return 20;
  if (n.includes('$10') || n.includes('BIG MONEY')) return 10;
  if (n.includes('$5') || n.includes('FIVE')) return 5;
  if (n.includes('$2') || n.includes('TWO')) return 2;
  if (n.includes('$1') || n.includes('ONE DOLLAR')) return 1;
  return 5; // median default for unknown NY games
}

// Parse prize_amount strings from the API into numeric dollar values
function parsePrizeAmount(amountStr: string): number {
  if (!amountStr || amountStr === 'Free Ticket' || amountStr === 'FREE TICKET') return 1;
  const s = amountStr.replace(/\$/g, '').replace(/,/g, '').trim().toUpperCase();
  try {
    // Annuity formats
    if (s.includes('/WK/LIFE') || s.includes('1,000/WK')) return 1_000_000;
    if (s.includes('/YR/LIFE') || s.includes('1,000,000 A YEAR')) return 10_000_000;
    if (s.includes('/YR/20') || s.includes('/YR') && s.includes('/20')) {
      const num = parseFloat(s.replace(/[^0-9.]/g, ''));
      return num * 20 * 0.65; // present value estimate
    }
    if (s.includes('/YR/')) {
      const num = parseFloat(s.replace(/[^0-9.]/g, ''));
      return num * 10;
    }
    if (s.includes('/MO/') || s.includes('MO/LIFE')) {
      const num = parseFloat(s.replace(/[^0-9.]/g, ''));
      return num * 120;
    }
    if (s.includes('LIFE') || s.includes('/DAY/')) {
      const num = parseFloat(s.replace(/[^0-9.]/g, ''));
      return num * 5000;
    }
    const num = parseFloat(s.replace(/[^0-9.]/g, ''));
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

interface RawRow {
  game_number: string;
  game_name: string;
  paid: string;
  unpaid: string;
  total: string;
  prize_amount: string;
}

function fetchJson(url: string): Promise<RawRow[]> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'Accept': 'application/json' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

let cache: { data: ScratchOffGame[]; fetchedAt: number } | null = null;
const CACHE_TTL = 3600 * 1000; // 1 hour

export async function getScratchOffGames(): Promise<ScratchOffGame[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  const url = 'https://data.ny.gov/resource/nzqa-7unk.json?%24limit=5000';
  const rows = await fetchJson(url);

  // Group rows by game_number
  const gameMap = new Map<string, { name: string; tiers: ScratchOffPrizeTier[] }>();

  for (const row of rows) {
    const gn = row.game_number;
    if (!gameMap.has(gn)) {
      gameMap.set(gn, { name: row.game_name, tiers: [] });
    }
    const prizeValue = parsePrizeAmount(row.prize_amount);
    gameMap.get(gn)!.tiers.push({
      prizeAmount: row.prize_amount,
      prizeValue,
      unpaid: parseInt(row.unpaid) || 0,
      paid: parseInt(row.paid) || 0,
      total: parseInt(row.total) || 0,
    });
  }

  const games: ScratchOffGame[] = [];

  for (const [gameNumber, { name, tiers }] of gameMap.entries()) {
    const price = PRICE_LOOKUP[gameNumber] ?? inferPriceFromName(name);

    const totalRemainingWinners = tiers.reduce((s, t) => s + t.unpaid, 0);
    const totalRemainingValue = tiers.reduce((s, t) => s + t.unpaid * t.prizeValue, 0);
    const bigPrizesLeft = tiers.filter(t => t.prizeValue >= 10_000).reduce((s, t) => s + t.unpaid, 0);

    const sortedByValue = [...tiers].sort((a, b) => b.prizeValue - a.prizeValue);
    const topTier = sortedByValue[0] ?? { prizeValue: 0, prizeAmount: 'N/A', unpaid: 0 };

    const totalTickets = tiers.reduce((s, t) => s + t.total, 0);
    const totalUnpaid = tiers.reduce((s, t) => s + t.unpaid, 0);
    const pctRemaining = totalTickets > 0 ? (totalUnpaid / totalTickets) * 100 : 0;

    // Value score: expected remaining value per dollar spent
    // Using estimated remaining tickets = totalUnpaid tickets (winners only), so inferred total remaining
    // odds of winning = totalRemainingWinners / estimated remaining tickets
    // estimated remaining tickets ≈ (totalUnpaid / totalTickets) * original ticket count ≈ use pct
    const estimatedRemainingTickets = totalTickets > 0 ? (totalUnpaid / totalTickets) * (totalTickets * 3) : totalUnpaid * 5;
    const oddsNum = estimatedRemainingTickets > 0 ? estimatedRemainingTickets / Math.max(totalRemainingWinners, 1) : 999;
    const valueScore = totalRemainingWinners > 0
      ? (totalRemainingValue / Math.max(estimatedRemainingTickets, 1)) / price
      : 0;

    const oddsFormatted = `1 in ${Math.round(oddsNum).toLocaleString()}`;

    let rank: 'top' | 'good' | 'fair' | 'low' = 'low';
    if (valueScore >= 0.5 && bigPrizesLeft >= 5) rank = 'top';
    else if (valueScore >= 0.3 && bigPrizesLeft >= 2) rank = 'good';
    else if (valueScore >= 0.15 || bigPrizesLeft >= 1) rank = 'fair';

    games.push({
      gameNumber,
      gameName: name,
      price,
      totalRemainingWinners,
      totalRemainingValue,
      bigPrizesLeft,
      topPrizeRemaining: topTier.unpaid,
      topPrizeAmount: topTier.prizeAmount,
      topPrizeValue: topTier.prizeValue,
      prizeTiers: sortedByValue,
      pctRemaining: Math.round(pctRemaining * 10) / 10,
      valueScore: Math.round(valueScore * 1000) / 1000,
      oddsOfWinning: oddsFormatted,
      rank,
    });
  }

  // Sort by value score descending
  games.sort((a, b) => b.valueScore - a.valueScore);

  cache = { data: games, fetchedAt: Date.now() };
  return games;
}
