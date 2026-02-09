import { storage } from "./storage";

const REAL_API_ENDPOINTS = {
  powerball: 'https://data.ny.gov/resource/d6yy-54nr.json',
  megamillions: 'https://data.ny.gov/resource/5xaw-6ayf.json'
};

export async function seedHistoricalData() {
  try {
    console.log('🚀 LAZY LOADING: Starting with essential data for instant startup...');
    
    await seedEssentialData();
    
    console.log('✅ Essential data loaded - app ready for instant use!');
    
    console.log('📊 Background loading: Building educational dataset for academic analysis...');
    setImmediate(async () => {
      try {
        const { seedExpandedLotteryData } = await import('./expandedLotteryData');
        await seedExpandedLotteryData();
        console.log('✅ EDUCATIONAL DATASET COMPLETE: Full academic dataset loaded for study!');
      } catch (error: any) {
        console.error('❌ Background dataset loading failed:', error.message);
      }
    });
    
  } catch (error: any) {
    console.error('Error with lazy loading:', error.message);
    await fallbackBasicData();
  }
}

async function seedEssentialData() {
  for (const game of ['powerball', 'megamillions'] as const) {
    try {
      const url = `${REAL_API_ENDPOINTS[game]}?$order=draw_date%20DESC&$limit=10`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      
      if (!response.ok) throw new Error(`API ${response.status}`);
      
      const rawData: any[] = await response.json();
      let count = 0;
      
      for (const record of rawData) {
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

        try {
          await storage.createDraw({
            game,
            drawDate: new Date(drawDate),
            mainNumbers,
            bonusNumber,
            jackpot: record.multiplier ? `${record.multiplier}x Multiplier` : null
          });
          count++;
        } catch {
        }
      }
      console.log(`✅ Essential ${game}: ${count} real recent draws loaded`);
    } catch (error: any) {
      console.log(`⚠️ Could not fetch essential ${game} data: ${error.message}`);
    }
  }
}

async function fallbackBasicData() {
  console.log('🔄 Falling back to basic lottery data...');
  
  for (const game of ['powerball', 'megamillions'] as const) {
    try {
      const url = `${REAL_API_ENDPOINTS[game]}?$order=draw_date%20DESC&$limit=3`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) continue;
      const rawData: any[] = await response.json();
      
      for (const record of rawData) {
        if (!record.draw_date || !record.winning_numbers) continue;
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

        try {
          await storage.createDraw({
            game,
            drawDate: new Date(record.draw_date.split('T')[0]),
            mainNumbers,
            bonusNumber,
            jackpot: null
          });
        } catch {
        }
      }
    } catch {
    }
  }

  console.log('✅ Basic lottery data seeded successfully');
}
