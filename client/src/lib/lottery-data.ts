import { GameType, LotteryDraw, NumberFrequency, AnalysisResult } from "@shared/schema";

export const GAME_CONFIG = {
  powerball: {
    name: 'Powerball',
    mainNumbers: { min: 1, max: 69, count: 5 },
    bonusNumber: { min: 1, max: 26, name: 'Powerball' },
    color: 'red',
    odds: '1 in 292,201,338',
    icon: 'fas fa-bolt'
  },
  megamillions: {
    name: 'MegaMillions',
    mainNumbers: { min: 1, max: 60, count: 5 },
    bonusNumber: { min: 1, max: 24, name: 'Mega Ball' },
    color: 'blue',
    odds: '1 in 302,575,350',
    icon: 'fas fa-gem'
  }
} as const;

export const ANALYSIS_METHODS = {
  hot: {
    name: 'Hot Numbers',
    description: 'Based on frequency',
    icon: 'fas fa-fire',
    color: 'orange'
  },
  balanced: {
    name: 'Balanced',
    description: 'Even distribution',
    icon: 'fas fa-balance-scale',
    color: 'blue'
  },
  wheel: {
    name: 'Wheel System',
    description: 'Multiple combinations',
    icon: 'fas fa-cogs',
    color: 'green'
  }
} as const;

export const WHEEL_SYSTEMS = {
  single: {
    name: 'Single Ticket Wheel',
    description: 'One optimized ticket using wheel analysis',
    ticketsRequired: '1 ticket',
    tickets: 1
  },
  abbreviated: {
    name: 'Abbreviated Wheel',
    description: 'Optimized coverage with fewer tickets',
    ticketsRequired: '6 tickets',
    tickets: 6
  },
  key: {
    name: 'Key Number Wheel',
    description: 'Guaranteed hot numbers in every ticket',
    ticketsRequired: '8 tickets',
    tickets: 8
  },
  full: {
    name: 'Full Wheel',
    description: 'Maximum coverage combinations',
    ticketsRequired: '12 tickets',
    tickets: 12
  }
} as const;
