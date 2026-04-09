'use client';

import React, { useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { format, isSameDay, isBefore } from 'date-fns';
import styles from '@/styles/calendar.module.css';
import { DayInfo, DateRange, isInRange, isRangeStart, isRangeEnd, WEEKDAYS } from '@/utils/calendarUtils';
import { getHolidayForDate } from '@/data/holidays';
import { useCursor } from '@/components/CustomCursor';
import { useSound } from '@/components/SoundProvider';

interface CalendarGridProps {
  days: DayInfo[];
  currentMonth: number;
  currentYear: number;
  selectedRange: DateRange;
  isLoading: boolean;
  timeOfDay: 'morning' | 'afternoon' | 'night';
  selectingStart: boolean;
  hoveredDate: Date | null;
  expandedDate: Date | null;
  onDayClick: (date: Date, isCurrentMonth: boolean) => void;
  onDayDoubleClick: (date: Date, isCurrentMonth: boolean) => void;
  onDayHover: (date: Date | null) => void;
  onDayKeyDown: (e: React.KeyboardEvent, date: Date, isCurrentMonth: boolean) => void;
}

export default function CalendarGrid({
  days,
  currentMonth,
  currentYear,
  selectedRange,
  isLoading,
  timeOfDay,
  selectingStart,
  hoveredDate,
  expandedDate,
  onDayClick,
  onDayDoubleClick,
  onDayHover,
  onDayKeyDown,
}: CalendarGridProps) {
  const daysRef = useRef<HTMLDivElement>(null);
  const previousRangeRects = useRef<Map<string, DOMRect>>(new Map());
  const previousLayoutRects = useRef<Map<string, DOMRect>>(new Map());
  const { setCursorMode, setCursorTarget } = useCursor();
  const { playDayClick, playHolidayHover } = useSound();
  useEffect(() => {
    if (!daysRef.current || isLoading) return;
    const cells = daysRef.current.querySelectorAll(`.${styles.dayCell}`);

    gsap.fromTo(cells,
      { opacity: 0, y: 12, scale: 0.9 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        stagger: { amount: 0.3, from: 'start' },
        ease: 'power2.out',
        clearProps: 'all',
      }
    );
  }, [currentYear, currentMonth, isLoading]);
  useEffect(() => {
    if (!selectedRange.end || !daysRef.current || isLoading) return;
    
    const rangeCells = daysRef.current.querySelectorAll(`.${styles.inRange}`);
    if (rangeCells.length === 0) return;

    const hasEndpoints = Boolean(selectedRange.start && selectedRange.end);
    const fromRight = selectedRange.start && selectedRange.end
      ? isBefore(selectedRange.end, selectedRange.start)
      : false;

    const rootStyles = getComputedStyle(document.documentElement);
    const baseRangeColor = rootStyles.getPropertyValue('--range-bg').trim() || 'rgba(14, 165, 233, 0.08)';
    const flashColor = rootStyles.getPropertyValue('--accent').trim() || '#0EA5E9';
    const spreadFrom = hasEndpoints ? 'edges' : 'start';

    gsap.killTweensOf(rangeCells);
    
    gsap.fromTo(rangeCells,
      { scaleX: 0, transformOrigin: fromRight ? 'right center' : 'left center' },
      {
        scaleX: 1,
        duration: 0.42,
        stagger: { each: 0.02, from: spreadFrom },
        ease: 'power2.out',
        clearProps: 'all'
      }
    );

    gsap.fromTo(rangeCells,
      { backgroundColor: flashColor, filter: 'brightness(1.14)' },
      {
        backgroundColor: baseRangeColor,
        filter: 'brightness(1)',
        duration: 0.5,
        stagger: { each: 0.02, from: spreadFrom },
        ease: 'power1.out',
        onComplete: () => {
          gsap.set(rangeCells, { clearProps: 'backgroundColor,filter' });
        },
      }
    );
  }, [selectedRange.start, selectedRange.end, isLoading]);
  useEffect(() => {
    if (!daysRef.current || isLoading) return;
    
    const expandedCell = daysRef.current.querySelector(`.${styles.expanded}`);
    if (expandedCell) {
      gsap.fromTo(expandedCell,
        { scale: 0.9, rotateY: -15, opacity: 0 },
        { scale: 1.05, rotateY: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [expandedDate, isLoading]);
  useLayoutEffect(() => {
    if (!daysRef.current || isLoading) return;

    const cells = Array.from(daysRef.current.querySelectorAll<HTMLElement>(`.${styles.dayCell}`));
    const nextRects = new Map<string, DOMRect>();

    cells.forEach((cell) => {
      const dateKey = cell.dataset.dateKey;
      if (!dateKey) return;

      const nextRect = cell.getBoundingClientRect();
      nextRects.set(dateKey, nextRect);

      const prevRect = previousLayoutRects.current.get(dateKey);
      if (!prevRect) return;

      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      const sx = prevRect.width / nextRect.width;
      const sy = prevRect.height / nextRect.height;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.02 && Math.abs(sy - 1) < 0.02) {
        return;
      }

      gsap.fromTo(cell,
        {
          x: dx,
          y: dy,
          scaleX: sx,
          scaleY: sy,
          transformOrigin: 'center center',
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.44,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    });

    previousLayoutRects.current = nextRects;
  }, [expandedDate, isLoading, currentMonth, currentYear]);
  useLayoutEffect(() => {
    if (!daysRef.current || isLoading) return;

    const activeCells = Array.from(
      daysRef.current.querySelectorAll<HTMLElement>('[data-range-active="true"]')
    );

    const nextRects = new Map<string, DOMRect>();

    activeCells.forEach((cell) => {
      const dateKey = cell.dataset.dateKey;
      if (!dateKey) return;

      const nextRect = cell.getBoundingClientRect();
      nextRects.set(dateKey, nextRect);

      const prevRect = previousRangeRects.current.get(dateKey);
      if (!prevRect) {
        gsap.fromTo(
          cell,
          { opacity: 0, scale: 0.92 },
          { opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'all' }
        );
        return;
      }

      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      const sx = prevRect.width / nextRect.width;
      const sy = prevRect.height / nextRect.height;

      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && Math.abs(sx - 1) < 0.02 && Math.abs(sy - 1) < 0.02) {
        return;
      }

      gsap.fromTo(
        cell,
        {
          x: dx,
          y: dy,
          scaleX: sx,
          scaleY: sy,
          transformOrigin: 'center center',
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          duration: 0.38,
          ease: 'power3.out',
          clearProps: 'all',
        }
      );
    });

    previousRangeRects.current = nextRects;
  }, [selectedRange.start, selectedRange.end, isLoading]);
  const getTentativeRange = (): DateRange => {
    if (selectingStart || !selectedRange.start || !hoveredDate) {
      return { start: null, end: null };
    }
    return { start: selectedRange.start, end: hoveredDate };
  };

  const tentativeRange = getTentativeRange();

  const handleDayMouseEnter = useCallback((e: React.MouseEvent, date: Date, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) return;
    onDayHover(date);
    setCursorTarget(e.currentTarget as HTMLElement);
    setCursorMode(!selectingStart && selectedRange.start ? 'selecting' : 'day-hover');
  }, [onDayHover, setCursorMode, setCursorTarget, selectingStart, selectedRange.start]);

  const handleDayMouseLeave = useCallback(() => {
    onDayHover(null);
    setCursorTarget(null);
    setCursorMode('default');
  }, [onDayHover, setCursorMode, setCursorTarget]);

  const todayTimeLabel = timeOfDay === 'morning'
    ? 'Morning'
    : timeOfDay === 'night'
    ? 'Night'
    : 'Afternoon';

  const spawnDayRipple = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const cell = event.currentTarget;
    const rect = cell.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = styles.dayClickRipple;

    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    ripple.style.left = `${offsetX}px`;
    ripple.style.top = `${offsetY}px`;
    ripple.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'var(--accent)';

    cell.appendChild(ripple);

    gsap.fromTo(ripple,
      {
        xPercent: -50,
        yPercent: -50,
        scale: 0,
        opacity: 0.3,
      },
      {
        scale: 4,
        opacity: 0,
        duration: 0.48,
        ease: 'power2.out',
        onComplete: () => ripple.remove(),
      }
    );
  }, []);

  const handleHolidayBadgeEnter = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    const badge = event.currentTarget;
    gsap.fromTo(
      badge,
      { scale: 1, rotate: 0 },
      {
        scale: 1.4,
        rotate: 15,
        duration: 0.58,
        ease: 'elastic.out(1, 0.45)',
        yoyo: true,
        repeat: 1,
      }
    );
    playHolidayHover();
  }, [playHolidayHover]);

  return (
    <div className={styles.calendarSection}>
      <div className={styles.selectionHint}>
        {!selectingStart && selectedRange.start && (
          <span className={styles.selectionHintText} role="status" aria-live="polite">
            Click an end date to complete your selection
          </span>
        )}
      </div>
      <div className={styles.weekdayHeader}>
        {WEEKDAYS.map((day, i) => (
          <div
            key={day}
            className={`${styles.weekdayCell} ${i >= 5 ? styles.weekendHeader : ''}`}
          >
            {day}
          </div>
        ))}
      </div>
      <div className={styles.daysGrid} ref={daysRef}>
        {isLoading
          ? Array.from({ length: 42 }, (_, idx) => (
              <div key={`skeleton-${idx}`} className={styles.dayCellSkeleton} aria-hidden="true">
                <span className={styles.dayCellShimmer} />
              </div>
            ))
          : days.map((day, dayIndex) => {
          const holiday = day.isCurrentMonth ? getHolidayForDate(currentMonth, day.dayOfMonth) : undefined;
          const isExpanded = expandedDate && isSameDay(day.date, expandedDate);
          const isTopRow = dayIndex < 7;
          const inRange = isInRange(day.date, selectedRange);
          const isStart = isRangeStart(day.date, selectedRange);
          const isEnd = isRangeEnd(day.date, selectedRange);
          const inTentative = tentativeRange.start && tentativeRange.end
            ? isInRange(day.date, tentativeRange)
            : false;
          const isTentStart = tentativeRange.start && tentativeRange.end
            ? isRangeStart(day.date, tentativeRange)
            : false;
          const isTentEnd = tentativeRange.start && tentativeRange.end
            ? isRangeEnd(day.date, tentativeRange)
            : false;

          const classNames = [
            styles.dayCell,
            !day.isCurrentMonth && styles.otherMonth,
            day.isWeekend && day.isCurrentMonth && styles.weekend,
            day.isToday && day.isCurrentMonth && styles.today,
            isStart && styles.rangeStart,
            isEnd && styles.rangeEnd,
            inRange && !isStart && !isEnd && styles.inRange,
            isExpanded && styles.expanded,
            expandedDate && !isExpanded && styles.dayCellDimmed,
            !selectedRange.end && isTentStart && styles.tentativeStart,
            !selectedRange.end && isTentEnd && styles.tentativeEnd,
            !selectedRange.end && inTentative && !isTentStart && !isTentEnd && styles.tentativeRange,
            !selectingStart && day.isCurrentMonth && styles.selectingEnd,
          ].filter(Boolean).join(' ');

          return (
            <div
                key={day.formattedDate}
                className={classNames}
                data-date-key={day.formattedDate}
                data-range-active={inRange || isStart || isEnd ? 'true' : 'false'}
                onClick={(e) => {
                  spawnDayRipple(e);
                  onDayClick(day.date, day.isCurrentMonth);
                  if (day.isCurrentMonth) playDayClick();
                }}
                onDoubleClick={() => onDayDoubleClick(day.date, day.isCurrentMonth)}
              onMouseEnter={(e) => handleDayMouseEnter(e, day.date, day.isCurrentMonth)}
              onMouseLeave={handleDayMouseLeave}
              onKeyDown={(e) => onDayKeyDown(e, day.date, day.isCurrentMonth)}
              role="button"
              tabIndex={day.isCurrentMonth ? 0 : -1}
              aria-label={format(day.date, 'EEEE, MMMM d, yyyy')}
              aria-pressed={day.isCurrentMonth ? (inRange || isStart || isEnd) : undefined}
            >
              {!isExpanded ? (
                <>
                  <span className={styles.dayNumber}>{day.dayOfMonth}</span>
                  {holiday && (
                    <>
                      <span className={styles.holidayBadge} onMouseEnter={handleHolidayBadgeEnter}>{holiday.emoji}</span>
                      <span className={`${styles.holidayTooltip} ${isTopRow ? styles.holidayTooltipBelow : ''}`}>{holiday.name}</span>
                    </>
                  )}
                  {day.isToday && day.isCurrentMonth && (
                    <span className={styles.todayTimeIndicator} aria-label={`Time of day: ${todayTimeLabel}`}>
                      {todayTimeLabel}
                    </span>
                  )}
                </>
              ) : (
                <div className={styles.dayDetailExpanded}>
                  <div className={styles.dayDetailHeader}>
                    <span className={styles.dayDetailDate}>
                      {format(day.date, 'EEEE')}
                    </span>
                    <span className={styles.dayDetailNumber}>{day.dayOfMonth}</span>
                  </div>
                  {holiday && (
                    <div className={styles.dayDetailHoliday}>
                      {holiday.emoji} {holiday.name}
                    </div>
                  )}
                  <button 
                    className={styles.dayDetailClose}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayDoubleClick(day.date, day.isCurrentMonth);
                    }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
