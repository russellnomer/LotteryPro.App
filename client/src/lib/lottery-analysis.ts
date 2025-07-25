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

export function generateWheelCombinations(hotNumbers: number[], game: GameType): number[][] {
  const combinations: number[][] = [];
  const maxMain = game === 'powerball' ? 69 : 60;
  
  // Generate abbreviated wheel with key numbers
  const keyNumbers = hotNumbers.slice(0, 3); // Use top 3 hot numbers as key
  const poolNumbers = hotNumbers.slice(3, 8); // Additional pool
  
  // Add some random numbers to the pool
  while (poolNumbers.length < 10) {
    const randomNum = Math.floor(Math.random() * maxMain) + 1;
    if (!hotNumbers.includes(randomNum) && !poolNumbers.includes(randomNum)) {
      poolNumbers.push(randomNum);
    }
  }
  
  // Generate combinations ensuring at least one key number
  for (let i = 0; i < 12; i++) {
    const combination: number[] = [];
    
    // Add one key number
    const keyIndex = Math.floor(Math.random() * keyNumbers.length);
    combination.push(keyNumbers[keyIndex]);
    
    // Fill rest from pool
    const remainingPool = [...poolNumbers];
    while (combination.length < 5 && remainingPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingPool.length);
      combination.push(remainingPool.splice(randomIndex, 1)[0]);
    }
    
    // Fill any remaining with random numbers
    while (combination.length < 5) {
      const randomNum = Math.floor(Math.random() * maxMain) + 1;
      if (!combination.includes(randomNum)) {
        combination.push(randomNum);
      }
    }
    
    combination.sort((a, b) => a - b);
    combinations.push(combination);
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
