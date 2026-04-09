'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from '@/styles/calendar.module.css';

interface CalendarHangerProps {
  onSecretTrigger?: () => void;
}

export default function CalendarHanger({ onSecretTrigger }: CalendarHangerProps) {
  const [pinClicks, setPinClicks] = useState(0);
  const resetTimerRef = useRef<number | null>(null);

  const handlePinClick = useCallback(() => {
    setPinClicks((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        onSecretTrigger?.();
        return 0;
      }
      return next;
    });

    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => setPinClicks(0), 2200);
  }, [onSecretTrigger]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  return (
    <div className={styles.calendarHanger} aria-hidden="true">
      <div className={styles.hangerShadow} />
      <div className={styles.hangerRing}>
        <button
          type="button"
          className={styles.hangerPin}
          onClick={handlePinClick}
          aria-hidden="true"
          tabIndex={-1}
          title={`Pin taps: ${pinClicks}/5`}
        />
      </div>
    </div>
  );
}
