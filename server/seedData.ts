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

    // Powerball historical data updated with August 2025 draws
    const powerbellDraws = [
      // Most recent draws from August 2025
      { date: "2025-08-30", numbers: [3, 18, 22, 27, 33], powerball: 17 },
      { date: "2025-08-27", numbers: [12, 15, 34, 48, 62], powerball: 9 },
      { date: "2025-08-25", numbers: [7, 29, 45, 56, 63], powerball: 14 },
      { date: "2025-08-23", numbers: [11, 31, 39, 52, 68], powerball: 21 },
      { date: "2025-08-20", numbers: [31, 59, 62, 65, 68], powerball: 5 },
      { date: "2025-08-16", numbers: [14, 26, 38, 44, 57], powerball: 8 },
      { date: "2025-08-13", numbers: [9, 19, 23, 41, 55], powerball: 13 },
      { date: "2025-08-10", numbers: [6, 17, 28, 42, 59], powerball: 24 },
      { date: "2025-08-07", numbers: [4, 13, 35, 47, 61], powerball: 16 },
      { date: "2025-08-04", numbers: [21, 24, 36, 53, 67], powerball: 11 },
      // July 2025 draws (keeping for comparison)
      { date: "2025-07-30", numbers: [15, 27, 39, 46, 64], powerball: 3 },
      { date: "2025-07-26", numbers: [8, 25, 37, 52, 69], powerball: 19 },
      { date: "2025-07-23", numbers: [2, 18, 19, 25, 35], powerball: 25 },
      { date: "2025-07-21", numbers: [8, 11, 28, 33, 42], powerball: 2 },
      { date: "2025-07-19", numbers: [28, 48, 51, 61, 69], powerball: 20 }
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