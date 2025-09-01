import { storage } from "./storage";

export async function seedHistoricalData() {
  try {
    // Use expanded comprehensive lottery dataset
    const { seedExpandedLotteryData } = await import('./expandedLotteryData');
    await seedExpandedLotteryData();
  } catch (error) {
    console.error('Error seeding expanded historical data:', error);
  }
}