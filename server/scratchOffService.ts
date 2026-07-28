import https from 'https';
import { sendMail } from './emailService';
import { pool } from './db';

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
  price: number | null; // null = price not in official lookup; never guessed
  totalRemainingWinners: number;
  totalRemainingValue: number;
  bigPrizesLeft: number;
  topPrizeRemaining: number;
  topPrizeTotal: number;
  topPrizePct: number; // % of top prizes still unclaimed (0-100)
  topPrizeAmount: string;
  topPrizeValue: number;
  prizeTiers: ScratchOffPrizeTier[];
  pctRemaining: number;
  valueScore: number;
  oddsOfWinning: string;
  rank: 'top' | 'good' | 'fair' | 'low';
}

// Official ticket prices for NY scratch-off games by game number
// Source: nylottery.ny.gov — scraped March 2026, covers all 110 currently active games
// DO NOT guess prices — if a game number is missing, price will show as "Unknown"
const PRICE_LOOKUP: Record<string, number> = {
  '1453': 2,  // WIN FOR LIFE
  '1464': 30, // $10,000,000 BONUS
  '1489': 30, // $10,000,000 DELUXE
  '1512': 30, // X SERIES: 200X
  '1528': 20, // $300,000,000 CASH PAYOUT
  '1531': 2,  // CASHWORD DOUBLER
  '1540': 20, // MILLIONAIRE MAKER
  '1546': 30, // VIP MILLIONS
  '1548': 10, // SET FOR LIFE
  '1552': 1,  // LOOSE CHANGE
  '1561': 10, // INSTANT $500
  '1568': 5,  // RUBY RED 7S
  '1571': 20, // ALL CASH
  '1573': 2,  // IT TAKES 2
  '1574': 1,  // INSTANT TAKE 5
  '1577': 5,  // WILD CASH MULTIPLIER
  '1579': 20, // $5,000,000 CASH ROYALE
  '1582': 10, // MULTIPLIER CRAZE
  '1584': 20, // $10,000 A WEEK FOR LIFE
  '1585': 30, // JACKPOT FORTUNE
  '1586': 5,  // PLUS THE MONEY
  '1587': 3,  // MATCH FOR CASH
  '1588': 2,  // CASHWORD
  '1595': 10, // XTREME CASH
  '1596': 5,  // XTREME WINNINGS
  '1597': 2,  // XTREME BUCKS
  '1598': 1,  // LUCKY 7S
  '1599': 20, // XTREME MONEY
  '1600': 5,  // $500,000 BLAST
  '1603': 10, // SHOW ME $500
  '1604': 5,  // WIN $250
  '1606': 30, // $10,000,000 CASH
  '1608': 2,  // DOUBLE DEUCES
  '1609': 20, // $2,000,000 CASHWORD
  '1610': 5,  // DOUBLE WIN
  '1611': 3,  // LUCKY LINES
  '1612': 10, // $3,000,000 MAX
  '1613': 5,  // BIG MONEY X20
  '1614': 1,  // 5 TIMES LUCKY
  '1617': 2,  // TRIPLE 7-11-21
  '1618': 1,  // LOOSE CHANGE
  '1619': 2,  // CASHWORD DOUBLER
  '1621': 20, // WIN $100 OR $200
  '1622': 5,  // 25X THE GOLD
  '1623': 1,  // DOUBLE DOUBLER
  '1624': 2,  // WIN FOR LIFE
  '1625': 10, // $3,000,000 GRANDE
  '1626': 5,  // $1,000,000 GRANDE
  '1627': 2,  // CASH DROP
  '1628': 1,  // INSTANT TAKE 5
  '1629': 30, // $100, $200 OR $500!
  '1630': 5,  // MONEY RUSH
  '1631': 3,  // MULTIPLY YOUR NUMBERS
  '1632': 5,  // DOUBLE TRIPLE CASHWORD
  '1633': 10, // $1,000,000 CASHWORD BONUS
  '1635': 5,  // HOLIDAY RICHES
  '1637': 5,  // $500,000 YEAR OF THE SNAKE
  '1638': 1,  // BONUS 5X
  '1639': 10, // SET FOR LIFE
  '1640': 10, // BONUS 50X
  '1641': 5,  // BONUS 20X
  '1642': 2,  // BONUS 10X
  '1643': 20, // BONUS 100X
  '1644': 5,  // LUCKY CASH
  '1645': 3,  // BONUS 15X CASHWORD
  '1646': 10, // $50 OR $100
  '1647': 5,  // BINGO MULTIPLIER
  '1648': 1,  // 3-2-WON!
  '1649': 2,  // CASHWORD
  '1650': 30, // ULTIMATE CASH
  '1651': 5,  // NEW YORK MILLIONAIRE
  '1652': 2,  // BLACKJACK DOUBLER
  '1653': 1,  // LUCKY 7'S
  '1654': 10, // MONEY MATCH
  '1655': 5,  // $1,000,000 GOLD
  '1656': 3,  // UNLOCK IT!
  '1657': 20, // WIN EITHER $100 OR $200!
  '1658': 5,  // $500,000 MATCH TO WIN
  '1659': 1,  // TRIPLE MATCH
  '1660': 10, // BONUS BUCKS
  '1661': 5,  // CASINO NIGHTS
  '1662': 3,  // CASHWORD EXTRA!
  '1663': 20, // MYSTERY MULTIPLIER
  '1664': 5,  // WINNING STREAK 25X
  '1665': 1,  // 9S IN A LINE DOUBLER
  '1666': 10, // $1,000,000 BONUS CASHWORD
  '1667': 10, // $3,000,000 CA$H
  '1668': 5,  // MORE MONEY
  '1669': 2,  // $25,000 EXTRA CA$H
  '1670': 2,  // CASHWORD DOUBLER
  '1671': 20, // $5,000,000 BLITZ
  '1672': 5,  // LUCKY 13
  '1673': 3,  // WIN $60,000
  '1674': 10, // $5,000 GOLD
  '1675': 5,  // $500 HOLIDAY BONUS
  '1676': 2,  // $100S FOR THE HOLIDAYS
  '1677': 30, // $100, $200 OR $500!
  '1678': 5,  // 2026
  '1679': 1,  // 10XTRA
  '1680': 1,  // INSTANT TAKE 5
  '1681': 10, // 100XTRA
  '1682': 5,  // $500,000 YEAR OF THE HORSE
  '1683': 2,  // 20XTRA
  '1684': 20, // 200XTRA
  '1685': 5,  // 50XTRA
  '1686': 20, // $10,000 A WEEK FOR LIFE
  '1687': 3,  // 30XTRA CASHWORD
  '1688': 10, // $3,000,000 BONUS STARS
  '1689': 5,  // BINGO TIMES 20
  '1690': 1,  // 7-11-21 TRIPLER
  '1691': 30, // 300X THE MONEY
  '1692': 5,  // $1,000,000 MUST LOVE DOGS
  '1693': 10, // BONUS BLACKJACK
  '1694': 20, // $2,000,000 100X CASHWORD
  '1695': 5,  // POT OF GOLD
  '1696': 3,  // MATCH 7S
  '1697': 10, // $3,000,000 MAX MULTIPLIER
  '1698': 5,  // DOUBLE YOUR MONEY
  '1699': 1,  // LUCKY 7S
  '1700': 20, // MILLIONAIRE RICHES
  '1701': 5,  // HOT DOG
  '1702': 3,  // DIAMOND CASHWORD
  '1703': 5,  // $1,000,000 50X CASHWORD
  '1704': 10, // $50 OR $100 (same price tier as game #1646, identical name/series)
  '1705': 5,  // LADY LUCK 25X (confirmed via NY API: min prize $5, top prize $500,000; same tier as WINNING STREAK 25X #1664)
  '1706': 2,  // WIN IT ALL (confirmed via NY API: min prize $2, prizes at $2/$4/$5 — double-or-nothing $2 ticket)
  '1707': 1,  // LOOSE CHANGE (same series as games #1552 and #1618 — confirmed $1)
  '1708': 5,  // DOUBLE TRIPLE CASHWORD (same series as game #1632 — confirmed $5)
};

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

export function clearNYCache() { cache = null; }

// ─── DB-managed price overrides ───────────────────────────────────────────────
// Loads all rows from scratch_off_prices (admin-entered via the dashboard).
// Returns a plain object so it can be merged with PRICE_LOOKUP without modifying
// the hardcoded constant.  Returns {} on any DB error so the service degrades
// gracefully to PRICE_LOOKUP-only behaviour.
async function loadDbPrices(): Promise<Record<string, number>> {
  try {
    const result = await pool.query<{ game_number: string; price: number }>(
      'SELECT game_number, price FROM scratch_off_prices'
    );
    const map: Record<string, number> = {};
    for (const row of result.rows) {
      map[row.game_number] = row.price;
    }
    return map;
  } catch (err: any) {
    console.warn('[scratchOff] Could not load DB prices (table may not exist yet):', err?.message);
    return {};
  }
}

// Ensure the scratch_off_prices table exists.  Called once at service init time
// so the admin UI works even before a formal schema migration is run.
export async function ensurePricesTable(): Promise<void> {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS scratch_off_prices (
        game_number VARCHAR(10) PRIMARY KEY,
        price       INTEGER     NOT NULL,
        game_name   TEXT,
        added_at    TIMESTAMP   DEFAULT now(),
        added_by    TEXT        DEFAULT 'admin'
      )
    `);
  } catch (err: any) {
    console.error('[scratchOff] Failed to create scratch_off_prices table:', err?.message);
  }
}

export async function getScratchOffGames(): Promise<ScratchOffGame[]> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL) {
    return cache.data;
  }

  // Merge hardcoded lookup with any admin-entered DB prices.
  // DB prices take precedence so corrections don't require a redeployment.
  const dbPrices = await loadDbPrices();
  const effectivePriceLookup: Record<string, number> = { ...PRICE_LOOKUP, ...dbPrices };

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
    const price: number | null = effectivePriceLookup[gameNumber] ?? null;

    const totalRemainingWinners = tiers.reduce((s, t) => s + t.unpaid, 0);
    const totalRemainingValue = tiers.reduce((s, t) => s + t.unpaid * t.prizeValue, 0);
    const bigPrizesLeft = tiers.filter(t => t.prizeValue >= 10_000).reduce((s, t) => s + t.unpaid, 0);

    const sortedByValue = [...tiers].sort((a, b) => b.prizeValue - a.prizeValue);
    const topTier = sortedByValue[0] ?? { prizeValue: 0, prizeAmount: 'N/A', unpaid: 0 };

    const totalTickets = tiers.reduce((s, t) => s + t.total, 0);
    const totalUnpaid = tiers.reduce((s, t) => s + t.unpaid, 0);
    const pctRemaining = totalTickets > 0 ? (totalUnpaid / totalTickets) * 100 : 0;

    const estimatedRemainingTickets = totalTickets > 0 ? (totalUnpaid / totalTickets) * (totalTickets * 3) : totalUnpaid * 5;
    const oddsNum = estimatedRemainingTickets > 0 ? estimatedRemainingTickets / Math.max(totalRemainingWinners, 1) : 999;
    // Value score requires a known price — omit for unknown-price games so we never mislead
    const valueScore = (totalRemainingWinners > 0 && price !== null)
      ? (totalRemainingValue / Math.max(estimatedRemainingTickets, 1)) / price
      : 0;

    const oddsFormatted = `1 in ${Math.round(oddsNum).toLocaleString()}`;

    let rank: 'top' | 'good' | 'fair' | 'low' = 'low';
    if (valueScore >= 0.5 && bigPrizesLeft >= 5) rank = 'top';
    else if (valueScore >= 0.3 && bigPrizesLeft >= 2) rank = 'good';
    else if (valueScore >= 0.15 || bigPrizesLeft >= 1) rank = 'fair';

    const topPrizeTotal = topTier.total;
    const topPrizePct = topPrizeTotal > 0 ? Math.round((topTier.unpaid / topPrizeTotal) * 100) : 0;

    games.push({
      gameNumber,
      gameName: name,
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

// ─── NY Scratch-Off Gap Detector ─────────────────────────────────────────────

export interface ScratchOffGap {
  gameNumber: string;
  gameName: string;
  detectedAt: string; // ISO timestamp
}

// In-memory store of games seen in the live NY API that have no price entry
let detectedGaps: ScratchOffGap[] = [];
let lastGapCheckAt: string | null = null;

// Game numbers that were present in the previous run for which an alert email was
// successfully delivered. Comparing against this — not a permanent historical set —
// means a gap that disappears and reappears will trigger a fresh alert, while gaps
// that persist unchanged week over week produce no duplicate email.
// Reset to empty on every process restart (intentional: see follow-up task #72).
let previousAlertedGapNumbers = new Set<string>();

export function getDetectedGaps(): { gaps: ScratchOffGap[]; lastCheckedAt: string | null } {
  return { gaps: detectedGaps, lastCheckedAt: lastGapCheckAt };
}

// Sends the admin a formatted email listing each newly-discovered gap game.
// Returns true only when sendMail confirms delivery (success: true).
async function sendGapAlertEmail(newGaps: ScratchOffGap[]): Promise<boolean> {
  const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'russell@lotterypro.app';
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0]?.trim() || 'lotterypro.app';

  // Plain-text body — one line per game with a direct NY Lottery link
  const gameLines = newGaps
    .map(g => `  • Game #${g.gameNumber} — ${g.gameName}\n    https://nylottery.ny.gov/scratch-off?game=${g.gameNumber}`)
    .join('\n\n');

  const text = [
    `⚠️  ${newGaps.length} new NY scratch-off game(s) detected without a ticket price.`,
    '',
    'These games are live in the NY Lottery API but are missing from PRICE_LOOKUP',
    'in server/scratchOffService.ts. Until a price is added, these games will show',
    '"Unknown" price to users on the Scratch-Off Helper page.',
    '',
    'New games:',
    gameLines,
    '',
    '────────────────────────────────',
    `Admin dashboard: https://${domain}/admin`,
    `Detected at: ${new Date().toISOString()}`,
    '────────────────────────────────',
    'To fix: open server/scratchOffService.ts and add each game number to PRICE_LOOKUP.',
  ].join('\n');

  // HTML body — table of new games with clickable links
  const tableRows = newGaps
    .map(g => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-family:monospace;">${g.gameNumber}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${g.gameName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">
          <a href="https://nylottery.ny.gov/scratch-off?game=${g.gameNumber}"
             style="color:#667eea;text-decoration:none;">nylottery.ny.gov ↗</a>
        </td>
      </tr>`)
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;background:#f9f9f9;">
      <div style="background:linear-gradient(135deg,#e53e3e 0%,#c53030 100%);padding:28px;border-radius:10px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:24px;">⚠️ NY Scratch-Off Price Gap Alert</h1>
        <p style="margin:8px 0 0 0;opacity:0.9;">LotteryPro · Admin Notification</p>
      </div>
      <div style="background:white;padding:28px;border-radius:0 0 10px 10px;margin-top:2px;">
        <p style="color:#333;font-size:16px;">
          <strong>${newGaps.length} new game(s)</strong> appeared in the NY Lottery API without
          a ticket price in <code>PRICE_LOOKUP</code>. These games will display
          <em>"Unknown"</em> price until the lookup is updated.
        </p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
          <thead>
            <tr style="background:#f7fafc;">
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#4a5568;">Game #</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#4a5568;">Game Name</th>
              <th style="padding:10px 12px;text-align:left;border-bottom:2px solid #e2e8f0;color:#4a5568;">NY Lottery Link</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
        <div style="background:#fff5f5;border-left:4px solid #e53e3e;padding:14px;border-radius:4px;margin:20px 0;">
          <strong style="color:#c53030;">Action required:</strong>
          <span style="color:#555;"> Open <code>server/scratchOffService.ts</code> and add each
          game number to <code>PRICE_LOOKUP</code> with the correct ticket price.</span>
        </div>
        <div style="text-align:center;margin:24px 0;">
          <a href="https://${domain}/admin"
             style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:12px 28px;text-decoration:none;border-radius:20px;font-weight:bold;display:inline-block;">
            Open Admin Dashboard
          </a>
        </div>
        <p style="color:#aaa;font-size:12px;text-align:center;margin-top:24px;">
          Detected at ${new Date().toISOString()} · LotteryPro automated alert
        </p>
      </div>
    </div>`;

  try {
    const result = await sendMail({
      to: adminEmail,
      subject: `🚨 [LotteryPro] ${newGaps.length} new NY scratch-off game(s) missing a price`,
      text,
      html,
    });
    if (result.success) {
      console.log(`[scratchOff] Gap alert email sent to ${adminEmail} for ${newGaps.length} new game(s).`);
      return true;
    }
    console.warn(`[scratchOff] Gap alert email not delivered (no transport): ${result.message}`);
    return false;
  } catch (err: any) {
    console.error('[scratchOff] Failed to send gap alert email:', err?.message ?? err);
    return false;
  }
}

// Fetch the NY API, find all game numbers with no PRICE_LOOKUP entry, and
// store them so the admin dashboard can surface them for manual follow-up.
// Emails the admin only when the current run contains game numbers that were
// NOT present in the previous successfully-alerted run (i.e. genuinely new
// or reappeared gaps). previousAlertedGapNumbers is updated only when the
// email is confirmed delivered, so a failed send triggers a retry next run.
export async function detectNYScratchOffGaps(): Promise<ScratchOffGap[]> {
  console.log('[scratchOff] Running weekly NY game-gap detection...');
  try {
    const url = 'https://data.ny.gov/resource/nzqa-7unk.json?%24limit=5000';
    const rows = await fetchJson(url);

    // Collect unique game numbers + names from the live API, summing unpaid
    // prize counts across all tiers so we can detect sold-out games below.
    const seen = new Map<string, { name: string; totalUnpaid: number }>(); // gameNumber → { name, totalUnpaid }
    for (const row of rows) {
      const unpaid = parseInt(row.unpaid) || 0;
      if (!seen.has(row.game_number)) {
        seen.set(row.game_number, { name: row.game_name, totalUnpaid: unpaid });
      } else {
        seen.get(row.game_number)!.totalUnpaid += unpaid;
      }
    }

    // Merge hardcoded lookup with DB-stored prices so admin entries close gaps immediately
    const dbPrices = await loadDbPrices();
    const effectivePriceLookup: Record<string, number> = { ...PRICE_LOOKUP, ...dbPrices };

    // Identify games in the API that have no price entry (in either source) AND are still active.
    // Suppression rule: if every prize tier for a game has unpaid === 0 the game
    // is fully sold out or retired — alerting the admin to add a price for a dead
    // game produces noise with no user-facing benefit, so we skip it silently.
    // Only games with at least one remaining unpaid prize are flagged as true gaps.
    const gaps: ScratchOffGap[] = [];
    for (const [gameNumber, { name, totalUnpaid }] of seen.entries()) {
      if (effectivePriceLookup[gameNumber] === undefined) {
        // Skip sold-out / retired games: all remaining prize tiers have unpaid === 0
        if (totalUnpaid === 0) continue;
        gaps.push({
          gameNumber,
          gameName: name,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    // Sort by game number ascending for easy reading
    gaps.sort((a, b) => Number(a.gameNumber) - Number(b.gameNumber));

    detectedGaps = gaps;
    lastGapCheckAt = new Date().toISOString();

    if (gaps.length > 0) {
      console.warn(
        `[scratchOff] ${gaps.length} NY game(s) missing from PRICE_LOOKUP:`,
        gaps.map(g => `#${g.gameNumber} ${g.gameName}`).join(', ')
      );

      // New gaps = current gaps whose game number was absent from the previous
      // successful alert. This means a gap that resolves and later reappears
      // will alert again (correct), while persistent unchanged gaps stay silent.
      const newGaps = gaps.filter(g => !previousAlertedGapNumbers.has(g.gameNumber));

      if (newGaps.length > 0) {
        const delivered = await sendGapAlertEmail(newGaps);
        if (delivered) {
          // Snapshot the full current gap set as the new baseline. Only
          // advance the baseline on confirmed delivery so a transport failure
          // causes a retry on the next weekly run instead of silent suppression.
          previousAlertedGapNumbers = new Set(gaps.map(g => g.gameNumber));
        }
      } else {
        console.log('[scratchOff] All current gaps match the previous alert — no duplicate email sent.');
      }
    } else {
      // No gaps this run: clear the baseline so any future gaps are treated as new.
      previousAlertedGapNumbers = new Set();
      console.log('[scratchOff] No NY price gaps detected — all live games have prices.');
    }

    return gaps;
  } catch (err: any) {
    console.error('[scratchOff] Gap detection failed:', err?.message ?? err);
    return detectedGaps; // return last known state on error
  }
}

// Run gap detection once on startup, then weekly.
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Small delay so server is fully booted before the first network call
setTimeout(() => {
  detectNYScratchOffGaps();
  setInterval(detectNYScratchOffGaps, WEEK_MS);
}, 10_000);
