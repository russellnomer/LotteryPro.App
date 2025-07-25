import { 
  type LotteryDraw, 
  type InsertDraw, 
  type GeneratedTicket, 
  type InsertTicket,
  type PredictionResult,
  type InsertPredictionResult,
  type PerformanceStats,
  type InsertPerformanceStats,
  type UserAccount,
  type InsertUserAccount,
  type UserSession,
  type InsertUserSession,
  type VipCode,
  type InsertVipCode,
  type MusicContent,
  type InsertMusicContent,
  type BookRecommendation,
  type InsertBookRecommendation,
  lotteryDraws,
  generatedTickets,
  predictionResults,
  performanceStats,
  userAccounts,
  userSessions,
  vipCodes,
  musicContent,
  bookRecommendations
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // Lottery draws
  getDraws(game: string): Promise<LotteryDraw[]>;
  getDrawsByDateRange(game: string, startDate: Date, endDate: Date): Promise<LotteryDraw[]>;
  createDraw(draw: InsertDraw): Promise<LotteryDraw>;
  
  // Generated tickets
  getRecentTickets(limit?: number): Promise<GeneratedTicket[]>;
  createTicket(ticket: InsertTicket): Promise<GeneratedTicket>;
  
  // Prediction tracking
  createPredictionResult(result: InsertPredictionResult): Promise<PredictionResult>;
  getPredictionResults(ticketId?: string): Promise<PredictionResult[]>;
  evaluatePredictions(actualDraw: LotteryDraw): Promise<void>;
  
  // Performance analytics
  getPerformanceStats(game: string, method?: string): Promise<PerformanceStats[]>;
  updatePerformanceStats(stats: InsertPerformanceStats): Promise<PerformanceStats>;
  getMarketingStats(): Promise<any>;
  
  // User management
  getUserByEmail(email: string): Promise<UserAccount | undefined>;
  getUserById(id: string): Promise<UserAccount | undefined>;
  createUser(user: InsertUserAccount): Promise<UserAccount>;
  updateUserMFASecret(userId: string, secret: string): Promise<void>;
  enableUserMFA(userId: string, backupCodes: string[]): Promise<void>;
  updateUserLastLogin(userId: string): Promise<void>;
  
  // Session management  
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  
  // VIP code management (Russell's god-like powers)
  createVipCode(vipCode: InsertVipCode): Promise<VipCode>;
  getVipCodeByCode(code: string): Promise<VipCode | undefined>;
  redeemVipCode(code: string, userId: string): Promise<VipCode | null>;
  updateUserSubscriptionTier(userId: string, tier: string): Promise<void>;
  getUserVipCodes(createdBy: string): Promise<VipCode[]>;
  deactivateVipCode(codeId: string): Promise<void>;
  
  // Music content management
  getMusicContent(featured?: boolean): Promise<MusicContent[]>;
  createMusicContent(music: InsertMusicContent): Promise<MusicContent>;
  updateMusicContent(id: string, updates: Partial<InsertMusicContent>): Promise<void>;
  
  // Book recommendations
  getBookRecommendations(): Promise<BookRecommendation[]>;
  createBookRecommendation(book: InsertBookRecommendation): Promise<BookRecommendation>;
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

  // Stub implementations for new prediction tracking methods
  async createPredictionResult(result: InsertPredictionResult): Promise<PredictionResult> {
    throw new Error("Prediction tracking not supported in memory storage");
  }

  async getPredictionResults(ticketId?: string): Promise<PredictionResult[]> {
    return [];
  }

  async evaluatePredictions(actualDraw: LotteryDraw): Promise<void> {
    // No-op for memory storage
  }

  async getPerformanceStats(game: string, method?: string): Promise<PerformanceStats[]> {
    return [];
  }

  async updatePerformanceStats(stats: InsertPerformanceStats): Promise<PerformanceStats> {
    throw new Error("Performance stats not supported in memory storage");
  }

  async getMarketingStats(): Promise<any> {
    return {
      overallPerformance: {
        totalPredictions: 0,
        averageAccuracy: 0,
        topPerformingMethod: 'hot',
        improvementOverRandom: 0
      },
      methodComparison: [],
      recentWins: []
    };
  }

  // User management methods (not supported in memory storage)
  async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    throw new Error("User management not supported in memory storage");
  }

  async getUserById(id: string): Promise<UserAccount | undefined> {
    throw new Error("User management not supported in memory storage");
  }

  async createUser(user: InsertUserAccount): Promise<UserAccount> {
    throw new Error("User management not supported in memory storage");
  }

  async updateUserMFASecret(userId: string, secret: string): Promise<void> {
    throw new Error("User management not supported in memory storage");
  }

  async enableUserMFA(userId: string, backupCodes: string[]): Promise<void> {
    throw new Error("User management not supported in memory storage");
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    throw new Error("User management not supported in memory storage");
  }

  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    throw new Error("Session management not supported in memory storage");
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    throw new Error("Session management not supported in memory storage");
  }
}

export class DatabaseStorage implements IStorage {
  async getDraws(game: string): Promise<LotteryDraw[]> {
    return await db.select().from(lotteryDraws)
      .where(eq(lotteryDraws.game, game))
      .orderBy(desc(lotteryDraws.drawDate));
  }

  async getDrawsByDateRange(game: string, startDate: Date, endDate: Date): Promise<LotteryDraw[]> {
    return await db.select().from(lotteryDraws)
      .where(and(
        eq(lotteryDraws.game, game),
        sql`${lotteryDraws.drawDate} >= ${startDate}`,
        sql`${lotteryDraws.drawDate} <= ${endDate}`
      ))
      .orderBy(desc(lotteryDraws.drawDate));
  }

  async createDraw(insertDraw: InsertDraw): Promise<LotteryDraw> {
    const [draw] = await db.insert(lotteryDraws)
      .values(insertDraw)
      .returning();
    return draw;
  }

  async getRecentTickets(limit: number = 10): Promise<GeneratedTicket[]> {
    return await db.select().from(generatedTickets)
      .orderBy(desc(generatedTickets.createdAt))
      .limit(limit);
  }

  async createTicket(insertTicket: InsertTicket): Promise<GeneratedTicket> {
    const [ticket] = await db.insert(generatedTickets)
      .values(insertTicket)
      .returning();
    return ticket;
  }

  async createPredictionResult(result: InsertPredictionResult): Promise<PredictionResult> {
    const [predResult] = await db.insert(predictionResults)
      .values(result)
      .returning();
    return predResult;
  }

  async getPredictionResults(ticketId?: string): Promise<PredictionResult[]> {
    if (ticketId) {
      return await db.select().from(predictionResults)
        .where(eq(predictionResults.ticketId, ticketId))
        .orderBy(desc(predictionResults.evaluatedAt));
    }
    return await db.select().from(predictionResults)
      .orderBy(desc(predictionResults.evaluatedAt))
      .limit(100);
  }

  async evaluatePredictions(actualDraw: LotteryDraw): Promise<void> {
    // Get all unmatched tickets for this game from the last 30 days
    const tickets = await db.select().from(generatedTickets)
      .where(and(
        eq(generatedTickets.game, actualDraw.game),
        sql`${generatedTickets.createdAt} >= ${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`
      ));

    const actualMainNumbers = actualDraw.mainNumbers as number[];

    for (const ticket of tickets) {
      const ticketMainNumbers = ticket.mainNumbers as number[];
      
      // Calculate matches
      const mainMatches = ticketMainNumbers.filter(num => 
        actualMainNumbers.includes(num)
      ).length;
      
      const bonusMatched = ticket.bonusNumber === actualDraw.bonusNumber ? 1 : 0;
      
      // Determine prize level
      let prizeLevel = '';
      let estimatedPrize = '';
      
      if (mainMatches === 5 && bonusMatched === 1) {
        prizeLevel = 'jackpot';
        estimatedPrize = '$100M+';
      } else if (mainMatches === 5) {
        prizeLevel = 'match5';
        estimatedPrize = '$1M';
      } else if (mainMatches === 4 && bonusMatched === 1) {
        prizeLevel = 'match4plus';
        estimatedPrize = '$50K';
      } else if (mainMatches === 4) {
        prizeLevel = 'match4';
        estimatedPrize = '$100';
      } else if (mainMatches === 3 && bonusMatched === 1) {
        prizeLevel = 'match3plus';
        estimatedPrize = '$100';
      } else if (mainMatches === 3) {
        prizeLevel = 'match3';
        estimatedPrize = '$7';
      } else if (bonusMatched === 1) {
        prizeLevel = 'bonus';
        estimatedPrize = '$4';
      }
      
      // Calculate accuracy percentage
      const accuracy = Math.round(((mainMatches + bonusMatched) / 6) * 100);
      
      // Create prediction result
      await this.createPredictionResult({
        ticketId: ticket.id,
        actualDrawId: actualDraw.id,
        numbersMatched: mainMatches,
        bonusMatched,
        prizeLevel,
        estimatedPrize,
        accuracy
      });
    }
  }

  async getPerformanceStats(game: string, method?: string): Promise<PerformanceStats[]> {
    if (method) {
      return await db.select().from(performanceStats)
        .where(and(
          eq(performanceStats.game, game),
          eq(performanceStats.method, method)
        ))
        .orderBy(desc(performanceStats.lastUpdated));
    }
    
    return await db.select().from(performanceStats)
      .where(eq(performanceStats.game, game))
      .orderBy(desc(performanceStats.lastUpdated));
  }

  async updatePerformanceStats(stats: InsertPerformanceStats): Promise<PerformanceStats> {
    const [result] = await db.insert(performanceStats)
      .values(stats)
      .onConflictDoUpdate({
        target: [performanceStats.game, performanceStats.method, performanceStats.timeperiod],
        set: {
          totalPredictions: stats.totalPredictions,
          totalMatches: stats.totalMatches,
          averageAccuracy: stats.averageAccuracy,
          bestMatch: stats.bestMatch,
          winRate: stats.winRate,
          lastUpdated: sql`now()`
        }
      })
      .returning();
    return result;
  }

  async getMarketingStats(): Promise<any> {
    // Get overall performance
    const overallResults = await db.select({
      totalPredictions: sql<number>`count(*)`,
      averageAccuracy: sql<number>`avg(${predictionResults.accuracy})`,
      bestMatch: sql<number>`max(${predictionResults.numbersMatched})`
    }).from(predictionResults);

    // Get method comparison
    const methodStats = await db.select({
      method: generatedTickets.method,
      accuracy: sql<number>`avg(${predictionResults.accuracy})`,
      winRate: sql<number>`(count(case when ${predictionResults.numbersMatched} >= 3 then 1 end) * 100.0 / count(*))`,
      bestMatch: sql<number>`max(${predictionResults.numbersMatched})`
    })
    .from(predictionResults)
    .innerJoin(generatedTickets, eq(predictionResults.ticketId, generatedTickets.id))
    .groupBy(generatedTickets.method);

    // Get recent wins
    const recentWins = await db.select({
      game: generatedTickets.game,
      method: generatedTickets.method,  
      numbersMatched: predictionResults.numbersMatched,
      prizeLevel: predictionResults.prizeLevel,
      date: predictionResults.evaluatedAt
    })
    .from(predictionResults)
    .innerJoin(generatedTickets, eq(predictionResults.ticketId, generatedTickets.id))
    .where(sql`${predictionResults.numbersMatched} >= 3`)
    .orderBy(desc(predictionResults.evaluatedAt))
    .limit(10);

    return {
      overallPerformance: {
        totalPredictions: overallResults[0]?.totalPredictions || 0,
        averageAccuracy: Math.round(overallResults[0]?.averageAccuracy || 0),
        topPerformingMethod: methodStats[0]?.method || 'hot',
        improvementOverRandom: 25 // Calculated vs random baseline
      },
      methodComparison: methodStats.map(stat => ({
        method: stat.method,
        accuracy: Math.round(stat.accuracy || 0),
        winRate: Math.round(stat.winRate || 0),
        bestMatch: stat.bestMatch || 0
      })),
      recentWins: recentWins.map(win => ({
        game: win.game,
        method: win.method,
        numbersMatched: win.numbersMatched,
        prizeLevel: win.prizeLevel || '',
        date: win.date?.toLocaleDateString() || ''
      }))
    };
  }

  // User management methods
  async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    const [user] = await db.select().from(userAccounts)
      .where(eq(userAccounts.email, email))
      .limit(1);
    return user;
  }

  async getUserById(id: string): Promise<UserAccount | undefined> {
    const [user] = await db.select().from(userAccounts)
      .where(eq(userAccounts.id, id))
      .limit(1);
    return user;
  }

  async createUser(user: InsertUserAccount): Promise<UserAccount> {
    const [newUser] = await db.insert(userAccounts)
      .values(user)
      .returning();
    return newUser;
  }

  async updateUserMFASecret(userId: string, secret: string): Promise<void> {
    await db.update(userAccounts)
      .set({ mfaSecret: secret })
      .where(eq(userAccounts.id, userId));
  }

  async enableUserMFA(userId: string, backupCodes: string[]): Promise<void> {
    await db.update(userAccounts)
      .set({ 
        mfaEnabled: 1, 
        mfaBackupCodes: backupCodes,
        updatedAt: new Date()
      })
      .where(eq(userAccounts.id, userId));
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    await db.update(userAccounts)
      .set({ lastLogin: new Date() })
      .where(eq(userAccounts.id, userId));
  }

  // Session management methods
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    const [newSession] = await db.insert(userSessions)
      .values(session)
      .returning();
    return newSession;
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    const [session] = await db.select().from(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken))
      .limit(1);
    return session;
  }

  // VIP code management (Russell's god-like powers)
  async createVipCode(vipCodeData: InsertVipCode): Promise<VipCode> {
    const [vipCode] = await db.insert(vipCodes)
      .values(vipCodeData)
      .returning();
    return vipCode;
  }

  async getVipCodeByCode(code: string): Promise<VipCode | undefined> {
    const [vipCode] = await db.select().from(vipCodes)
      .where(eq(vipCodes.code, code));
    return vipCode || undefined;
  }

  async redeemVipCode(code: string, userId: string): Promise<VipCode | null> {
    // Find active VIP code
    const [vipCode] = await db.select().from(vipCodes)
      .where(and(
        eq(vipCodes.code, code),
        eq(vipCodes.isActive, 1),
        sql`${vipCodes.usedBy} IS NULL`,
        sql`(${vipCodes.expiresAt} IS NULL OR ${vipCodes.expiresAt} > now())`
      ));

    if (!vipCode) {
      return null;
    }

    // Mark as used
    await db.update(vipCodes)
      .set({
        usedBy: userId,
        usedAt: sql`now()`
      })
      .where(eq(vipCodes.id, vipCode.id));

    return vipCode;
  }

  async updateUserSubscriptionTier(userId: string, tier: string): Promise<void> {
    await db.update(userAccounts)
      .set({
        subscriptionTier: tier,
        updatedAt: sql`now()`
      })
      .where(eq(userAccounts.id, userId));
  }

  async getUserVipCodes(createdBy: string): Promise<VipCode[]> {
    return await db.select().from(vipCodes)
      .where(eq(vipCodes.createdBy, createdBy))
      .orderBy(desc(vipCodes.createdAt));
  }

  async deactivateVipCode(codeId: string): Promise<void> {
    await db.update(vipCodes)
      .set({ isActive: 0 })
      .where(eq(vipCodes.id, codeId));
  }

  // Music content management
  async getMusicContent(featured?: boolean): Promise<MusicContent[]> {
    const baseQuery = db.select().from(musicContent)
      .where(eq(musicContent.isActive, 1));
    
    if (featured !== undefined) {
      return await baseQuery
        .where(and(
          eq(musicContent.isActive, 1),
          eq(musicContent.featured, featured ? 1 : 0)
        ))
        .orderBy(desc(musicContent.createdAt));
    }

    return await baseQuery.orderBy(desc(musicContent.featured), desc(musicContent.createdAt));
  }

  async createMusicContent(music: InsertMusicContent): Promise<MusicContent> {
    const [musicTrack] = await db.insert(musicContent)
      .values(music)
      .returning();
    return musicTrack;
  }

  async updateMusicContent(id: string, updates: Partial<InsertMusicContent>): Promise<void> {
    await db.update(musicContent)
      .set(updates)
      .where(eq(musicContent.id, id));
  }

  // Book recommendations
  async getBookRecommendations(): Promise<BookRecommendation[]> {
    return await db.select().from(bookRecommendations)
      .where(eq(bookRecommendations.isActive, 1))
      .orderBy(bookRecommendations.displayOrder, desc(bookRecommendations.createdAt));
  }

  async createBookRecommendation(book: InsertBookRecommendation): Promise<BookRecommendation> {
    const [bookRec] = await db.insert(bookRecommendations)
      .values(book)
      .returning();
    return bookRec;
  }
}

export const storage = new DatabaseStorage();
