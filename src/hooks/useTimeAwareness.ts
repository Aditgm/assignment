'use client';

import { useCallback, useEffect, useState } from 'react';

export type TimeOfDay = 'morning' | 'afternoon' | 'night';

export function useTimeAwareness() {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('afternoon');
  const [nightSuggestionDismissed, setNightSuggestionDismissed] = useState(false);

  const getCurrentTimeOfDay = useCallback((): TimeOfDay => {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 18) return 'afternoon';
    return 'night';
  }, []);

  useEffect(() => {
    const updateTimeOfDay = () => setTimeOfDay(getCurrentTimeOfDay());
    updateTimeOfDay();

    const timer = window.setInterval(updateTimeOfDay, 60_000);
    return () => window.clearInterval(timer);
  }, [getCurrentTimeOfDay]);

  return {
    timeOfDay,
    nightSuggestionDismissed,
    setNightSuggestionDismissed,
  };
}
