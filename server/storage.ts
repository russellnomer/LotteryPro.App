import { type LotteryDraw, type InsertDraw, type GeneratedTicket, type InsertTicket } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Lottery draws
  getDraws(game: string): Promise<LotteryDraw[]>;
  getDrawsByDateRange(game: string, startDate: Date, endDate: Date): Promise<LotteryDraw[]>;
  createDraw(draw: InsertDraw): Promise<LotteryDraw>;
  
  // Generated tickets
  getRecentTickets(limit?: number): Promise<GeneratedTicket[]>;
  createTicket(ticket: InsertTicket): Promise<GeneratedTicket>;
}

export class MemStorage implements IStorage {
  private draws: Map<string, LotteryDraw>;
  private tickets: Map<string, GeneratedTicket>;

  constructor() {
    this.draws = new Map();
    this.tickets = new Map();
    this.initializeHistoricalData();
  }

  private initializeHistoricalData() {
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
    powerbellDraws.forEach(draw => {
      const id = randomUUID();
      const lotteryDraw: LotteryDraw = {
        id,
        game: 'powerball',
        drawDate: new Date(draw.date),
        mainNumbers: draw.numbers,
        bonusNumber: draw.powerball,
        jackpot: null
      };
      this.draws.set(id, lotteryDraw);
    });

    // Insert MegaMillions data
    megaMillionsDraws.forEach(draw => {
      const id = randomUUID();
      const lotteryDraw: LotteryDraw = {
        id,
        game: 'megamillions',
        drawDate: new Date(draw.date),
        mainNumbers: draw.numbers,
        bonusNumber: draw.megaBall,
        jackpot: null
      };
      this.draws.set(id, lotteryDraw);
    });
  }

  async getDraws(game: string): Promise<LotteryDraw[]> {
    return Array.from(this.draws.values())
      .filter(draw => draw.game === game)
      .sort((a, b) => b.drawDate.getTime() - a.drawDate.getTime());
  }

  async getDrawsByDateRange(game: string, startDate: Date, endDate: Date): Promise<LotteryDraw[]> {
    return Array.from(this.draws.values())
      .filter(draw => 
        draw.game === game && 
        draw.drawDate >= startDate && 
        draw.drawDate <= endDate
      )
      .sort((a, b) => b.drawDate.getTime() - a.drawDate.getTime());
  }

  async createDraw(insertDraw: InsertDraw): Promise<LotteryDraw> {
    const id = randomUUID();
    const draw: LotteryDraw = { ...insertDraw, id, jackpot: insertDraw.jackpot || null };
    this.draws.set(id, draw);
    return draw;
  }

  async getRecentTickets(limit: number = 10): Promise<GeneratedTicket[]> {
    return Array.from(this.tickets.values())
      .sort((a, b) => b.createdAt!.getTime() - a.createdAt!.getTime())
      .slice(0, limit);
  }

  async createTicket(insertTicket: InsertTicket): Promise<GeneratedTicket> {
    const id = randomUUID();
    const ticket: GeneratedTicket = { 
      ...insertTicket, 
      id, 
      createdAt: new Date() 
    };
    this.tickets.set(id, ticket);
    return ticket;
  }
}

export const storage = new MemStorage();
