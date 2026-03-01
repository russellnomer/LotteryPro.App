import { storage } from "./storage";
import { type LotteryDraw, type GameType, GAME_CONFIG } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

interface CacheMetadata {
  lastUpdated: string;
  totalDraws: number;
  gameType: GameType;
  version: string;
}

interface CachedLotteryData {
  metadata: CacheMetadata;
  essentialDraws: LotteryDraw[]; // Last 50 draws for instant startup
  fullDraws: LotteryDraw[]; // Complete dataset for maximum statistical power
  frequencyMap: Map<number, number>;
  bonusFrequencyMap: Map<number, number>;
}

/**
 * Smart caching system for lottery datasets
 * Provides instant startup with essential data and progressive loading of full statistical power
 */
export class LotteryCache {
  private readonly CACHE_DIR = './cache/lottery';
  private readonly ESSENTIAL_DRAW_COUNT = 50; // Minimum for instant startup
  private readonly FULL_DRAW_TARGET = 500; // Maximum statistical power
  private readonly CACHE_VERSION = '1.0';
  
  // In-memory cache for ultra-fast access
  private memoryCache = new Map<GameType, CachedLotteryData>();
  private loadingPromises = new Map<GameType, Promise<void>>();

  constructor() {
    this.ensureCacheDirectory();
  }

  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.CACHE_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Get essential draws for instant startup (50 most recent)
   */
  async getEssentialDraws(game: GameType): Promise<LotteryDraw[]> {
    // Try memory cache first
    const cached = this.memoryCache.get(game);
    if (cached?.essentialDraws) {
      return cached.essentialDraws;
    }

    // Try disk cache
    const diskCached = await this.loadFromDisk(game);
    if (diskCached?.essentialDraws) {
      this.memoryCache.set(game, diskCached);
      return diskCached.essentialDraws;
    }

    // Fallback: load from database
    console.log(`🚀 Loading essential ${game} draws for instant startup...`);
    const draws = await storage.getDraws(game);
    const essential = draws.slice(0, this.ESSENTIAL_DRAW_COUNT);
    
    // Cache for next time
    await this.cacheEssentialData(game, essential);
    
    return essential;
  }

  /**
   * Get full dataset for maximum statistical power
   * Uses progressive loading - starts with essential, builds to full
   */
  async getFullDraws(game: GameType): Promise<LotteryDraw[]> {
    // Check if already loading
    const loadingPromise = this.loadingPromises.get(game);
    if (loadingPromise) {
      await loadingPromise;
    }

    // Check memory cache
    const cached = this.memoryCache.get(game);
    if (cached?.fullDraws && cached.fullDraws.length >= this.FULL_DRAW_TARGET) {
      return cached.fullDraws;
    }

    // Start progressive loading
    const promise = this.loadFullDataset(game);
    this.loadingPromises.set(game, promise);
    
    try {
      await promise;
      const updatedCache = this.memoryCache.get(game);
      return updatedCache?.fullDraws || [];
    } finally {
      this.loadingPromises.delete(game);
    }
  }

  /**
   * Check if cache needs updating
   */
  async needsUpdate(game: GameType): Promise<boolean> {
    try {
      const cached = await this.loadFromDisk(game);
      if (!cached) return true;

      // Check if cache is older than 24 hours
      const lastUpdated = new Date(cached.metadata.lastUpdated);
      const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
      
      return daysSinceUpdate > 1 || cached.metadata.version !== this.CACHE_VERSION;
    } catch {
      return true;
    }
  }

  /**
   * Get pre-calculated frequency maps for instant analysis
   */
  async getFrequencyMaps(game: GameType): Promise<{
    mainFreq: Map<number, number>;
    bonusFreq: Map<number, number>;
  }> {
    const cached = this.memoryCache.get(game);
    if (cached?.frequencyMap && cached?.bonusFrequencyMap) {
      return {
        mainFreq: cached.frequencyMap,
        bonusFreq: cached.bonusFrequencyMap
      };
    }

    // Calculate from available data
    const draws = await this.getEssentialDraws(game);
    return this.calculateFrequencyMaps(draws);
  }

  /**
   * Progressive loading strategy: essential → full dataset
   */
  private async loadFullDataset(game: GameType): Promise<void> {
    console.log(`📊 Progressive loading: Building ${game} MAXIMUM statistical power...`);
    
    // Get all available draws from database
    const allDraws = await storage.getDraws(game);
    
    // Calculate frequency maps for instant analysis
    const { mainFreq, bonusFreq } = this.calculateFrequencyMaps(allDraws);
    
    // Update memory cache with full dataset
    const cacheData: CachedLotteryData = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalDraws: allDraws.length,
        gameType: game,
        version: this.CACHE_VERSION
      },
      essentialDraws: allDraws.slice(0, this.ESSENTIAL_DRAW_COUNT),
      fullDraws: allDraws,
      frequencyMap: mainFreq,
      bonusFrequencyMap: bonusFreq
    };
    
    this.memoryCache.set(game, cacheData);
    
    // Save to disk for next startup
    await this.saveToDisk(game, cacheData);
    
    console.log(`✅ ${game} dataset complete: ${allDraws.length} draws, MAXIMUM statistical power activated!`);
  }

  /**
   * Cache essential data for instant startup
   */
  private async cacheEssentialData(game: GameType, draws: LotteryDraw[]): Promise<void> {
    const { mainFreq, bonusFreq } = this.calculateFrequencyMaps(draws);
    
    const cacheData: CachedLotteryData = {
      metadata: {
        lastUpdated: new Date().toISOString(),
        totalDraws: draws.length,
        gameType: game,
        version: this.CACHE_VERSION
      },
      essentialDraws: draws,
      fullDraws: [], // Will be loaded progressively
      frequencyMap: mainFreq,
      bonusFrequencyMap: bonusFreq
    };
    
    this.memoryCache.set(game, cacheData);
  }

  /**
   * Calculate frequency maps for hot number analysis
   */
  private calculateFrequencyMaps(draws: LotteryDraw[]): {
    mainFreq: Map<number, number>;
    bonusFreq: Map<number, number>;
  } {
    const mainFreq = new Map<number, number>();
    const bonusFreq = new Map<number, number>();
    
    const gameType = draws[0]?.game as GameType | undefined;
    const gameConf = gameType && GAME_CONFIG[gameType] ? GAME_CONFIG[gameType] : GAME_CONFIG.powerball;
    const maxBonus = gameConf.bonusNumber ? gameConf.bonusNumber.max : 0;
    const maxMain = gameConf.mainNumbers.max;
    
    draws.forEach(draw => {
      // Process main numbers - filter to valid range
      (draw.mainNumbers as number[]).forEach(num => {
        if (num >= 1 && num <= maxMain) {
          mainFreq.set(num, (mainFreq.get(num) || 0) + 1);
        }
      });
      
      // Process bonus number - filter to valid range
      if (draw.bonusNumber >= 1 && draw.bonusNumber <= maxBonus) {
        bonusFreq.set(draw.bonusNumber, (bonusFreq.get(draw.bonusNumber) || 0) + 1);
      }
    });
    
    return { mainFreq, bonusFreq };
  }

  /**
   * Save cache data to disk for persistence
   */
  private async saveToDisk(game: GameType, data: CachedLotteryData): Promise<void> {
    try {
      const filename = path.join(this.CACHE_DIR, `${game}-cache.json`);
      
      // Convert Maps to objects for JSON serialization
      const serializable = {
        ...data,
        frequencyMap: Object.fromEntries(data.frequencyMap),
        bonusFrequencyMap: Object.fromEntries(data.bonusFrequencyMap)
      };
      
      await fs.writeFile(filename, JSON.stringify(serializable, null, 2));
    } catch (error) {
      console.error(`Failed to save ${game} cache to disk:`, error);
    }
  }

  /**
   * Load cache data from disk
   */
  private async loadFromDisk(game: GameType): Promise<CachedLotteryData | null> {
    try {
      const filename = path.join(this.CACHE_DIR, `${game}-cache.json`);
      const data = await fs.readFile(filename, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert objects back to Maps
      return {
        ...parsed,
        frequencyMap: new Map(Object.entries(parsed.frequencyMap).map(([k, v]) => [parseInt(k), v as number])),
        bonusFrequencyMap: new Map(Object.entries(parsed.bonusFrequencyMap).map(([k, v]) => [parseInt(k), v as number]))
      };
    } catch {
      return null;
    }
  }

  /**
   * Force cache refresh for both games
   */
  async refreshCache(): Promise<void> {
    console.log('🔄 Refreshing lottery cache with latest data...');
    
    await Promise.all([
      this.loadFullDataset('powerball'),
      this.loadFullDataset('megamillions'),
      this.loadFullDataset('millionaireforlife')
    ]);
    
    console.log('✅ Cache refresh complete!');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): Record<GameType, { essential: number; full: number; inMemory: boolean }> {
    const stats = {} as Record<GameType, { essential: number; full: number; inMemory: boolean }>;
    
    (['powerball', 'megamillions'] as GameType[]).forEach(game => {
      const cached = this.memoryCache.get(game);
      stats[game] = {
        essential: cached?.essentialDraws?.length || 0,
        full: cached?.fullDraws?.length || 0,
        inMemory: !!cached
      };
    });
    
    return stats;
  }
}

// Global cache instance
export const lotteryCache = new LotteryCache();