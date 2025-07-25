import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const lotteryDraws = pgTable("lottery_draws", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  game: text("game").notNull(), // 'powerball' or 'megamillions'
  drawDate: timestamp("draw_date").notNull(),
  mainNumbers: jsonb("main_numbers").notNull(), // array of numbers
  bonusNumber: integer("bonus_number").notNull(), // powerball or mega ball
  jackpot: text("jackpot"), // jackpot amount as string
});

export const generatedTickets = pgTable("generated_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  game: text("game").notNull(),
  method: text("method").notNull(), // 'hot', 'balanced', 'wheel'
  mainNumbers: jsonb("main_numbers").notNull(),
  bonusNumber: integer("bonus_number").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const predictionResults = pgTable("prediction_results", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => generatedTickets.id),
  actualDrawId: varchar("actual_draw_id").references(() => lotteryDraws.id),
  numbersMatched: integer("numbers_matched").notNull().default(0),
  bonusMatched: integer("bonus_matched").notNull().default(0), // 0 or 1
  prizeLevel: text("prize_level"), // 'jackpot', 'match5', 'match4', etc.
  estimatedPrize: text("estimated_prize"),
  accuracy: integer("accuracy").notNull().default(0), // percentage 0-100
  evaluatedAt: timestamp("evaluated_at").default(sql`now()`),
});

export const performanceStats = pgTable("performance_stats", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  game: text("game").notNull(),
  method: text("method").notNull(),
  timeperiod: text("timeperiod").notNull(), // 'daily', 'weekly', 'monthly'
  totalPredictions: integer("total_predictions").notNull().default(0),
  totalMatches: integer("total_matches").notNull().default(0),
  averageAccuracy: integer("average_accuracy").notNull().default(0),
  bestMatch: integer("best_match").notNull().default(0),
  winRate: integer("win_rate").notNull().default(0), // percentage
  lastUpdated: timestamp("last_updated").default(sql`now()`),
});

export const userAccounts = pgTable("user_accounts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  subscriptionTier: text("subscription_tier").notNull().default("free"), // 'free', 'basic', 'pro', 'premium'
  subscriptionStatus: text("subscription_status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  paypalSubscriptionId: text("paypal_subscription_id"),
  mfaSecret: text("mfa_secret"), // Base32 encoded secret for TOTP
  mfaEnabled: integer("mfa_enabled").notNull().default(0), // 0 = disabled, 1 = enabled
  mfaBackupCodes: jsonb("mfa_backup_codes"), // Array of backup codes
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const userSessions = pgTable("user_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => userAccounts.id),
  sessionToken: text("session_token").notNull().unique(),
  mfaVerified: integer("mfa_verified").notNull().default(0), // 0 = not verified, 1 = verified
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// VIP codes table for Russell's god-like gifting abilities
export const vipCodes = pgTable("vip_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // The unique code Russell creates
  subscriptionTier: text("subscription_tier").notNull(), // 'basic', 'pro', 'premium'
  createdBy: varchar("created_by").notNull().references(() => userAccounts.id), // russell@russellnomer.com user ID
  usedBy: varchar("used_by").references(() => userAccounts.id), // Who redeemed it
  isActive: integer("is_active").notNull().default(1), // 0 = deactivated, 1 = active
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  expiresAt: timestamp("expires_at"), // Optional expiration
});

// Music content integration for Russell Nomer Music branding
export const musicContent = pgTable("music_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  platform: text("platform").notNull(), // 'spotify', 'soundcloud', 'youtube', 'apple_music', 'unitedmasters'
  trackTitle: text("track_title").notNull(),
  trackUrl: text("track_url").notNull(),
  embedCode: text("embed_code"), // For platforms that support embedding
  coverImageUrl: text("cover_image_url"),
  genre: text("genre"),
  releaseDate: timestamp("release_date"),
  playCount: integer("play_count").default(0),
  featured: integer("featured").notNull().default(0), // 0 = regular, 1 = featured track
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Book recommendations for Russell's gambling strategy books
export const bookRecommendations = pgTable("book_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  amazonUrl: text("amazon_url").notNull(),
  coverImageUrl: text("cover_image_url"),
  description: text("description"),
  category: text("category").notNull(), // 'gambling', 'strategy', 'entertainment'
  displayOrder: integer("display_order").default(0),
  isActive: integer("is_active").notNull().default(1),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const insertDrawSchema = createInsertSchema(lotteryDraws).omit({
  id: true,
});

export const insertTicketSchema = createInsertSchema(generatedTickets).omit({
  id: true,
  createdAt: true,
});

export type InsertDraw = z.infer<typeof insertDrawSchema>;
export type LotteryDraw = typeof lotteryDraws.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type GeneratedTicket = typeof generatedTickets.$inferSelect;

export const insertPredictionResultSchema = createInsertSchema(predictionResults).omit({
  id: true,
  evaluatedAt: true,
});

export const insertPerformanceStatsSchema = createInsertSchema(performanceStats).omit({
  id: true,
  lastUpdated: true,
});

export type InsertPredictionResult = z.infer<typeof insertPredictionResultSchema>;
export type PredictionResult = typeof predictionResults.$inferSelect;
export type InsertPerformanceStats = z.infer<typeof insertPerformanceStatsSchema>;

export const insertUserAccountSchema = createInsertSchema(userAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSessionSchema = createInsertSchema(userSessions).omit({
  id: true,
  createdAt: true,
});

export type InsertUserAccount = z.infer<typeof insertUserAccountSchema>;
export type UserAccount = typeof userAccounts.$inferSelect;
export type InsertUserSession = z.infer<typeof insertUserSessionSchema>;
export type UserSession = typeof userSessions.$inferSelect;
export type PerformanceStats = typeof performanceStats.$inferSelect;

// VIP and Music schemas
export const insertVipCodeSchema = createInsertSchema(vipCodes).omit({
  id: true,
  usedAt: true,
  createdAt: true,
});

export const insertMusicContentSchema = createInsertSchema(musicContent).omit({
  id: true,
  createdAt: true,
});

export const insertBookRecommendationSchema = createInsertSchema(bookRecommendations).omit({
  id: true,
  createdAt: true,
});

export type InsertVipCode = z.infer<typeof insertVipCodeSchema>;
export type VipCode = typeof vipCodes.$inferSelect;
export type InsertMusicContent = z.infer<typeof insertMusicContentSchema>;
export type MusicContent = typeof musicContent.$inferSelect;
export type InsertBookRecommendation = z.infer<typeof insertBookRecommendationSchema>;
export type BookRecommendation = typeof bookRecommendations.$inferSelect;

// Analysis types
export type GameType = 'powerball' | 'megamillions';

export type NumberFrequency = {
  number: number;
  frequency: number;
  isHot: boolean;
  isCold: boolean;
};

export type AnalysisResult = {
  hotNumbers: number[];
  coldNumbers: number[];
  frequencyData: NumberFrequency[];
  recommendations: {
    hot: number[];
    balanced: number[];
    wheel: number[][];
  };
  stats: {
    totalDraws: number;
    dateRange: string;
    mostFrequent: number[];
    leastFrequent: number[];
  };
};

export type TicketGeneration = {
  mainNumbers: number[];
  bonusNumber: number;
  method: string;
  confidence: number;
  ticketId?: string;
};

export type PerformanceReport = {
  game: GameType;
  method: string;
  timeperiod: string;
  totalPredictions: number;
  totalMatches: number;
  averageAccuracy: number;
  bestMatch: number;
  winRate: number;
  recentResults: PredictionResult[];
  comparisonToRandom: {
    ourWinRate: number;
    randomWinRate: number;
    improvement: number;
  };
};

export type MarketingStats = {
  overallPerformance: {
    totalPredictions: number;
    averageAccuracy: number;
    topPerformingMethod: string;
    improvementOverRandom: number;
  };
  methodComparison: Array<{
    method: string;
    accuracy: number;
    winRate: number;
    bestMatch: number;
  }>;
  recentWins: Array<{
    game: string;
    method: string;
    numbersMatched: number;
    prizeLevel: string;
    date: string;
  }>;
};
