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
  type SupportTicket,
  type InsertSupportTicket,
  type SupportMessage,
  type InsertSupportMessage,
  type UserConsent,
  type InsertUserConsent,
  type CustomerProfile,
  type InsertCustomerProfile,
  type CustomerActivity,
  type InsertCustomerActivity,
  type EmailVerificationCode,
  type InsertEmailVerificationCode,
  type SmsVerificationCode,
  type InsertSmsVerificationCode,
  lotteryDraws,
  generatedTickets,
  predictionResults,
  performanceStats,
  userAccounts,
  userSessions,
  vipCodes,
  musicContent,
  bookRecommendations,
  supportTickets,
  supportMessages,
  userConsents,
  customerProfiles,
  customerActivity,
  emailVerificationCodes,
  smsVerificationCodes
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc, sql, count, gt } from "drizzle-orm";

// In-memory guest usage tracking (resets on server restart)
interface GuestUsage {
  count: number;
  lastReset: string; // Date string for daily reset
}

const guestUsageMap = new Map<string, GuestUsage>();

export interface IStorage {
  // Lottery draws
  getDraws(game: string): Promise<LotteryDraw[]>;
  getDrawsByDateRange(game: string, startDate: Date, endDate: Date): Promise<LotteryDraw[]>;
  createDraw(draw: InsertDraw): Promise<LotteryDraw>;
  deleteDraw(drawId: string): Promise<void>;
  
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
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  
  // Session management  
  createUserSession(session: InsertUserSession): Promise<UserSession>;
  getUserSession(sessionToken: string): Promise<UserSession | undefined>;
  deleteUserSession(sessionToken: string): Promise<void>;
  cleanupExpiredSessions(): Promise<number>;
  
  // VIP code management (Russell's god-like powers)
  createVipCode(vipCode: InsertVipCode): Promise<VipCode>;
  getVipCodeByCode(code: string): Promise<VipCode | undefined>;
  redeemVipCode(code: string, userId: string): Promise<VipCode | null>;
  updateUserSubscriptionTier(userId: string, tier: string): Promise<void>;
  updateUserTier(email: string, tier: string): Promise<void>;
  getUserVipCodes(createdBy: string): Promise<VipCode[]>;
  deactivateVipCode(codeId: string): Promise<void>;
  getAllUsers(): Promise<UserAccount[]>;
  
  // Subscription management
  updateUserSubscriptionStatus(userId: string, status: string, paypalSubscriptionId?: string): Promise<void>;
  checkUserUsageLimit(userId: string): Promise<{ canUse: boolean; count: number; limit: number }>;
  incrementUserDailyUsage(userId: string): Promise<void>;
  resetUserDailyUsage(userId: string): Promise<void>;
  resetAllDailyUsage(): Promise<number>;
  getUserSubscriptionInfo(userId: string): Promise<{ tier: string; status: string; usageCount: number; usageLimit: number } | undefined>;
  
  // Music content management
  getMusicContent(featured?: boolean): Promise<MusicContent[]>;
  createMusicContent(music: InsertMusicContent): Promise<MusicContent>;
  updateMusicContent(id: string, updates: Partial<InsertMusicContent>): Promise<void>;
  
  // Book recommendations
  getBookRecommendations(): Promise<BookRecommendation[]>;
  createBookRecommendation(book: InsertBookRecommendation): Promise<BookRecommendation>;
  
  // Support ticket management
  createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket>;
  getSupportTicket(id: string): Promise<SupportTicket | undefined>;
  getSupportTickets(filters?: { status?: string; priority?: string; userId?: string }): Promise<SupportTicket[]>;
  updateSupportTicket(id: string, updates: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined>;
  createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage>;
  getTicketMessages(ticketId: string): Promise<SupportMessage[]>;
  
  // User consent management
  recordUserConsent(consent: InsertUserConsent): Promise<UserConsent>;
  getUserConsent(userId?: string, sessionId?: string): Promise<UserConsent | undefined>;
  
  // Customer profile management
  createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile>;
  getCustomerProfile(id: string): Promise<CustomerProfile | undefined>;
  getCustomerProfileByEmail(emailHash: string): Promise<CustomerProfile | undefined>;
  updateCustomerProfile(id: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined>;
  
  // Customer activity tracking
  createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity>;
  getCustomerActivities(customerId: string): Promise<CustomerActivity[]>;
  
  // Email verification codes
  createEmailVerificationCode(code: InsertEmailVerificationCode): Promise<EmailVerificationCode>;
  getEmailVerificationCode(emailHash: string, code: string): Promise<EmailVerificationCode | undefined>;
  markEmailVerificationAsUsed(id: string): Promise<void>;
  
  // SMS verification codes
  createSmsVerificationCode(code: InsertSmsVerificationCode): Promise<SmsVerificationCode>;
  getSmsVerificationCode(mobileNumberHash: string, code: string): Promise<SmsVerificationCode | undefined>;
  markSmsVerificationAsUsed(id: string): Promise<void>;
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

  async deleteDraw(drawId: string): Promise<void> {
    this.draws.delete(drawId);
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

  // User management stub implementations
  async getUserByEmail(email: string): Promise<UserAccount | undefined> {
    return undefined;
  }

  async getUserById(id: string): Promise<UserAccount | undefined> {
    return undefined;
  }

  async createUser(user: InsertUserAccount): Promise<UserAccount> {
    throw new Error("User management not supported in memory storage");
  }

  async updateUserMFASecret(userId: string, secret: string): Promise<void> {
    // No-op for memory storage
  }

  async enableUserMFA(userId: string, backupCodes: string[]): Promise<void> {
    // No-op for memory storage
  }

  async updateUserLastLogin(userId: string): Promise<void> {
    // No-op for memory storage
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    // No-op for memory storage
  }

  // Session management stub implementations
  async createUserSession(session: InsertUserSession): Promise<UserSession> {
    throw new Error("Session management not supported in memory storage");
  }

  async getUserSession(sessionToken: string): Promise<UserSession | undefined> {
    return undefined;
  }

  async deleteUserSession(sessionToken: string): Promise<void> {
    // No-op for memory storage
  }

  async cleanupExpiredSessions(): Promise<number> {
    return 0; // No sessions in memory storage
  }

  // VIP code management stub implementations
  async createVipCode(vipCode: InsertVipCode): Promise<VipCode> {
    throw new Error("VIP code management not supported in memory storage");
  }

  async getVipCodeByCode(codeHash: string): Promise<VipCode | undefined> {
    return undefined;
  }

  async redeemVipCode(codeHash: string, userId: string): Promise<VipCode | null> {
    return null;
  }

  async updateUserSubscriptionTier(userId: string, tier: string): Promise<void> {
    // No-op for memory storage
  }

  async updateUserTier(email: string, tier: string): Promise<void> {
    // No-op for memory storage
  }

  async getUserVipCodes(createdBy: string): Promise<VipCode[]> {
    return [];
  }

  async deactivateVipCode(codeId: string): Promise<void> {
    // No-op for memory storage
  }

  async getAllUsers(): Promise<UserAccount[]> {
    return [];
  }

  // Subscription management stub implementations
  async updateUserSubscriptionStatus(userId: string, status: string, paypalSubscriptionId?: string): Promise<void> {
    // No-op for memory storage
  }

  async checkUserUsageLimit(userId: string): Promise<{ canUse: boolean; count: number; limit: number }> {
    return { canUse: true, count: 0, limit: 999 }; // Unlimited for memory storage
  }

  async incrementUserDailyUsage(userId: string): Promise<void> {
    // No-op for memory storage
  }

  async resetUserDailyUsage(userId: string): Promise<void> {
    // No-op for memory storage
  }

  async resetAllDailyUsage(): Promise<number> {
    // No-op for memory storage
    return 0;
  }

  async getUserSubscriptionInfo(userId: string): Promise<{ tier: string; status: string; usageCount: number; usageLimit: number } | undefined> {
    return { tier: 'unlimited', status: 'active', usageCount: 0, usageLimit: 999 };
  }

  // Music content management stub implementations
  async getMusicContent(featured?: boolean): Promise<MusicContent[]> {
    return [];
  }

  async createMusicContent(music: InsertMusicContent): Promise<MusicContent> {
    throw new Error("Music content management not supported in memory storage");
  }

  async updateMusicContent(id: string, updates: Partial<InsertMusicContent>): Promise<void> {
    // No-op for memory storage
  }

  // Book recommendations stub implementations
  async getBookRecommendations(): Promise<BookRecommendation[]> {
    return [];
  }

  async createBookRecommendation(book: InsertBookRecommendation): Promise<BookRecommendation> {
    throw new Error("Book recommendations not supported in memory storage");
  }

  // Support ticket management stub implementations
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    throw new Error("Support tickets not supported in memory storage");
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    return undefined;
  }

  async getSupportTickets(filters?: { status?: string; priority?: string; userId?: string }): Promise<SupportTicket[]> {
    return [];
  }

  async updateSupportTicket(id: string, updates: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    return undefined;
  }

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    throw new Error("Support messages not supported in memory storage");
  }

  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    return [];
  }

  // User consent management stub implementations
  async recordUserConsent(consent: InsertUserConsent): Promise<UserConsent> {
    throw new Error("User consent not supported in memory storage");
  }

  async getUserConsent(userId?: string, sessionId?: string): Promise<UserConsent | undefined> {
    return undefined;
  }

  // Customer profile stub implementations
  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    throw new Error("Customer profiles not supported in memory storage");
  }

  async getCustomerProfile(id: string): Promise<CustomerProfile | undefined> {
    return undefined;
  }

  async getCustomerProfileByEmail(emailHash: string): Promise<CustomerProfile | undefined> {
    return undefined;
  }

  async updateCustomerProfile(id: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    return undefined;
  }

  async createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    throw new Error("Customer activity not supported in memory storage");
  }

  async getCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
    return [];
  }

  async createEmailVerificationCode(code: InsertEmailVerificationCode): Promise<EmailVerificationCode> {
    throw new Error("Email verification not supported in memory storage");
  }

  async getEmailVerificationCode(emailHash: string, code: string): Promise<EmailVerificationCode | undefined> {
    return undefined;
  }

  async markEmailVerificationAsUsed(id: string): Promise<void> {
    throw new Error("Email verification not supported in memory storage");
  }

  async createSmsVerificationCode(code: InsertSmsVerificationCode): Promise<SmsVerificationCode> {
    throw new Error("SMS verification not supported in memory storage");
  }

  async getSmsVerificationCode(mobileNumberHash: string, code: string): Promise<SmsVerificationCode | undefined> {
    return undefined;
  }

  async markSmsVerificationAsUsed(id: string): Promise<void> {
    throw new Error("SMS verification not supported in memory storage");
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
      .onConflictDoNothing()
      .returning();
    return draw;
  }

  async deleteDraw(drawId: string): Promise<void> {
    await db.delete(lotteryDraws)
      .where(eq(lotteryDraws.id, drawId));
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

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db.update(userAccounts)
      .set({ passwordHash, updatedAt: new Date() })
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

  async deleteUserSession(sessionToken: string): Promise<void> {
    await db.delete(userSessions)
      .where(eq(userSessions.sessionToken, sessionToken));
  }

  async cleanupExpiredSessions(): Promise<number> {
    const result = await db.delete(userSessions)
      .where(sql`${userSessions.expiresAt} < now()`);
    return result.rowCount || 0;
  }

  // VIP code management (Russell's god-like powers)
  async createVipCode(vipCodeData: InsertVipCode): Promise<VipCode> {
    const [vipCode] = await db.insert(vipCodes)
      .values(vipCodeData)
      .returning();
    return vipCode;
  }

  async getVipCodeByCode(codeHash: string): Promise<VipCode | undefined> {
    const [vipCode] = await db.select().from(vipCodes)
      .where(eq(vipCodes.codeHash, codeHash));
    return vipCode || undefined;
  }

  async redeemVipCode(codeHash: string, userId: string): Promise<VipCode | null> {
    // Find active VIP code
    const [vipCode] = await db.select().from(vipCodes)
      .where(and(
        eq(vipCodes.codeHash, codeHash),
        eq(vipCodes.isUsed, 0),
        sql`(${vipCodes.expiresAt} IS NULL OR ${vipCodes.expiresAt} > now())`
      ));

    if (!vipCode) {
      return null;
    }

    // Mark as used
    await db.update(vipCodes)
      .set({
        isUsed: 1,
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
      .set({ isUsed: 1 })
      .where(eq(vipCodes.id, codeId));
  }

  async getAllUsers(): Promise<UserAccount[]> {
    return await db.select().from(userAccounts)
      .orderBy(desc(userAccounts.createdAt));
  }

  async updateUserTier(email: string, tier: string): Promise<void> {
    await db.update(userAccounts)
      .set({ 
        subscriptionTier: tier,
        updatedAt: new Date()
      })
      .where(eq(userAccounts.email, email));
  }

  // Music content management
  async getMusicContent(featured?: boolean): Promise<MusicContent[]> {
    if (featured !== undefined) {
      return await db.select().from(musicContent)
        .where(and(
          eq(musicContent.isActive, 1),
          eq(musicContent.featured, featured ? 1 : 0)
        ))
        .orderBy(desc(musicContent.createdAt));
    }

    return await db.select().from(musicContent)
      .where(eq(musicContent.isActive, 1))
      .orderBy(desc(musicContent.featured), desc(musicContent.createdAt));
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

  // Subscription management implementations
  async updateUserSubscriptionStatus(userId: string, status: string, paypalSubscriptionId?: string): Promise<void> {
    const updateData: any = {
      subscriptionStatus: status,
      updatedAt: new Date()
    };
    
    if (paypalSubscriptionId) {
      updateData.paypalSubscriptionId = paypalSubscriptionId;
    }
    
    await db.update(userAccounts)
      .set(updateData)
      .where(eq(userAccounts.id, userId));
  }

  async checkUserUsageLimit(userId: string): Promise<{ canUse: boolean; count: number; limit: number }> {
    const user = await db.select({
      subscriptionTier: userAccounts.subscriptionTier,
      dailyUsageCount: userAccounts.dailyUsageCount,
      lastUsageReset: userAccounts.lastUsageReset
    }).from(userAccounts)
      .where(eq(userAccounts.id, userId))
      .limit(1);

    if (user.length === 0) {
      // Guest user - use in-memory tracking
      const today = new Date().toDateString();
      let guestUsage = guestUsageMap.get(userId);
      
      // Reset if new day or first visit
      if (!guestUsage || guestUsage.lastReset !== today) {
        guestUsage = { count: 0, lastReset: today };
        guestUsageMap.set(userId, guestUsage);
      }
      
      const limit = 3; // Free tier guest limit
      const canUse = guestUsage.count < limit;
      
      console.log('🎁 GUEST USER:', userId, 'Count:', guestUsage.count, 'Limit:', limit, 'CanUse:', canUse);
      return { canUse, count: guestUsage.count, limit };
    }

    const userData = user[0];
    
    // Check if we need to reset daily usage (new day)
    const today = new Date().toDateString();
    const lastReset = userData.lastUsageReset ? new Date(userData.lastUsageReset).toDateString() : '';
    
    if (today !== lastReset) {
      await this.resetUserDailyUsage(userId);
      userData.dailyUsageCount = 0;
    }

    // Define usage limits by tier
    const usageLimits: Record<string, number> = {
      free: 1,
      basic: 5,
      pro: 9999,
      premium: 9999,
      unlimited: 9999,
      founder: 9999,
      lifetime: 9999,
    };

    const limit = usageLimits[userData.subscriptionTier] ?? 1;
    const count = userData.dailyUsageCount || 0;
    const canUse = count < limit;

    return { canUse, count, limit };
  }

  async incrementUserDailyUsage(userId: string): Promise<void> {
    // Check if user exists first (to handle guests)
    const user = await db.select({ id: userAccounts.id })
      .from(userAccounts)
      .where(eq(userAccounts.id, userId))
      .limit(1);
      
    if (user.length === 0) {
      // Guest user - increment in-memory tracking
      const today = new Date().toDateString();
      let guestUsage = guestUsageMap.get(userId);
      
      if (!guestUsage || guestUsage.lastReset !== today) {
        guestUsage = { count: 0, lastReset: today };
      }
      
      guestUsage.count++;
      guestUsageMap.set(userId, guestUsage);
      
      console.log('🎯 GUEST INCREMENT:', userId, 'New count:', guestUsage.count);
      return;
    }
    
    // Update registered user's usage count
    await db.update(userAccounts)
      .set({
        dailyUsageCount: sql`${userAccounts.dailyUsageCount} + 1`,
        updatedAt: new Date()
      })
      .where(eq(userAccounts.id, userId));
  }

  async resetUserDailyUsage(userId: string): Promise<void> {
    await db.update(userAccounts)
      .set({
        dailyUsageCount: 0,
        lastUsageReset: new Date(),
        updatedAt: new Date()
      })
      .where(eq(userAccounts.id, userId));
  }

  async resetAllDailyUsage(): Promise<number> {
    // Count users with non-zero usage before resetting so we return meaningful number
    const [{ total }] = await db.select({ total: count() }).from(userAccounts).where(gt(userAccounts.dailyUsageCount, 0));
    await db.update(userAccounts)
      .set({
        dailyUsageCount: 0,
        lastUsageReset: new Date(),
        updatedAt: new Date()
      });
    return total;
  }

  async getUserSubscriptionInfo(userId: string): Promise<{ tier: string; status: string; usageCount: number; usageLimit: number } | undefined> {
    const user = await db.select({
      subscriptionTier: userAccounts.subscriptionTier,
      subscriptionStatus: userAccounts.subscriptionStatus,
      dailyUsageCount: userAccounts.dailyUsageCount,
      lastUsageReset: userAccounts.lastUsageReset
    }).from(userAccounts)
      .where(eq(userAccounts.id, userId))
      .limit(1);

    if (user.length === 0) {
      return undefined;
    }

    const userData = user[0];
    
    // Check if we need to reset daily usage (new day)
    const today = new Date().toDateString();
    const lastReset = userData.lastUsageReset ? new Date(userData.lastUsageReset).toDateString() : '';
    
    let usageCount = userData.dailyUsageCount || 0;
    if (today !== lastReset) {
      await this.resetUserDailyUsage(userId);
      usageCount = 0;
    }

    // Define usage limits by tier
    const usageLimits: Record<string, number> = {
      free: 1,
      basic: 5,
      pro: 9999,
      premium: 9999,
      unlimited: 9999,
      founder: 9999,
      lifetime: 9999,
    };

    const usageLimit = usageLimits[userData.subscriptionTier] ?? 1;

    return {
      tier: userData.subscriptionTier,
      status: userData.subscriptionStatus,
      usageCount,
      usageLimit
    };
  }

  // Support ticket management
  async createSupportTicket(ticket: InsertSupportTicket): Promise<SupportTicket> {
    const [newTicket] = await db.insert(supportTickets)
      .values(ticket)
      .returning();
    return newTicket;
  }

  async getSupportTicket(id: string): Promise<SupportTicket | undefined> {
    const [ticket] = await db.select().from(supportTickets)
      .where(eq(supportTickets.id, id))
      .limit(1);
    return ticket;
  }

  async getSupportTickets(filters?: { status?: string; priority?: string; userId?: string }): Promise<SupportTicket[]> {
    let query = db.select().from(supportTickets);
    
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(supportTickets.status, filters.status));
    }
    if (filters?.priority) {
      conditions.push(eq(supportTickets.priority, filters.priority));
    }
    if (filters?.userId) {
      conditions.push(eq(supportTickets.userId, filters.userId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(supportTickets.createdAt));
  }

  async updateSupportTicket(id: string, updates: Partial<InsertSupportTicket>): Promise<SupportTicket | undefined> {
    const [updated] = await db.update(supportTickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(supportTickets.id, id))
      .returning();
    return updated;
  }

  async createSupportMessage(message: InsertSupportMessage): Promise<SupportMessage> {
    const [newMessage] = await db.insert(supportMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getTicketMessages(ticketId: string): Promise<SupportMessage[]> {
    return await db.select().from(supportMessages)
      .where(eq(supportMessages.ticketId, ticketId))
      .orderBy(supportMessages.createdAt);
  }

  // User consent management
  async recordUserConsent(consent: InsertUserConsent): Promise<UserConsent> {
    const [newConsent] = await db.insert(userConsents)
      .values(consent)
      .returning();
    return newConsent;
  }

  async getUserConsent(userId?: string, sessionId?: string): Promise<UserConsent | undefined> {
    if (userId) {
      const [consent] = await db.select().from(userConsents)
        .where(eq(userConsents.userId, userId))
        .orderBy(desc(userConsents.createdAt))
        .limit(1);
      return consent;
    }
    if (sessionId) {
      const [consent] = await db.select().from(userConsents)
        .where(eq(userConsents.sessionId, sessionId))
        .orderBy(desc(userConsents.createdAt))
        .limit(1);
      return consent;
    }
    return undefined;
  }

  // Customer profile management
  async createCustomerProfile(profile: InsertCustomerProfile): Promise<CustomerProfile> {
    const [newProfile] = await db.insert(customerProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async getCustomerProfile(id: string): Promise<CustomerProfile | undefined> {
    const [profile] = await db.select().from(customerProfiles)
      .where(eq(customerProfiles.id, id))
      .limit(1);
    return profile;
  }

  async getCustomerProfileByEmail(emailHash: string): Promise<CustomerProfile | undefined> {
    const [profile] = await db.select().from(customerProfiles)
      .where(eq(customerProfiles.emailHash, emailHash))
      .limit(1);
    return profile;
  }

  async updateCustomerProfile(id: string, updates: Partial<InsertCustomerProfile>): Promise<CustomerProfile | undefined> {
    const [updated] = await db.update(customerProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(customerProfiles.id, id))
      .returning();
    return updated;
  }

  // Customer activity tracking
  async createCustomerActivity(activity: InsertCustomerActivity): Promise<CustomerActivity> {
    const [newActivity] = await db.insert(customerActivity)
      .values(activity)
      .returning();
    return newActivity;
  }

  async getCustomerActivities(customerId: string): Promise<CustomerActivity[]> {
    return await db.select().from(customerActivity)
      .where(eq(customerActivity.customerId, customerId))
      .orderBy(desc(customerActivity.createdAt));
  }

  // Email verification codes
  async createEmailVerificationCode(code: InsertEmailVerificationCode): Promise<EmailVerificationCode> {
    const [newCode] = await db.insert(emailVerificationCodes)
      .values(code)
      .returning();
    return newCode;
  }

  async getEmailVerificationCode(emailHash: string, code: string): Promise<EmailVerificationCode | undefined> {
    const [verificationCode] = await db.select().from(emailVerificationCodes)
      .where(and(
        eq(emailVerificationCodes.emailHash, emailHash),
        eq(emailVerificationCodes.verificationCode, code)
      ))
      .limit(1);
    return verificationCode;
  }

  async markEmailVerificationAsUsed(id: string): Promise<void> {
    await db.update(emailVerificationCodes)
      .set({ isUsed: true })
      .where(eq(emailVerificationCodes.id, id));
  }

  // SMS verification codes
  async createSmsVerificationCode(code: InsertSmsVerificationCode): Promise<SmsVerificationCode> {
    const [newCode] = await db.insert(smsVerificationCodes)
      .values(code)
      .returning();
    return newCode;
  }

  async getSmsVerificationCode(mobileNumberHash: string, code: string): Promise<SmsVerificationCode | undefined> {
    const [verificationCode] = await db.select().from(smsVerificationCodes)
      .where(and(
        eq(smsVerificationCodes.mobileNumberHash, mobileNumberHash),
        eq(smsVerificationCodes.verificationCode, code)
      ))
      .limit(1);
    return verificationCode;
  }

  async markSmsVerificationAsUsed(id: string): Promise<void> {
    await db.update(smsVerificationCodes)
      .set({ isUsed: true })
      .where(eq(smsVerificationCodes.id, id));
  }

}

export const storage = new DatabaseStorage();
