/**
 * Performance Tracking Service
 * Compares generated picks against actual lottery draws
 * Calculates prize tiers and win/loss statements at different spending levels
 */

import { storage } from "./storage";

// Prize amounts for Powerball (approximate values)
const POWERBALL_PRIZES = {
  '5+1': 1000000, // Jackpot (placeholder - actual varies)
  '5+0': 1000000, // Match 5
  '4+1': 50000,   // Match 4 + Powerball
  '4+0': 100,     // Match 4
  '3+1': 100,     // Match 3 + Powerball
  '3+0': 7,       // Match 3
  '2+1': 7,       // Match 2 + Powerball
  '1+1': 4,       // Match 1 + Powerball
  '0+1': 4        // Match Powerball only
};

// Prize amounts for MegaMillions (approximate values)
const MEGAMILLIONS_PRIZES = {
  '5+1': 1000000, // Jackpot (placeholder - actual varies)
  '5+0': 1000000, // Match 5
  '4+1': 10000,   // Match 4 + Mega Ball
  '4+0': 500,     // Match 4
  '3+1': 200,     // Match 3 + Mega Ball
  '3+0': 10,      // Match 3
  '2+1': 10,      // Match 2 + Mega Ball
  '1+1': 4,       // Match 1 + Mega Ball
  '0+1': 2        // Match Mega Ball only
};

export interface MatchResult {
  ticketId: string;
  drawId: string;
  game: string;
  method: string;
  numbersMatched: number;
  bonusMatched: boolean;
  prizeLevel: string;
  prizeAmount: number;
  ticketDate: Date;
  drawDate: Date;
}

export interface WinLossStatement {
  spendingLevel: number; // dollars per draw
  totalSpent: number;
  totalWon: number;
  netProfit: number;
  winningTickets: number;
  totalTickets: number;
  roi: number; // return on investment percentage
  biggestWin: number;
  byMethod: {
    [method: string]: {
      spent: number;
      won: number;
      net: number;
      tickets: number;
      wins: number;
    };
  };
}

class PerformanceTrackingService {
  /**
   * Compare all generated tickets against actual draws
   * Each ticket is matched with only ONE draw (the next scheduled draw after creation)
   */
  async evaluateAllTickets(): Promise<MatchResult[]> {
    console.log('🎯 Evaluating all generated tickets against actual draws...');
    
    const tickets = await storage.getRecentTickets(10000);
    const existingResults = await storage.getPredictionResults();
    const results: MatchResult[] = [];
    
    // Create a set of existing ticket-draw pairs for deduplication
    const existingPairs = new Set(
      existingResults.map(r => `${r.ticketId}:${r.actualDrawId}`)
    );
    
    for (const ticket of tickets) {
      try {
        // Get all draws for this game
        const draws = await storage.getDraws(ticket.game);
        
        // Find the NEXT scheduled draw after this ticket was created
        const ticketDate = new Date(ticket.createdAt || new Date());
        const futureDraws = draws
          .filter(draw => {
            const drawDate = new Date(draw.drawDate);
            return drawDate >= ticketDate;
          })
          .sort((a, b) => new Date(a.drawDate).getTime() - new Date(b.drawDate).getTime());
        
        // Get only the FIRST future draw (the next one)
        const nextDraw = futureDraws[0];
        
        if (!nextDraw) {
          continue; // No future draws for this ticket
        }
        
        // Check if we already evaluated this ticket-draw pair
        const pairKey = `${ticket.id}:${nextDraw.id}`;
        if (existingPairs.has(pairKey)) {
          continue; // Skip duplicate evaluation
        }
        
        // Evaluate against the next draw only
        const result = this.compareTicketToDraw(ticket, nextDraw);
        if (result) {
          results.push(result);
          
          // Store result in database
          await storage.createPredictionResult({
            ticketId: ticket.id,
            actualDrawId: nextDraw.id || '',
            numbersMatched: result.numbersMatched,
            bonusMatched: result.bonusMatched ? 1 : 0,
            prizeLevel: result.prizeLevel,
            estimatedPrize: result.prizeAmount.toString(),
            accuracy: this.calculateAccuracy(result.numbersMatched, result.bonusMatched)
          });
          
          // Add to existing pairs to prevent duplicates in this run
          existingPairs.add(pairKey);
        }
      } catch (error) {
        console.error(`Error evaluating ticket ${ticket.id}:`, error);
      }
    }
    
    console.log(`✅ Evaluated ${tickets.length} tickets, found ${results.length} new results`);
    return results;
  }
  
  /**
   * Compare a single ticket against a draw
   */
  private compareTicketToDraw(ticket: any, draw: any): MatchResult | null {
    const ticketMain = Array.isArray(ticket.mainNumbers) 
      ? ticket.mainNumbers 
      : JSON.parse(ticket.mainNumbers || '[]');
    const drawMain = Array.isArray(draw.mainNumbers)
      ? draw.mainNumbers
      : JSON.parse(draw.mainNumbers || '[]');
    
    // Count matching main numbers
    const matchCount = ticketMain.filter((num: number) => 
      drawMain.includes(num)
    ).length;
    
    // Check bonus number match
    const bonusMatch = ticket.bonusNumber === draw.bonusNumber;
    
    // Determine prize level and amount
    const prizeKey = `${matchCount}+${bonusMatch ? '1' : '0'}`;
    const prizes = ticket.game === 'powerball' ? POWERBALL_PRIZES : MEGAMILLIONS_PRIZES;
    const prizeAmount = prizes[prizeKey as keyof typeof prizes] || 0;
    
    // Only return results with prizes
    if (prizeAmount === 0) return null;
    
    return {
      ticketId: ticket.id,
      drawId: draw.id || '',
      game: ticket.game,
      method: ticket.method,
      numbersMatched: matchCount,
      bonusMatched: bonusMatch,
      prizeLevel: prizeKey,
      prizeAmount,
      ticketDate: new Date(ticket.createdAt || new Date()),
      drawDate: new Date(draw.drawDate)
    };
  }
  
  /**
   * Calculate accuracy percentage
   */
  private calculateAccuracy(numbersMatched: number, bonusMatched: boolean): number {
    const total = numbersMatched + (bonusMatched ? 1 : 0);
    return Math.round((total / 6) * 100);
  }
  
  /**
   * Generate win/loss statement for a specific spending level
   */
  async generateWinLossStatement(spendingLevel: number): Promise<WinLossStatement> {
    const results = await storage.getPredictionResults();
    const tickets = await storage.getRecentTickets(10000);
    
    const totalTickets = tickets.length;
    const totalSpent = totalTickets * spendingLevel;
    
    let totalWon = 0;
    let winningTickets = 0;
    let biggestWin = 0;
    const byMethod: WinLossStatement['byMethod'] = {};
    
    // Process each result
    for (const result of results) {
      const prizeAmount = parseInt(result.estimatedPrize || '0');
      totalWon += prizeAmount;
      
      if (prizeAmount > 0) {
        winningTickets++;
      }
      
      if (prizeAmount > biggestWin) {
        biggestWin = prizeAmount;
      }
      
      // Find the ticket to get the method
      const ticket = tickets.find(t => t.id === result.ticketId);
      if (ticket) {
        const method = ticket.method || 'unknown';
        
        if (!byMethod[method]) {
          byMethod[method] = {
            spent: 0,
            won: 0,
            net: 0,
            tickets: 0,
            wins: 0
          };
        }
        
        byMethod[method].spent += spendingLevel;
        byMethod[method].won += prizeAmount;
        byMethod[method].tickets += 1;
        if (prizeAmount > 0) {
          byMethod[method].wins += 1;
        }
      }
    }
    
    // Calculate method net profits
    Object.keys(byMethod).forEach(method => {
      byMethod[method].net = byMethod[method].won - byMethod[method].spent;
    });
    
    const netProfit = totalWon - totalSpent;
    const roi = totalSpent > 0 ? (netProfit / totalSpent) * 100 : 0;
    
    return {
      spendingLevel,
      totalSpent,
      totalWon,
      netProfit,
      winningTickets,
      totalTickets,
      roi,
      biggestWin,
      byMethod
    };
  }
  
  /**
   * Generate win/loss statements for multiple spending levels
   */
  async generateMultiLevelStatements(): Promise<WinLossStatement[]> {
    const levels = [2, 10, 20, 50];
    const statements: WinLossStatement[] = [];
    
    for (const level of levels) {
      const statement = await this.generateWinLossStatement(level);
      statements.push(statement);
    }
    
    return statements;
  }
  
  /**
   * Get performance summary for all methods
   */
  async getMethodPerformanceSummary(): Promise<any> {
    const results = await storage.getPredictionResults();
    const tickets = await storage.getRecentTickets(10000);
    
    const summary: any = {};
    
    for (const ticket of tickets) {
      const method = ticket.method || 'unknown';
      
      if (!summary[method]) {
        summary[method] = {
          method,
          totalTickets: 0,
          wins: 0,
          totalWon: 0,
          avgWin: 0,
          biggestWin: 0,
          matches: {
            '5': 0,
            '4': 0,
            '3': 0,
            '2': 0,
            '1': 0,
            '0': 0
          }
        };
      }
      
      summary[method].totalTickets++;
      
      // Find all results for this ticket
      const ticketResults = results.filter(r => r.ticketId === ticket.id);
      
      for (const result of ticketResults) {
        const prize = parseInt(result.estimatedPrize || '0');
        
        if (prize > 0) {
          summary[method].wins++;
          summary[method].totalWon += prize;
          
          if (prize > summary[method].biggestWin) {
            summary[method].biggestWin = prize;
          }
        }
        
        // Track match counts
        const matches = result.numbersMatched || 0;
        if (matches >= 0 && matches <= 5) {
          summary[method].matches[matches.toString()]++;
        }
      }
    }
    
    // Calculate averages
    Object.keys(summary).forEach(method => {
      if (summary[method].wins > 0) {
        summary[method].avgWin = summary[method].totalWon / summary[method].wins;
      }
    });
    
    return summary;
  }
}

export const performanceTracker = new PerformanceTrackingService();
