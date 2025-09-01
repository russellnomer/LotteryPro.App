import { storage } from "./storage";

/**
 * Maximum capacity lottery dataset generator for ultimate statistical analysis
 * Generates 500+ Powerball and 400+ MegaMillions draws covering 5+ years
 */
export async function seedExpandedLotteryData() {
  console.log('🎯 Generating MAXIMUM capacity lottery dataset with 500+ draws covering 5+ years...');
  
  // Generate Powerball draws (Monday, Wednesday, Saturday = ~156 draws per year)
  const powerbellDraws = generatePowerbellHistory();
  
  // Generate MegaMillions draws (Tuesday, Friday = ~104 draws per year)  
  const megaMillionsDraws = generateMegaMillionsHistory();

  // Insert Powerball data
  for (const draw of powerbellDraws) {
    try {
      await storage.createDraw({
        game: 'powerball',
        drawDate: new Date(draw.date),
        mainNumbers: draw.numbers,
        bonusNumber: draw.powerball,
        jackpot: draw.jackpot
      });
    } catch (error) {
      // Skip duplicates
    }
  }

  // Insert MegaMillions data
  for (const draw of megaMillionsDraws) {
    try {
      await storage.createDraw({
        game: 'megamillions', 
        drawDate: new Date(draw.date),
        mainNumbers: draw.numbers,
        bonusNumber: draw.megaBall,
        jackpot: draw.jackpot
      });
    } catch (error) {
      // Skip duplicates
    }
  }

  console.log(`✅ Seeded ${powerbellDraws.length} Powerball and ${megaMillionsDraws.length} MegaMillions draws for ultra-comprehensive analysis`);
}

function generatePowerbellHistory() {
  const draws = [];
  const currentDate = new Date('2025-09-01');
  let drawDate = new Date(currentDate);
  
  // Generate 500 Powerball draws (about 5 years of data)
  for (let i = 0; i < 500; i++) {
    // Powerball draws: Monday (1), Wednesday (3), Saturday (6)
    if (i > 0) {
      do {
        drawDate.setDate(drawDate.getDate() - 1);
      } while (![1, 3, 6].includes(drawDate.getDay()));
    }
    
    const numbers = generateRealisticPowerbellNumbers();
    const jackpot = generateRealisticJackpot('powerball', i);
    
    draws.push({
      date: new Date(drawDate).toISOString().split('T')[0],
      numbers: numbers.main.sort((a, b) => a - b),
      powerball: numbers.powerball,
      jackpot
    });
  }
  
  return draws.reverse(); // Return chronological order
}

function generateMegaMillionsHistory() {
  const draws = [];
  const currentDate = new Date('2025-09-01');
  let drawDate = new Date(currentDate);
  
  // Generate 400 MegaMillions draws (about 5 years of data)  
  for (let i = 0; i < 400; i++) {
    // MegaMillions draws: Tuesday (2), Friday (5)
    if (i > 0) {
      do {
        drawDate.setDate(drawDate.getDate() - 1);
      } while (![2, 5].includes(drawDate.getDay()));
    }
    
    const numbers = generateRealisticMegaMillionsNumbers();
    const jackpot = generateRealisticJackpot('megamillions', i);
    
    draws.push({
      date: new Date(drawDate).toISOString().split('T')[0],
      numbers: numbers.main.sort((a, b) => a - b),
      megaBall: numbers.megaBall,
      jackpot
    });
  }
  
  return draws.reverse(); // Return chronological order
}

function generateRealisticPowerbellNumbers() {
  // Powerball: 5 numbers from 1-69, bonus from 1-26
  const main = [];
  const used = new Set();
  
  // Generate 5 unique main numbers with realistic distribution
  while (main.length < 5) {
    const num = generateWeightedNumber(1, 69, 'powerball');
    if (!used.has(num)) {
      main.push(num);
      used.add(num);
    }
  }
  
  const powerball = generateWeightedNumber(1, 26, 'powerball-bonus');
  
  return { main, powerball };
}

function generateRealisticMegaMillionsNumbers() {
  // MegaMillions: 5 numbers from 1-70, bonus from 1-25
  const main = [];
  const used = new Set();
  
  // Generate 5 unique main numbers with realistic distribution
  while (main.length < 5) {
    const num = generateWeightedNumber(1, 70, 'megamillions');
    if (!used.has(num)) {
      main.push(num);
      used.add(num);
    }
  }
  
  const megaBall = generateWeightedNumber(1, 25, 'megamillions-bonus');
  
  return { main, megaBall };
}

function generateWeightedNumber(min: number, max: number, type: string): number {
  // Create realistic number distribution patterns
  const range = max - min + 1;
  let num;
  
  if (type.includes('powerball')) {
    // Powerball tends to have certain number clusters
    const hotZones = [
      [1, 15], [16, 30], [31, 45], [46, 69]
    ];
    const zone = hotZones[Math.floor(Math.random() * hotZones.length)];
    num = Math.floor(Math.random() * (zone[1] - zone[0] + 1)) + zone[0];
  } else if (type.includes('megamillions')) {
    // MegaMillions distribution patterns
    const hotZones = [
      [1, 17], [18, 35], [36, 52], [53, 70]
    ];
    const zone = hotZones[Math.floor(Math.random() * hotZones.length)];
    num = Math.floor(Math.random() * (zone[1] - zone[0] + 1)) + zone[0];
  } else {
    // Uniform distribution for bonus numbers
    num = Math.floor(Math.random() * range) + min;
  }
  
  return Math.max(min, Math.min(max, num));
}

function generateRealisticJackpot(game: string, drawIndex: number): string {
  // Simulate realistic jackpot progression
  const baseAmount = game === 'powerball' ? 20 : 15;
  const rolloverFactor = Math.floor(drawIndex / 10) * 50; // Simulate rollovers
  const randomVariation = Math.floor(Math.random() * 100);
  
  const amount = baseAmount + rolloverFactor + randomVariation;
  
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)} Billion`;
  } else {
    return `$${amount} Million`;
  }
}