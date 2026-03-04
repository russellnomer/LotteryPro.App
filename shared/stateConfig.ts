export type DataStatus = 'full' | 'national-only' | 'coming-soon';

export interface StateGame {
  name: string;
  type: 'draw' | 'scratch';
  drawDays?: string;
}

export interface StateConfig {
  code: string;
  name: string;
  flag: string;
  dataStatus: DataStatus;
  scratchOffApiUrl: string | null;
  drawGames: StateGame[];
  representativeUrl: string;
  lotteryWebsite: string | null;
  prohibited: boolean;
}

// National draw games available in all participating states
const NATIONAL_GAMES: StateGame[] = [
  { name: 'Powerball', type: 'draw', drawDays: 'Mon/Wed/Sat' },
  { name: 'Mega Millions', type: 'draw', drawDays: 'Tue/Fri' },
];

export const STATE_CONFIGS: Record<string, StateConfig> = {
  NY: {
    code: 'NY', name: 'New York', flag: '🗽',
    dataStatus: 'full',
    scratchOffApiUrl: 'https://data.ny.gov/resource/nzqa-7unk.json',
    drawGames: [
      ...NATIONAL_GAMES,
      { name: 'NY Lotto', type: 'draw', drawDays: 'Wed/Sat' },
      { name: 'Take 5', type: 'draw', drawDays: 'Daily' },
      { name: 'Pick 10', type: 'draw', drawDays: 'Daily' },
      { name: 'Numbers', type: 'draw', drawDays: 'Daily' },
      { name: 'Win 4', type: 'draw', drawDays: 'Daily' },
      { name: 'Cash4Life', type: 'draw', drawDays: 'Daily' },
    ],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=NY',
    lotteryWebsite: 'https://nylottery.ny.gov',
    prohibited: false,
  },
  NJ: {
    code: 'NJ', name: 'New Jersey', flag: '🏙️',
    dataStatus: 'national-only',
    scratchOffApiUrl: null,
    drawGames: [
      ...NATIONAL_GAMES,
      { name: 'Pick-3', type: 'draw', drawDays: 'Daily' },
      { name: 'Pick-4', type: 'draw', drawDays: 'Daily' },
      { name: 'Cash 5', type: 'draw', drawDays: 'Daily' },
      { name: 'Jersey Cash 5', type: 'draw', drawDays: 'Daily' },
      { name: 'Pick-6', type: 'draw', drawDays: 'Mon/Thu' },
      { name: 'Cash4Life', type: 'draw', drawDays: 'Daily' },
    ],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=NJ',
    lotteryWebsite: 'https://www.njlottery.com',
    prohibited: false,
  },
  PA: {
    code: 'PA', name: 'Pennsylvania', flag: '🔔',
    dataStatus: 'national-only',
    scratchOffApiUrl: null,
    drawGames: [
      ...NATIONAL_GAMES,
      { name: 'Pick 2', type: 'draw', drawDays: 'Daily' },
      { name: 'Pick 3', type: 'draw', drawDays: 'Daily' },
      { name: 'Pick 4', type: 'draw', drawDays: 'Daily' },
      { name: 'Pick 5', type: 'draw', drawDays: 'Daily' },
      { name: 'Cash 5', type: 'draw', drawDays: 'Daily' },
      { name: 'Match 6', type: 'draw', drawDays: 'Mon/Thu' },
      { name: 'Treasure Hunt', type: 'draw', drawDays: 'Daily' },
    ],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=PA',
    lotteryWebsite: 'https://www.palottery.state.pa.us',
    prohibited: false,
  },
  CT: {
    code: 'CT', name: 'Connecticut', flag: '🌿',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Classic Lotto', type: 'draw', drawDays: 'Daily' }, { name: 'Play3', type: 'draw', drawDays: 'Daily' }, { name: 'Play4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash5', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=CT',
    lotteryWebsite: 'https://www.ctlottery.org', prohibited: false,
  },
  MA: {
    code: 'MA', name: 'Massachusetts', flag: '🦞',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Mass Cash', type: 'draw', drawDays: 'Daily' }, { name: 'Keno', type: 'draw', drawDays: 'Daily' }, { name: 'Numbers Game', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky for Life', type: 'draw', drawDays: 'Mon/Thu' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=MA',
    lotteryWebsite: 'https://www.masslottery.com', prohibited: false,
  },
  FL: {
    code: 'FL', name: 'Florida', flag: '🌴',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Florida Lotto', type: 'draw', drawDays: 'Sat' }, { name: 'Pick 2', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 5', type: 'draw', drawDays: 'Daily' }, { name: 'Fantasy 5', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky Money', type: 'draw', drawDays: 'Tue/Fri' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=FL',
    lotteryWebsite: 'https://www.flalottery.com', prohibited: false,
  },
  TX: {
    code: 'TX', name: 'Texas', flag: '⭐',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Texas Two Step', type: 'draw', drawDays: 'Mon/Thu' }, { name: 'Lotto Texas', type: 'draw', drawDays: 'Wed/Sat' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash Five', type: 'draw', drawDays: 'Daily' }, { name: 'All or Nothing', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=TX',
    lotteryWebsite: 'https://www.txlottery.org', prohibited: false,
  },
  CA: {
    code: 'CA', name: 'California', flag: '🌅',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'SuperLotto Plus', type: 'draw', drawDays: 'Wed/Sat' }, { name: 'Fantasy 5', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 3', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 4', type: 'draw', drawDays: 'Daily' }, { name: 'Daily Derby', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=CA',
    lotteryWebsite: 'https://www.calottery.com', prohibited: false,
  },
  IL: {
    code: 'IL', name: 'Illinois', flag: '🌽',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Lotto', type: 'draw', drawDays: 'Mon/Thu/Sat' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky Day Lotto', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 5', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=IL',
    lotteryWebsite: 'https://www.illinoislottery.com', prohibited: false,
  },
  OH: {
    code: 'OH', name: 'Ohio', flag: '🌰',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Classic Lotto 47', type: 'draw', drawDays: 'Mon/Wed/Sat' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 5', type: 'draw', drawDays: 'Daily' }, { name: 'Rolling Cash 5', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky for Life', type: 'draw', drawDays: 'Mon/Thu' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=OH',
    lotteryWebsite: 'https://www.ohiolottery.com', prohibited: false,
  },
  MI: {
    code: 'MI', name: 'Michigan', flag: '🚗',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Classic Lotto 47', type: 'draw', drawDays: 'Mon/Wed/Sat' }, { name: 'Fantasy 5', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 3', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 4', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky for Life', type: 'draw', drawDays: 'Mon/Thu' }, { name: 'Keno', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=MI',
    lotteryWebsite: 'https://www.michiganlottery.com', prohibited: false,
  },
  GA: {
    code: 'GA', name: 'Georgia', flag: '🍑',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Georgia Five', type: 'draw', drawDays: 'Daily' }, { name: 'Fantasy 5', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 3', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash Pop', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=GA',
    lotteryWebsite: 'https://www.galottery.com', prohibited: false,
  },
  VA: {
    code: 'VA', name: 'Virginia', flag: '🌹',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 5', type: 'draw', drawDays: 'Daily' }, { name: 'Bank a Million', type: 'draw', drawDays: 'Wed/Sat' }, { name: 'Cash Pop', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=VA',
    lotteryWebsite: 'https://www.valottery.com', prohibited: false,
  },
  MD: {
    code: 'MD', name: 'Maryland', flag: '🦀',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 5', type: 'draw', drawDays: 'Daily' }, { name: 'Bonus Match 5', type: 'draw', drawDays: 'Daily' }, { name: 'MultiMatch', type: 'draw', drawDays: 'Mon/Thu' }, { name: 'Cash4Life', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=MD',
    lotteryWebsite: 'https://www.mdlottery.com', prohibited: false,
  },
  NC: {
    code: 'NC', name: 'North Carolina', flag: '🌲',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 5', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky for Life', type: 'draw', drawDays: 'Mon/Thu' }, { name: 'Carolina Cash 7', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=NC',
    lotteryWebsite: 'https://www.nclottery.com', prohibited: false,
  },
  SC: {
    code: 'SC', name: 'South Carolina', flag: '🌙',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 5', type: 'draw', drawDays: 'Daily' }, { name: 'Palmetto Cash 5', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=SC',
    lotteryWebsite: 'https://www.sclottery.com', prohibited: false,
  },
  TN: {
    code: 'TN', name: 'Tennessee', flag: '🎸',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Tennessee Cash', type: 'draw', drawDays: 'Tue/Fri' }, { name: 'Cash 3', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash4Life', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=TN',
    lotteryWebsite: 'https://www.tnlottery.com', prohibited: false,
  },
  KY: {
    code: 'KY', name: 'Kentucky', flag: '🐴',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Cash Ball', type: 'draw', drawDays: 'Daily' }, { name: 'Keno', type: 'draw', drawDays: 'Daily' }, { name: '5 Card Cash', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=KY',
    lotteryWebsite: 'https://www.kylottery.com', prohibited: false,
  },
  IN: {
    code: 'IN', name: 'Indiana', flag: '🏎️',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Hoosier Lotto', type: 'draw', drawDays: 'Wed/Sat' }, { name: 'Quick Draw', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 5', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 3', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 4', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=IN',
    lotteryWebsite: 'https://www.in.gov/hoosierlottery', prohibited: false,
  },
  WI: {
    code: 'WI', name: 'Wisconsin', flag: '🧀',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Badger 5', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'SuperCash!', type: 'draw', drawDays: 'Daily' }, { name: 'All or Nothing', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=WI',
    lotteryWebsite: 'https://www.wilottery.com', prohibited: false,
  },
  MN: {
    code: 'MN', name: 'Minnesota', flag: '❄️',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Gopher 5', type: 'draw', drawDays: 'Daily' }, { name: 'Northstar Cash', type: 'draw', drawDays: 'Daily' }, { name: 'Daily 3', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky for Life', type: 'draw', drawDays: 'Mon/Thu' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=MN',
    lotteryWebsite: 'https://www.mnlottery.com', prohibited: false,
  },
  MO: {
    code: 'MO', name: 'Missouri', flag: '🌉',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Lotto', type: 'draw', drawDays: 'Mon/Wed/Sat' }, { name: 'Show Me Cash', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }, { name: 'Club Keno', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=MO',
    lotteryWebsite: 'https://www.molottery.com', prohibited: false,
  },
  CO: {
    code: 'CO', name: 'Colorado', flag: '⛷️',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Colorado Lotto+', type: 'draw', drawDays: 'Mon/Wed/Sat' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'Cash 5', type: 'draw', drawDays: 'Daily' }, { name: 'Lucky for Life', type: 'draw', drawDays: 'Mon/Thu' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=CO',
    lotteryWebsite: 'https://www.coloradolottery.com', prohibited: false,
  },
  AZ: {
    code: 'AZ', name: 'Arizona', flag: '🌵',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'The Pick', type: 'draw', drawDays: 'Mon/Thu' }, { name: 'Fantasy 5', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 3', type: 'draw', drawDays: 'Daily' }, { name: 'All or Nothing', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=AZ',
    lotteryWebsite: 'https://www.arizonalottery.com', prohibited: false,
  },
  WA: {
    code: 'WA', name: 'Washington', flag: '🌧️',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Lotto', type: 'draw', drawDays: 'Wed/Sat' }, { name: 'Hit 5', type: 'draw', drawDays: 'Daily' }, { name: 'Match 4', type: 'draw', drawDays: 'Daily' }, { name: 'Daily Game', type: 'draw', drawDays: 'Daily' }, { name: 'Keno', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=WA',
    lotteryWebsite: 'https://www.walottery.com', prohibited: false,
  },
  OR: {
    code: 'OR', name: 'Oregon', flag: '🌲',
    dataStatus: 'national-only', scratchOffApiUrl: null,
    drawGames: [...NATIONAL_GAMES, { name: 'Megabucks', type: 'draw', drawDays: 'Wed/Sat' }, { name: 'Win for Life', type: 'draw', drawDays: 'Daily' }, { name: 'Pick 4', type: 'draw', drawDays: 'Daily' }],
    representativeUrl: 'https://openstates.org/find_your_legislator/?state=OR',
    lotteryWebsite: 'https://www.oregonlottery.org', prohibited: false,
  },
  // Remaining states with national-only status
  ...(['AR','DE','DC','ID','IA','KS','LA','ME','MT','NE','NH','NM','ND','OK','RI','SD','VT','WV','WY'].reduce((acc, code) => {
    const names: Record<string,string> = { AR:'Arkansas', DE:'Delaware', DC:'Washington D.C.', ID:'Idaho', IA:'Iowa', KS:'Kansas', LA:'Louisiana', ME:'Maine', MT:'Montana', NE:'Nebraska', NH:'New Hampshire', NM:'New Mexico', ND:'North Dakota', OK:'Oklahoma', RI:'Rhode Island', SD:'South Dakota', VT:'Vermont', WV:'West Virginia', WY:'Wyoming' };
    const flags: Record<string,string> = { AR:'🌾', DE:'🦅', DC:'🏛️', ID:'🥔', IA:'🌽', KS:'🌻', LA:'🎷', ME:'🦞', MT:'🏔️', NE:'🌾', NH:'🍁', NM:'☀️', ND:'🌾', OK:'🌾', RI:'⚓', SD:'🦅', VT:'🍁', WV:'⛰️', WY:'🦬' };
    acc[code] = { code, name: names[code], flag: flags[code] || '🎫', dataStatus: 'national-only', scratchOffApiUrl: null, drawGames: [...NATIONAL_GAMES], representativeUrl: `https://openstates.org/find_your_legislator/?state=${code}`, lotteryWebsite: null, prohibited: false };
    return acc;
  }, {} as Record<string, StateConfig>)),
  // Prohibited states
  AL: { code:'AL', name:'Alabama', flag:'🌸', dataStatus:'coming-soon', scratchOffApiUrl:null, drawGames:[], representativeUrl:'https://openstates.org/find_your_legislator/?state=AL', lotteryWebsite:null, prohibited:true },
  AK: { code:'AK', name:'Alaska', flag:'🐻', dataStatus:'coming-soon', scratchOffApiUrl:null, drawGames:[], representativeUrl:'https://openstates.org/find_your_legislator/?state=AK', lotteryWebsite:null, prohibited:true },
  HI: { code:'HI', name:'Hawaii', flag:'🌺', dataStatus:'coming-soon', scratchOffApiUrl:null, drawGames:[], representativeUrl:'https://openstates.org/find_your_legislator/?state=HI', lotteryWebsite:null, prohibited:true },
  MS: { code:'MS', name:'Mississippi', flag:'🎵', dataStatus:'coming-soon', scratchOffApiUrl:null, drawGames:[], representativeUrl:'https://openstates.org/find_your_legislator/?state=MS', lotteryWebsite:null, prohibited:true },
  NV: { code:'NV', name:'Nevada', flag:'🎰', dataStatus:'coming-soon', scratchOffApiUrl:null, drawGames:[], representativeUrl:'https://openstates.org/find_your_legislator/?state=NV', lotteryWebsite:null, prohibited:true },
  UT: { code:'UT', name:'Utah', flag:'🏜️', dataStatus:'coming-soon', scratchOffApiUrl:null, drawGames:[], representativeUrl:'https://openstates.org/find_your_legislator/?state=UT', lotteryWebsite:null, prohibited:true },
};

export const ALL_STATES = Object.values(STATE_CONFIGS).sort((a, b) => a.name.localeCompare(b.name));
export const ELIGIBLE_STATES = ALL_STATES.filter(s => !s.prohibited);
export const PROHIBITED_STATE_CODES = ALL_STATES.filter(s => s.prohibited).map(s => s.code);

export function getStateConfig(code: string): StateConfig | null {
  return STATE_CONFIGS[code?.toUpperCase()] || null;
}

export const SAMPLE_LETTER_TEMPLATE = (stateName: string) => `Subject: Request for Lottery Prize Transparency Data

Dear [Representative Name],

I am writing to request that ${stateName} publish its lottery scratch-off game remaining prize data as open, machine-readable public data — similar to what New York State currently provides through data.ny.gov.

New York publishes how many prizes remain for each scratch-off game, allowing players to make informed decisions about which tickets still have top prizes available. This transparency:

1. Protects consumers from unknowingly buying tickets from games where all major prizes have already been claimed
2. Builds public trust in the lottery system
3. Aligns with modern open government principles

The data already exists — state lottery commissions are required to track it internally. Making it publicly available costs little and benefits residents greatly.

I respectfully request that ${stateName} Lottery Commission publish remaining prize data for all scratch-off games in an open, machine-readable format (JSON/CSV) updated at least daily.

Thank you for your service and your consideration of this request.

Sincerely,
[Your Name]
[Your Address]
[Your City, ${stateName} ZIP]`;
