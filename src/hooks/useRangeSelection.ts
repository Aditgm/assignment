'use client';

import { useCallback, useState } from 'react';
import { isBefore, isSameDay } from 'date-fns';
import { DateRange } from '@/utils/calendarUtils';

export function useRangeSelection() {
  const [selectedRange, setSelectedRange] = useState<DateRange>({ start: null, end: null });
  const [selectingStart, setSelectingStart] = useState(true);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);
  const [expandedDate, setExpandedDate] = useState<Date | null>(null);

  const handleDayClick = useCallback((date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;

    let vibrationMs: number | null = null;

    setSelectedRange((prev) => {
      const { start } = prev;
      if (!start || prev.end !== null) {
        vibrationMs = 10;
        setSelectingStart(false);
        return { start: date, end: null };
      }

      vibrationMs = 15;
      setSelectingStart(true);
      setHoveredDate(null);

      if (isSameDay(date, start)) return { start: date, end: date };
      if (isBefore(date, start)) return { start: date, end: start };
      return { start, end: date };
    });

    const isMobileViewport = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
    if (vibrationMs && isMobileViewport && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(vibrationMs);
    }
  }, []);

  const handleDayHover = useCallback((date: Date | null) => {
    setHoveredDate(date);
  }, []);

  const handleDayDoubleClick = useCallback((date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    setExpandedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
  }, []);

  const clearRange = useCallback(() => {
    setSelectedRange({ start: null, end: null });
    setSelectingStart(true);
  }, []);

  const resetSelection = useCallback(() => {
    setSelectedRange({ start: null, end: null });
    setSelectingStart(true);
    setHoveredDate(null);
    setExpandedDate(null);
  }, []);

  return {
    selectedRange,
    selectingStart,
    hoveredDate,
    expandedDate,
    handleDayClick,
    handleDayHover,
    handleDayDoubleClick,
    clearRange,
    resetSelection,
  };
}
