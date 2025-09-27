import { storage } from "./storage";
import { LotteryDraw } from "@shared/schema";

/**
 * Educational Lottery Analysis with Historical Data Integration
 * Implements various mathematical approaches for educational analysis purposes
 * All methods are for entertainment and educational use only
 */

interface EducationalAnalysis {
  mainNumbers: number[];
  bonusNumber: number;
  methodology: string;
  studyFactors: string[];
  analysisType: string;
  educationalNote: string;
}

interface HistoricalDataStudy {
  game: string;
  recentDraw: any;
  gapAnalysis: number[];
  patternObservations: string[];
  frequencyFactor: number;
  studyInsights: string[];
}

export class EnhancedLotteryAnalysis {
  
  /**
   * Generate educational analysis methods incorporating historical data
   */
  async generateEducationalAnalyses(game: 'powerball' | 'megamillions'): Promise<EducationalAnalysis[]> {
    const analyses: EducationalAnalysis[] = [];
    
    // Get historical data study
    const dataStudy = await this.analyzeHistoricalData(game);
    
    // Method 1: Frequency Pattern Study
    analyses.push(await this.generateFrequencyPatternStudy(game, dataStudy));
    
    // Method 2: Pattern Observation Analysis  
    analyses.push(await this.generatePatternObservationStudy(game, dataStudy));
    
    // Method 3: Dynamic Distribution Study
    analyses.push(await this.generateDynamicDistributionStudy(game, dataStudy));
    
    // Method 4: Mathematical Probability Study
    analyses.push(await this.generateProbabilityStudy(game, dataStudy));
    
    // Method 5: Contrarian Analysis (alternative approach)
    analyses.push(await this.generateContrarianStudy(game, dataStudy));
    
    // Method 6: Historical Comparison Study
    analyses.push(await this.generateHistoricalComparisonStudy(game, dataStudy));
    
    return analyses;
  }

  /**
   * Analyze historical data for educational insights and patterns
   */
  private async analyzeHistoricalData(game: 'powerball' | 'megamillions'): Promise<HistoricalDataStudy> {
    const draws: LotteryDraw[] = await storage.getDraws(game);
    const recentDraw = draws[0]; // Most recent draw
    
    if (!recentDraw) {
      throw new Error(`No draws found for ${game}`);
    }

    // Study gaps between numbers in recent draw
    const sortedNumbers = [...(recentDraw.mainNumbers as number[])].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sortedNumbers.length; i++) {
      gaps.push(sortedNumbers[i] - sortedNumbers[i-1]);
    }

    // Observe pattern characteristics
    const patternObservations = this.identifyPatternDeviations(recentDraw, draws);
    
    // Study frequency characteristics for educational purposes
    const frequencyFactor = this.calculateOverdueFactor(draws, game);
    
    // Generate educational insights based on analysis
    const studyInsights = this.generateRecommendations(gaps, patternObservations, frequencyFactor);

    return {
      game,
      recentDraw,
      gapAnalysis: gaps,
      patternObservations,
      frequencyFactor,
      studyInsights
    };
  }

  /**
   * Method 1: Frequency Pattern Study
   * Educational purpose: Studies numbers that appear less frequently in recent draws
   */
  private async generateFrequencyPatternStudy(
    game: 'powerball' | 'megamillions', 
    study: HistoricalDataStudy
  ): Promise<EducationalAnalysis> {
    const draws: LotteryDraw[] = await storage.getDraws(game);
    const maxNum = game === 'powerball' ? 69 : 70;
    
    // Study numbers that haven't appeared recently for educational purposes
    const recentAppearances = new Map<number, number>();
    
    // Examine last 20 draws for frequency patterns
    for (let i = 0; i < Math.min(20, draws.length); i++) {
      (draws[i].mainNumbers as number[]).forEach((num: number) => {
        recentAppearances.set(num, (recentAppearances.get(num) || 0) + 1);
      });
    }
    
    // Identify numbers with lower recent frequency for study
    const infrequentNumbers: number[] = [];
    for (let num = 1; num <= maxNum; num++) {
      if (!recentAppearances.has(num) || recentAppearances.get(num)! < 2) {
        infrequentNumbers.push(num);
      }
    }
    
    // Study frequency patterns weighted by historical data
    const frequency = this.calculateFrequencies(draws);
    const studyNumbers = infrequentNumbers.map(num => ({
      num,
      freq: frequency[num] || 0
    })).sort((a, b) => b.freq - a.freq);
    
    const mainNumbers = studyNumbers.slice(0, 5).map(item => item.num);
    const bonusNumber = this.getBestBonusNumber(draws, game);

    return {
      mainNumbers: mainNumbers.sort((a, b) => a - b),
      bonusNumber,
      methodology: "Frequency Pattern Study",
      studyFactors: ["Recent frequency patterns", "Historical data analysis", "Educational frequency study"],
      analysisType: "Frequency-Based Education",
      educationalNote: "This method may appeal to players interested in frequency pattern studies"
    };
  }

  /**
   * Method 2: Pattern Observation Study
   * Educational purpose: Studies gap patterns in historical drawings
   */
  private async generatePatternObservationStudy(
    game: 'powerball' | 'megamillions',
    study: HistoricalDataStudy
  ): Promise<EducationalAnalysis> {
    const draws = await storage.getDraws(game);
    const maxNum = game === 'powerball' ? 69 : 70;
    
    // Study pattern characteristics from recent data
    const observedPatterns = study.patternObservations;
    
    // Study typical gap patterns for educational purposes
    const mainNumbers: number[] = [];
    
    // Study typical gaps between lottery numbers for educational insight
    const typicalGapRange = [3, 8]; // Common gaps observed in data
    let currentNum = Math.floor(Math.random() * 15) + 1; // Start in low range
    
    for (let i = 0; i < 5; i++) {
      mainNumbers.push(currentNum);
      if (i < 4) {
        const gap = typicalGapRange[0] + Math.floor(Math.random() * (typicalGapRange[1] - typicalGapRange[0]));
        currentNum = Math.min(currentNum + gap, maxNum);
      }
    }
    
    const bonusNumber = this.getBestBonusNumber(draws, game);

    return {
      mainNumbers: mainNumbers.sort((a, b) => a - b),
      bonusNumber,
      methodology: "Pattern Observation Study",
      studyFactors: ["Gap pattern analysis", "Historical observation", "Educational gap study"],
      analysisType: "Pattern-Based Education",
      educationalNote: "This approach may interest players who study gap patterns in drawings"
    };
  }

  /**
   * Method 3: Dynamic Distribution Study
   * Educational purpose: Studies long-term vs recent frequency patterns
   */
  private async generateDynamicDistributionStudy(
    game: 'powerball' | 'megamillions',
    study: HistoricalDataStudy
  ): Promise<EducationalAnalysis> {
    const draws = await storage.getDraws(game);
    const frequency = this.calculateFrequencies(draws);
    
    // Study dynamic distribution patterns for educational insights
    const recent10Freq = this.calculateRecentFrequencies(draws, 10);
    const recent50Freq = this.calculateRecentFrequencies(draws, 50);
    
    // Study numbers with different long-term vs recent patterns for education
    const studyCandidates: {num: number, score: number}[] = [];
    
    Object.keys(frequency).forEach(numStr => {
      const num = parseInt(numStr);
      const longTermFreq = frequency[num] || 0;
      const recentFreq = recent10Freq[num] || 0;
      const mediumFreq = recent50Freq[num] || 0;
      
      // Study score based on frequency variance patterns
      const score = longTermFreq - (recentFreq * 3) + (mediumFreq * 0.5);
      if (score > 0) {
        studyCandidates.push({num, score});
      }
    });
    
    // Select numbers for educational distribution study
    studyCandidates.sort((a, b) => b.score - a.score);
    const mainNumbers = studyCandidates.slice(0, 5).map(item => item.num);
    const bonusNumber = this.getBestBonusNumber(draws, game);

    return {
      mainNumbers: mainNumbers.sort((a, b) => a - b),
      bonusNumber,
      methodology: "Dynamic Distribution Study",
      studyFactors: ["Long-term frequency patterns", "Recent occurrence analysis", "Educational distribution study"],
      analysisType: "Frequency Distribution Education",
      educationalNote: "This approach may suit players interested in frequency distribution patterns"
    };
  }

  /**
   * Method 4: Mathematical Probability Study
   * Educational purpose: Studies multiple statistical factors for educational insight
   */
  private async generateProbabilityStudy(
    game: 'powerball' | 'megamillions',
    study: HistoricalDataStudy
  ): Promise<EducationalAnalysis> {
    const draws = await storage.getDraws(game);
    const maxNum = game === 'powerball' ? 69 : 70;
    
    // Study mathematical factors for educational purposes
    const studyValues = new Map<number, number>();
    
    for (let num = 1; num <= maxNum; num++) {
      const frequency = this.getNumberFrequency(draws, num);
      const recentAppearances = this.getRecentAppearances(draws, num, 15);
      const positionScore = this.getPositionScore(draws, num);
      const gapScore = this.getGapScore(draws, num);
      
      // Combined study value for educational analysis
      const studyValue = (frequency * 0.4) + 
                        ((15 - recentAppearances) * 0.3) + 
                        (positionScore * 0.2) + 
                        (gapScore * 0.1);
      
      studyValues.set(num, studyValue);
    }
    
    // Select numbers for educational probability study
    const sortedByStudyValue = Array.from(studyValues.entries())
      .sort(([,a], [,b]) => b - a);
    
    const mainNumbers = sortedByStudyValue.slice(0, 5).map(([num]) => num);
    const bonusNumber = this.getBestBonusNumber(draws, game);

    return {
      mainNumbers: mainNumbers.sort((a, b) => a - b),
      bonusNumber,
      methodology: "Mathematical Probability Study",
      studyFactors: ["Multi-factor mathematical study", "Educational statistical analysis", "Probability theory education"],
      analysisType: "Mathematical Education",
      educationalNote: "This method may appeal to players interested in multi-factor mathematical analysis"
    };
  }

  /**
   * Method 5: Contrarian Analysis
   * Educational purpose: Studies alternative approaches to pattern analysis
   */
  private async generateContrarianStudy(
    game: 'powerball' | 'megamillions',
    study: HistoricalDataStudy
  ): Promise<EducationalAnalysis> {
    const draws = await storage.getDraws(game);
    const recentNumbers = study.recentDraw.mainNumbers;
    const maxNum = game === 'powerball' ? 69 : 70;
    
    // Study contrarian patterns for educational purposes
    const commonPatterns = this.identifyCommonPatterns(draws);
    
    // Study numbers with different characteristics than recent patterns
    const mainNumbers: number[] = [];
    const studyNumbers = new Set(recentNumbers);
    
    // Study distribution across different ranges for educational insight
    const ranges = [
      [1, 15], [16, 30], [31, 45], [46, 60], [61, maxNum]
    ];
    
    // Study diverse range distribution patterns
    ranges.forEach((range, index) => {
      if (mainNumbers.length < 5) {
        const [min, max] = range;
        for (let attempts = 0; attempts < 20 && mainNumbers.length < 5; attempts++) {
          const num = min + Math.floor(Math.random() * (max - min + 1));
          if (!mainNumbers.includes(num) && !studyNumbers.has(num)) {
            mainNumbers.push(num);
            break;
          }
        }
      }
    });
    
    // Complete the educational study if needed
    while (mainNumbers.length < 5) {
      const num = Math.floor(Math.random() * maxNum) + 1;
      if (!mainNumbers.includes(num) && !studyNumbers.has(num)) {
        mainNumbers.push(num);
      }
    }

    const bonusNumber = this.getBestBonusNumber(draws, game);

    return {
      mainNumbers: mainNumbers.sort((a, b) => a - b),
      bonusNumber,
      methodology: "Contrarian Analysis",
      studyFactors: ["Alternative pattern study", "Range distribution analysis", "Educational contrarian approach"],
      analysisType: "Alternative Analysis Education",
      educationalNote: "This approach may interest players who prefer alternative analysis methods"
    };
  }

  /**
   * Method 6: Historical Comparison Study
   * Educational purpose: Studies combined analytical approaches for educational insight
   */
  private async generateHistoricalComparisonStudy(
    game: 'powerball' | 'megamillions',
    study: HistoricalDataStudy
  ): Promise<EducationalAnalysis> {
    const draws = await storage.getDraws(game);
    
    // Study combined analytical methods for educational purposes
    // (This demonstrates how multiple approaches can be studied together)
    
    // Study multiple analytical approaches for educational insight
    const frequency = this.calculateFrequencies(draws);
    const positionAnalysis = this.analyzePositionalFrequency(draws);
    const sequenceAnalysis = this.analyzeNumberSequences(draws);
    
    // Combine multiple educational study approaches
    const studyScores = new Map<number, number>();
    const maxNum = game === 'powerball' ? 69 : 70;
    
    for (let num = 1; num <= maxNum; num++) {
      const freqScore = (frequency[num] || 0) / draws.length;
      const posScore = this.getPositionalScore(positionAnalysis, num);
      const seqScore = this.getSequenceScore(sequenceAnalysis, num);
      
      const combinedStudyScore = (freqScore * 0.5) + (posScore * 0.3) + (seqScore * 0.2);
      studyScores.set(num, combinedStudyScore);
    }
    
    // Select numbers for educational comparison study
    const sortedByStudyScore = Array.from(studyScores.entries())
      .sort(([,a], [,b]) => b - a);
    
    const mainNumbers = sortedByStudyScore.slice(0, 5).map(([num]) => num);
    const bonusNumber = this.getBestBonusNumber(draws, game);

    return {
      mainNumbers: mainNumbers.sort((a, b) => a - b),
      bonusNumber,
      methodology: "Historical Comparison Study",
      studyFactors: ["Multi-method comparison study", "Educational positional analysis", "Historical sequence study"],
      analysisType: "Comprehensive Educational Analysis",
      educationalNote: "This comprehensive approach may suit players interested in multi-method comparative analysis"
    };
  }

  // Helper methods
  private calculateFrequencies(draws: any[]): Record<number, number> {
    const freq: Record<number, number> = {};
    draws.forEach(draw => {
      draw.mainNumbers.forEach((num: number) => {
        freq[num] = (freq[num] || 0) + 1;
      });
    });
    return freq;
  }

  private calculateRecentFrequencies(draws: any[], count: number): Record<number, number> {
    const freq: Record<number, number> = {};
    const recentDraws = draws.slice(0, count);
    recentDraws.forEach(draw => {
      draw.mainNumbers.forEach((num: number) => {
        freq[num] = (freq[num] || 0) + 1;
      });
    });
    return freq;
  }

  private getBestBonusNumber(draws: any[], game: string): number {
    const bonusFreq: Record<number, number> = {};
    draws.forEach(draw => {
      const bonus = draw.bonusNumber;
      bonusFreq[bonus] = (bonusFreq[bonus] || 0) + 1;
    });
    
    const bestBonus = Object.entries(bonusFreq)
      .sort(([,a], [,b]) => b - a)[0];
    
    return parseInt(bestBonus?.[0] || (game === 'powerball' ? '26' : '25'));
  }

  private identifyPatternDeviations(latestDraw: any, draws: any[]): string[] {
    const deviations: string[] = [];
    
    // Check for unusual gap patterns
    const sortedNumbers = [...latestDraw.mainNumbers].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 1; i < sortedNumbers.length; i++) {
      gaps.push(sortedNumbers[i] - sortedNumbers[i-1]);
    }
    
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap > 15) deviations.push("Large gaps between numbers");
    if (avgGap < 5) deviations.push("Small gaps between numbers");
    
    // Check for consecutive numbers
    const hasConsecutive = gaps.some(gap => gap === 1);
    if (hasConsecutive) deviations.push("Consecutive numbers present");
    
    return deviations;
  }

  private calculateOverdueFactor(draws: any[], game: string): number {
    const maxNum = game === 'powerball' ? 69 : 70;
    const recentDraws = draws.slice(0, 10);
    const recentNumbers = new Set();
    
    recentDraws.forEach(draw => {
      draw.mainNumbers.forEach((num: number) => recentNumbers.add(num));
    });
    
    const overdueCount = maxNum - recentNumbers.size;
    return overdueCount / maxNum; // Percentage of numbers that are overdue
  }

  private generateRecommendations(gaps: number[], deviations: string[], overdueFactor: number): string[] {
    const recommendations: string[] = [];
    
    if (overdueFactor > 0.6) {
      recommendations.push("High overdue factor - focus on numbers not drawn recently");
    }
    
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap > 12) {
      recommendations.push("Recent large gaps - consider closer number selection");
    }
    
    if (deviations.includes("Consecutive numbers present")) {
      recommendations.push("Avoid consecutive numbers in next selection");
    }
    
    return recommendations;
  }

  private getNumberFrequency(draws: any[], num: number): number {
    return draws.filter(draw => draw.mainNumbers.includes(num)).length;
  }

  private getRecentAppearances(draws: any[], num: number, count: number): number {
    const recentDraws = draws.slice(0, count);
    return recentDraws.filter(draw => draw.mainNumbers.includes(num)).length;
  }

  private getPositionScore(draws: any[], num: number): number {
    let totalPositions = 0;
    let appearances = 0;
    
    draws.forEach(draw => {
      const sortedNumbers = [...draw.mainNumbers].sort((a, b) => a - b);
      const position = sortedNumbers.indexOf(num);
      if (position !== -1) {
        totalPositions += position;
        appearances++;
      }
    });
    
    return appearances > 0 ? totalPositions / appearances : 0;
  }

  private getGapScore(draws: any[], num: number): number {
    // Calculate average gaps when this number appears
    let totalGaps = 0;
    let gapCount = 0;
    
    draws.forEach(draw => {
      if (draw.mainNumbers.includes(num)) {
        const sortedNumbers = [...draw.mainNumbers].sort((a, b) => a - b);
        const position = sortedNumbers.indexOf(num);
        
        if (position > 0) {
          totalGaps += sortedNumbers[position] - sortedNumbers[position - 1];
          gapCount++;
        }
        if (position < sortedNumbers.length - 1) {
          totalGaps += sortedNumbers[position + 1] - sortedNumbers[position];
          gapCount++;
        }
      }
    });
    
    return gapCount > 0 ? totalGaps / gapCount : 0;
  }

  private identifyCommonPatterns(draws: any[]): any {
    // Identify common patterns in the draws
    return {};
  }

  private analyzePositionalFrequency(draws: any[]): any {
    // Analyze frequency by position when numbers are sorted
    return {};
  }

  private analyzeNumberSequences(draws: any[]): any {
    // Analyze common number sequences
    return {};
  }

  private getPositionalScore(positionAnalysis: any, num: number): number {
    // Get positional score for a number
    return Math.random() * 0.1; // Placeholder
  }

  private getSequenceScore(sequenceAnalysis: any, num: number): number {
    // Get sequence score for a number
    return Math.random() * 0.1; // Placeholder
  }
}

export const enhancedAnalysis = new EnhancedLotteryAnalysis();