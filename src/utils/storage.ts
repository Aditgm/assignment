const isBrowser = typeof window !== 'undefined';

export function saveToStorage<T>(key: string, value: T): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn('localStorage save failed:', e);
  }
}

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (!isBrowser) return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.warn('localStorage load failed:', e);
    return fallback;
  }
}

export function getNotesKey(year: number, month: number): string {
  return `wall-cal-notes-${year}-${month}`;
}

export function getRangeNotesKey(rangeId: string): string {
  return `wall-cal-range-note-${rangeId}`;
}

export const THEME_KEY = 'wall-cal-theme';
export const RANGE_KEY = 'wall-cal-range';
