import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  isWeekend,
  isBefore,
  isAfter,
  addMonths,
  subMonths,
} from 'date-fns';

export interface DayInfo {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  formattedDate: string;
}

export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export function getMonthGrid(year: number, month: number): DayInfo[] {
  const date = new Date(year, month);
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const today = new Date();

  return eachDayOfInterval({ start: gridStart, end: gridEnd }).map((day) => ({
    date: day,
    dayOfMonth: day.getDate(),
    isCurrentMonth: isSameMonth(day, date),
    isToday: isSameDay(day, today),
    isWeekend: isWeekend(day),
    formattedDate: format(day, 'yyyy-MM-dd'),
  }));
}

export function isInRange(date: Date, range: DateRange): boolean {
  if (!range.start || !range.end) return false;
  const start = isBefore(range.start, range.end) ? range.start : range.end;
  const end = isAfter(range.end, range.start) ? range.end : range.start;
  return isWithinInterval(date, { start, end });
}

export function isRangeStart(date: Date, range: DateRange): boolean {
  if (!range.start) return false;
  const actualStart = range.end && isBefore(range.end, range.start) ? range.end : range.start;
  return isSameDay(date, actualStart);
}

export function isRangeEnd(date: Date, range: DateRange): boolean {
  if (!range.end) return false;
  const actualEnd = isBefore(range.end, range.start!) ? range.start! : range.end;
  return isSameDay(date, actualEnd);
}

export function formatMonthYear(year: number, month: number): string {
  return format(new Date(year, month), 'MMMM yyyy');
}

export function getMonthName(month: number): string {
  return format(new Date(2026, month), 'MMMM');
}

export function navigateMonth(year: number, month: number, direction: 'prev' | 'next'): { year: number; month: number } {
  const current = new Date(year, month);
  const target = direction === 'next' ? addMonths(current, 1) : subMonths(current, 1);
  return { year: target.getFullYear(), month: target.getMonth() };
}

export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
