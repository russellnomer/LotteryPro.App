export const GAME_CONFIG = {
  powerball: {
    name: 'Powerball',
    mainNumbers: { count: 5, min: 1, max: 69 },
    bonusNumber: { count: 1, min: 1, max: 26, name: 'Powerball' },
    drawDays: ['Mon', 'Wed', 'Sat'],
    price: 2
  },
  megamillions: {
    name: 'Mega Millions',
    mainNumbers: { count: 5, min: 1, max: 70 },
    bonusNumber: { count: 1, min: 1, max: 25, name: 'Mega Ball' },
    drawDays: ['Tue', 'Fri'],
    price: 2
  },
  nylotto: {
    name: 'NY Lotto',
    mainNumbers: { count: 6, min: 1, max: 59 },
    bonusNumber: { count: 1, min: 1, max: 59, name: 'Bonus', playerPicks: false },
    drawDays: ['Wed', 'Sat'],
    price: 1
  },
  cash4life: {
    name: 'Cash4Life',
    mainNumbers: { count: 5, min: 1, max: 60 },
    bonusNumber: { count: 1, min: 1, max: 4, name: 'Cash Ball' },
    drawDays: ['Daily'],
    price: 2
  },
  take5: {
    name: 'Take 5',
    mainNumbers: { count: 5, min: 1, max: 39 },
    bonusNumber: null,
    drawDays: ['Twice Daily'],
    price: 1
  },
  pick10: {
    name: 'Pick 10',
    mainNumbers: { count: 10, min: 1, max: 80 },
    bonusNumber: null,
    drawDays: ['Daily'],
    price: 1
  }
} as const;

export type GameType = keyof typeof GAME_CONFIG;
export type MethodologyType = 'frequency' | 'pattern' | 'numerology' | 'astrology' | 'random' | 'mixed';

export const ALL_GAME_TYPES: GameType[] = ['powerball', 'megamillions', 'nylotto', 'cash4life', 'take5', 'pick10'];
export const ALL_METHODOLOGIES: MethodologyType[] = ['frequency', 'pattern', 'numerology', 'astrology', 'random', 'mixed'];
