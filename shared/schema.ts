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
export type PerformanceStats = typeof performanceStats.$inferSelect;

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
