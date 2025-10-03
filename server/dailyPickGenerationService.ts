/**
 * Daily Pick Generation Service
 * Automatically generates lottery picks using all available methods
 * for educational tracking and performance analysis
 */

import { storage } from "./storage";
import { advancedStrategies } from "./advancedLotteryStrategies";
import { enhancedAnalysis } from "./enhancedLotteryAnalysis";
import { numerologyAnalysis } from "./numerologyAnalysis";
import { realTimeAnalysis } from "./realTimeAnalysis";

export type PickMethod = 
  | 'hot' 
  | 'balanced' 
  | 'wheel'
  | 'random'
  | 'frequency'
  | 'distribution'
  | 'gap_pattern'
  | 'delta_system'
  | 'sum_range'
  | 'sequence'
  | 'positional'
  | 'combined'
  | 'pattern_observation'
  | 'dynamic_distribution'
  | 'mathematical_probability'
  | 'contrarian'
  | 'historical_comparison'
  | 'numerology_life_path'
  | 'numerology_master'
  | 'numerology_kabbalah'
  | 'avoidance'
  | 'overdue';

interface DailyPick {
  game: 'powerball' | 'megamillions';
  method: PickMethod;
  methodName: string;
  mainNumbers: number[];
  bonusNumber: number;
  date: Date;
}

class DailyPickGenerationService {
  /**
   * Generate daily picks for all methods and both games
   */
  async generateDailyPicks(): Promise<void> {
    console.log('🎯 Generating daily educational picks for all methods...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    try {
      // Check if we already generated picks for today
      const existingPicks = await this.checkExistingPicksForDate(today);
      if (existingPicks > 0) {
        console.log(`✅ Daily picks already generated for ${today.toDateString()} (${existingPicks} picks found)`);
        return;
      }
      
      // Generate picks for both games
      await this.generatePicksForGame('powerball', today);
      await this.generatePicksForGame('megamillions', today);
      
      console.log('✅ Daily pick generation complete!');
    } catch (error) {
      console.error('❌ Error generating daily picks:', error);
      throw error;
    }
  }
  
  /**
   * Generate picks for a specific game
   */
  private async generatePicksForGame(game: 'powerball' | 'megamillions', date: Date): Promise<void> {
    console.log(`📊 Generating ${game} picks for ${date.toDateString()}...`);
    
    const picks: DailyPick[] = [];
    const gameConfig = game === 'powerball' ? {maxMain: 69, maxBonus: 26} : {maxMain: 70, maxBonus: 24};
    
    // Base methods - Hot, Balanced, Wheel, Random (REQUIRED)
    const advancedPredictions = await advancedStrategies.generateEducationalAnalysis(game, 10);
    // Get one of each core method
    const frequencyMethod = advancedPredictions.find((p: any) => p.methodology === 'Frequency-Based Analysis');
    const distributionMethod = advancedPredictions.find((p: any) => p.methodology === 'Mathematical Distribution Study');
    
    if (frequencyMethod) {
      picks.push({
        game,
        method: 'hot',
        methodName: 'Hot Numbers',
        mainNumbers: frequencyMethod.mainNumbers,
        bonusNumber: frequencyMethod.bonusNumber,
        date
      });
    }
    
    if (distributionMethod) {
      picks.push({
        game,
        method: 'balanced',
        methodName: 'Balanced Distribution',
        mainNumbers: distributionMethod.mainNumbers,
        bonusNumber: distributionMethod.bonusNumber,
        date
      });
    }
    
    // Get wheel system
    const wheelSystems = await advancedStrategies.generateWheelingSystems(game);
    if (wheelSystems && wheelSystems.length > 0) {
      const firstWheel = wheelSystems[0];
      if (firstWheel.combinations && firstWheel.combinations.length > 0) {
        const firstCombo = firstWheel.combinations[0];
        // Wheel combination is just an array of numbers, split into main and bonus
        const wheelMain = firstCombo.slice(0, 5);
        const wheelBonus = firstCombo[5] || Math.floor(Math.random() * gameConfig.maxBonus) + 1;
        picks.push({
          game,
          method: 'wheel',
          methodName: 'Wheeling System',
          mainNumbers: wheelMain,
          bonusNumber: wheelBonus,
          date
        });
      }
    }
    
    // Random method
    const randomMain: number[] = [];
    while (randomMain.length < 5) {
      const num = Math.floor(Math.random() * gameConfig.maxMain) + 1;
      if (!randomMain.includes(num)) randomMain.push(num);
    }
    const randomBonus = Math.floor(Math.random() * gameConfig.maxBonus) + 1;
    picks.push({
      game,
      method: 'random',
      methodName: 'Random Selection',
      mainNumbers: randomMain.sort((a, b) => a - b),
      bonusNumber: randomBonus,
      date
    });
    
    // Additional advanced strategy methods
    advancedPredictions.forEach((pred: any) => {
      const methodMap: Record<string, PickMethod> = {
        'Frequency-Based Analysis': 'frequency',
        'Mathematical Distribution Study': 'distribution',
        'Gap Pattern Examination': 'gap_pattern',
        'Delta System Analysis': 'delta_system',
        'Sum Range Study': 'sum_range',
        'Sequence Analysis': 'sequence',
        'Positional Study': 'positional',
        'Combined Analysis': 'combined'
      };
      
      const method = methodMap[pred.methodology] || 'frequency';
      
      picks.push({
        game,
        method,
        methodName: pred.methodology,
        mainNumbers: pred.mainNumbers,
        bonusNumber: pred.bonusNumber,
        date
      });
    });
    
    // Enhanced analysis methods
    const enhancedPredictions = await enhancedAnalysis.generateEducationalAnalyses(game);
    enhancedPredictions.forEach((pred: any) => {
      const methodMap: Record<string, PickMethod> = {
        'Pattern Observation Study': 'pattern_observation',
        'Dynamic Distribution Analysis': 'dynamic_distribution',
        'Mathematical Probability Study': 'mathematical_probability',
        'Contrarian Analysis': 'contrarian',
        'Historical Comparison Study': 'historical_comparison'
      };
      
      const method = methodMap[pred.studyMethod] || 'pattern_observation';
      
      picks.push({
        game,
        method,
        methodName: pred.studyMethod,
        mainNumbers: pred.mainNumbers,
        bonusNumber: pred.bonusNumber,
        date
      });
    });
    
    // Numerology methods
    const numerologyStudies = await numerologyAnalysis.generateNumerologyStudies(game);
    numerologyStudies.forEach((study: any) => {
      const methodMap: Record<string, PickMethod> = {
        'Life Path Educational Study': 'numerology_life_path',
        'Master Numbers Study': 'numerology_master',
        'Kabbalah Number Study': 'numerology_kabbalah'
      };
      
      const method = methodMap[study.numerologyMethod] || 'numerology_life_path';
      
      picks.push({
        game,
        method,
        methodName: study.numerologyMethod,
        mainNumbers: study.mainNumbers,
        bonusNumber: study.bonusNumber,
        date
      });
    });
    
    // Real-time analysis methods (only for Powerball for now)
    if (game === 'powerball') {
      const realTimeStudies = await realTimeAnalysis.generateRealTimeStudies();
      realTimeStudies.forEach((study: any) => {
        const methodMap: Record<string, PickMethod> = {
          'Recent Number Avoidance Study': 'avoidance',
          'Enhanced Overdue Analysis with Real Data': 'overdue'
        };
        
        const method = methodMap[study.method] || 'avoidance';
        
        picks.push({
          game,
          method,
          methodName: study.method,
          mainNumbers: study.mainNumbers,
          bonusNumber: study.bonusNumber,
          date
        });
      });
    }
    
    // Store all picks in database
    let savedCount = 0;
    for (const pick of picks) {
      try {
        await storage.createTicket({
          game: pick.game,
          method: pick.method,
          mainNumbers: pick.mainNumbers,
          bonusNumber: pick.bonusNumber
        });
        savedCount++;
      } catch (error) {
        console.error(`❌ Error saving pick for ${pick.methodName}:`, error);
      }
    }
    
    console.log(`✅ Saved ${savedCount}/${picks.length} ${game} picks for ${date.toDateString()}`);
  }
  
  /**
   * Check if picks already exist for a given date
   */
  private async checkExistingPicksForDate(date: Date): Promise<number> {
    try {
      // Get recent tickets (last 1000)
      const allTickets = await storage.getRecentTickets(1000);
      
      // Count tickets created on the target date
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      const count = allTickets.filter((ticket: any) => {
        if (!ticket.createdAt) return false;
        const ticketDate = new Date(ticket.createdAt);
        return ticketDate >= startOfDay && ticketDate <= endOfDay;
      }).length;
      
      return count;
    } catch (error) {
      console.error('Error checking existing picks:', error);
      return 0;
    }
  }
  
  /**
   * Generate historical picks retroactively for analysis
   * This helps build up a history for educational tracking
   */
  async generateHistoricalPicks(daysBack: number = 30): Promise<void> {
    console.log(`📚 Generating historical picks for the last ${daysBack} days...`);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < daysBack; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      try {
        await this.generatePicksForGame('powerball', date);
        await this.generatePicksForGame('megamillions', date);
      } catch (error) {
        console.error(`❌ Error generating picks for ${date.toDateString()}:`, error);
      }
    }
    
    console.log('✅ Historical pick generation complete!');
  }
}

export const dailyPickService = new DailyPickGenerationService();
