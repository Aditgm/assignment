'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { navigateMonth } from '@/utils/calendarUtils';

export type NavDirection = 'next' | 'prev';

export function useCalendarNavigation(initialDate: Date) {
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [navDirectionState, setNavDirectionState] = useState<NavDirection>('next');
  const [isGridLoading, setIsGridLoading] = useState(true);

  const navDirectionRef = useRef<NavDirection>('next');
  const yearRef = useRef(currentYear);
  const monthRef = useRef(currentMonth);
  const touchStartXRef = useRef(0);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    yearRef.current = currentYear;
    monthRef.current = currentMonth;
  }, [currentYear, currentMonth]);

  const goToMonth = useCallback((direction: NavDirection) => {
    navDirectionRef.current = direction;
    setNavDirectionState(direction);
    setIsGridLoading(true);

    const { year, month } = navigateMonth(yearRef.current, monthRef.current, direction);
    setCurrentYear(year);
    setCurrentMonth(month);
    return { year, month };
  }, []);

  const goToToday = useCallback((today: Date) => {
    navDirectionRef.current = 'next';
    setNavDirectionState('next');
    setIsGridLoading(true);

    const year = today.getFullYear();
    const month = today.getMonth();
    setCurrentYear(year);
    setCurrentMonth(month);
    return { year, month };
  }, []);

  return {
    currentYear,
    currentMonth,
    navDirectionState,
    navDirectionRef,
    isGridLoading,
    setIsGridLoading,
    yearRef,
    monthRef,
    touchStartXRef,
    touchStartYRef,
    goToMonth,
    goToToday,
  };
}
