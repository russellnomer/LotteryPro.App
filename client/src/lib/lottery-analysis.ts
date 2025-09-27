import { NumberFrequency, LotteryDraw, GameType } from "@shared/schema";

export function calculateFrequencyAnalysis(draws: LotteryDraw[], game: GameType) {
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
  const frequencyData: NumberFrequency[] = sortedByFreq.map(([number, freq]) => ({
    number,
    frequency: freq,
    isHot: hotNumbers.includes(number),
    isCold: coldNumbers.includes(number)
  }));
  
  return {
    hotNumbers,
    coldNumbers,
    frequencyData,
    bonusFrequency: Array.from(bonusFreq.entries()).sort((a, b) => b[1] - a[1])
  };
}

export function generateWheelCombinations(hotNumbers: number[], game: GameType, wheelType: string = 'abbreviated'): number[][] {
  const combinations: number[][] = [];
  const maxMain = game === 'powerball' ? 69 : 70;
  const maxBonus = game === 'powerball' ? 26 : 24;
  
  // Configuration for different wheel types
  const wheelConfig = {
    single: { count: 1, keyNumbers: 2, poolSize: 8 },
    abbreviated: { count: 6, keyNumbers: 3, poolSize: 10 },
    key: { count: 8, keyNumbers: 2, poolSize: 12 },
    full: { count: 12, keyNumbers: 4, poolSize: 15 }
  };
  
  const config = wheelConfig[wheelType as keyof typeof wheelConfig] || wheelConfig.abbreviated;
  
  // Use top hot numbers as key numbers
  const keyNumbers = hotNumbers.slice(0, config.keyNumbers);
  const poolNumbers = [...hotNumbers.slice(config.keyNumbers, 8)];
  
  // Add some strategic numbers to the pool
  while (poolNumbers.length < config.poolSize) {
    const randomNum = Math.floor(Math.random() * maxMain) + 1;
    if (!hotNumbers.includes(randomNum) && !poolNumbers.includes(randomNum)) {
      poolNumbers.push(randomNum);
    }
  }
  
  if (wheelType === 'single') {
    // Single ticket wheel - optimized selection
    const combination: number[] = [];
    
    // Add 2 key hot numbers
    combination.push(...keyNumbers.slice(0, 2));
    
    // Add 2 from hot pool
    const hotPool = hotNumbers.slice(2, 6);
    for (let i = 0; i < 2 && i < hotPool.length; i++) {
      if (!combination.includes(hotPool[i])) {
        combination.push(hotPool[i]);
      }
    }
    
    // Add 1 balanced number
    const midRange = Math.floor(maxMain / 2);
    let balancedNum = Math.floor(Math.random() * 20) + midRange - 10;
    while (combination.includes(balancedNum) || balancedNum < 1 || balancedNum > maxMain) {
      balancedNum = Math.floor(Math.random() * 20) + midRange - 10;
    }
    combination.push(balancedNum);
    
    // Sort and add to combinations
    combination.sort((a, b) => a - b);
    combinations.push(combination);
    
  } else {
    // Multi-ticket wheels
    for (let i = 0; i < config.count; i++) {
      const combination: number[] = [];
      
      // Always include at least one key number
      const keyIndex = i % keyNumbers.length;
      combination.push(keyNumbers[keyIndex]);
      
      // For key wheel, add another key number
      if (wheelType === 'key' && keyNumbers.length > 1) {
        const secondKeyIndex = (keyIndex + 1) % keyNumbers.length;
        if (!combination.includes(keyNumbers[secondKeyIndex])) {
          combination.push(keyNumbers[secondKeyIndex]);
        }
      }
      
      // Fill rest from pool with variety
      const availablePool = [...poolNumbers];
      while (combination.length < 5 && availablePool.length > 0) {
        const randomIndex = Math.floor(Math.random() * availablePool.length);
        const selectedNum = availablePool.splice(randomIndex, 1)[0];
        if (!combination.includes(selectedNum)) {
          combination.push(selectedNum);
        }
      }
      
      // Fill remaining with random numbers if needed
      while (combination.length < 5) {
        const randomNum = Math.floor(Math.random() * maxMain) + 1;
        if (!combination.includes(randomNum)) {
          combination.push(randomNum);
        }
      }
      
      combination.sort((a, b) => a - b);
      combinations.push(combination);
    }
  }
  
  return combinations;
}

export function formatChartData(frequencyData: NumberFrequency[]) {
  return {
    labels: frequencyData.slice(0, 12).map(item => item.number.toString()),
    datasets: [{
      label: 'Frequency',
      data: frequencyData.slice(0, 12).map(item => item.frequency),
      backgroundColor: frequencyData.slice(0, 12).map(item => 
        item.isHot ? '#FF5722' : item.frequency >= 2 ? '#FF9800' : '#E0E0E0'
      ),
      borderColor: '#FF5722',
      borderWidth: 1
    }]
  };
}
