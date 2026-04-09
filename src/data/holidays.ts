export interface Holiday {
  name: string;
  emoji: string;
  date: string;
}

export const HOLIDAYS: Holiday[] = [
  { name: "New Year's Day", emoji: '🎉', date: '01-01' },
  { name: "Valentine's Day", emoji: '❤️', date: '02-14' },
  { name: "St. Patrick's Day", emoji: '🍀', date: '03-17' },
  { name: 'April Fools', emoji: '🤡', date: '04-01' },
  { name: 'Earth Day', emoji: '🌍', date: '04-22' },
  { name: 'Labor Day', emoji: '⚒️', date: '05-01' },
  { name: "Mother's Day", emoji: '💐', date: '05-11' },
  { name: "Father's Day", emoji: '👔', date: '06-15' },
  { name: 'Independence Day', emoji: '🇺🇸', date: '07-04' },
  { name: 'Halloween', emoji: '🎃', date: '10-31' },
  { name: 'Christmas Eve', emoji: '🎄', date: '12-24' },
  { name: 'Christmas', emoji: '🎅', date: '12-25' },
  { name: "New Year's Eve", emoji: '✨', date: '12-31' },
  { name: 'World Music Day', emoji: '🎵', date: '06-21' },
  { name: 'Diwali Season', emoji: '🪔', date: '10-20' },
  { name: 'Holi', emoji: '🎨', date: '03-14' },
  { name: 'Republic Day', emoji: '🇮🇳', date: '01-26' },
  { name: 'Independence Day (IN)', emoji: '🇮🇳', date: '08-15' },
];

export function getHolidaysForMonth(month: number): Holiday[] {
  const mm = String(month + 1).padStart(2, '0');
  return HOLIDAYS.filter((h) => h.date.startsWith(mm + '-'));
}

export function getHolidayForDate(month: number, day: number): Holiday | undefined {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return HOLIDAYS.find((h) => h.date === `${mm}-${dd}`);
}
