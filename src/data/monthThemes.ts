export interface MonthTheme {
  name: string;
  image: string;
  accentColor: string;
  accentGradient: string;
  description: string;
  season: 'cold' | 'dry' | 'monsoon' | 'autumn' | 'mild';
  particle: 'snow' | 'yellow' | 'leaves' | 'rain' | 'droplets';
}

export const MONTH_THEMES: MonthTheme[] = [
  {
    name: 'January',
    image: '/images/months/january.png',
    accentColor: '#2196F3',
    accentGradient: 'linear-gradient(135deg, #1976D2, #42A5F5)',
    description: 'Foggy winter mornings in north India',
    season: 'cold',
    particle: 'snow',
  },
  {
    name: 'February',
    image: '/images/months/february.png',
    accentColor: '#E91E63',
    accentGradient: 'linear-gradient(135deg, #C2185B, #F06292)',
    description: 'Crisp air and soft late-winter sunlight',
    season: 'cold',
    particle: 'snow',
  },
  {
    name: 'March',
    image: '/images/months/march.png',
    accentColor: '#4CAF50',
    accentGradient: 'linear-gradient(135deg, #2E7D32, #66BB6A)',
    description: 'Spring fading into early summer dryness',
    season: 'dry',
    particle: 'yellow',
  },
  {
    name: 'April',
    image: '/images/months/april.png',
    accentColor: '#0EA5E9',
    accentGradient: 'linear-gradient(135deg, #0284C7, #38BDF8)',
    description: 'Dry heat and amber skies before peak summer',
    season: 'dry',
    particle: 'yellow',
  },
  {
    name: 'May',
    image: '/images/months/may.png',
    accentColor: '#8BC34A',
    accentGradient: 'linear-gradient(135deg, #558B2F, #9CCC65)',
    description: 'Peak Indian summer with blazing afternoons',
    season: 'dry',
    particle: 'yellow',
  },
  {
    name: 'June',
    image: '/images/months/june.png',
    accentColor: '#FF9800',
    accentGradient: 'linear-gradient(135deg, #EF6C00, #FFB74D)',
    description: 'First monsoon showers and cooling winds',
    season: 'monsoon',
    particle: 'rain',
  },
  {
    name: 'July',
    image: '/images/months/july.png',
    accentColor: '#F44336',
    accentGradient: 'linear-gradient(135deg, #C62828, #EF5350)',
    description: 'Deep monsoon greenery and rainwashed horizons',
    season: 'monsoon',
    particle: 'rain',
  },
  {
    name: 'August',
    image: '/images/months/august.png',
    accentColor: '#FF5722',
    accentGradient: 'linear-gradient(135deg, #D84315, #FF8A65)',
    description: 'Lush landscapes under active monsoon skies',
    season: 'monsoon',
    particle: 'droplets',
  },
  {
    name: 'September',
    image: '/images/months/september.png',
    accentColor: '#795548',
    accentGradient: 'linear-gradient(135deg, #4E342E, #8D6E63)',
    description: 'Retreating rains and cleaner blue skies',
    season: 'mild',
    particle: 'rain',
  },
  {
    name: 'October',
    image: '/images/months/october.png',
    accentColor: '#FF6F00',
    accentGradient: 'linear-gradient(135deg, #E65100, #FFA726)',
    description: 'Post-monsoon autumn warmth and dry leaves',
    season: 'autumn',
    particle: 'leaves',
  },
  {
    name: 'November',
    image: '/images/months/november.png',
    accentColor: '#607D8B',
    accentGradient: 'linear-gradient(135deg, #37474F, #78909C)',
    description: 'Cool, dry autumn fields and golden evenings',
    season: 'autumn',
    particle: 'leaves',
  },
  {
    name: 'December',
    image: '/images/months/december.png',
    accentColor: '#3F51B5',
    accentGradient: 'linear-gradient(135deg, #283593, #7986CB)',
    description: 'Northern chill and misty winter landscapes',
    season: 'cold',
    particle: 'snow',
  },
];

export function getMonthTheme(month: number): MonthTheme {
  return MONTH_THEMES[month];
}
