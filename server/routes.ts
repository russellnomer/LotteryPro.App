import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import youtubeRoutes from "./routes/youtube";
import youtubeService from "./youtubeService";
import { insertTicketSchema, insertDrawSchema, type GameType } from "@shared/schema";
import { seedHistoricalData } from "./seedData";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { createAdSenseConfigEndpoint } from "./middleware/adsense";
import { register, login, setupMFA, verifyMFASetup, requireAuth } from "./auth";
import { 
  createPayPalSubscription, 
  activatePayPalSubscription,
  handleSubscriptionActivated,
  handleSubscriptionCancelled,
  handleSubscriptionSuspended,
  handlePaymentCompleted
} from "./paypalSubscriptions";
// VIP management functions will be imported dynamically
import { seedRussellNomerContent } from "./seedMusicData";
import { numerologyAnalysis } from "./numerologyAnalysis";
import { lotteryCache } from "./lotteryCache";
import { progressiveLoader } from "./progressiveLoader";
import { 
  securityHeaders, 
  authRateLimit, 
  apiRateLimit, 
  sanitizeInput, 
  securityLogger, 
  sessionSecurity,
  secureErrorHandler,
  validateDependencyIntegrity
} from "./middleware/security";
import { customerDataService } from "./customerDataService";
import customerDataRoutes from "./routes/customerData";
import profileSetupRoutes from "./routes/profileSetup";
import fanContestRoutes from "./routes/fanContest";
import ascapNetworkingRoutes from "./routes/ascapNetworking";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Initialize smart caching and progressive loading
  console.log('🎓 Initializing educational lottery analysis system...');
  
  // Seed historical data and Russell Nomer content on startup  
  await seedHistoricalData();
  await seedRussellNomerContent();
  
  // Start progressive enhancement system
  progressiveLoader.startProgressiveLoading().catch(error => {
    console.error('❌ Progressive loading error:', error);
  });
  
  // Get historical draws for a specific game (using smart cache)
  app.get("/api/draws/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
      // Use cache for instant response
      const draws = await lotteryCache.getEssentialDraws(game);
      res.json(draws);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get full dataset for educational analysis
  app.get("/api/draws/:game/full", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
      // Progressive loading for educational data collection
      const draws = await lotteryCache.getFullDraws(game);
      res.json(draws);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get cache statistics for monitoring
  app.get("/api/cache/stats", async (req, res) => {
    try {
      const stats = lotteryCache.getCacheStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get progressive loading status for real-time monitoring
  app.get("/api/loading/status", async (req, res) => {
    try {
      const loadingState = progressiveLoader.getLoadingState();
      const isComplete = progressiveLoader.isComplete();
      res.json({ 
        loadingState, 
        isComplete,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get loading status for a specific game
  app.get("/api/loading/status/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
      const gameState = progressiveLoader.getGameLoadingState(game);
      res.json(gameState || { message: "Loading state not found" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Force refresh all data (admin endpoint)
  app.post("/api/loading/refresh", async (req, res) => {
    try {
      await progressiveLoader.forceRefresh();
      res.json({ message: "Data refresh initiated", timestamp: new Date().toISOString() });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate lottery numbers with usage enforcement
  app.post("/api/generate/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }

      // Track usage for all users (authenticated and guests)
      let usageTrackingId = req.user?.id;
      let isGuest = false;
      
      if (!usageTrackingId) {
        // For guest users, use session ID or consistent IP-based ID (NO timestamp)
        isGuest = true;
        usageTrackingId = req.sessionID || `guest_${req.ip}`;
        console.log('📊 USAGE TRACKING: Guest user detected, using tracking ID:', usageTrackingId);
      }
      
      // Check usage limits for all users
      const usageInfo = await storage.checkUserUsageLimit(usageTrackingId);
      
      if (!usageInfo.canUse) {
        console.log('🚫 USAGE LIMIT: User reached daily limit', usageTrackingId, usageInfo);
        return res.status(429).json({ 
          success: false,
          message: "Daily usage limit reached. Please upgrade your subscription for unlimited access.",
          usageCount: usageInfo.count,
          usageLimit: usageInfo.limit,
          upgradeRequired: true,
          isGuest
        });
      }
      
      // Increment usage count for all users
      console.log('⚡ USAGE INCREMENT: Tracking usage for', isGuest ? 'guest' : 'user', usageTrackingId);
      await storage.incrementUserDailyUsage(usageTrackingId);

      const { method = 'hot' } = req.body;
      
      // Get historical data for analysis
      const draws = await storage.getDraws(game);
      
      // Generate numbers based on method
      let mainNumbers: number[];
      let bonusNumber: number;
      
      if (method === 'hot') {
        // Use cached frequency maps for instant hot number analysis
        const { mainFreq, bonusFreq } = await lotteryCache.getFrequencyMaps(game);
        
        // Get most frequent numbers
        const sortedNumbers = Array.from(mainFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([num]) => num);
        
        const sortedBonus = Array.from(bonusFreq.entries())
          .sort((a, b) => b[1] - a[1])
          .map(([num]) => num);
        
        // Select top frequent numbers with some randomness
        mainNumbers = sortedNumbers.slice(0, 8).sort(() => 0.5 - Math.random()).slice(0, 5).sort((a, b) => a - b);
        bonusNumber = sortedBonus[0] || Math.floor(Math.random() * (game === 'powerball' ? 26 : 24)) + 1;
        
      } else if (method === 'balanced') {
        // Balanced selection across ranges
        const maxMain = game === 'powerball' ? 69 : 60;
        const ranges = {
          low: Math.floor(maxMain / 3),
          mid: Math.floor((maxMain * 2) / 3),
          high: maxMain
        };
        
        mainNumbers = [
          Math.floor(Math.random() * ranges.low) + 1,
          Math.floor(Math.random() * (ranges.mid - ranges.low)) + ranges.low + 1,
          Math.floor(Math.random() * (ranges.high - ranges.mid)) + ranges.mid + 1,
          Math.floor(Math.random() * maxMain) + 1,
          Math.floor(Math.random() * maxMain) + 1
        ].filter((num, index, arr) => arr.indexOf(num) === index)
         .slice(0, 5)
         .sort((a, b) => a - b);
        
        // Fill if needed
        while (mainNumbers.length < 5) {
          const newNum = Math.floor(Math.random() * maxMain) + 1;
          if (!mainNumbers.includes(newNum)) {
            mainNumbers.push(newNum);
          }
        }
        mainNumbers.sort((a, b) => a - b);
        
        bonusNumber = Math.floor(Math.random() * (game === 'powerball' ? 26 : 24)) + 1;
        
      } else {
        // Random generation
        const maxMain = game === 'powerball' ? 69 : 60;
        const maxBonus = game === 'powerball' ? 26 : 24;
        
        mainNumbers = [];
        while (mainNumbers.length < 5) {
          const num = Math.floor(Math.random() * maxMain) + 1;
          if (!mainNumbers.includes(num)) {
            mainNumbers.push(num);
          }
        }
        mainNumbers.sort((a, b) => a - b);
        
        bonusNumber = Math.floor(Math.random() * maxBonus) + 1;
      }
      
      // Save generated ticket
      const ticket = await storage.createTicket({
        game,
        method,
        mainNumbers,
        bonusNumber
      });
      
      // Ensure we have exactly 5 main numbers and 1 bonus = 6 total
      if (mainNumbers.length !== 5) {
        return res.status(500).json({ message: "Failed to generate exactly 5 main numbers" });
      }

      const gameConfig = {
        powerball: { maxMain: 69, maxBonus: 26 },
        megamillions: { maxMain: 60, maxBonus: 24 }
      }[game];

      res.json({
        mainNumbers,
        bonusNumber,
        method,
        educationalNote: `Educational ${method} number methodology for study purposes`,
        ticketId: ticket.id,
        totalNumbers: 6, // Explicitly show this is 6 numbers total
        gameInfo: {
          name: game,
          format: `5 from 1-${gameConfig.maxMain} + 1 from 1-${gameConfig.maxBonus}`
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get analysis data for a game (with real-time data updates)
  app.get("/api/analysis/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
      // Update lottery data with latest results
      const { lotteryDataService } = await import('./lotteryDataService');
      await lotteryDataService.updateAllGames();
      
      const draws = await storage.getDraws(game);
      
      // Calculate frequency analysis
      const frequency = new Map<number, number>();
      const bonusFreq = new Map<number, number>();
      
      draws.forEach(draw => {
        (draw.mainNumbers as number[]).forEach(num => {
          frequency.set(num, (frequency.get(num) || 0) + 1);
        });
        bonusFreq.set(draw.bonusNumber, (bonusFreq.get(draw.bonusNumber) || 0) + 1);
      });
      
      // Sort by frequency
      const sortedByFreq = Array.from(frequency.entries())
        .sort((a, b) => b[1] - a[1]);
      
      const hotNumbers = sortedByFreq.slice(0, 5).map(([num]) => num);
      const coldNumbers = sortedByFreq.slice(-5).map(([num]) => num);
      
      // Generate frequency data for chart
      const frequencyData = sortedByFreq.map(([number, freq]) => ({
        number,
        frequency: freq,
        isHot: hotNumbers.includes(number),
        isCold: coldNumbers.includes(number)
      }));
      
      // Stats with statistical significance indicator
      const dateRange = draws.length > 0 ? 
        `${draws[draws.length - 1].drawDate.toLocaleDateString()} - ${draws[0].drawDate.toLocaleDateString()}` :
        'No data';
      
      const hasAdequateData = draws.length >= 200; // Adequate sample size for educational analysis
      
      const analysis = {
        hotNumbers,
        coldNumbers,
        frequencyData,
        bonusFrequency: Array.from(bonusFreq.entries()).sort((a, b) => b[1] - a[1]),
        stats: {
          totalDraws: draws.length,
          dateRange,
          mostFrequent: hotNumbers.slice(0, 3),
          leastFrequent: coldNumbers.slice(0, 3),
          sampleSize: draws.length,
          isStatisticallySignificant,
          dataFreshness: draws.length > 0 ? 
            `Updated ${Math.floor((Date.now() - draws[0].drawDate.getTime()) / (1000 * 60 * 60 * 24))} days ago` :
            'No recent data'
        },
        recentDraws: draws.slice(0, 5)
      };
      
      res.json(analysis);
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // VIP Code redemption route
  app.post('/api/redeem-vip-code', async (req, res) => {
    try {
      const { redeemVipCode } = await import('./vipManagement');
      const { code, userEmail } = req.body;
      
      if (!code || !userEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'VIP code and email are required' 
        });
      }

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await redeemVipCode(
        { code: code.trim(), userEmail: userEmail.trim() },
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error redeeming VIP code:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to redeem VIP code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Advertisement Management Routes
  app.get('/api/admin/campaigns', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const campaigns = await adManager.getAllCampaigns();
      res.json(campaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/admin/campaigns', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const campaign = await adManager.createCampaign(req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  app.patch('/api/admin/campaigns/:id', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const campaign = await adManager.updateCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ message: 'Failed to update campaign' });
    }
  });

  app.delete('/api/admin/campaigns/:id', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      await adManager.deleteCampaign(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ message: 'Failed to delete campaign' });
    }
  });

  app.get('/api/admin/ad-revenue', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const report = await adManager.getRevenueReport();
      res.json(report);
    } catch (error: any) {
      console.error('Error fetching revenue report:', error);
      res.status(500).json({ message: 'Failed to fetch revenue report' });
    }
  });

  app.post('/api/ad-view/:campaignId', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const { placement, userTier } = req.body;
      await adManager.recordAdView(req.params.campaignId, placement, userTier);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error recording ad view:', error);
      res.status(500).json({ message: 'Failed to record ad view' });
    }
  });

  app.post('/api/ad-click/:campaignId', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const { placement } = req.body;
      await adManager.recordAdClick(req.params.campaignId, placement);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error recording ad click:', error);
      res.status(500).json({ message: 'Failed to record ad click' });
    }
  });

  app.get('/api/ads/:placement', async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const ad = await adManager.selectAdForRotation(req.params.placement);
      res.json(ad);
    } catch (error: any) {
      console.error('Error selecting ad:', error);
      res.status(500).json({ message: 'Failed to select ad' });
    }
  });

  // Admin route for creating new users
  app.post('/api/admin/create-user', async (req, res) => {
    try {
      const { createNewUser } = await import('./vipManagement');
      const userData = {
        ...req.body,
        adminEmail: 'admin@russell-nomer.com', // Russell's admin email
      };
      
      const result = await createNewUser(userData);
      res.json(result);
    } catch (error: any) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: error.message || 'Failed to create user' });
    }
  });

  // Add new draw and evaluate predictions
  // Admin routes for VIP code management
  app.get('/api/admin/totp-info', async (req, res) => {
    try {
      const { getCurrentTotpToken, getTotpTimeRemaining } = await import('./vipManagement');
      
      res.json({
        token: getCurrentTotpToken(),
        timeRemaining: getTotpTimeRemaining(),
      });
    } catch (error) {
      console.error('Error getting TOTP info:', error);
      res.status(500).json({ message: 'Failed to get TOTP info' });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/vip-codes', async (req, res) => {
    try {
      const { getVipCodesByAdmin } = await import('./vipManagement');
      const adminEmail = 'russell@russellnomer.com'; // Default admin
      const codes = await getVipCodesByAdmin(adminEmail);
      res.json(codes);
    } catch (error) {
      console.error('Error fetching VIP codes:', error);
      res.status(500).json({ message: 'Failed to fetch VIP codes' });
    }
  });

  app.get('/api/admin/logs', async (req, res) => {
    try {
      const { getAdminLogs } = await import('./vipManagement');
      const logs = await getAdminLogs(50);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ message: 'Failed to fetch admin logs' });
    }
  });

  app.post('/api/admin/generate-vip', async (req, res) => {
    try {
      const { generateSecureVipCode } = await import('./vipManagement');
      const { targetEmail, currentTier, targetTier, adminNotes } = req.body;
      
      console.log('VIP Generation Request:', { targetEmail, currentTier, targetTier, adminNotes });
      
      if (!targetEmail || !currentTier || !targetTier) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const adminEmail = 'russell@russellnomer.com'; // Default admin
      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await generateSecureVipCode(
        { targetEmail, currentTier, targetTier, adminNotes },
        adminEmail,
        ipAddress,
        userAgent
      );

      console.log('VIP Generation Success:', result);
      res.json(result);
    } catch (error: any) {
      console.error('Error generating VIP code:', error);
      res.status(500).json({ 
        message: 'Failed to generate VIP code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post('/api/admin/update-user-tier', async (req, res) => {
    try {
      const { email, tier } = req.body;
      
      if (!email || !tier) {
        return res.status(400).json({ message: 'Email and tier are required' });
      }

      await storage.updateUserTier(email, tier);
      
      // Log the admin action
      const { db } = await import('./db');
      const { adminLogs } = await import('@shared/schema');
      await db.insert(adminLogs).values({
        adminEmail: 'russell@russellnomer.com',
        action: 'update_user_tier',
        targetEmail: email,
        details: { newTier: tier },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating user tier:', error);
      res.status(500).json({ message: 'Failed to update user tier' });
    }
  });

  // VIP Code redemption routes (multiple endpoints for compatibility)
  app.post('/api/vip/redeem', async (req, res) => {
    try {
      const { redeemVipCode } = await import('./vipManagement');
      const { code, userEmail } = req.body;
      
      if (!code || !userEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'VIP code and email are required' 
        });
      }

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await redeemVipCode(
        { code: code.trim(), userEmail: userEmail.trim() },
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error redeeming VIP code:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to redeem VIP code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post('/api/redeem-vip-code', async (req, res) => {
    try {
      const { redeemVipCode } = await import('./vipManagement');
      const { code, userEmail } = req.body;
      
      if (!code || !userEmail) {
        return res.status(400).json({ 
          success: false, 
          message: 'VIP code and email are required' 
        });
      }

      const ipAddress = req.ip;
      const userAgent = req.get('User-Agent');

      const result = await redeemVipCode(
        { code: code.trim(), userEmail: userEmail.trim() },
        ipAddress,
        userAgent
      );

      res.json(result);
    } catch (error: any) {
      console.error('Error redeeming VIP code:', error);
      res.status(500).json({ 
        success: false,
        message: 'Failed to redeem VIP code',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  app.post("/api/draws", async (req, res) => {
    try {
      const drawData = insertDrawSchema.parse(req.body);
      const newDraw = await storage.createDraw(drawData);
      
      // Evaluate all predictions against this new draw
      await storage.evaluatePredictions(newDraw);
      
      res.json(newDraw);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get performance stats
  app.get("/api/performance/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      const method = req.query.method as string;
      
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
      const stats = await storage.getPerformanceStats(game, method);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get marketing analytics
  app.get("/api/marketing-stats", async (req, res) => {
    try {
      const stats = await storage.getMarketingStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get prediction results for a ticket
  app.get("/api/predictions/:ticketId?", async (req, res) => {
    try {
      const ticketId = req.params.ticketId;
      const results = await storage.getPredictionResults(ticketId);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // PayPal routes
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // PayPal Subscription routes
  
  // Get user subscription status
  app.get("/api/subscription/status", async (req, res) => {
    try {
      // Use same tracking logic as generate endpoint
      let usageTrackingId = req.user?.id;
      let isGuest = false;
      let userTier = "free";
      let userStatus = "inactive";
      let paypalId = null;
      
      if (!usageTrackingId) {
        // For guest users, use session ID or consistent IP-based ID (NO timestamp)
        isGuest = true;
        usageTrackingId = req.sessionID || `guest_${req.ip}`;
        userTier = "guest";
        console.log('📊 STATUS CHECK: Guest user detected, using tracking ID:', usageTrackingId);
      } else {
        // For authenticated users, get user details
        const user = await storage.getUserById(req.user.id);
        if (user) {
          userTier = user.subscriptionTier || "free";
          userStatus = user.subscriptionStatus || "inactive";
          paypalId = user.paypalSubscriptionId || null;
        }
      }
      
      // Get usage info for tracking ID
      const usageInfo = await storage.checkUserUsageLimit(usageTrackingId);
      
      console.log('📊 STATUS RESPONSE:', {
        trackingId: usageTrackingId,
        isGuest,
        tier: userTier,
        usage: usageInfo.count,
        limit: usageInfo.limit
      });
      
      res.json({
        success: true,
        subscription_tier: userTier,
        subscription_status: userStatus, 
        daily_usage_count: usageInfo.count,
        daily_usage_limit: usageInfo.limit,
        can_use: usageInfo.canUse,
        paypal_subscription_id: paypalId,
        is_guest: isGuest,
        tracking_id: usageTrackingId
      });
    } catch (error: any) {
      console.error('Subscription status error:', error);
      res.status(500).json({ 
        success: false, 
        error: error.message,
        subscription_tier: "guest",
        subscription_status: "inactive",
        daily_usage_count: 0
      });
    }
  });

  app.post("/api/subscriptions/create", requireAuth, async (req, res) => {
    try {
      const { planId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      if (!planId) {
        return res.status(400).json({ success: false, message: 'Plan ID is required' });
      }

      // Create PayPal subscription
      const subscription = await createPayPalSubscription(planId, userId);
      
      if (subscription.success) {
        res.json({ 
          success: true, 
          subscriptionId: subscription.subscriptionId,
          approvalUrl: subscription.approvalUrl
        });
      } else {
        res.status(400).json({ success: false, message: subscription.error });
      }
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ success: false, message: 'Failed to create subscription' });
    }
  });

  app.post("/api/subscriptions/activate", requireAuth, async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      // Activate subscription and update user tier
      const result = await activatePayPalSubscription(subscriptionId, userId);
      
      if (result.success) {
        res.json({ success: true, tier: result.tier });
      } else {
        res.status(400).json({ success: false, message: result.error });
      }
    } catch (error) {
      console.error('Subscription activation error:', error);
      res.status(500).json({ success: false, message: 'Failed to activate subscription' });
    }
  });

  app.post("/webhooks/paypal", async (req, res) => {
    try {
      const eventType = req.body.event_type;
      const resource = req.body.resource;

      console.log('PayPal webhook received:', eventType);

      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
          await handleSubscriptionActivated(resource);
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          await handleSubscriptionCancelled(resource);
          break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
          await handleSubscriptionSuspended(resource);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await handlePaymentCompleted(resource);
          break;
        default:
          console.log('Unhandled webhook event:', eventType);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
  });

  // Usage enforcement endpoint
  app.post("/api/check-usage", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const usageInfo = await storage.checkUserUsageLimit(userId);
      res.json({ success: true, ...usageInfo });
    } catch (error) {
      console.error('Usage check error:', error);
      res.status(500).json({ success: false, message: 'Failed to check usage' });
    }
  });

  // Subscription info endpoint
  app.get("/api/subscription-info", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const subscriptionInfo = await storage.getUserSubscriptionInfo(userId);
      if (subscriptionInfo) {
        res.json({ success: true, ...subscriptionInfo });
      } else {
        res.status(404).json({ success: false, message: 'Subscription info not found' });
      }
    } catch (error) {
      console.error('Subscription info error:', error);
      res.status(500).json({ success: false, message: 'Failed to get subscription info' });
    }
  });

  // Secure AdSense configuration endpoint - no sensitive data exposed
  app.get("/api/adsense-config", createAdSenseConfigEndpoint());

  // Authentication routes with rate limiting
  app.post("/api/auth/register", authRateLimit, register);
  app.post("/api/auth/login", authRateLimit, login);
  app.post("/api/auth/mfa/setup", authRateLimit, setupMFA);
  app.post("/api/auth/mfa/verify", authRateLimit, verifyMFASetup);

  // VIP Code Management Routes moved to admin endpoints above

  // Music Content Routes - Russell Nomer's authentic songs
  app.get("/api/music", async (req, res) => {
    try {
      const featured = req.query.featured === 'true';
      const music = await storage.getMusicContent(featured);
      res.json(music);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Russell Nomer's live YouTube catalog
  app.get("/api/russell-music", async (req, res) => {
    try {
      const songs = await youtubeService.getRussellNomerSongs();
      res.json({
        success: true,
        artist: "Russell Nomer",
        channelId: "UCAiOa4F7HAyxgHaDlRPw6vA",
        count: songs.length,
        songs: songs
      });
    } catch (error: any) {
      console.error('Error fetching Russell Nomer songs:', error);
      res.status(500).json({ 
        success: false,
        error: "Could not fetch Russell Nomer's songs from YouTube",
        message: error.message 
      });
    }
  });

  // Book Recommendations Routes
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getBookRecommendations();
      res.json(books);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Customer data collection and analytics routes
  app.use('/api/customer', customerDataRoutes);
  app.use('/api/customer', profileSetupRoutes);
  app.use('/api/fan-contest', fanContestRoutes);
  app.use('/api/ascap', ascapNetworkingRoutes);
  
  // YouTube API Routes for Russell Nomer's authentic music
  app.use('/api/youtube', youtubeRoutes);

  // Advanced lottery strategies
  app.get('/api/advanced-strategies/:game', async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      const { advancedStrategies } = await import('./advancedLotteryStrategies');
      const predictions = await advancedStrategies.generateAdvancedPredictions(game as any, 10);
      
      res.json({
        success: true,
        game,
        strategies: predictions,
        totalStrategies: predictions.length,
        analysisNote: "Educational lottery number study methodologies"
      });
    } catch (error) {
      console.error('Error generating advanced strategies:', error);
      res.status(500).json({ error: 'Failed to generate advanced strategies' });
    }
  });

  // Wheeling systems
  app.get('/api/wheeling-systems/:game', async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      const { advancedStrategies } = await import('./advancedLotteryStrategies');
      const wheelSystems = await advancedStrategies.generateWheelingSystems(game as any);
      
      res.json({
        success: true,
        game,
        wheelingSystems: wheelSystems
      });
    } catch (error) {
      console.error('Error generating wheeling systems:', error);
      res.status(500).json({ error: 'Failed to generate wheeling systems' });
    }
  });

  // Enhanced lottery analysis with latest results
  app.get('/api/enhanced-analysis/:game', async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      // Update lottery data with latest results first
      const { lotteryDataService } = await import('./lotteryDataService');
      await lotteryDataService.updateAllGames();

      const { enhancedAnalysis } = await import('./enhancedLotteryAnalysis');
      const predictions = await enhancedAnalysis.generateEnhancedPredictions(game as any);
      
      res.json({
        success: true,
        game,
        enhancedPredictions: predictions,
        totalPredictions: predictions.length,
        educationalNote: "Enhanced educational analysis for lottery number study",
        analysisDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating enhanced analysis:', error);
      res.status(500).json({ error: 'Failed to generate enhanced analysis' });
    }
  });

  // Combined educational analysis combining all strategies
  app.get('/api/combined-analysis/:game', async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      // Update lottery data first
      const { lotteryDataService } = await import('./lotteryDataService');
      await lotteryDataService.updateAllGames();

      // Get all strategies
      const { advancedStrategies } = await import('./advancedLotteryStrategies');
      const { enhancedAnalysis } = await import('./enhancedLotteryAnalysis');
      
      const [basicStrategies, enhancedPredictions] = await Promise.all([
        advancedStrategies.generateAdvancedPredictions(game as any, 5),
        enhancedAnalysis.generateEnhancedPredictions(game as any)
      ]);

      // Select the first enhanced analysis for educational display
      const primaryEnhanced = enhancedPredictions[0] || null;

      // Get current draws for additional analysis
      const draws = await storage.getDraws(game);
      const latestDrawDate = draws[0]?.drawDate || new Date();

      res.json({
        success: true,
        game,
        combinedAnalysis: primaryEnhanced,
        alternativePredictions: enhancedPredictions.slice(0, 3),
        supportingStrategies: basicStrategies.slice(0, 3),
        analysisMetadata: {
          totalDrawsAnalyzed: draws.length,
          latestDrawDate: latestDrawDate,
          analysisDate: new Date().toISOString(),
          educationalNote: "Combined educational analysis for study purposes",
          strategiesUsed: enhancedPredictions.length + basicStrategies.length
        }
      });
    } catch (error) {
      console.error('Error generating combined analysis:', error);
      res.status(500).json({ error: 'Failed to generate combined analysis' });
    }
  });

  // Real-time analysis with actual recent results
  app.get('/api/real-time-analysis', async (req, res) => {
    try {
      const { realTimeAnalysis } = await import('./realTimeAnalysis');
      const studies = await realTimeAnalysis.generateRealTimeStudies();
      
      // Select the first educational study for display
      const primaryStudy = studies[0] || null;

      res.json({
        success: true,
        primaryStudy,
        allStudies: studies,
        totalMethods: studies.length,
        analysisDate: new Date().toISOString(),
        basedOnActualResults: true,
        recentResultsAnalyzed: 5,
        educationalNote: "For educational analysis and entertainment purposes only"
      });
    } catch (error) {
      console.error('Error generating real-time analysis:', error);
      res.status(500).json({ error: 'Failed to generate real-time analysis' });
    }
  });

  // Numerology analysis routes - based on book guidance
  app.get('/api/numerology-analysis', async (req, res) => {
    try {
      const { numerologyAnalysis } = await import('./numerologyAnalysis');
      const { fullName, birthDate } = req.query;
      
      const predictions = await numerologyAnalysis.generateNumerologyPredictions(
        fullName as string, 
        birthDate as string
      );
      
      res.json({
        success: true,
        numerologyPredictions: predictions,
        totalPredictions: predictions.length,
        educationalNote: "Educational numerological study methods for entertainment purposes",
        analysisDate: new Date().toISOString(),
        personalizedInput: {
          fullName: fullName || 'Universal Energy',
          birthDate: birthDate || 'Current Universal Day'
        }
      });
    } catch (error: any) {
      console.error('Error in numerology analysis:', error);
      res.status(500).json({ error: 'Failed to generate numerology analysis' });
    }
  });

  // Personalized numerology report based on book guidance
  app.post('/api/numerology-report', async (req, res) => {
    try {
      const { numerologyAnalysis } = await import('./numerologyAnalysis');
      const { fullName, birthDate } = req.body;
      
      if (!fullName || !birthDate) {
        return res.status(400).json({ 
          error: 'Full name and birth date are required for personalized numerology analysis' 
        });
      }

      const [predictions, report] = await Promise.all([
        numerologyAnalysis.generateNumerologyPredictions(fullName, birthDate),
        numerologyAnalysis.generatePersonalizedReport(fullName, birthDate)
      ]);

      // Find the highest vibration prediction
      const mostPowerfulPrediction = predictions.reduce((best, current) => 
        current.vibrationLevel > best.vibrationLevel ? current : best
      );

      res.json({
        success: true,
        personalizedReport: report,
        numerologyPredictions: predictions,
        mostPowerfulPrediction,
        spiritualGuidance: mostPowerfulPrediction.spiritualGuidance,
        luckyTiming: mostPowerfulPrediction.luckyTiming,
        analysisDate: new Date().toISOString()
      });
    } catch (error: any) {
      console.error('Error generating personalized numerology report:', error);
      res.status(500).json({ error: 'Failed to generate personalized numerology report' });
    }
  });

  // Performance tracking and win/loss analysis endpoints
  app.post('/api/performance/initialize-tracking', async (req, res) => {
    try {
      console.log('🎯 Initializing performance tracking system...');
      const { dailyPickService } = await import('./dailyPickGenerationService');
      const { performanceTracker } = await import('./performanceTrackingService');
      
      // Generate 30 days of historical picks
      await dailyPickService.generateHistoricalPicks(30);
      
      // Evaluate all tickets against draws
      const results = await performanceTracker.evaluateAllTickets();
      
      console.log('✅ Performance tracking initialized!');
      
      res.json({
        success: true,
        message: 'Performance tracking initialized',
        resultsCount: results.length
      });
    } catch (error: any) {
      console.error('Error initializing tracking:', error);
      res.status(500).json({ error: 'Failed to initialize tracking' });
    }
  });
  
  app.post('/api/performance/generate-daily-picks', async (req, res) => {
    try {
      const { dailyPickService } = await import('./dailyPickGenerationService');
      await dailyPickService.generateDailyPicks();
      
      res.json({
        success: true,
        message: 'Daily picks generated successfully'
      });
    } catch (error: any) {
      console.error('Error generating daily picks:', error);
      res.status(500).json({ error: 'Failed to generate daily picks' });
    }
  });
  
  app.post('/api/performance/generate-historical-picks', async (req, res) => {
    try {
      const { dailyPickService } = await import('./dailyPickGenerationService');
      const { daysBack } = req.body;
      await dailyPickService.generateHistoricalPicks(daysBack || 30);
      
      res.json({
        success: true,
        message: `Historical picks generated for ${daysBack || 30} days`
      });
    } catch (error: any) {
      console.error('Error generating historical picks:', error);
      res.status(500).json({ error: 'Failed to generate historical picks' });
    }
  });
  
  app.post('/api/performance/evaluate-tickets', async (req, res) => {
    try {
      const { performanceTracker } = await import('./performanceTrackingService');
      const results = await performanceTracker.evaluateAllTickets();
      
      res.json({
        success: true,
        resultsCount: results.length,
        message: 'All tickets evaluated against draws'
      });
    } catch (error: any) {
      console.error('Error evaluating tickets:', error);
      res.status(500).json({ error: 'Failed to evaluate tickets' });
    }
  });
  
  app.get('/api/performance/win-loss-statements', async (req, res) => {
    try {
      const { performanceTracker } = await import('./performanceTrackingService');
      const statements = await performanceTracker.generateMultiLevelStatements();
      
      res.json({
        success: true,
        statements,
        educationalNote: 'For educational and entertainment purposes only - not predictive'
      });
    } catch (error: any) {
      console.error('Error generating win/loss statements:', error);
      res.status(500).json({ error: 'Failed to generate statements' });
    }
  });
  
  app.get('/api/performance/method-summary', async (req, res) => {
    try {
      const { performanceTracker } = await import('./performanceTrackingService');
      const summary = await performanceTracker.getMethodPerformanceSummary();
      
      res.json({
        success: true,
        summary,
        educationalNote: 'For educational analysis only - past results do not predict future outcomes'
      });
    } catch (error: any) {
      console.error('Error getting method summary:', error);
      res.status(500).json({ error: 'Failed to get method summary' });
    }
  });
  
  app.get('/api/performance/daily-picks', async (req, res) => {
    try {
      const { game, method } = req.query;
      let tickets = await storage.getRecentTickets(10000);
      
      // Filter by game if specified
      if (game && game !== 'all') {
        tickets = tickets.filter((t: any) => t.game === game);
      }
      
      // Filter by method if specified
      if (method && method !== 'all') {
        tickets = tickets.filter((t: any) => t.method === method);
      }
      
      res.json({
        success: true,
        tickets,
        total: tickets.length,
        educationalNote: 'Educational lottery picks for analysis purposes only'
      });
    } catch (error: any) {
      console.error('Error fetching daily picks:', error);
      res.status(500).json({ error: 'Failed to fetch daily picks' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
