import { sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  varchar, 
  integer, 
  timestamp, 
  jsonb, 
  decimal,
  boolean,
  date,
  index
} from "drizzle-orm/pg-core";
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
  subscriptionTier: text("subscription_tier").notNull().default("free"), // 'free', 'basic', 'pro', 'premium', 'unlimited'
  subscriptionStatus: text("subscription_status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  paypalSubscriptionId: text("paypal_subscription_id"),
  mfaSecret: text("mfa_secret"), // Base32 encoded secret for TOTP
  mfaEnabled: integer("mfa_enabled").notNull().default(0), // 0 = disabled, 1 = enabled
  mfaBackupCodes: jsonb("mfa_backup_codes"), // Array of backup codes
  dailyUsageCount: integer("daily_usage_count").notNull().default(0),
  lastUsageReset: timestamp("last_usage_reset").default(sql`now()`),
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

// Enhanced VIP codes table with Nomerati + Google Authenticator security
export const vipCodes = pgTable("vip_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  codeHash: text("code_hash").notNull().unique(), // SHA-256 hash of Nomerati + TOTP + email
  targetEmail: text("target_email").notNull(), // Account this code is designated for
  currentTier: text("current_tier").notNull(), // User's current tier
  targetTier: text("target_tier").notNull(), // Tier to upgrade to
  isUsed: integer("is_used").notNull().default(0), // 0 = unused, 1 = used
  createdBy: varchar("created_by").notNull().references(() => userAccounts.id), // Admin who created
  createdAt: timestamp("created_at").default(sql`now()`),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at").notNull(), // TOTP-based expiration (5 minutes)
  adminNotes: text("admin_notes"), // Admin notes about the upgrade
});

// Admin access logs for security auditing
export const adminLogs = pgTable("admin_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminEmail: text("admin_email").notNull(),
  action: text("action").notNull(), // create_vip_code, upgrade_user, view_users, etc.
  targetEmail: text("target_email"), // User affected by action
  details: jsonb("details"), // Additional action details
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  timestamp: timestamp("timestamp").default(sql`now()`),
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

export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertVipCode = z.infer<typeof insertVipCodeSchema>;
export type VipCode = typeof vipCodes.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertMusicContent = z.infer<typeof insertMusicContentSchema>;
export type MusicContent = typeof musicContent.$inferSelect;
export type InsertBookRecommendation = z.infer<typeof insertBookRecommendationSchema>;
export type BookRecommendation = typeof bookRecommendations.$inferSelect;

// Export advertisement schemas
export * from "./adSchema";

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

// Customer data collection for marketing and compliance
export const customerProfiles = pgTable("customer_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"), // Optional link to registered users
  
  // Required profile fields for quick setup
  email: varchar("email").notNull(),
  emailHash: varchar("email_hash").notNull(), // Salted hash for privacy
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  
  // Full mailing address (required)
  streetAddress: varchar("street_address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zipCode: varchar("zip_code").notNull(),
  country: varchar("country").default("US"),
  
  // Mobile number (required)
  mobileNumber: varchar("mobile_number").notNull(),
  mobileNumberHash: varchar("mobile_number_hash").notNull(), // Salted hash for privacy
  
  // Legacy phone field for compatibility
  phone: varchar("phone"),
  phoneHash: varchar("phone_hash"), // Salted hash for privacy
  
  // Verification status - must verify email OR mobile to access system
  emailVerified: boolean("email_verified").default(false),
  mobileVerified: boolean("mobile_verified").default(false),
  isProfileComplete: boolean("is_profile_complete").default(false),
  accountApproved: boolean("account_approved").default(false), // Requires verification to access system
  
  // Additional profile data
  dateOfBirth: date("date_of_birth"),
  subscriptionTier: varchar("subscription_tier").default("free"),
  totalSpent: decimal("total_spent", { precision: 10, scale: 2 }).default("0.00"),
  lifetimeValue: decimal("lifetime_value", { precision: 10, scale: 2 }).default("0.00"),
  lastActivity: timestamp("last_activity").defaultNow(),
  registrationSource: varchar("registration_source"), // web, mobile, referral
  referralCode: varchar("referral_code"),
  marketingOptIn: boolean("marketing_opt_in").default(true),
  smsOptIn: boolean("sms_opt_in").default(false),
  interests: jsonb("interests"), // gambling preferences, casino interest, etc.
  demographics: jsonb("demographics"), // age group, income range, etc.
  behaviorData: jsonb("behavior_data"), // usage patterns, preferences
  complianceFlags: jsonb("compliance_flags"), // any compliance notes
  riskScore: integer("risk_score").default(0), // compliance risk scoring
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification codes table
export const emailVerificationCodes = pgTable("email_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull(),
  emailHash: varchar("email_hash").notNull(),
  verificationCode: varchar("verification_code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0), // Track verification attempts
  createdAt: timestamp("created_at").defaultNow(),
});

// SMS verification codes table
export const smsVerificationCodes = pgTable("sms_verification_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mobileNumber: varchar("mobile_number").notNull(),
  mobileNumberHash: varchar("mobile_number_hash").notNull(),
  verificationCode: varchar("verification_code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").default(false),
  attempts: integer("attempts").default(0), // Track verification attempts
  createdAt: timestamp("created_at").defaultNow(),
});

// Customer activity tracking for analytics and compliance
export const customerActivity = pgTable("customer_activity", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customerProfiles.id),
  activityType: varchar("activity_type").notNull(), // login, generation, purchase, etc.
  activityData: jsonb("activity_data"), // specific details
  gameType: varchar("game_type"), // powerball, megamillions
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  ipAddress: varchar("ip_address"),
  ipHash: varchar("ip_hash"), // Salted hash for privacy
  userAgent: text("user_agent"),
  sessionId: varchar("session_id"),
  deviceFingerprint: varchar("device_fingerprint"),
  location: jsonb("location"), // geo data if available
  timestamp: timestamp("timestamp").defaultNow(),
});

// Administrative access logs for compliance and transparency
export const adminAccessLogs = pgTable("admin_access_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  adminEmail: varchar("admin_email").notNull(),
  adminId: varchar("admin_id"),
  action: varchar("action").notNull(),
  targetCustomerId: varchar("target_customer_id"),
  queryParameters: jsonb("query_parameters"),
  resultCount: integer("result_count"),
  justification: text("justification"), // reason for access
  ipAddress: varchar("ip_address"),
  sessionId: varchar("session_id"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Marketing campaigns tracking
export const marketingCampaigns = pgTable("marketing_campaigns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // email, sms, social, casino_partnership
  targetAudience: jsonb("target_audience"), // demographics, behavior filters
  content: jsonb("content"), // campaign content and assets
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  budget: decimal("budget", { precision: 10, scale: 2 }),
  spent: decimal("spent", { precision: 10, scale: 2 }).default("0.00"),
  impressions: integer("impressions").default(0),
  clicks: integer("clicks").default(0),
  conversions: integer("conversions").default(0),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0.00"),
  active: boolean("active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Lead scoring and segmentation
export const customerSegments = pgTable("customer_segments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  criteria: jsonb("criteria"), // segmentation rules
  customerCount: integer("customer_count").default(0),
  averageLTV: decimal("average_ltv", { precision: 10, scale: 2 }),
  conversionRate: decimal("conversion_rate", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type InsertCustomerProfile = typeof customerProfiles.$inferInsert;

export type CustomerActivity = typeof customerActivity.$inferSelect;
export type InsertCustomerActivity = typeof customerActivity.$inferInsert;

export type AdminAccessLog = typeof adminAccessLogs.$inferSelect;
export type InsertAdminAccessLog = typeof adminAccessLogs.$inferInsert;

export type MarketingCampaign = typeof marketingCampaigns.$inferSelect;
export type InsertMarketingCampaign = typeof marketingCampaigns.$inferInsert;

export type CustomerSegment = typeof customerSegments.$inferSelect;
export type InsertCustomerSegment = typeof customerSegments.$inferInsert;

export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

export type SmsVerificationCode = typeof smsVerificationCodes.$inferSelect;
export type InsertSmsVerificationCode = typeof smsVerificationCodes.$inferInsert;
