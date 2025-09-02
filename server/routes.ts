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
// VIP management functions will be imported dynamically
import { seedRussellNomerContent } from "./seedMusicData";
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
  
  // Seed historical data and Russell Nomer content on startup
  await seedHistoricalData();
  await seedRussellNomerContent();
  
  // Get historical draws for a specific game
  app.get("/api/draws/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
      const draws = await storage.getDraws(game);
      res.json(draws);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate lottery numbers
  app.post("/api/generate/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }

      const { method = 'hot' } = req.body;
      
      // Get historical data for analysis
      const draws = await storage.getDraws(game);
      
      // Generate numbers based on method
      let mainNumbers: number[];
      let bonusNumber: number;
      
      if (method === 'hot') {
        // Use frequency analysis for hot numbers
        const frequency = new Map<number, number>();
        const bonusFreq = new Map<number, number>();
        
        draws.forEach(draw => {
          (draw.mainNumbers as number[]).forEach(num => {
            frequency.set(num, (frequency.get(num) || 0) + 1);
          });
          bonusFreq.set(draw.bonusNumber, (bonusFreq.get(draw.bonusNumber) || 0) + 1);
        });
        
        // Get most frequent numbers
        const sortedNumbers = Array.from(frequency.entries())
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
        confidence: method === 'hot' ? 0.75 : method === 'balanced' ? 0.65 : 0.50,
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
      
      const isStatisticallySignificant = draws.length >= 200; // Ultra-maximum statistical confidence requirement
      
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
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
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
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        averageExpectedValue: predictions.reduce((sum, p) => sum + p.expectedValue, 0) / predictions.length,
        analysisDate: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error generating enhanced analysis:', error);
      res.status(500).json({ error: 'Failed to generate enhanced analysis' });
    }
  });

  // Ultimate prediction combining all strategies
  app.get('/api/ultimate-prediction/:game', async (req, res) => {
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

      // Find the highest confidence prediction from enhanced analysis
      const bestEnhanced = enhancedPredictions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      // Get current draws for additional analysis
      const draws = await storage.getDraws(game);
      const latestDrawDate = draws[0]?.drawDate || new Date();

      res.json({
        success: true,
        game,
        ultimatePrediction: bestEnhanced,
        alternativePredictions: enhancedPredictions.slice(0, 3),
        supportingStrategies: basicStrategies.slice(0, 3),
        analysisMetadata: {
          totalDrawsAnalyzed: draws.length,
          latestDrawDate: latestDrawDate,
          analysisDate: new Date().toISOString(),
          confidenceLevel: bestEnhanced.confidence,
          expectedValue: bestEnhanced.expectedValue,
          strategiesUsed: enhancedPredictions.length + basicStrategies.length
        }
      });
    } catch (error) {
      console.error('Error generating ultimate prediction:', error);
      res.status(500).json({ error: 'Failed to generate ultimate prediction' });
    }
  });

  // Real-time analysis with actual recent results
  app.get('/api/real-time-analysis', async (req, res) => {
    try {
      const { realTimeAnalysis } = await import('./realTimeAnalysis');
      const predictions = await realTimeAnalysis.generateRealTimePredictions();
      
      // Find the ultimate prediction (highest confidence)
      const ultimatePrediction = predictions.reduce((best, current) => 
        current.confidence > best.confidence ? current : best
      );

      res.json({
        success: true,
        ultimatePrediction,
        allPredictions: predictions,
        totalStrategies: predictions.length,
        averageConfidence: predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length,
        analysisDate: new Date().toISOString(),
        basedOnActualResults: true,
        recentResultsAnalyzed: 5,
        jackpotAmount: "$1,300,000,000"
      });
    } catch (error) {
      console.error('Error generating real-time analysis:', error);
      res.status(500).json({ error: 'Failed to generate real-time analysis' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
