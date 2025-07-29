import { db } from "./db";
import { adCampaigns, adAnalytics, adPlacements, type AdCampaign, type InsertAdCampaign, type AdAnalytics } from "../shared/adSchema";
import { eq, and, lte, gte, desc, sql } from "drizzle-orm";

/**
 * Advertisement Management Service
 * Handles campaign creation, rotation, analytics, and revenue tracking
 */

export class AdManagementService {
  
  /**
   * Create a new advertisement campaign
   */
  async createCampaign(campaignData: InsertAdCampaign): Promise<AdCampaign> {
    const [campaign] = await db
      .insert(adCampaigns)
      .values({
        ...campaignData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    console.log(`📢 Created new ad campaign: ${campaign.name} (${campaign.type})`);
    return campaign;
  }

  /**
   * Get active campaigns for a specific placement
   */
  async getActiveCampaigns(placement: string): Promise<AdCampaign[]> {
    const now = new Date();
    
    const campaigns = await db
      .select()
      .from(adCampaigns)
      .where(
        and(
          eq(adCampaigns.placement, placement),
          eq(adCampaigns.isActive, true),
          // Check if campaign is within date range
          sql`(${adCampaigns.startDate} IS NULL OR ${adCampaigns.startDate} <= ${now})`,
          sql`(${adCampaigns.endDate} IS NULL OR ${adCampaigns.endDate} >= ${now})`
        )
      )
      .orderBy(desc(adCampaigns.priority), desc(adCampaigns.rotationWeight));

    return campaigns;
  }

  /**
   * Select ad for display using weighted rotation
   */
  async selectAdForRotation(placement: string): Promise<AdCampaign | null> {
    const campaigns = await this.getActiveCampaigns(placement);
    
    if (campaigns.length === 0) return null;

    // Filter out campaigns that have reached their limits
    const availableCampaigns = await this.filterAvailableCampaigns(campaigns);
    
    if (availableCampaigns.length === 0) return null;

    // Weighted random selection
    const totalWeight = availableCampaigns.reduce((sum, campaign) => 
      sum + (campaign.rotationWeight || 1), 0
    );
    
    let random = Math.random() * totalWeight;
    
    for (const campaign of availableCampaigns) {
      random -= (campaign.rotationWeight || 1);
      if (random <= 0) {
        return campaign;
      }
    }
    
    return availableCampaigns[0]; // Fallback
  }

  /**
   * Filter campaigns that haven't reached their view/click limits
   */
  private async filterAvailableCampaigns(campaigns: AdCampaign[]): Promise<AdCampaign[]> {
    const available: AdCampaign[] = [];
    
    for (const campaign of campaigns) {
      if (!campaign.maxViews && !campaign.maxClicks) {
        available.push(campaign);
        continue;
      }
      
      const analytics = await this.getCampaignAnalytics(campaign.id);
      const totalViews = analytics.reduce((sum, a) => sum + (a.views || 0), 0);
      const totalClicks = analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
      
      const viewsOk = !campaign.maxViews || totalViews < campaign.maxViews;
      const clicksOk = !campaign.maxClicks || totalClicks < campaign.maxClicks;
      
      if (viewsOk && clicksOk) {
        available.push(campaign);
      }
    }
    
    return available;
  }

  /**
   * Record ad view/impression
   */
  async recordAdView(campaignId: string, placement: string, userTier: string = 'free'): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get or create analytics record for today
    const [analytics] = await db
      .select()
      .from(adAnalytics)
      .where(
        and(
          eq(adAnalytics.campaignId, campaignId),
          eq(adAnalytics.placement, placement),
          gte(adAnalytics.date, today)
        )
      )
      .limit(1);

    const campaign = await this.getCampaignById(campaignId);
    const viewRevenue = campaign?.ratePerView ? parseFloat(campaign.ratePerView) : 0;

    if (analytics) {
      // Update existing record
      await db
        .update(adAnalytics)
        .set({
          views: sql`${adAnalytics.views} + 1`,
          impressions: sql`${adAnalytics.impressions} + 1`,
          viewRevenue: sql`${adAnalytics.viewRevenue} + ${viewRevenue}`,
          totalRevenue: sql`${adAnalytics.totalRevenue} + ${viewRevenue}`,
          freeUserViews: userTier === 'free' ? sql`${adAnalytics.freeUserViews} + 1` : adAnalytics.freeUserViews,
          paidUserViews: userTier !== 'free' ? sql`${adAnalytics.paidUserViews} + 1` : adAnalytics.paidUserViews,
        })
        .where(eq(adAnalytics.id, analytics.id));
    } else {
      // Create new record
      await db
        .insert(adAnalytics)
        .values({
          campaignId,
          placement,
          views: 1,
          impressions: 1,
          viewRevenue: viewRevenue.toString(),
          totalRevenue: viewRevenue.toString(),
          freeUserViews: userTier === 'free' ? 1 : 0,
          paidUserViews: userTier !== 'free' ? 1 : 0,
          date: today,
        });
    }
  }

  /**
   * Record ad click
   */
  async recordAdClick(campaignId: string, placement: string): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [analytics] = await db
      .select()
      .from(adAnalytics)
      .where(
        and(
          eq(adAnalytics.campaignId, campaignId),
          eq(adAnalytics.placement, placement),
          gte(adAnalytics.date, today)
        )
      )
      .limit(1);

    const campaign = await this.getCampaignById(campaignId);
    const clickRevenue = campaign?.ratePerClick ? parseFloat(campaign.ratePerClick) : 0;

    if (analytics) {
      await db
        .update(adAnalytics)
        .set({
          clicks: sql`${adAnalytics.clicks} + 1`,
          clickRevenue: sql`${adAnalytics.clickRevenue} + ${clickRevenue}`,
          totalRevenue: sql`${adAnalytics.totalRevenue} + ${clickRevenue}`,
        })
        .where(eq(adAnalytics.id, analytics.id));
    } else {
      // Create analytics record if it doesn't exist
      await db
        .insert(adAnalytics)
        .values({
          campaignId,
          placement,
          clicks: 1,
          clickRevenue: clickRevenue.toString(),
          totalRevenue: clickRevenue.toString(),
          date: today,
        });
    }
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string): Promise<AdAnalytics[]> {
    return await db
      .select()
      .from(adAnalytics)
      .where(eq(adAnalytics.campaignId, campaignId))
      .orderBy(desc(adAnalytics.date));
  }

  /**
   * Get campaign by ID
   */
  async getCampaignById(campaignId: string): Promise<AdCampaign | null> {
    const [campaign] = await db
      .select()
      .from(adCampaigns)
      .where(eq(adCampaigns.id, campaignId))
      .limit(1);
    
    return campaign || null;
  }

  /**
   * Get all campaigns for admin dashboard
   */
  async getAllCampaigns(): Promise<AdCampaign[]> {
    return await db
      .select()
      .from(adCampaigns)
      .orderBy(desc(adCampaigns.createdAt));
  }

  /**
   * Update campaign
   */
  async updateCampaign(campaignId: string, updates: Partial<InsertAdCampaign>): Promise<AdCampaign> {
    const [campaign] = await db
      .update(adCampaigns)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(adCampaigns.id, campaignId))
      .returning();
    
    return campaign;
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string): Promise<void> {
    await db
      .delete(adCampaigns)
      .where(eq(adCampaigns.id, campaignId));
    
    console.log(`🗑️ Deleted ad campaign: ${campaignId}`);
  }

  /**
   * Get revenue report
   */
  async getRevenueReport(startDate?: Date, endDate?: Date): Promise<{
    totalRevenue: number;
    viewRevenue: number;
    clickRevenue: number;
    totalViews: number;
    totalClicks: number;
    campaignBreakdown: Array<{
      campaignId: string;
      campaignName: string;
      revenue: number;
      views: number;
      clicks: number;
    }>;
  }> {
    const whereClause = startDate && endDate 
      ? and(gte(adAnalytics.date, startDate), lte(adAnalytics.date, endDate))
      : undefined;

    const analytics = await db
      .select()
      .from(adAnalytics)
      .where(whereClause)
      .orderBy(desc(adAnalytics.date));

    const totalRevenue = analytics.reduce((sum, a) => sum + parseFloat(a.totalRevenue || '0'), 0);
    const viewRevenue = analytics.reduce((sum, a) => sum + parseFloat(a.viewRevenue || '0'), 0);
    const clickRevenue = analytics.reduce((sum, a) => sum + parseFloat(a.clickRevenue || '0'), 0);
    const totalViews = analytics.reduce((sum, a) => sum + (a.views || 0), 0);
    const totalClicks = analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);

    // Group by campaign
    const campaignMap = new Map();
    for (const record of analytics) {
      const key = record.campaignId;
      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          campaignId: key,
          revenue: 0,
          views: 0,
          clicks: 0,
        });
      }
      const campaign = campaignMap.get(key);
      campaign.revenue += parseFloat(record.totalRevenue || '0');
      campaign.views += record.views || 0;
      campaign.clicks += record.clicks || 0;
    }

    // Get campaign names
    const campaignBreakdown = [];
    for (const [campaignId, data] of campaignMap) {
      const campaign = await this.getCampaignById(campaignId);
      campaignBreakdown.push({
        ...data,
        campaignName: campaign?.name || 'Unknown Campaign',
      });
    }

    return {
      totalRevenue,
      viewRevenue,
      clickRevenue,
      totalViews,
      totalClicks,
      campaignBreakdown,
    };
  }
}

export const adManager = new AdManagementService();