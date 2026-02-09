import { storage } from "./storage";
import { bulkDataOps } from "./bulkDataOperations";
import { type InsertDraw } from "@shared/schema";

const REAL_API_ENDPOINTS = {
  powerball: 'https://data.ny.gov/resource/d6yy-54nr.json',
  megamillions: 'https://data.ny.gov/resource/5xaw-6ayf.json'
};

async function fetchRealDraws(game: 'powerball' | 'megamillions'): Promise<InsertDraw[]> {
  const url = `${REAL_API_ENDPOINTS[game]}?$order=draw_date%20DESC&$limit=1000`;
  console.log(`🌐 Fetching real ${game} data from data.ny.gov...`);

  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`API returned status ${response.status}`);
  }

  const rawData: any[] = await response.json();

  if (!Array.isArray(rawData) || rawData.length === 0) {
    throw new Error('API returned empty data');
  }

  const draws: InsertDraw[] = [];

  for (const record of rawData) {
    try {
      if (!record.draw_date || !record.winning_numbers) continue;

      const drawDate = record.draw_date.split('T')[0];
      const numbers = record.winning_numbers.trim().split(/\s+/).map(Number);
      let mainNumbers: number[];
      let bonusNumber: number;

      if (game === 'megamillions') {
        if (numbers.length < 5 || !record.mega_ball) continue;
        mainNumbers = numbers.slice(0, 5).sort((a: number, b: number) => a - b);
        bonusNumber = parseInt(record.mega_ball);
      } else {
        if (numbers.length < 6) continue;
        mainNumbers = numbers.slice(0, 5).sort((a: number, b: number) => a - b);
        bonusNumber = numbers[5];
      }

      if (mainNumbers.some(isNaN) || isNaN(bonusNumber)) continue;

      draws.push({
        game,
        drawDate: new Date(drawDate),
        mainNumbers,
        bonusNumber,
        jackpot: record.multiplier ? `${record.multiplier}x Multiplier` : (record.mega_ball ? null : null)
      });
    } catch {
    }
  }

  console.log(`✅ Parsed ${draws.length} real ${game} draws from data.ny.gov`);
  return draws;
}

export async function seedExpandedLotteryData() {
  console.log('📚 Fetching REAL lottery data from NY State Open Data API...');

  const startTime = Date.now();

  try {
    const [powerballDraws, megaMillionsDraws] = await Promise.all([
      fetchRealDraws('powerball'),
      fetchRealDraws('megamillions')
    ]);

    const results = await bulkDataOps.bulkInsertParallel(powerballDraws, megaMillionsDraws);

    const duration = Date.now() - startTime;

    console.log(`✅ REAL DATA SEEDING COMPLETE in ${duration}ms:`);
    console.log(`   📊 Powerball: ${results.powerball.inserted} real draws inserted, ${results.powerball.skipped} skipped`);
    console.log(`   📊 MegaMillions: ${results.megamillions.inserted} real draws inserted, ${results.megamillions.skipped} skipped`);

    const stats = await bulkDataOps.getDatabaseStats();
    console.log(`🎯 DATABASE STATS: ${stats.totalDraws} total draws (${stats.powerbellCount} PB, ${stats.megaMillionsCount} MM)`);

    return {
      powerball: results.powerball,
      megamillions: results.megamillions,
      performance: { duration, totalDraws: stats.totalDraws }
    };
  } catch (error: any) {
    console.error('❌ Failed to fetch real lottery data:', error.message);
    console.log('⚠️ No fallback - real data required for accurate analysis');
    throw error;
  }
}
