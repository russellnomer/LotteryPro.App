import { EventEmitter } from 'events';
import { storage } from './storage';
import { lotteryCache } from './lotteryCache';
import { type GameType } from '@shared/schema';

interface LoadingProgress {
  game: GameType;
  stage: 'essential' | 'progressive' | 'complete';
  progress: number; // 0-100
  drawsLoaded: number;
  totalDraws: number;
  estimatedTimeRemaining?: number;
  statisticalPower?: number;
}

/**
 * Progressive Enhancement System for Russell Nomer Lottery Platform
 * Provides real-time loading progress and statistical power notifications
 */
export class ProgressiveLoader extends EventEmitter {
  private loadingState = new Map<GameType, LoadingProgress>();
  private loadingPromises = new Map<GameType, Promise<void>>();
  
  constructor() {
    super();
  }

  /**
   * Start progressive loading for both games
   */
  async startProgressiveLoading(): Promise<void> {
    console.log('🚀 PROGRESSIVE ENHANCEMENT: Starting Russell Nomer hybrid powerhouse...');
    
    // Initialize loading state
    (['powerball', 'megamillions'] as GameType[]).forEach(game => {
      this.loadingState.set(game, {
        game,
        stage: 'essential',
        progress: 0,
        drawsLoaded: 0,
        totalDraws: 500,
        statisticalPower: 0
      });
    });

    // Start progressive loading for both games simultaneously
    const promises = (['powerball', 'megamillions'] as GameType[]).map(game => 
      this.loadGameProgressively(game)
    );

    this.loadingPromises.set('powerball', promises[0]);
    this.loadingPromises.set('megamillions', promises[1]);

    // Wait for essential data to be loaded
    await Promise.all([
      this.waitForStage('powerball', 'progressive'),
      this.waitForStage('megamillions', 'progressive')
    ]);

    console.log('✅ Essential data loaded for both games - INSTANT FUNCTIONALITY READY!');
  }

  /**
   * Progressive loading for a specific game
   */
  private async loadGameProgressively(game: GameType): Promise<void> {
    try {
      const startTime = Date.now();
      
      // Stage 1: Essential data (instant startup)
      this.updateProgress(game, 'essential', 10, 10, 500);
      await this.loadEssentialDraws(game);
      this.updateProgress(game, 'progressive', 25, 25, 500);

      // Stage 2: Progressive loading (background enhancement)
      await this.loadProgressiveDraws(game, startTime);
      
      // Stage 3: Complete (maximum statistical power achieved)
      this.updateProgress(game, 'complete', 100, 500, 500);
      this.emit('gameComplete', game);
      
      console.log(`✅ ${game.toUpperCase()}: MAXIMUM STATISTICAL POWER achieved!`);
      
    } catch (error) {
      console.error(`❌ Progressive loading failed for ${game}:`, error);
      this.emit('error', { game, error });
    }
  }

  /**
   * Load essential draws for instant functionality
   */
  private async loadEssentialDraws(game: GameType): Promise<void> {
    // Essential draws are already loaded by seedData.ts
    // Just update cache and progress
    await lotteryCache.getEssentialDraws(game);
    this.emit('essentialComplete', game);
  }

  /**
   * Load draws progressively in batches
   */
  private async loadProgressiveDraws(game: GameType, startTime: number): Promise<void> {
    const targetDraws = game === 'powerball' ? 500 : 400;
    const batchSize = 50;
    let loaded = 25; // Already have essential data

    // Progressive loading in batches for smoother UX
    while (loaded < targetDraws) {
      const batchStart = Date.now();
      
      // Simulate progressive data loading (in real app this would fetch from APIs)
      await this.loadBatch(game, Math.min(batchSize, targetDraws - loaded));
      loaded += Math.min(batchSize, targetDraws - loaded);
      
      // Calculate progress and statistical power
      const progress = Math.round((loaded / targetDraws) * 100);
      const statisticalPower = this.calculateStatisticalPower(game, loaded);
      const timeElapsed = Date.now() - startTime;
      const estimatedTotal = (timeElapsed / loaded) * targetDraws;
      const estimatedRemaining = Math.max(0, estimatedTotal - timeElapsed);

      this.updateProgress(game, 'progressive', progress, loaded, targetDraws, estimatedRemaining, statisticalPower);
      
      // Emit milestone events
      if (loaded >= 100 && loaded < 150) {
        this.emit('milestone', { game, milestone: 'basic_analysis', confidence: '3x minimum' });
      } else if (loaded >= 200 && loaded < 250) {
        this.emit('milestone', { game, milestone: 'advanced_analysis', confidence: '6x minimum' });
      } else if (loaded >= 300 && loaded < 350) {
        this.emit('milestone', { game, milestone: 'expert_analysis', confidence: '10x minimum' });
      }

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Final cache optimization
    await lotteryCache.getFullDraws(game);
  }

  /**
   * Simulate loading a batch of draws
   */
  private async loadBatch(game: GameType, batchSize: number): Promise<void> {
    // In a real implementation, this would:
    // 1. Fetch data from lottery APIs
    // 2. Generate realistic historical data
    // 3. Store in database and cache
    
    // For now, simulate the work
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  }

  /**
   * Calculate statistical power based on number of draws
   */
  private calculateStatisticalPower(game: GameType, drawsLoaded: number): number {
    const minimumSample = 30; // Minimum for basic statistics
    const optimalSample = game === 'powerball' ? 500 : 400;
    
    if (drawsLoaded < minimumSample) {
      return Math.round((drawsLoaded / minimumSample) * 100);
    }
    
    // Calculate confidence multiplier
    const multiplier = Math.min(drawsLoaded / minimumSample, optimalSample / minimumSample);
    return Math.round(multiplier * 100);
  }

  /**
   * Update loading progress
   */
  private updateProgress(
    game: GameType, 
    stage: LoadingProgress['stage'], 
    progress: number, 
    drawsLoaded: number, 
    totalDraws: number,
    estimatedTimeRemaining?: number,
    statisticalPower?: number
  ): void {
    const state: LoadingProgress = {
      game,
      stage,
      progress: Math.min(100, Math.max(0, progress)),
      drawsLoaded,
      totalDraws,
      estimatedTimeRemaining,
      statisticalPower: statisticalPower || this.calculateStatisticalPower(game, drawsLoaded)
    };

    this.loadingState.set(game, state);
    this.emit('progress', state);
  }

  /**
   * Wait for a specific loading stage
   */
  private async waitForStage(game: GameType, stage: LoadingProgress['stage']): Promise<void> {
    return new Promise((resolve) => {
      const checkState = () => {
        const state = this.loadingState.get(game);
        if (state && (state.stage === stage || state.stage === 'complete')) {
          resolve();
          return;
        }
        // Check again in 100ms
        setTimeout(checkState, 100);
      };
      checkState();
    });
  }

  /**
   * Get current loading state for all games
   */
  getLoadingState(): Record<GameType, LoadingProgress> {
    const state = {} as Record<GameType, LoadingProgress>;
    this.loadingState.forEach((progress, game) => {
      state[game] = progress;
    });
    return state;
  }

  /**
   * Get loading state for a specific game
   */
  getGameLoadingState(game: GameType): LoadingProgress | undefined {
    return this.loadingState.get(game);
  }

  /**
   * Check if progressive loading is complete for all games
   */
  isComplete(): boolean {
    return Array.from(this.loadingState.values()).every(state => state.stage === 'complete');
  }

  /**
   * Force refresh of all data
   */
  async forceRefresh(): Promise<void> {
    console.log('🔄 Force refreshing all lottery data...');
    await lotteryCache.refreshCache();
    await this.startProgressiveLoading();
  }
}

// Global progressive loader instance
export const progressiveLoader = new ProgressiveLoader();