import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTicketSchema, insertDrawSchema, type GameType } from "@shared/schema";
import { seedHistoricalData } from "./seedData";
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
import { createAdSenseConfigEndpoint } from "./middleware/adsense";
import { register, login, setupMFA, verifyMFASetup, requireAuth } from "./auth";
import { createVipCode, getMyVipCodes, redeemVipCode, deactivateVipCode } from "./vipManagement";
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

  // Get analysis data for a game
  app.get("/api/analysis/:game", async (req, res) => {
    try {
      const game = req.params.game as GameType;
      if (!['powerball', 'megamillions'].includes(game)) {
        return res.status(400).json({ message: "Invalid game type" });
      }
      
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
      
      // Stats
      const dateRange = draws.length > 0 ? 
        `${draws[draws.length - 1].drawDate.toLocaleDateString()} - ${draws[0].drawDate.toLocaleDateString()}` :
        'No data';
      
      const analysis = {
        hotNumbers,
        coldNumbers,
        frequencyData,
        bonusFrequency: Array.from(bonusFreq.entries()).sort((a, b) => b[1] - a[1]),
        stats: {
          totalDraws: draws.length,
          dateRange,
          mostFrequent: hotNumbers.slice(0, 3),
          leastFrequent: coldNumbers.slice(0, 3)
        },
        recentDraws: draws.slice(0, 5)
      };
      
      res.json(analysis);
      
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Add new draw and evaluate predictions
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

  // VIP Code Management Routes (Russell's god-like powers)
  app.post("/api/vip/create", requireAuth, securityLogger, createVipCode);
  app.get("/api/vip/my-codes", requireAuth, securityLogger, getMyVipCodes);
  app.post("/api/vip/redeem", requireAuth, securityLogger, redeemVipCode);
  app.delete("/api/vip/codes/:codeId", requireAuth, securityLogger, deactivateVipCode);

  // Music Content Routes
  app.get("/api/music", async (req, res) => {
    try {
      const featured = req.query.featured === 'true';
      const music = await storage.getMusicContent(featured);
      res.json(music);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
