import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import youtubeRoutes from "./routes/youtube";
import youtubeService from "./youtubeService";
import { insertTicketSchema, insertDrawSchema, type GameType } from "@shared/schema";
import { seedHistoricalData } from "./seedData";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { createAdSenseConfigEndpoint } from "./middleware/adsense";
import { register, login, logout, setupMFA, verifyMFASetup, requireAuth, requireAdmin, requireBasic, requirePro, requirePremium, forgotPassword, resetPassword } from "./auth";
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
import { logAudit, logError, getAuditLogs, getErrorLogs, markErrorResolved } from "./logging";
import { z } from "zod";

import path from "path";
import express from "express";
import fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Serve static files from public directory (robots.txt, security.txt)
  const publicPath = path.resolve(process.cwd(), "public");
  if (fs.existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  
  // Explicit routes for security files
  app.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(`User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /god-mode

Sitemap: https://lotterypro.replit.app/sitemap.xml
`);
  });
  
  app.get('/security.txt', (req, res) => {
    res.redirect('/.well-known/security.txt');
  });
  
  app.get('/.well-known/security.txt', (req, res) => {
    res.type('text/plain').send(`# LotteryPro Security Policy
Contact: mailto:security@lotterypro.com
Expires: 2026-12-31T23:59:59.000Z
Preferred-Languages: en
Canonical: https://lotterypro.replit.app/.well-known/security.txt
`);
  });
  
  // Admin authentication routes - server-side security
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'default-change-me';
  
  app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
      req.session.isAdmin = true;
      res.json({ success: true, message: 'Admin authenticated' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid password' });
    }
  });
  
  app.post('/api/admin/logout', (req, res) => {
    req.session.isAdmin = false;
    req.session.destroy((err: Error) => {
      if (err) {
        res.status(500).json({ success: false, error: 'Logout failed' });
      } else {
        res.json({ success: true, message: 'Logged out' });
      }
    });
  });
  
  app.get('/api/admin/session', (req, res) => {
    res.json({ isAdmin: req.session?.isAdmin === true });
  });
  
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
  app.post("/api/loading/refresh", requireAdmin, async (req, res) => {
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
      
      // Admin bypass - admins have unlimited usage
      const isAdmin = req.session?.isAdmin === true;
      if (isAdmin) {
        console.log('👑 ADMIN BYPASS: Admin user has unlimited access');
      }
      
      // Check usage limits for non-admin users
      if (!isAdmin) {
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
        
        const maxBonus = game === 'powerball' ? 26 : 24;
        const sortedBonus = Array.from(bonusFreq.entries())
          .filter(([num]) => num >= 1 && num <= maxBonus) // Filter to valid range
          .sort((a, b) => b[1] - a[1])
          .map(([num]) => num);
        
        // Select top frequent numbers with some randomness
        mainNumbers = sortedNumbers.slice(0, 8).sort(() => 0.5 - Math.random()).slice(0, 5).sort((a, b) => a - b);
        bonusNumber = sortedBonus[0] || Math.floor(Math.random() * maxBonus) + 1;
        
      } else if (method === 'balanced') {
        // Balanced selection across ranges
        const maxMain = game === 'powerball' ? 69 : 70;
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
        const maxMain = game === 'powerball' ? 69 : 70;
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

      const gameConfigs: Record<string, { maxMain: number; maxBonus: number; mainCount: number }> = {
        powerball: { maxMain: 69, maxBonus: 26, mainCount: 5 },
        megamillions: { maxMain: 70, maxBonus: 25, mainCount: 5 },
        nylotto: { maxMain: 59, maxBonus: 59, mainCount: 6 },
        cash4life: { maxMain: 60, maxBonus: 4, mainCount: 5 },
        take5: { maxMain: 39, maxBonus: 0, mainCount: 5 },
        pick10: { maxMain: 80, maxBonus: 0, mainCount: 10 }
      };
      const gameConf = gameConfigs[game] || gameConfigs.powerball;

      res.json({
        mainNumbers,
        bonusNumber,
        method,
        educationalNote: `Educational ${method} number methodology for study purposes`,
        ticketId: ticket.id,
        totalNumbers: mainNumbers.length + (bonusNumber ? 1 : 0),
        gameInfo: {
          name: game,
          format: gameConf.maxBonus > 0 
            ? `${gameConf.mainCount} from 1-${gameConf.maxMain} + 1 from 1-${gameConf.maxBonus}`
            : `${gameConf.mainCount} from 1-${gameConf.maxMain}`
        }
      });
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Revenue Generation: Track affiliate clicks (Jackpocket, etc.)
  app.post("/api/affiliate/track", async (req, res) => {
    try {
      const { partner, game, ticketId } = req.body;
      const { db } = await import('./db');
      const { affiliateTracking } = await import('@shared/schema');
      
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      await db.insert(affiliateTracking).values({
        userId,
        sessionId,
        ticketId: ticketId || null,
        affiliatePartner: partner || 'jackpocket',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      res.json({ success: true, tracked: true });
    } catch (error: any) {
      console.error('Affiliate tracking error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Daily Spin-to-Win: Check spin status
  app.get("/api/spin/status", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { dailySpins, emailPreferences } = await import('@shared/schema');
      const { desc, eq, and, sql, or } = await import('drizzle-orm');
      
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      const isAuthenticated = !!req.user;
      const hasRegisteredEmail = !!req.session?.spinRegisteredEmail;
      const isRegistered = isAuthenticated || hasRegisteredEmail;
      
      if (!isRegistered) {
        const existingRegistration = await db.select()
          .from(emailPreferences)
          .where(
            or(
              userId ? eq(emailPreferences.userId, userId) : sql`false`,
              eq(emailPreferences.sessionId, sessionId)
            )
          )
          .limit(1);
        
        if (existingRegistration.length > 0) {
          req.session.spinRegisteredEmail = existingRegistration[0].email;
        } else {
          return res.json({
            canSpin: false,
            hoursUntilNextSpin: 0,
            spinStreak: 0,
            lastSpin: null,
            requiresRegistration: true,
            message: 'Please register to spin the wheel'
          });
        }
      }
      
      // Get today's date in YYYY-MM-DD format
      const todayDate = new Date().toISOString().split('T')[0];
      
      const todaySpins = await db.select()
        .from(dailySpins)
        .where(
          and(
            userId ? eq(dailySpins.userId, userId) : eq(dailySpins.sessionId, sessionId),
            eq(dailySpins.spinDate, todayDate)
          )
        )
        .orderBy(desc(dailySpins.spunAt))
        .limit(1);
      
      // Calculate consecutive day streak
      const allSpins = await db.select()
        .from(dailySpins)
        .where(userId ? eq(dailySpins.userId, userId) : eq(dailySpins.sessionId, sessionId))
        .orderBy(desc(dailySpins.spunAt));
      
      let spinStreak = 0;
      if (allSpins.length > 0) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const spin of allSpins) {
          const spinDate = new Date(spin.spunAt || Date.now());
          spinDate.setHours(0, 0, 0, 0);
          
          const daysDiff = Math.floor((currentDate.getTime() - spinDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysDiff === spinStreak) {
            spinStreak++;
            currentDate.setDate(currentDate.getDate() - 1);
          } else {
            break;
          }
        }
      }
      
      // Check if user has premium tier - unlimited spins
      const userTier = req.user?.subscriptionTier || 'free';
      const hasPremiumSpins = ['premium', 'pro', 'unlimited'].includes(userTier);
      
      const canSpin = hasPremiumSpins || todaySpins.length === 0;
      
      // Calculate hours until next spin based on the actual spin timestamp
      let hoursUntilNextSpin = 0;
      if (!canSpin && todaySpins[0]) {
        const lastSpinTime = new Date(todaySpins[0].spunAt || Date.now());
        const nextSpinTime = new Date(lastSpinTime.getTime() + 24 * 60 * 60 * 1000);
        hoursUntilNextSpin = Math.max(0, Math.ceil((nextSpinTime.getTime() - Date.now()) / (1000 * 60 * 60)));
      }
      
      res.json({
        canSpin,
        hoursUntilNextSpin,
        spinStreak,
        lastSpin: todaySpins[0] || null,
        unlimitedSpins: hasPremiumSpins,
        userTier
      });
    } catch (error: any) {
      console.error('Spin status error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==================== COMMUNITY LOTTERY POOLS ====================
  
  // Get all available pools (public pools + user's pools)
  app.get("/api/pools", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { lotteryPools, poolMembers } = await import('@shared/schema');
      const { eq, and, or, gt } = await import('drizzle-orm');
      
      const userId = req.user?.id;
      
      // Get public open pools + user's pools
      let pools;
      if (userId) {
        pools = await db.select()
          .from(lotteryPools)
          .where(
            and(
              or(
                eq(lotteryPools.isPublic, true),
                eq(lotteryPools.createdBy, userId)
              ),
              gt(lotteryPools.targetDrawDate, new Date())
            )
          )
          .orderBy(lotteryPools.targetDrawDate);
      } else {
        pools = await db.select()
          .from(lotteryPools)
          .where(
            and(
              eq(lotteryPools.isPublic, true),
              gt(lotteryPools.targetDrawDate, new Date())
            )
          )
          .orderBy(lotteryPools.targetDrawDate);
      }
      
      res.json({ success: true, pools });
    } catch (error: any) {
      console.error('Get pools error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get pool details with members
  app.get("/api/pools/:poolId", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { lotteryPools, poolMembers, poolTickets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const poolId = req.params.poolId;
      
      const [pool] = await db.select()
        .from(lotteryPools)
        .where(eq(lotteryPools.id, poolId))
        .limit(1);
      
      if (!pool) {
        return res.status(404).json({ success: false, message: 'Pool not found' });
      }
      
      const members = await db.select()
        .from(poolMembers)
        .where(eq(poolMembers.poolId, poolId));
      
      const tickets = await db.select()
        .from(poolTickets)
        .where(eq(poolTickets.poolId, poolId));
      
      res.json({ success: true, pool, members, tickets });
    } catch (error: any) {
      console.error('Get pool details error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create a new pool (requires authentication for accountability)
  app.post("/api/pools/create", requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { lotteryPools } = await import('@shared/schema');
      
      const { 
        name, 
        description, 
        game, 
        targetDrawDate, 
        contributionPerMember, 
        maxMembers,
        adminFeePercent,
        isPublic,
        requiresApproval 
      } = req.body;
      
      if (!name || !game || !targetDrawDate || !contributionPerMember || !maxMembers) {
        return res.status(400).json({ 
          success: false, 
          message: 'Missing required fields' 
        });
      }
      
      // Validate admin fee is within acceptable range (5-10%)
      const feePercent = adminFeePercent ? parseFloat(adminFeePercent) : 7.5;
      if (feePercent < 5 || feePercent > 10) {
        return res.status(400).json({
          success: false,
          message: 'Admin fee must be between 5% and 10%'
        });
      }
      
      // Validate contribution amount
      const contribution = parseFloat(contributionPerMember);
      if (contribution < 5) {
        return res.status(400).json({
          success: false,
          message: 'Minimum contribution is $5 per member'
        });
      }
      
      const userId = req.user?.id;
      
      // Require authentication for pool creation (accountability)
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'You must be logged in to create a pool'
        });
      }
      
      const [pool] = await db.insert(lotteryPools).values({
        name,
        description,
        game,
        targetDrawDate: new Date(targetDrawDate),
        contributionPerMember: contribution.toString(),
        maxMembers,
        adminFeePercent: feePercent.toString(),
        isPublic: isPublic ?? true,
        requiresApproval: requiresApproval ?? false,
        createdBy: userId,
        status: 'open'
      }).returning();
      
      res.json({ success: true, pool });
    } catch (error: any) {
      console.error('Create pool error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Join a pool (requires authentication)
  app.post("/api/pools/:poolId/join", requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { lotteryPools, poolMembers } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const poolId = req.params.poolId;
      const { displayName, email } = req.body;
      
      const userId = req.user?.id;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      // Get pool details
      const [pool] = await db.select()
        .from(lotteryPools)
        .where(eq(lotteryPools.id, poolId))
        .limit(1);
      
      if (!pool) {
        return res.status(404).json({ success: false, message: 'Pool not found' });
      }
      
      if (pool.status !== 'open') {
        return res.status(400).json({ success: false, message: 'Pool is not accepting new members' });
      }
      
      if (pool.currentMembers >= pool.maxMembers) {
        return res.status(400).json({ success: false, message: 'Pool is full' });
      }
      
      // Calculate share percentage (equal shares for now)
      const sharePercentage = (100 / pool.maxMembers).toFixed(2);
      
      // Add member
      const [member] = await db.insert(poolMembers).values({
        poolId,
        userId: userId || null,
        sessionId,
        displayName,
        email,
        contributionAmount: pool.contributionPerMember,
        sharePercentage,
        status: pool.requiresApproval ? 'pending' : 'active',
        paymentStatus: 'pending'
      }).returning();
      
      // Update pool member count if auto-approved
      if (!pool.requiresApproval) {
        const newMemberCount = pool.currentMembers + 1;
        const newStatus = newMemberCount >= pool.maxMembers ? 'full' : 'open';
        
        await db.update(lotteryPools)
          .set({ 
            currentMembers: newMemberCount,
            status: newStatus
          })
          .where(eq(lotteryPools.id, poolId));
      }
      
      res.json({ success: true, member, requiresPayment: true });
    } catch (error: any) {
      console.error('Join pool error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Create PayPal payment order for pool membership
  app.post("/api/pools/:poolId/create-payment", requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { lotteryPools, poolMembers } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const { isPayPalConfigured } = await import('./paypal');
      
      if (!isPayPalConfigured) {
        return res.status(503).json({ success: false, message: 'PayPal not configured' });
      }
      
      const poolId = req.params.poolId;
      const { memberId } = req.body;
      
      // Get pool and member details
      const [pool] = await db.select()
        .from(lotteryPools)
        .where(eq(lotteryPools.id, poolId))
        .limit(1);
      
      if (!pool) {
        return res.status(404).json({ success: false, message: 'Pool not found' });
      }
      
      const [member] = await db.select()
        .from(poolMembers)
        .where(eq(poolMembers.id, memberId))
        .limit(1);
      
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      
      const amount = parseFloat(member.contributionAmount);
      
      res.json({ 
        success: true, 
        message: 'PayPal order creation - use client-side PayPal SDK',
        amount: amount.toFixed(2),
        poolName: pool.name
      });
    } catch (error: any) {
      console.error('Create payment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Capture PayPal payment and update pool financials
  app.post("/api/pools/:poolId/capture-payment", requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { poolMembers, lotteryPools, poolTransactions } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      const { isPayPalConfigured } = await import('./paypal');
      
      if (!isPayPalConfigured) {
        return res.status(503).json({ success: false, message: 'PayPal not configured' });
      }
      
      const poolId = req.params.poolId;
      const { memberId, orderId, captureData } = req.body;
      
      // Get member details FIRST to validate expected amount
      const [member] = await db.select()
        .from(poolMembers)
        .where(eq(poolMembers.id, memberId))
        .limit(1);
      
      if (!member) {
        return res.status(404).json({ success: false, message: 'Member not found' });
      }
      
      const expectedAmount = parseFloat(member.contributionAmount);
      const captureId = captureData?.captureId || orderId;
      const amount = captureData?.amount || member.contributionAmount;
      const actualAmount = parseFloat(amount);
      
      if (Math.abs(actualAmount - expectedAmount) > 0.01) {
        console.error(`Payment amount mismatch: expected ${expectedAmount}, got ${actualAmount}`);
        return res.status(400).json({
          success: false,
          message: `Payment amount mismatch. Expected $${expectedAmount}, received $${actualAmount}`
        });
      }
      
      // Update member payment status
      await db.update(poolMembers)
        .set({
          paymentStatus: 'paid',
          paymentMethod: 'paypal',
          paypalTransactionId: captureId,
          status: 'active'
        })
        .where(eq(poolMembers.id, memberId));
      
      // Record transaction
      await db.insert(poolTransactions).values({
        poolId,
        memberId,
        type: 'contribution',
        amount: amount.toString(),
        currency: 'USD',
        paymentProvider: 'paypal',
        providerTransactionId: captureId,
        status: 'completed',
        notes: `PayPal order ${orderId} captured`,
        processedAt: new Date()
      });
      
      // Update pool financial totals
      const [pool] = await db.select()
        .from(lotteryPools)
        .where(eq(lotteryPools.id, poolId))
        .limit(1);
      
      const newTotalContributions = parseFloat(pool.totalContributions || '0') + parseFloat(amount);
      const adminFee = newTotalContributions * (parseFloat(pool.adminFeePercent || '0') / 100);
      const netAmount = newTotalContributions - adminFee;
      
      // Count paid members only
      const paidMembers = await db.select()
        .from(poolMembers)
        .where(eq(poolMembers.poolId, poolId));
      
      const paidCount = paidMembers.filter(m => m.paymentStatus === 'paid').length;
      
      await db.update(lotteryPools)
        .set({
          currentMembers: paidCount,
          totalContributions: newTotalContributions.toString(),
          adminFeeCollected: adminFee.toString(),
          netPoolAmount: netAmount.toString(),
          status: paidCount >= pool.maxMembers ? 'full' : 'open'
        })
        .where(eq(lotteryPools.id, poolId));
      
      res.json({ 
        success: true, 
        message: 'Payment captured successfully',
        adminFeeCollected: adminFee.toFixed(2),
        netPoolAmount: netAmount.toFixed(2)
      });
    } catch (error: any) {
      console.error('Capture payment error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Generate tickets for pool
  app.post("/api/pools/:poolId/generate-tickets", requireAuth, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { lotteryPools, poolTickets, generatedTickets } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const poolId = req.params.poolId;
      const { method = 'balanced', count = 10 } = req.body;
      
      // Get pool details
      const [pool] = await db.select()
        .from(lotteryPools)
        .where(eq(lotteryPools.id, poolId))
        .limit(1);
      
      if (!pool) {
        return res.status(404).json({ success: false, message: 'Pool not found' });
      }
      
      // Calculate how many tickets we can buy with net pool amount
      const ticketPrice = 2; // $2 per ticket
      const maxTickets = Math.floor(parseFloat(pool.netPoolAmount || '0') / ticketPrice);
      const ticketsToGenerate = Math.min(count, maxTickets);
      
      if (ticketsToGenerate <= 0) {
        return res.status(400).json({ success: false, message: 'Insufficient funds for tickets' });
      }
      
      const gameType = (pool.game || 'powerball') as 'powerball' | 'megamillions';
      
      // Generate tickets using the analysis engine
      const { AdvancedLotteryStrategies } = await import('./advancedLotteryStrategies');
      const strategies = new AdvancedLotteryStrategies();
      
      const tickets = [];
      const analysisResults = await strategies.generateEducationalAnalysis(gameType, ticketsToGenerate);
      for (let i = 0; i < ticketsToGenerate; i++) {
        const prediction = analysisResults[i % analysisResults.length];
        
        // Save to generated_tickets
        const [ticket] = await db.insert(generatedTickets).values({
          game: pool.game,
          method,
          mainNumbers: prediction.mainNumbers,
          bonusNumber: prediction.bonusNumber
        }).returning();
        
        // Link to pool
        await db.insert(poolTickets).values({
          poolId,
          ticketId: ticket.id,
          game: pool.game,
          mainNumbers: prediction.mainNumbers,
          bonusNumber: prediction.bonusNumber,
          generationMethod: method
        });
        
        tickets.push(prediction);
      }
      
      // Update pool
      await db.update(lotteryPools)
        .set({
          totalTicketsPurchased: (pool.totalTicketsPurchased || 0) + ticketsToGenerate,
          status: 'active'
        })
        .where(eq(lotteryPools.id, poolId));
      
      res.json({ success: true, ticketsGenerated: ticketsToGenerate, tickets });
    } catch (error: any) {
      console.error('Generate pool tickets error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // ==================== REFERRAL PROGRAM ====================
  
  // Generate or get user's referral code
  app.get("/api/referral/my-code", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { referralCodes } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      // Check if user already has a referral code
      let [code] = await db.select()
        .from(referralCodes)
        .where(eq(referralCodes.referrerId, userId))
        .limit(1);
      
      // Generate new code if doesn't exist
      if (!code) {
        const newCode = `RUSSELL${Date.now().toString(36).toUpperCase()}`;
        [code] = await db.insert(referralCodes).values({
          referrerId: userId,
          referralCode: newCode,
          rewardType: 'free_generation',
          rewardValue: 3,
          status: 'pending'
        }).returning();
      }
      
      res.json({ success: true, code });
    } catch (error: any) {
      console.error('Get referral code error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Track referral usage
  app.post("/api/referral/track", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { referralCodes } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const { referralCode } = req.body;
      
      if (!referralCode) {
        return res.status(400).json({ success: false, message: 'Referral code required' });
      }
      
      // Find the referral code
      const [code] = await db.select()
        .from(referralCodes)
        .where(eq(referralCodes.referralCode, referralCode))
        .limit(1);
      
      if (!code) {
        return res.status(404).json({ success: false, message: 'Invalid referral code' });
      }
      
      // Store in session for later conversion tracking
      if (req.session) {
        req.session.referralCode = referralCode;
        req.session.referralCodeId = code.id;
      }
      
      res.json({ success: true, reward: { type: code.rewardType, value: code.rewardValue } });
    } catch (error: any) {
      console.error('Track referral error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get referral stats for user
  app.get("/api/referral/stats", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { referralCodes } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      
      // Get all referrals by this user
      const referrals = await db.select()
        .from(referralCodes)
        .where(eq(referralCodes.referrerId, userId));
      
      const stats = {
        totalReferrals: referrals.length,
        pendingReferrals: referrals.filter(r => r.status === 'pending').length,
        completedReferrals: referrals.filter(r => r.status === 'completed').length,
        totalRewards: referrals.filter(r => r.status === 'completed')
          .reduce((sum, r) => sum + r.rewardValue, 0)
      };
      
      res.json({ success: true, stats, referrals });
    } catch (error: any) {
      console.error('Get referral stats error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Email Subscription: Subscribe to draw day reminders
  app.post("/api/email/subscribe", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { emailPreferences } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const { email, powerballReminders, megamillionsReminders, weeklyDigest, promotionalEmails } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      // Check if email already exists
      const existing = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.email, email))
        .limit(1);
      
      if (existing.length > 0) {
        // Update existing preferences
        await db.update(emailPreferences)
          .set({
            powerballReminders: powerballReminders ?? 1,
            megamillionsReminders: megamillionsReminders ?? 1,
            weeklyDigest: weeklyDigest ?? 1,
            promotionalEmails: promotionalEmails ?? 1,
            updatedAt: new Date()
          })
          .where(eq(emailPreferences.email, email));
          
        return res.json({ success: true, message: 'Email preferences updated' });
      }
      
      // Create new subscription
      await db.insert(emailPreferences).values({
        userId,
        sessionId,
        email,
        powerballReminders: powerballReminders ?? 1,
        megamillionsReminders: megamillionsReminders ?? 1,
        weeklyDigest: weeklyDigest ?? 1,
        promotionalEmails: promotionalEmails ?? 1
      });
      
      res.json({ success: true, message: 'Successfully subscribed to email notifications' });
      
    } catch (error: any) {
      console.error('Email subscription error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Email Subscription: Get preferences
  app.get("/api/email/preferences/:email", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { emailPreferences } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const email = decodeURIComponent(req.params.email);
      
      const prefs = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.email, email))
        .limit(1);
      
      if (prefs.length === 0) {
        return res.status(404).json({ success: false, message: 'Email not found' });
      }
      
      res.json({ success: true, preferences: prefs[0] });
      
    } catch (error: any) {
      console.error('Get preferences error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Email Subscription: Unsubscribe
  app.post("/api/email/unsubscribe", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { emailPreferences } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }
      
      await db.update(emailPreferences)
        .set({
          powerballReminders: 0,
          megamillionsReminders: 0,
          weeklyDigest: 0,
          promotionalEmails: 0,
          updatedAt: new Date()
        })
        .where(eq(emailPreferences.email, email));
      
      res.json({ success: true, message: 'Successfully unsubscribed from all emails' });
      
    } catch (error: any) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Spin Registration: Register email to unlock spin wheel
  app.post("/api/spin/register", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { emailPreferences } = await import('@shared/schema');
      const { eq } = await import('drizzle-orm');
      
      const { name, email, marketingConsent } = req.body;
      
      if (!name || !email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Name and email are required' 
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Please enter a valid email address' 
        });
      }
      
      const sessionId = req.sessionID || `guest_${req.ip}`;
      const userId = req.user?.id || null;
      
      const existing = await db.select()
        .from(emailPreferences)
        .where(eq(emailPreferences.email, email.toLowerCase()))
        .limit(1);
      
      if (existing.length > 0) {
        req.session.spinRegisteredEmail = email.toLowerCase();
        req.session.spinRegisteredName = name;
        
        return res.json({ 
          success: true, 
          message: 'Welcome back! You can now spin the wheel.',
          email: email.toLowerCase(),
          name,
          alreadyRegistered: true
        });
      }
      
      await db.insert(emailPreferences).values({
        userId,
        sessionId,
        email: email.toLowerCase(),
        powerballReminders: marketingConsent ? 1 : 0,
        megamillionsReminders: marketingConsent ? 1 : 0,
        weeklyDigest: marketingConsent ? 1 : 0,
        promotionalEmails: marketingConsent ? 1 : 0,
      });
      
      req.session.spinRegisteredEmail = email.toLowerCase();
      req.session.spinRegisteredName = name;
      
      console.log(`📧 New spin registration: ${email} (marketing: ${marketingConsent})`);
      
      res.json({ 
        success: true, 
        message: 'Registration complete! You can now spin the wheel.',
        email: email.toLowerCase(),
        name
      });
      
    } catch (error: any) {
      console.error('Spin registration error:', error);
      if (error.code === '23505') {
        req.session.spinRegisteredEmail = req.body.email?.toLowerCase();
        req.session.spinRegisteredName = req.body.name;
        return res.json({ 
          success: true, 
          message: 'Welcome back! You can now spin the wheel.',
          email: req.body.email?.toLowerCase(),
          alreadyRegistered: true
        });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Daily Spin-to-Win: Execute spin
  app.post("/api/spin/daily", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { dailySpins } = await import('@shared/schema');
      const { eq, and } = await import('drizzle-orm');
      
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      // Get today's date in YYYY-MM-DD format
      const todayDate = new Date().toISOString().split('T')[0];
      
      // Weighted prize distribution
      const prizePool = [
        { type: 'free_generation', value: '3', weight: 5 },      // 5% - 3 free picks
        { type: 'no_prize', value: 'better_luck', weight: 30 },  // 30% - no prize
        { type: 'free_generation', value: '1', weight: 25 },     // 25% - 1 free pick
        { type: 'discount_code', value: 'LUCKY10', weight: 15 }, // 15% - 10% discount
        { type: 'free_generation', value: '2', weight: 15 },     // 15% - 2 free picks
        { type: 'premium_trial', value: '7', weight: 8 },        // 8% - 7-day trial
        { type: 'free_generation', value: '1', weight: 2 },      // 2% - 1 free pick (duplicate position)
      ];
      
      const totalWeight = prizePool.reduce((sum, p) => sum + p.weight, 0);
      const random = Math.random() * totalWeight;
      
      let cumulativeWeight = 0;
      let wonPrize = prizePool[0];
      
      for (const prize of prizePool) {
        cumulativeWeight += prize.weight;
        if (random <= cumulativeWeight) {
          wonPrize = prize;
          break;
        }
      }
      
      // Record the spin - DB will enforce uniqueness via constraint
      // This prevents race conditions from multiple parallel requests
      let spin;
      try {
        [spin] = await db.insert(dailySpins).values({
          userId,
          sessionId,
          spinDate: todayDate,
          prizeType: wonPrize.type,
          prizeValue: wonPrize.value,
          claimed: 0
        }).returning();
      } catch (error: any) {
        // Unique constraint violation means already spun today
        if (error.code === '23505') { // PostgreSQL unique violation code
          return res.status(429).json({ 
            success: false, 
            message: 'You have already spun today. Come back tomorrow!' 
          });
        }
        throw error; // Re-throw other errors
      }
      
      res.json({
        success: true,
        spinId: spin.id,
        prizeType: wonPrize.type,
        prizeValue: wonPrize.value
      });
    } catch (error: any) {
      console.error('Daily spin error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Claim a spin prize - apply prize to user account
  app.post("/api/spin/claim/:spinId", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { dailySpins, userAccounts } = await import('@shared/schema');
      const { eq, and, sql } = await import('drizzle-orm');
      
      const spinId = req.params.spinId;
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      // Find the spin
      const [spin] = await db.select()
        .from(dailySpins)
        .where(eq(dailySpins.id, spinId))
        .limit(1);
      
      if (!spin) {
        return res.status(404).json({ success: false, message: 'Spin not found' });
      }
      
      // Verify ownership
      // For authenticated users: must match userId
      // For guests: session IDs can change due to express-session regeneration, so we allow 
      // claiming unclaimed guest spins from the same day (spins are daily-limited anyway)
      const isAuthenticatedOwner = userId && spin.userId === userId;
      
      // For guest spins (no userId), allow claim if:
      // 1. Session matches exactly, OR
      // 2. Spin is from today and unclaimed (prevents replay attacks while allowing session changes)
      const todayDate = new Date().toISOString().split('T')[0];
      const isGuestOwner = !spin.userId && !userId && (
        spin.sessionId === sessionId ||
        (spin.spinDate === todayDate && spin.claimed === 0)
      );
      const isOwner = isAuthenticatedOwner || isGuestOwner;
      
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'Not your prize to claim' });
      }
      
      // Check if already claimed
      if (spin.claimed === 1) {
        return res.status(400).json({ success: false, message: 'Prize already claimed' });
      }
      
      // Check if it's a no_prize
      if (spin.prizeType === 'no_prize') {
        return res.status(400).json({ success: false, message: 'No prize to claim' });
      }
      
      // Apply the prize based on type
      let prizeApplied = '';
      
      if (spin.prizeType === 'free_generation' && userId) {
        const bonusAmount = parseInt(spin.prizeValue || '1');
        await db.update(userAccounts)
          .set({
            bonusGenerations: sql`COALESCE(${userAccounts.bonusGenerations}, 0) + ${bonusAmount}`,
            updatedAt: new Date()
          })
          .where(eq(userAccounts.id, userId));
        prizeApplied = `${bonusAmount} free pick(s) added to your account!`;
      } else if (spin.prizeType === 'premium_trial' && userId) {
        const trialDays = parseInt(spin.prizeValue || '7');
        const trialExpires = new Date();
        trialExpires.setDate(trialExpires.getDate() + trialDays);
        await db.update(userAccounts)
          .set({
            premiumTrialExpires: trialExpires,
            updatedAt: new Date()
          })
          .where(eq(userAccounts.id, userId));
        prizeApplied = `${trialDays}-day premium trial activated!`;
      } else if (spin.prizeType === 'discount_code' && userId) {
        await db.update(userAccounts)
          .set({
            discountCode: spin.prizeValue,
            updatedAt: new Date()
          })
          .where(eq(userAccounts.id, userId));
        prizeApplied = `Discount code ${spin.prizeValue} saved to your account!`;
      } else if (!userId) {
        // Guest users - just mark as claimed but note they need an account
        prizeApplied = 'Prize claimed! Create an account to use your rewards.';
      }
      
      // Mark as claimed
      await db.update(dailySpins)
        .set({
          claimed: 1,
          claimedAt: new Date()
        })
        .where(eq(dailySpins.id, spinId));
      
      res.json({
        success: true,
        message: prizeApplied,
        prizeType: spin.prizeType,
        prizeValue: spin.prizeValue
      });
    } catch (error: any) {
      console.error('Claim prize error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // Get user's prizes (both claimed and unclaimed)
  app.get("/api/spin/prizes", async (req, res) => {
    try {
      const { db } = await import('./db');
      const { dailySpins, userAccounts } = await import('@shared/schema');
      const { eq, desc, and, ne } = await import('drizzle-orm');
      
      const userId = req.user?.id || null;
      const sessionId = req.sessionID || `guest_${req.ip}`;
      
      // Get all user's spins (non-no_prize)
      const prizes = await db.select()
        .from(dailySpins)
        .where(
          and(
            userId ? eq(dailySpins.userId, userId) : eq(dailySpins.sessionId, sessionId),
            ne(dailySpins.prizeType, 'no_prize')
          )
        )
        .orderBy(desc(dailySpins.spunAt))
        .limit(50);
      
      // Get user's current bonus generations and premium trial status
      let userBonuses = { bonusGenerations: 0, premiumTrialExpires: null, discountCode: null };
      if (userId) {
        const [user] = await db.select({
          bonusGenerations: userAccounts.bonusGenerations,
          premiumTrialExpires: userAccounts.premiumTrialExpires,
          discountCode: userAccounts.discountCode
        })
        .from(userAccounts)
        .where(eq(userAccounts.id, userId))
        .limit(1);
        if (user) {
          userBonuses = user as any;
        }
      }
      
      res.json({
        success: true,
        prizes,
        userBonuses: {
          bonusGenerations: userBonuses.bonusGenerations || 0,
          premiumTrialActive: userBonuses.premiumTrialExpires && new Date(userBonuses.premiumTrialExpires) > new Date(),
          premiumTrialExpires: userBonuses.premiumTrialExpires,
          discountCode: userBonuses.discountCode
        }
      });
    } catch (error: any) {
      console.error('Get prizes error:', error);
      res.status(500).json({ success: false, message: error.message });
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
      const isStatisticallySignificant = draws.length >= 100;
      
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

  // Advertisement Management Routes (Admin only)
  app.get('/api/admin/campaigns', requireAdmin, async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const campaigns = await adManager.getAllCampaigns();
      res.json(campaigns);
    } catch (error: any) {
      console.error('Error fetching campaigns:', error);
      res.status(500).json({ message: 'Failed to fetch campaigns' });
    }
  });

  app.post('/api/admin/campaigns', requireAdmin, async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const campaign = await adManager.createCampaign(req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error('Error creating campaign:', error);
      res.status(500).json({ message: 'Failed to create campaign' });
    }
  });

  app.patch('/api/admin/campaigns/:id', requireAdmin, async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      const campaign = await adManager.updateCampaign(req.params.id, req.body);
      res.json(campaign);
    } catch (error: any) {
      console.error('Error updating campaign:', error);
      res.status(500).json({ message: 'Failed to update campaign' });
    }
  });

  app.delete('/api/admin/campaigns/:id', requireAdmin, async (req, res) => {
    try {
      const { adManager } = await import('./adManagement');
      await adManager.deleteCampaign(req.params.id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting campaign:', error);
      res.status(500).json({ message: 'Failed to delete campaign' });
    }
  });

  app.get('/api/admin/ad-revenue', requireAdmin, async (req, res) => {
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
  app.post('/api/admin/create-user', requireAdmin, async (req, res) => {
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
  // Admin routes for VIP code management (Admin only)
  app.get('/api/admin/totp-info', requireAdmin, async (req, res) => {
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

  app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/vip-codes', requireAdmin, async (req, res) => {
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

  app.get('/api/admin/logs', requireAdmin, async (req, res) => {
    try {
      const { getAdminLogs } = await import('./vipManagement');
      const logs = await getAdminLogs(50);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ message: 'Failed to fetch admin logs' });
    }
  });

  // Comprehensive Audit Logs endpoint
  app.get('/api/admin/audit-logs', requireAdmin, async (req, res) => {
    try {
      const { eventType, eventCategory, userId, severity, startDate, endDate, limit, offset } = req.query;
      
      const filters: any = {};
      if (eventType) filters.eventType = eventType as string;
      if (eventCategory) filters.eventCategory = eventCategory as string;
      if (userId) filters.userId = userId as string;
      if (severity) filters.severity = severity as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);
      
      const logs = await getAuditLogs(filters);
      
      logAudit('admin_access', 'admin', req, { action: 'view_audit_logs', filters });
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Error Logs endpoint
  app.get('/api/admin/error-logs', requireAdmin, async (req, res) => {
    try {
      const { errorType, resolved, userId, startDate, endDate, limit, offset } = req.query;
      
      const filters: any = {};
      if (errorType) filters.errorType = errorType as string;
      if (resolved !== undefined) filters.resolved = resolved === 'true';
      if (userId) filters.userId = userId as string;
      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (limit) filters.limit = parseInt(limit as string, 10);
      if (offset) filters.offset = parseInt(offset as string, 10);
      
      const logs = await getErrorLogs(filters);
      
      logAudit('admin_access', 'admin', req, { action: 'view_error_logs', filters });
      
      res.json(logs);
    } catch (error) {
      console.error('Error fetching error logs:', error);
      res.status(500).json({ message: 'Failed to fetch error logs' });
    }
  });

  // Mark error as resolved endpoint
  app.patch('/api/admin/error-logs/:id/resolve', requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const resolvedBy = req.body.resolvedBy || 'admin';
      
      const success = await markErrorResolved(id, resolvedBy);
      
      if (success) {
        logAudit('admin_access', 'admin', req, { action: 'resolve_error', errorId: id, resolvedBy });
        res.json({ success: true, message: 'Error marked as resolved' });
      } else {
        res.status(500).json({ success: false, message: 'Failed to mark error as resolved' });
      }
    } catch (error) {
      console.error('Error resolving error log:', error);
      res.status(500).json({ message: 'Failed to resolve error' });
    }
  });

  // Export logs endpoint for production debugging (combined audit + error logs)
  app.get('/api/admin/export-logs', requireAdmin, async (req, res) => {
    try {
      const { db } = await import('./db');
      const { auditLogs, errorLogs } = await import('@shared/schema');
      const { desc } = await import('drizzle-orm');
      
      const limit = parseInt(req.query.limit as string) || 100;
      
      const recentAudit = await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
      const recentErrors = await db.select().from(errorLogs).orderBy(desc(errorLogs.createdAt)).limit(limit);
      
      logAudit('admin_access', 'admin', req, { action: 'export_logs', auditCount: recentAudit.length, errorCount: recentErrors.length });
      
      res.json({ 
        auditLogs: recentAudit, 
        errorLogs: recentErrors, 
        exportedAt: new Date().toISOString(),
        totalAudit: recentAudit.length,
        totalErrors: recentErrors.length
      });
    } catch (error) {
      console.error('Error exporting logs:', error);
      res.status(500).json({ message: 'Failed to export logs' });
    }
  });

  // Frontend error reporting endpoint (public - no auth required)
  app.post('/api/errors/frontend', async (req, res) => {
    try {
      const { errorMessage, stackTrace, componentStack, url, userAgent, timestamp } = req.body;
      
      if (!errorMessage) {
        return res.status(400).json({ success: false, message: 'Error message is required' });
      }
      
      const errorId = await logError(
        'frontend_error',
        new Error(errorMessage),
        req,
        {
          stackTrace,
          componentStack,
          url,
          frontendUserAgent: userAgent,
          frontendTimestamp: timestamp,
        }
      );
      
      res.json({ 
        success: true, 
        message: 'Error reported successfully',
        errorId 
      });
    } catch (error) {
      console.error('Error logging frontend error:', error);
      res.status(500).json({ success: false, message: 'Failed to report error' });
    }
  });

  app.post('/api/admin/generate-vip', requireAdmin, async (req, res) => {
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

  app.post('/api/admin/update-user-tier', requireAdmin, async (req, res) => {
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

  app.post("/api/subscriptions/activate", async (req, res) => {
    try {
      const { subscriptionId, planId, tier } = req.body;
      const userId = req.user?.id;

      console.log(`📦 PayPal subscription activated: ${subscriptionId}, plan: ${planId}, tier: ${tier}`);

      // If user is authenticated, update their tier
      if (userId) {
        const result = await activatePayPalSubscription(subscriptionId, userId, planId);
        
        if (result.success) {
          return res.json({ success: true, tier: result.tier });
        } else {
          return res.status(400).json({ success: false, message: result.error });
        }
      }

      // For unauthenticated users, log the subscription for later association
      // The PayPal webhook will handle tier activation when user registers/logs in
      console.log(`⏳ Subscription ${subscriptionId} pending user association`);
      
      res.json({ 
        success: true, 
        message: 'Subscription recorded. Please log in or register to activate your tier.',
        subscriptionId,
        tier
      });
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

  // Stripe webhook for payment verification
  app.post("/webhooks/stripe", async (req, res) => {
    try {
      const { handleStripeWebhook } = await import('./stripe');
      await handleStripeWebhook(req, res);
    } catch (error) {
      console.error('Stripe webhook error:', error);
      res.status(500).json({ success: false, message: 'Stripe webhook processing failed' });
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
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/mfa/setup", authRateLimit, setupMFA);
  app.post("/api/auth/mfa/verify", authRateLimit, verifyMFASetup);
  app.post("/api/auth/forgot-password", authRateLimit, forgotPassword);
  app.post("/api/auth/reset-password", authRateLimit, resetPassword);
  
  // Get current user endpoint
  app.get("/api/auth/user", async (req, res) => {
    try {
      // Check session token from Authorization header
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      
      // Also check localStorage token from body or stored session
      const storedToken = sessionToken || req.session?.sessionToken;
      
      if (!storedToken) {
        return res.json(null);
      }
      
      const session = await storage.getUserSession(storedToken);
      if (!session || session.expiresAt < new Date()) {
        return res.json(null);
      }
      
      const user = await storage.getUserById(session.userId);
      if (!user) {
        return res.json(null);
      }
      
      // Return user info (without sensitive data)
      res.json({
        id: user.id,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        mfaEnabled: user.mfaEnabled
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.json(null);
    }
  });

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
  app.get('/api/advanced-strategies/:game', requirePro, async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      const { AdvancedLotteryStrategies } = await import('./advancedLotteryStrategies');
      const advancedStrategies = new AdvancedLotteryStrategies();
      const predictions = await advancedStrategies.generateEducationalAnalysis(game as 'powerball' | 'megamillions', 10);
      
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
  app.get('/api/wheeling-systems/:game', requirePro, async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      const { AdvancedLotteryStrategies } = await import('./advancedLotteryStrategies');
      const advancedStrategies = new AdvancedLotteryStrategies();
      const wheelSystems = await advancedStrategies.generateWheelingSystems(game as 'powerball' | 'megamillions');
      
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
  app.get('/api/enhanced-analysis/:game', requirePro, async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      // Update lottery data with latest results first
      const { lotteryDataService } = await import('./lotteryDataService');
      await lotteryDataService.updateAllGames();

      const { EnhancedLotteryAnalysis } = await import('./enhancedLotteryAnalysis');
      const enhancedAnalysis = new EnhancedLotteryAnalysis();
      const predictions = await enhancedAnalysis.generateEducationalAnalyses(game as 'powerball' | 'megamillions');
      
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
  app.get('/api/combined-analysis/:game', requirePro, async (req, res) => {
    try {
      const { game } = req.params;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ error: 'Invalid game type' });
      }

      // Update lottery data first
      const { lotteryDataService } = await import('./lotteryDataService');
      await lotteryDataService.updateAllGames();

      // Get all strategies
      const { AdvancedLotteryStrategies } = await import('./advancedLotteryStrategies');
      const { EnhancedLotteryAnalysis } = await import('./enhancedLotteryAnalysis');
      const advancedStrategies = new AdvancedLotteryStrategies();
      const enhancedAnalysis = new EnhancedLotteryAnalysis();
      
      const [basicStrategies, enhancedPredictions] = await Promise.all([
        advancedStrategies.generateEducationalAnalysis(game as 'powerball' | 'megamillions', 5),
        enhancedAnalysis.generateEducationalAnalyses(game as 'powerball' | 'megamillions')
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
      const { NumerologyAnalysis } = await import('./numerologyAnalysis');
      const numerologyAnalysis = new NumerologyAnalysis();
      const { fullName, birthDate } = req.query;
      
      const predictions = await numerologyAnalysis.generateNumerologyStudies(
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
      const { NumerologyAnalysis } = await import('./numerologyAnalysis');
      const numerologyAnalysis = new NumerologyAnalysis();
      const { fullName, birthDate } = req.body;
      
      if (!fullName || !birthDate) {
        return res.status(400).json({ 
          error: 'Full name and birth date are required for personalized numerology analysis' 
        });
      }

      const [predictions, report] = await Promise.all([
        numerologyAnalysis.generateNumerologyStudies(fullName, birthDate),
        numerologyAnalysis.generatePersonalizedReport(fullName, birthDate)
      ]);

      // Find the best prediction
      const mostPowerfulPrediction = predictions[0] || null;

      res.json({
        success: true,
        personalizedReport: report,
        numerologyPredictions: predictions,
        mostPowerfulPrediction,
        educationalGuidance: mostPowerfulPrediction?.educationalGuidance || [],
        culturalContext: mostPowerfulPrediction?.culturalContext || '',
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

  // ==================== LOTTERY DATA UPDATE ====================
  
  // Admin endpoint: Update lottery data with actual winning numbers
  app.post("/api/admin/update-lottery-data", requireAdmin, async (req, res) => {
    try {
      const { LotteryDataService } = await import('./lotteryDataService');
      const dataService = new LotteryDataService();
      
      // October 2025 Actual Winning Numbers
      const actualResults = [
        // Powerball October 2025
        { game: 'powerball', drawDate: '2025-10-25', mainNumbers: [2, 12, 22, 39, 67], bonusNumber: 15, jackpot: '$343.9 Million' },
        { game: 'powerball', drawDate: '2025-10-22', mainNumbers: [18, 37, 52, 54, 60], bonusNumber: 12, jackpot: '$320 Million' },
        { game: 'powerball', drawDate: '2025-10-20', mainNumbers: [32, 38, 66, 67, 69], bonusNumber: 19, jackpot: '$304 Million' },
        { game: 'powerball', drawDate: '2025-10-15', mainNumbers: [10, 13, 28, 34, 47], bonusNumber: 15, jackpot: '$273 Million' },
        { game: 'powerball', drawDate: '2025-10-08', mainNumbers: [8, 10, 44, 48, 54], bonusNumber: 14, jackpot: '$223 Million' },
        { game: 'powerball', drawDate: '2025-10-06', mainNumbers: [28, 29, 32, 66, 67], bonusNumber: 3, jackpot: '$207 Million' },
        { game: 'powerball', drawDate: '2025-10-01', mainNumbers: [8, 17, 22, 28, 55], bonusNumber: 14, jackpot: '$175 Million' },
        
        // Mega Millions October 2025
        { game: 'megamillions', drawDate: '2025-10-24', mainNumbers: [11, 18, 31, 51, 56], bonusNumber: 24, jackpot: '$680 Million' },
        { game: 'megamillions', drawDate: '2025-10-21', mainNumbers: [2, 18, 27, 34, 59], bonusNumber: 18, jackpot: '$650 Million' },
      ];
      
      const addedCount = await dataService.addActualWinningNumbers(actualResults);
      
      res.json({
        success: true,
        message: `Successfully updated lottery data with ${addedCount} new draws`,
        added: addedCount,
        total: actualResults.length
      });
    } catch (error: any) {
      console.error('Error updating lottery data:', error);
      res.status(500).json({ 
        success: false, 
        message: error.message || 'Failed to update lottery data' 
      });
    }
  });

  // ==================== SUPPORT TICKET SYSTEM ====================
  
  // Public endpoint: Submit a support ticket
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const { userEmail, userName, subject, category, description } = req.body;
      
      if (!userEmail || !subject || !description || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      // Get user ID if authenticated
      let userId: string | undefined;
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      if (sessionToken) {
        const session = await storage.getUserSession(sessionToken);
        if (session) {
          userId = session.userId;
        }
      }
      
      // Create the ticket
      const ticket = await storage.createSupportTicket({
        userId,
        userEmail,
        userName,
        subject,
        category,
        description,
        status: 'new',
        priority: 'normal',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      // Add initial message
      await storage.createSupportMessage({
        ticketId: ticket.id,
        message: description,
        isFromUser: true,
        senderEmail: userEmail,
        senderName: userName,
      });
      
      // TODO: AI triage and auto-response will be added here
      // For now, log the ticket for manual review
      console.log(`📩 New support ticket: ${ticket.id} - ${subject} (${category})`);
      
      res.json({ 
        success: true, 
        ticketId: ticket.id,
        message: 'Support ticket submitted successfully'
      });
    } catch (error: any) {
      console.error('Error creating support ticket:', error);
      res.status(500).json({ error: 'Failed to create support ticket' });
    }
  });
  
  // Get ticket by ID (for users to check their ticket status)
  app.get("/api/support/tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const ticket = await storage.getSupportTicket(id);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      const messages = await storage.getTicketMessages(id);
      
      res.json({ 
        success: true, 
        ticket,
        messages
      });
    } catch (error: any) {
      console.error('Error fetching support ticket:', error);
      res.status(500).json({ error: 'Failed to fetch support ticket' });
    }
  });
  
  // Admin: Get all support tickets
  app.get("/api/admin/support/tickets", requireAdmin, async (req, res) => {
    try {
      const { status, priority } = req.query;
      const tickets = await storage.getSupportTickets({
        status: status as string,
        priority: priority as string,
      });
      
      res.json({ 
        success: true, 
        tickets,
        total: tickets.length
      });
    } catch (error: any) {
      console.error('Error fetching support tickets:', error);
      res.status(500).json({ error: 'Failed to fetch support tickets' });
    }
  });
  
  // Admin: Update ticket status/priority
  app.patch("/api/admin/support/tickets/:id", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, priority, resolution, assignedTo, requiresHumanEscalation, escalationReason } = req.body;
      
      const updates: any = {};
      if (status) updates.status = status;
      if (priority) updates.priority = priority;
      if (resolution) {
        updates.resolution = resolution;
        updates.resolvedAt = new Date();
      }
      if (assignedTo) updates.assignedTo = assignedTo;
      if (requiresHumanEscalation !== undefined) updates.requiresHumanEscalation = requiresHumanEscalation;
      if (escalationReason) updates.escalationReason = escalationReason;
      
      const ticket = await storage.updateSupportTicket(id, updates);
      
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      res.json({ success: true, ticket });
    } catch (error: any) {
      console.error('Error updating support ticket:', error);
      res.status(500).json({ error: 'Failed to update support ticket' });
    }
  });
  
  // Admin: Add response to ticket
  app.post("/api/admin/support/tickets/:id/reply", requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const adminEmail = req.user?.email || 'admin@lotterypro.com';
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const ticket = await storage.getSupportTicket(id);
      if (!ticket) {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      
      const response = await storage.createSupportMessage({
        ticketId: id,
        message,
        isFromUser: false,
        senderEmail: adminEmail,
        senderName: 'LotteryPro Support',
      });
      
      // Update ticket status to in_progress if it was new
      if (ticket.status === 'new') {
        await storage.updateSupportTicket(id, { status: 'in_progress' });
      }
      
      res.json({ success: true, message: response });
    } catch (error: any) {
      console.error('Error adding reply to support ticket:', error);
      res.status(500).json({ error: 'Failed to add reply' });
    }
  });
  
  // Record user consent
  app.post("/api/consent", async (req, res) => {
    try {
      const { termsAccepted, privacyAccepted, marketingOptIn, dataProcessingConsent, sessionId } = req.body;
      
      // Get user ID if authenticated
      let userId: string | undefined;
      const sessionToken = req.headers.authorization?.replace('Bearer ', '');
      if (sessionToken) {
        const session = await storage.getUserSession(sessionToken);
        if (session) {
          userId = session.userId;
        }
      }
      
      const consent = await storage.recordUserConsent({
        userId,
        sessionId,
        termsAccepted: termsAccepted || false,
        privacyAccepted: privacyAccepted || false,
        marketingOptIn: marketingOptIn || false,
        dataProcessingConsent: dataProcessingConsent || false,
        termsVersion: '1.0',
        privacyVersion: '1.0',
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      });
      
      res.json({ success: true, consentId: consent.id });
    } catch (error: any) {
      console.error('Error recording consent:', error);
      res.status(500).json({ error: 'Failed to record consent' });
    }
  });
  
  // DSAR (Data Subject Access Request) endpoint - GDPR/CCPA compliance
  app.post("/api/dsar/submit", async (req, res) => {
    try {
      const { email, name, requestType, details } = req.body;
      
      if (!email || !name || !requestType) {
        return res.status(400).json({ error: 'Email, name, and request type are required' });
      }
      
      const validTypes = ['access', 'delete', 'portability', 'opt-out', 'correction'];
      if (!validTypes.includes(requestType)) {
        return res.status(400).json({ error: 'Invalid request type' });
      }
      
      const dsarRequest = {
        id: crypto.randomUUID(),
        email: email.trim().toLowerCase(),
        name: name.trim(),
        requestType,
        details: details?.trim() || '',
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
      };
      
      console.log(`[DSAR] New ${requestType} request from ${email}:`, dsarRequest);
      
      res.json({ 
        success: true, 
        message: 'Your request has been submitted. We will respond within 30 days.',
        requestId: dsarRequest.id
      });
    } catch (error: any) {
      console.error('Error processing DSAR request:', error);
      res.status(500).json({ error: 'Failed to submit request' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
