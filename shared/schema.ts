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
  index,
  unique
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
  subscriptionTier: text("subscription_tier").notNull().default("free"), // 'free', 'basic', 'pro', 'premium', 'founder', 'lifetime', 'unlimited'
  subscriptionStatus: text("subscription_status").notNull().default("active"), // 'active', 'cancelled', 'expired'
  paypalSubscriptionId: text("paypal_subscription_id"),
  mfaSecret: text("mfa_secret"), // Base32 encoded secret for TOTP
  mfaEnabled: integer("mfa_enabled").notNull().default(0), // 0 = disabled, 1 = enabled
  mfaBackupCodes: jsonb("mfa_backup_codes"), // Array of backup codes
  dailyUsageCount: integer("daily_usage_count").notNull().default(0),
  lastUsageReset: timestamp("last_usage_reset").default(sql`now()`),
  bonusGenerations: integer("bonus_generations").notNull().default(0), // Free picks from spin wheel wins
  premiumTrialExpires: timestamp("premium_trial_expires"), // Premium trial expiration from spin wheel
  discountCode: text("discount_code"), // Active discount code from spin wheel
  vipPoints: integer("vip_points").notNull().default(0), // Accumulated VIP points from spins
  spinStreak: integer("spin_streak").notNull().default(0), // Consecutive daily spins
  lastSpinDate: date("last_spin_date"), // Last spin date for streak tracking
  homeState: varchar("home_state", { length: 2 }), // 2-letter US state code, e.g. 'NY'
  emailVerified: boolean("email_verified").notNull().default(false),
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

// Comprehensive Audit Logs for business continuity
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventType: text("event_type").notNull(), // 'login', 'logout', 'spin', 'claim_prize', 'payment', 'tier_change', 'admin_access', 'security_alert'
  eventCategory: text("event_category").notNull(), // 'auth', 'transaction', 'admin', 'security', 'user_action'
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestPath: text("request_path"),
  requestMethod: text("request_method"),
  statusCode: integer("status_code"),
  details: jsonb("details"), // Additional context as JSON
  severity: text("severity").notNull().default("info"), // 'info', 'warning', 'error', 'critical'
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Error Logs for debugging and investigation
export const errorLogs = pgTable("error_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  errorType: text("error_type").notNull(), // 'unhandled_exception', 'api_error', 'validation_error', 'database_error', 'frontend_error'
  errorMessage: text("error_message").notNull(),
  stackTrace: text("stack_trace"),
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: text("session_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  requestPath: text("request_path"),
  requestMethod: text("request_method"),
  requestBody: jsonb("request_body"),
  context: jsonb("context"), // Additional debugging context
  resolved: integer("resolved").notNull().default(0), // 0 = unresolved, 1 = resolved
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: varchar("resolved_by"),
  createdAt: timestamp("created_at").default(sql`now()`),
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

// Revenue Generation: Jackpocket Affiliate Tracking
export const affiliateTracking = pgTable("affiliate_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: text("session_id"), // For guest tracking
  ticketId: varchar("ticket_id").references(() => generatedTickets.id),
  affiliatePartner: text("affiliate_partner").notNull().default('jackpocket'), // 'jackpocket', future partners
  clickedAt: timestamp("clicked_at").default(sql`now()`),
  convertedAt: timestamp("converted_at"),
  conversionValue: text("conversion_value"), // Estimated commission value
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// Revenue Generation: Daily Spin-to-Win Gamification
export const dailySpins = pgTable("daily_spins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: text("session_id"), // For guest tracking
  spinDate: text("spin_date").notNull(), // YYYY-MM-DD format for unique constraint
  prizeType: text("prize_type").notNull(), // 'free_generation', 'discount_code', 'premium_trial', 'no_prize'
  prizeValue: text("prize_value"), // Description of prize
  spunAt: timestamp("spun_at").default(sql`now()`),
  claimed: integer("claimed").notNull().default(0), // 0 = unclaimed, 1 = claimed
  claimedAt: timestamp("claimed_at"),
});
// Note: Unique constraints removed to allow premium members multiple daily spins

// Revenue Generation: Referral Program
export const referralCodes = pgTable("referral_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  referrerId: varchar("referrer_id").notNull().references(() => userAccounts.id),
  referralCode: text("referral_code").notNull().unique(),
  referredUserId: varchar("referred_user_id").references(() => userAccounts.id),
  rewardType: text("reward_type").notNull().default('free_generation'), // 'free_generation', 'discount', 'premium_credit'
  rewardValue: integer("reward_value").notNull().default(1), // Number of credits/days/uses
  status: text("status").notNull().default('pending'), // 'pending', 'completed', 'expired'
  createdAt: timestamp("created_at").default(sql`now()`),
  completedAt: timestamp("completed_at"),
});

// Revenue Generation: Email Notification Preferences
export const emailPreferences = pgTable("email_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: text("session_id"), // For guest tracking
  email: text("email").notNull(),
  powerballReminders: integer("powerball_reminders").notNull().default(1), // 1 = enabled, 0 = disabled
  megamillionsReminders: integer("megamillions_reminders").notNull().default(1),
  weeklyDigest: integer("weekly_digest").notNull().default(1),
  promotionalEmails: integer("promotional_emails").notNull().default(1),
  lastEmailSent: timestamp("last_email_sent"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
}, (table) => ({
  uniqueEmailUser: unique("unique_email_user").on(table.email),
}));

// Password Reset Tokens - Production-ready password reset system
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(), // SHA-256 hash of the reset token
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"), // Set when token is used
  createdAt: timestamp("created_at").default(sql`now()`),
});

// VIP Rewards - Redeemable prizes with VIP points
export const vipRewards = pgTable("vip_rewards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  pointsCost: integer("points_cost").notNull(),
  rewardType: text("reward_type").notNull(), // 'signed_song', 'free_picks', 'premium_days', 'merchandise', 'exclusive_content'
  rewardValue: text("reward_value").notNull(), // The actual value (number of picks, days, song title, etc.)
  isActive: integer("is_active").notNull().default(1),
  limitedQuantity: integer("limited_quantity"), // Null = unlimited
  claimedCount: integer("claimed_count").notNull().default(0),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// VIP Redemptions - Track when users redeem rewards
export const vipRedemptions = pgTable("vip_redemptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => userAccounts.id),
  rewardId: varchar("reward_id").notNull().references(() => vipRewards.id),
  pointsSpent: integer("points_spent").notNull(),
  status: text("status").notNull().default('pending'), // 'pending', 'fulfilled', 'cancelled'
  fulfilledAt: timestamp("fulfilled_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Drip Sequences - Track free-to-paid nurture email sequences per user
export const dripSequences = pgTable("drip_sequences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => userAccounts.id),
  sequenceName: text("sequence_name").notNull().default("free_to_paid"),
  // step 0 = enrolled (day 0 email queued), 1 = day-0 sent, 2 = day-2 sent,
  // 3 = day-5 sent, 4 = day-10 sent (sequence complete)
  currentStep: integer("current_step").notNull().default(0),
  enrolledAt: timestamp("enrolled_at").default(sql`now()`),
  nextSendAt: timestamp("next_send_at"),  // when the next step email should fire
  isActive: boolean("is_active").notNull().default(true),
  haltReason: text("halt_reason"), // 'upgraded', 'unsubscribed', 'completed'
  haltedAt: timestamp("halted_at"),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertDripSequenceSchema = createInsertSchema(dripSequences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  haltedAt: true,
});

export type InsertDripSequence = z.infer<typeof insertDripSequenceSchema>;
export type DripSequence = typeof dripSequences.$inferSelect;

// Email Send Log - Track all emails sent
export const emailSendLog = pgTable("email_send_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => userAccounts.id),
  email: text("email").notNull(),
  emailType: text("email_type").notNull(), // 'draw_reminder', 'weekly_digest', 'promotional', 'welcome'
  game: text("game"), // 'powerball', 'megamillions', or null
  ticketId: varchar("ticket_id").references(() => generatedTickets.id),
  sendGridMessageId: text("sendgrid_message_id"),
  status: text("status").notNull().default('pending'), // 'pending', 'sent', 'failed', 'bounced'
  errorMessage: text("error_message"),
  sentAt: timestamp("sent_at"),
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

// Audit and Error Log Schemas
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export const insertErrorLogSchema = createInsertSchema(errorLogs).omit({
  id: true,
  createdAt: true,
  resolvedAt: true,
});

// Revenue Generation Schemas
export const insertAffiliateTrackingSchema = createInsertSchema(affiliateTracking).omit({
  id: true,
  clickedAt: true,
});

export const insertDailySpinSchema = createInsertSchema(dailySpins).omit({
  id: true,
  spunAt: true,
  claimedAt: true,
  spinDate: true, // Auto-generated from current date
});

export const insertReferralCodeSchema = createInsertSchema(referralCodes).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertEmailPreferencesSchema = createInsertSchema(emailPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastEmailSent: true,
});

export const insertEmailSendLogSchema = createInsertSchema(emailSendLog).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

export type InsertVipCode = z.infer<typeof insertVipCodeSchema>;
export type VipCode = typeof vipCodes.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertErrorLog = z.infer<typeof insertErrorLogSchema>;
export type ErrorLog = typeof errorLogs.$inferSelect;
export type InsertMusicContent = z.infer<typeof insertMusicContentSchema>;
export type MusicContent = typeof musicContent.$inferSelect;
export type InsertBookRecommendation = z.infer<typeof insertBookRecommendationSchema>;
export type BookRecommendation = typeof bookRecommendations.$inferSelect;

// Revenue Generation Types
export type InsertAffiliateTracking = z.infer<typeof insertAffiliateTrackingSchema>;
export type AffiliateTracking = typeof affiliateTracking.$inferSelect;
export type InsertDailySpin = z.infer<typeof insertDailySpinSchema>;
export type DailySpin = typeof dailySpins.$inferSelect;
export type InsertReferralCode = z.infer<typeof insertReferralCodeSchema>;
export type ReferralCode = typeof referralCodes.$inferSelect;
export type InsertEmailPreferences = z.infer<typeof insertEmailPreferencesSchema>;
export type EmailPreferences = typeof emailPreferences.$inferSelect;
export type InsertEmailSendLog = z.infer<typeof insertEmailSendLogSchema>;
export type EmailSendLog = typeof emailSendLog.$inferSelect;

// Export advertisement schemas
export * from "./adSchema";

// Analysis types - Import from gameConfig for centralized configuration
import { GameType as GameTypeImport, MethodologyType as MethodologyTypeImport, GAME_CONFIG, ALL_GAME_TYPES, ALL_METHODOLOGIES } from './gameConfig';
export type GameType = GameTypeImport;
export type MethodologyType = MethodologyTypeImport;
export { GAME_CONFIG, ALL_GAME_TYPES, ALL_METHODOLOGIES };

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

// ==================== COMMUNITY LOTTERY POOLS ====================
// Revenue-generating feature: users pool money to buy more tickets together

export const lotteryPools = pgTable("lottery_pools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  game: text("game").notNull(), // 'powerball' or 'megamillions'
  targetDrawDate: timestamp("target_draw_date").notNull(),
  targetDrawId: varchar("target_draw_id").references(() => lotteryDraws.id),
  
  // Pool financials
  contributionPerMember: decimal("contribution_per_member", { precision: 10, scale: 2 }).notNull(),
  maxMembers: integer("max_members").notNull().default(10),
  currentMembers: integer("current_members").notNull().default(0),
  totalContributions: decimal("total_contributions", { precision: 10, scale: 2 }).default("0.00"),
  adminFeePercent: decimal("admin_fee_percent", { precision: 5, scale: 2 }).notNull().default("0.00"), // No admin fee in Syndicate Tracker model
  adminFeeCollected: decimal("admin_fee_collected", { precision: 10, scale: 2 }).default("0.00"),
  netPoolAmount: decimal("net_pool_amount", { precision: 10, scale: 2 }).default("0.00"),
  
  // Pool management
  createdBy: varchar("created_by").references(() => userAccounts.id),
  status: text("status").notNull().default("open"), // 'open', 'full', 'active', 'completed', 'cancelled'
  isPublic: boolean("is_public").default(true), // Public pools anyone can join
  requiresApproval: boolean("requires_approval").default(false),
  
  // Results tracking
  totalTicketsPurchased: integer("total_tickets_purchased").default(0),
  totalWinnings: decimal("total_winnings", { precision: 15, scale: 2 }).default("0.00"),
  winningsDistributed: boolean("winnings_distributed").default(false),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  closedAt: timestamp("closed_at"),
}, (table) => ({
  gameDrawIdx: index("lottery_pools_game_draw_idx").on(table.game, table.targetDrawDate),
  statusIdx: index("lottery_pools_status_idx").on(table.status),
}));

export const poolMembers = pgTable("pool_members", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => lotteryPools.id, { onDelete: 'cascade' }),
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: varchar("session_id"), // For guest members
  
  // Member details
  displayName: varchar("display_name", { length: 100 }),
  email: varchar("email", { length: 255 }),
  
  // Payment tracking
  contributionAmount: decimal("contribution_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // 'pending', 'paid', 'refunded'
  paymentMethod: text("payment_method"), // 'paypal', 'cashapp', 'credit'
  paypalTransactionId: varchar("paypal_transaction_id"),
  
  // Winnings
  sharePercentage: decimal("share_percentage", { precision: 5, scale: 2 }).notNull(), // Based on contribution
  winningsShare: decimal("winnings_share", { precision: 15, scale: 2 }).default("0.00"),
  winningsPaid: boolean("winnings_paid").default(false),
  
  // Membership
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'active', 'removed'
  joinedAt: timestamp("joined_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
}, (table) => ({
  poolMemberUnique: unique("pool_member_unique").on(table.poolId, table.userId),
  poolIdIdx: index("pool_members_pool_idx").on(table.poolId),
}));

export const poolTickets = pgTable("pool_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => lotteryPools.id, { onDelete: 'cascade' }),
  ticketId: varchar("ticket_id").references(() => generatedTickets.id),
  
  // Ticket details
  game: text("game").notNull(),
  mainNumbers: jsonb("main_numbers").notNull(),
  bonusNumber: integer("bonus_number").notNull(),
  generationMethod: text("generation_method").notNull(), // 'hot', 'balanced', 'wheel', etc.
  
  // Results
  drawId: varchar("draw_id").references(() => lotteryDraws.id),
  numbersMatched: integer("numbers_matched").default(0),
  bonusMatched: boolean("bonus_matched").default(false),
  prizeWon: decimal("prize_won", { precision: 15, scale: 2 }).default("0.00"),
  
  purchasedAt: timestamp("purchased_at").defaultNow(),
}, (table) => ({
  poolIdIdx: index("pool_tickets_pool_idx").on(table.poolId),
}));

export const poolTransactions = pgTable("pool_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => lotteryPools.id, { onDelete: 'cascade' }),
  memberId: varchar("member_id").references(() => poolMembers.id, { onDelete: 'set null' }),
  
  // Transaction details
  type: text("type").notNull(), // 'contribution', 'admin_fee', 'winnings_payout', 'refund'
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD"),
  
  // Payment processing
  paymentProvider: text("payment_provider"), // 'paypal', 'cashapp'
  providerTransactionId: varchar("provider_transaction_id"),
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'failed', 'refunded'
  
  // Metadata
  notes: text("notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  poolIdIdx: index("pool_transactions_pool_idx").on(table.poolId),
  typeIdx: index("pool_transactions_type_idx").on(table.type),
}));

export const poolWinnings = pgTable("pool_winnings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  poolId: varchar("pool_id").notNull().references(() => lotteryPools.id, { onDelete: 'cascade' }),
  ticketId: varchar("ticket_id").notNull().references(() => poolTickets.id, { onDelete: 'cascade' }),
  
  // Winning details
  prizeAmount: decimal("prize_amount", { precision: 15, scale: 2 }).notNull(),
  prizeTier: text("prize_tier").notNull(), // 'jackpot', 'match5', 'match4', etc.
  
  // Distribution
  adminFeeDeducted: decimal("admin_fee_deducted", { precision: 15, scale: 2 }).notNull(),
  netDistribution: decimal("net_distribution", { precision: 15, scale: 2 }).notNull(),
  distributedToMembers: boolean("distributed_to_members").default(false),
  
  wonAt: timestamp("won_at").defaultNow(),
  distributedAt: timestamp("distributed_at"),
}, (table) => ({
  poolIdIdx: index("pool_winnings_pool_idx").on(table.poolId),
}));

// Stripe event logging for payment verification
export const stripeEvents = pgTable("stripe_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: varchar("event_id").notNull().unique(),
  eventType: text("event_type").notNull(),
  customerIdentifier: text("customer_identifier"),
  tier: text("tier"),
  status: text("status"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Support tickets for customer service
export const supportTickets = pgTable("support_tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // User info (can be anonymous or authenticated)
  userId: varchar("user_id").references(() => userAccounts.id),
  userEmail: text("user_email").notNull(),
  userName: text("user_name"),
  
  // Ticket details
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'billing', 'technical', 'account', 'feature_request', 'bug_report', 'other'
  
  // Status and priority
  status: text("status").notNull().default("new"), // 'new', 'open', 'in_progress', 'waiting_user', 'resolved', 'closed'
  priority: text("priority").notNull().default("normal"), // 'low', 'normal', 'high', 'urgent'
  
  // AI triage results
  aiClassification: text("ai_classification"), // AI-determined category
  aiSuggestedResponse: text("ai_suggested_response"), // AI-suggested reply
  aiSeverityScore: integer("ai_severity_score"), // 1-10 severity rating
  requiresHumanEscalation: boolean("requires_human_escalation").default(false),
  escalationReason: text("escalation_reason"),
  
  // Assignment and resolution
  assignedTo: varchar("assigned_to").references(() => userAccounts.id),
  resolvedAt: timestamp("resolved_at"),
  resolution: text("resolution"),
  
  // Metadata
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  statusIdx: index("support_tickets_status_idx").on(table.status),
  priorityIdx: index("support_tickets_priority_idx").on(table.priority),
  userIdIdx: index("support_tickets_user_idx").on(table.userId),
}));

// Support ticket responses/messages
export const supportMessages = pgTable("support_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull().references(() => supportTickets.id, { onDelete: 'cascade' }),
  
  // Message content
  message: text("message").notNull(),
  isFromUser: boolean("is_from_user").notNull().default(true),
  isAutoGenerated: boolean("is_auto_generated").default(false),
  
  // Sender info
  senderEmail: text("sender_email"),
  senderName: text("sender_name"),
  
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  ticketIdIdx: index("support_messages_ticket_idx").on(table.ticketId),
}));

// User consent tracking for legal compliance
export const userConsents = pgTable("user_consents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => userAccounts.id),
  sessionId: text("session_id"), // For anonymous users
  
  // Consent types
  termsAccepted: boolean("terms_accepted").notNull().default(false),
  privacyAccepted: boolean("privacy_accepted").notNull().default(false),
  marketingOptIn: boolean("marketing_opt_in").notNull().default(false),
  dataProcessingConsent: boolean("data_processing_consent").notNull().default(false),
  
  // Consent metadata
  termsVersion: text("terms_version"),
  privacyVersion: text("privacy_version"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Type exports for Support System
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = typeof supportTickets.$inferInsert;
export type SupportMessage = typeof supportMessages.$inferSelect;
export type InsertSupportMessage = typeof supportMessages.$inferInsert;
export type UserConsent = typeof userConsents.$inferSelect;
export type InsertUserConsent = typeof userConsents.$inferInsert;

// Type exports for Community Pools
export type LotteryPool = typeof lotteryPools.$inferSelect;
export type InsertLotteryPool = typeof lotteryPools.$inferInsert;

export type PoolMember = typeof poolMembers.$inferSelect;
export type InsertPoolMember = typeof poolMembers.$inferInsert;

export type PoolTicket = typeof poolTickets.$inferSelect;
export type InsertPoolTicket = typeof poolTickets.$inferInsert;

export type PoolTransaction = typeof poolTransactions.$inferSelect;
export type InsertPoolTransaction = typeof poolTransactions.$inferInsert;

export type PoolWinning = typeof poolWinnings.$inferSelect;
export type InsertPoolWinning = typeof poolWinnings.$inferInsert;

// ==================== ONE-TIME PURCHASES ====================
export const oneTimePurchases = pgTable("one_time_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id"),
  sessionId: text("session_id"),
  purchaseType: text("purchase_type").notNull(),
  creditsGranted: integer("credits_granted").notNull().default(0),
  passExpiresAt: timestamp("pass_expires_at"),
  stripeSessionId: text("stripe_session_id"),
  status: text("status").notNull().default("pending"),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertOneTimePurchaseSchema = createInsertSchema(oneTimePurchases).omit({
  id: true,
  createdAt: true,
});

export type InsertOneTimePurchase = z.infer<typeof insertOneTimePurchaseSchema>;
export type OneTimePurchase = typeof oneTimePurchases.$inferSelect;

// WebAuthn / Biometric credentials
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => userAccounts.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  counter: integer("counter").notNull().default(0),
  deviceName: text("device_name").notNull().default("My Device"),
  transports: jsonb("transports"),
  createdAt: timestamp("created_at").defaultNow(),
  lastUsedAt: timestamp("last_used_at"),
});

export const insertWebauthnCredentialSchema = createInsertSchema(webauthnCredentials).omit({ id: true, createdAt: true });
export type InsertWebauthnCredential = z.infer<typeof insertWebauthnCredentialSchema>;
export type WebauthnCredential = typeof webauthnCredentials.$inferSelect;

// ==================== BLOG / PROGRAMMATIC SEO ====================
export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  metaDescription: text("meta_description").notNull(),
  content: text("content").notNull(), // Markdown content
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  author: text("author").notNull().default("LotteryPro Team"),
  ogImageUrl: text("og_image_url"),
  category: text("category").notNull().default("Analysis"),
  readTimeMinutes: integer("read_time_minutes").notNull().default(5),
  createdAt: timestamp("created_at").default(sql`now()`),
  updatedAt: timestamp("updated_at").default(sql`now()`),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;
