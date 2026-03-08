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
  price: number | null; // null = price not in official lookup; never guessed
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
  '1693': 10, // BONUS BLACKJACK
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
    const price: number | null = PRICE_LOOKUP[gameNumber] ?? null;

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
