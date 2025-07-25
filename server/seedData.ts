import { storage } from "./storage";

export async function seedHistoricalData() {
  try {
    // Check if data already exists
    const existingPowerball = await storage.getDraws('powerball');
    const existingMega = await storage.getDraws('megamillions');
    
    if (existingPowerball.length > 0 && existingMega.length > 0) {
      console.log('Historical data already seeded');
      return;
    }

    // Powerball historical data from the analysis
    const powerbellDraws = [
      { date: "2025-07-23", numbers: [2, 18, 19, 25, 35], powerball: 25 },
      { date: "2025-07-21", numbers: [8, 11, 28, 33, 42], powerball: 2 },
      { date: "2025-07-19", numbers: [28, 48, 51, 61, 69], powerball: 20 },
      { date: "2025-07-16", numbers: [4, 21, 43, 48, 49], powerball: 22 },
      { date: "2025-07-14", numbers: [8, 12, 45, 46, 63], powerball: 24 },
      { date: "2025-07-12", numbers: [8, 16, 24, 33, 54], powerball: 18 },
      { date: "2025-07-09", numbers: [5, 9, 25, 28, 69], powerball: 5 },
      { date: "2025-07-07", numbers: [33, 35, 58, 61, 69], powerball: 25 }
    ];

    // MegaMillions historical data from the analysis
    const megaMillionsDraws = [
      { date: "2025-07-22", numbers: [22, 41, 42, 59, 69], megaBall: 17 },
      { date: "2025-07-18", numbers: [11, 43, 54, 55, 63], megaBall: 3 },
      { date: "2025-07-15", numbers: [6, 10, 24, 35, 43], megaBall: 1 },
      { date: "2025-07-11", numbers: [12, 23, 24, 31, 56], megaBall: 1 },
      { date: "2025-07-08", numbers: [4, 6, 38, 44, 62], megaBall: 24 },
      { date: "2025-07-04", numbers: [17, 20, 24, 41, 42], megaBall: 24 },
      { date: "2025-07-01", numbers: [19, 28, 31, 39, 54], megaBall: 5 },
      { date: "2025-06-27", numbers: [18, 21, 29, 42, 50], megaBall: 2 }
    ];

    // Insert Powerball data
    for (const draw of powerbellDraws) {
      await storage.createDraw({
        game: 'powerball',
        drawDate: new Date(draw.date),
        mainNumbers: draw.numbers,
        bonusNumber: draw.powerball,
        jackpot: null
      });
    }

    // Insert MegaMillions data
    for (const draw of megaMillionsDraws) {
      await storage.createDraw({
        game: 'megamillions',
        drawDate: new Date(draw.date),
        mainNumbers: draw.numbers,
        bonusNumber: draw.megaBall,
        jackpot: null
      });
    }

    console.log('Historical data seeded successfully');
  } catch (error) {
    console.error('Error seeding historical data:', error);
  }
}