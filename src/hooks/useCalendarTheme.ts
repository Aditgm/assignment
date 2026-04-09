'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadFromStorage, saveToStorage, THEME_KEY } from '@/utils/storage';

export type CalendarTheme = 'light' | 'dark';

export function useCalendarTheme() {
  const [theme, setTheme] = useState<CalendarTheme>(() => loadFromStorage<CalendarTheme>(THEME_KEY, 'light'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const applyTheme = useCallback((nextTheme: CalendarTheme) => {
    setTheme(nextTheme);
    saveToStorage(THEME_KEY, nextTheme);
    return nextTheme;
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: CalendarTheme = theme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    return nextTheme;
  }, [applyTheme, theme]);

  return {
    theme,
    applyTheme,
    toggleTheme,
  };
}
