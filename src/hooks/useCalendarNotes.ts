'use client';

import { useCallback, useRef, useState } from 'react';
import { getNotesKey, loadFromStorage, saveToStorage } from '@/utils/storage';

export function useCalendarNotes(initialYear: number, initialMonth: number) {
  const [notes, setNotes] = useState(() => loadFromStorage<string>(getNotesKey(initialYear, initialMonth), ''));
  const [mobileNotesOpen, setMobileNotesOpen] = useState(false);
  const periodRef = useRef({ year: initialYear, month: initialMonth });

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value);
    saveToStorage(getNotesKey(periodRef.current.year, periodRef.current.month), value);
  }, []);

  const syncNotesForMonth = useCallback((year: number, month: number) => {
    periodRef.current = { year, month };
    setNotes(loadFromStorage<string>(getNotesKey(year, month), ''));
  }, []);

  const toggleMobileNotes = useCallback(() => {
    setMobileNotesOpen((prev) => !prev);
  }, []);

  return {
    notes,
    mobileNotesOpen,
    setMobileNotesOpen,
    toggleMobileNotes,
    handleNotesChange,
    syncNotesForMonth,
  };
}
