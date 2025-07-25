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
};
