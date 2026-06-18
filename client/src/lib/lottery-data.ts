import { GameType, LotteryDraw, NumberFrequency, AnalysisResult } from "@shared/schema";

export const GAME_CONFIG = {
  powerball: {
    name: 'Powerball',
    mainNumbers: { min: 1, max: 69, count: 5 },
    bonusNumber: { min: 1, max: 26, name: 'Powerball' },
    color: 'red',
    odds: '1 in 292,201,338',
    icon: 'fas fa-bolt',
    drawDays: ['Mon', 'Wed', 'Sat'],
    price: 2
  },
  megamillions: {
    name: 'Mega Millions',
    mainNumbers: { min: 1, max: 70, count: 5 },
    bonusNumber: { min: 1, max: 24, name: 'Mega Ball' },
    color: 'blue',
    odds: '1 in 302,575,350',
    icon: 'fas fa-gem',
    drawDays: ['Tue', 'Fri'],
    price: 5
  },
  nylotto: {
    name: 'NY Lotto',
    mainNumbers: { min: 1, max: 59, count: 6 },
    bonusNumber: { min: 1, max: 59, name: 'Bonus', playerPicks: false },
    color: 'purple',
    odds: '1 in 45,057,474',
    icon: 'fas fa-ticket-alt',
    drawDays: ['Wed', 'Sat'],
    price: 1
  },
  cash4life: {
    name: 'Cash4Life',
    mainNumbers: { min: 1, max: 60, count: 5 },
    bonusNumber: { min: 1, max: 4, name: 'Cash Ball' },
    color: 'green',
    odds: '1 in 21,846,048',
    icon: 'fas fa-money-bill-wave',
    drawDays: ['Daily'],
    price: 2
  },
  take5: {
    name: 'Take 5',
    mainNumbers: { min: 1, max: 39, count: 5 },
    bonusNumber: null,
    color: 'yellow',
    odds: '1 in 575,757',
    icon: 'fas fa-hand-paper',
    drawDays: ['Twice Daily'],
    price: 1
  },
  pick10: {
    name: 'Pick 10',
    mainNumbers: { min: 1, max: 80, count: 10 },
    bonusNumber: null,
    color: 'indigo',
    odds: '1 in 8,911,711',
    icon: 'fas fa-dice-d20',
    drawDays: ['Daily'],
    price: 1
  },
  millionaireforlife: {
    name: 'Millionaire For Life',
    mainNumbers: { min: 1, max: 58, count: 5 },
    bonusNumber: { min: 1, max: 5, name: 'Mill Ball' },
    color: 'emerald',
    odds: '1 in 3,838,380',
    icon: 'fas fa-crown',
    drawDays: ['Daily'],
    price: 5
  },
  numbers: {
    name: 'Numbers',
    mainNumbers: { min: 0, max: 9, count: 3 },
    bonusNumber: null,
    color: 'rose',
    odds: '1 in 1,000',
    icon: 'fas fa-hashtag',
    drawDays: ['Twice Daily'],
    price: 1
  },
  win4: {
    name: 'Win 4',
    mainNumbers: { min: 0, max: 9, count: 4 },
    bonusNumber: null,
    color: 'amber',
    odds: '1 in 10,000',
    icon: 'fas fa-4',
    drawDays: ['Twice Daily'],
    price: 1
  }
} as const;

export type MethodologyType = 'frequency' | 'pattern' | 'numerology' | 'astrology' | 'random' | 'mixed';

export const ANALYSIS_METHODS = {
  frequency: {
    name: 'Frequency',
    description: 'Hot/cold number analysis',
    icon: 'fas fa-fire',
    color: 'orange'
  },
  pattern: {
    name: 'Pattern',
    description: 'Pattern recognition',
    icon: 'fas fa-project-diagram',
    color: 'blue'
  },
  numerology: {
    name: 'Numerology',
    description: 'Numerology-based',
    icon: 'fas fa-star-of-david',
    color: 'purple'
  },
  astrology: {
    name: 'Astrology',
    description: 'Zodiac-based',
    icon: 'fas fa-moon',
    color: 'indigo'
  },
  random: {
    name: 'Random',
    description: 'Pure random',
    icon: 'fas fa-dice',
    color: 'gray'
  },
  mixed: {
    name: 'Mixed',
    description: 'Combine methods',
    icon: 'fas fa-blender',
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
