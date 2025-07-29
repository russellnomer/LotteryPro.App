import { pgTable, uuid, varchar, text, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Advertisement campaigns table
export const adCampaigns = pgTable("ad_campaigns", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'adsense', 'custom', 'affiliate'
  adCode: text("ad_code").notNull(), // HTML/JS code for the ad
  placement: varchar("placement", { length: 100 }).notNull(), // 'header', 'sidebar', 'footer', 'content'
  priority: integer("priority").default(1), // Higher number = higher priority
  isActive: boolean("is_active").default(true),
  
  // Rate card settings
  maxViews: integer("max_views"), // null = unlimited
  maxClicks: integer("max_clicks"), // null = unlimited
  ratePerView: decimal("rate_per_view", { precision: 10, scale: 4 }), // Revenue per view
  ratePerClick: decimal("rate_per_click", { precision: 10, scale: 4 }), // Revenue per click
  
  // Schedule settings
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  rotationWeight: integer("rotation_weight").default(1), // For weighted rotation
  
  // Client information
  clientName: varchar("client_name", { length: 255 }),
  clientEmail: varchar("client_email", { length: 255 }),
  billingInfo: jsonb("billing_info"), // Store billing details
  
  // Metadata
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Advertisement analytics table
export const adAnalytics = pgTable("ad_analytics", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id").references(() => adCampaigns.id),
  placement: varchar("placement", { length: 100 }).notNull(),
  
  // Performance metrics
  views: integer("views").default(0),
  clicks: integer("clicks").default(0),
  impressions: integer("impressions").default(0),
  
  // Revenue tracking
  viewRevenue: decimal("view_revenue", { precision: 10, scale: 2 }).default("0.00"),
  clickRevenue: decimal("click_revenue", { precision: 10, scale: 2 }).default("0.00"),
  totalRevenue: decimal("total_revenue", { precision: 10, scale: 2 }).default("0.00"),
  
  // User tier tracking
  freeUserViews: integer("free_user_views").default(0),
  paidUserViews: integer("paid_user_views").default(0),
  
  // Date tracking
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ad placement configuration
export const adPlacements = pgTable("ad_placements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(), // 'header', 'sidebar', etc.
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  dimensions: varchar("dimensions", { length: 50 }), // '728x90', '300x250', etc.
  isActive: boolean("is_active").default(true),
  showToFreeUsers: boolean("show_to_free_users").default(true),
  showToPaidUsers: boolean("show_to_paid_users").default(false),
  maxAdsPerRotation: integer("max_ads_per_rotation").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertAdCampaignSchema = createInsertSchema(adCampaigns).extend({
  type: z.enum(['adsense', 'custom', 'affiliate']),
  placement: z.string().min(1),
  priority: z.number().min(1).max(10),
  rotationWeight: z.number().min(1).max(100),
});

export const insertAdAnalyticsSchema = createInsertSchema(adAnalytics);
export const insertAdPlacementSchema = createInsertSchema(adPlacements);

// TypeScript types
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = z.infer<typeof insertAdCampaignSchema>;
export type AdAnalytics = typeof adAnalytics.$inferSelect;
export type InsertAdAnalytics = z.infer<typeof insertAdAnalyticsSchema>;
export type AdPlacement = typeof adPlacements.$inferSelect;
export type InsertAdPlacement = z.infer<typeof insertAdPlacementSchema>;

// Ad type definitions for better type safety
export interface AdSenseConfig {
  type: 'adsense';
  publisherId: string;
  slotId: string;
  format: string;
  responsive?: boolean;
}

export interface CustomAdConfig {
  type: 'custom';
  htmlContent: string;
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
}

export interface AffiliateAdConfig {
  type: 'affiliate';
  affiliateProgram: string;
  productId?: string;
  trackingCode: string;
  commission: number;
}