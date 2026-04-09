'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';
import { format, isToday } from 'date-fns';
import styles from '@/styles/calendar.module.css';
import { getMonthGrid } from '@/utils/calendarUtils';
import { useCursor } from '@/components/CustomCursor';

interface FloatingMiniCalendarProps {
  currentYear: number;
  currentMonth: number;
  onClick: () => void;
}

export default function FloatingMiniCalendar({ currentYear, currentMonth, onClick }: FloatingMiniCalendarProps) {
  const [visible, setVisible] = useState(false);
  const miniRef = useRef<HTMLDivElement>(null);
  const days = useMemo(() => getMonthGrid(currentYear, currentMonth), [currentYear, currentMonth]);
  const { setCursorMode, setCursorTarget } = useCursor();
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    if (!miniRef.current) return;
    
    gsap.to(miniRef.current, {
      opacity: visible ? 1 : 0,
      y: visible ? 0 : 20,
      pointerEvents: visible ? 'auto' : 'none',
      duration: 0.3,
      ease: 'power2.out'
    });
  }, [visible]);

  return (
    <div 
      ref={miniRef}
      className={styles.floatingMiniCalendar}
      onClick={onClick}
      style={{ opacity: 0, transform: 'translateY(20px)' }}
      onMouseEnter={(e) => {
        setCursorTarget(e.currentTarget as HTMLElement);
        setCursorMode('mini-hover');
      }}
      onMouseLeave={() => {
        setCursorTarget(null);
        setCursorMode('default');
      }}
      onFocus={(e) => {
        setCursorTarget(e.currentTarget as HTMLElement);
        setCursorMode('mini-hover');
      }}
      onBlur={() => {
        setCursorTarget(null);
        setCursorMode('default');
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Jump to main calendar"
      title="Back to main calendar"
    >
      <div className={styles.miniCalendarHeader}>
        {format(new Date(currentYear, currentMonth), 'MMMM yyyy')}
      </div>
      <div className={styles.miniCalendarGrid}>
        {days.map(day => (
          <div 
            key={day.formattedDate}
            className={[
              styles.miniCalendarDay,
              !day.isCurrentMonth && styles.miniCalendarOtherMonth,
              isToday(day.date) && styles.miniCalendarToday
            ].filter(Boolean).join(' ')}
            aria-hidden="true"
          >
            {day.isCurrentMonth && day.dayOfMonth}
          </div>
        ))}
      </div>
    </div>
  );
}