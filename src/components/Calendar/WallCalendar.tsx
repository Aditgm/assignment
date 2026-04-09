'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { format, differenceInDays, isBefore } from 'date-fns';
import gsap from 'gsap';
import styles from '@/styles/calendar.module.css';
import { getMonthGrid } from '@/utils/calendarUtils';
import { getMonthTheme } from '@/data/monthThemes';
import { StickyNote, X, CalendarDays, MoonStar } from 'lucide-react';

import ThemeToggle from './ThemeToggle';
import CalendarHanger from './CalendarHanger';
import SpiralBinding from './SpiralBinding';
import HeroSection from './HeroSection';
import CalendarGrid from './CalendarGrid';
import NotesPanel from './NotesPanel';
import MonthNav from './MonthNav';
import ParticleOverlay from './ParticleOverlay';
import FloatingMiniCalendar from './FloatingMiniCalendar';
import { useParallax } from '@/components/ParallaxProvider';
import { useSound } from '@/components/SoundProvider';
import { useCalendarNavigation } from '@/hooks/useCalendarNavigation';
import { useRangeSelection } from '@/hooks/useRangeSelection';
import { useCalendarNotes } from '@/hooks/useCalendarNotes';
import { useTimeAwareness } from '@/hooks/useTimeAwareness';
import { useCalendarTheme } from '@/hooks/useCalendarTheme';

type TransitionOrigin = {
  x: number;
  y: number;
};

const hexToRgba = (hex: string, alpha: number) => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 3 && normalized.length !== 6) {
    return `rgba(14, 165, 233, ${alpha})`;
  }

  const full = normalized.length === 3
    ? normalized.split('').map((ch) => ch + ch).join('')
    : normalized;

  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export default function WallCalendar() {
  const today = useMemo(() => new Date(), []);
  const { theme, applyTheme, toggleTheme } = useCalendarTheme();
  const { timeOfDay, nightSuggestionDismissed, setNightSuggestionDismissed } = useTimeAwareness();
  const {
    currentYear,
    currentMonth,
    navDirectionState,
    isGridLoading,
    setIsGridLoading,
    yearRef,
    monthRef,
    touchStartXRef,
    touchStartYRef,
    goToMonth: goToMonthState,
    goToToday: goToTodayState,
  } = useCalendarNavigation(today);
  const {
    selectedRange,
    selectingStart,
    hoveredDate,
    expandedDate,
    handleDayClick: handleRangeDayClick,
    handleDayHover,
    handleDayDoubleClick,
    clearRange,
    resetSelection,
  } = useRangeSelection();
  const {
    notes,
    mobileNotesOpen,
    toggleMobileNotes,
    handleNotesChange,
    syncNotesForMonth,
  } = useCalendarNotes(today.getFullYear(), today.getMonth());

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  const [isSwinging, setIsSwinging] = useState(false);
  const [maskTransition, setMaskTransition] = useState<{ image: string } | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const swingTimeoutRef = useRef<number | null>(null);
  const nightSuggestionRef = useRef<HTMLDivElement>(null);
  const maskTransitionRef = useRef<HTMLDivElement>(null);
  const transitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const transitionPendingRef = useRef(false);
  
  const { registerLayer, unregisterLayer } = useParallax();
  const { playPageFlip } = useSound();

  useEffect(() => {
    registerLayer(calendarRef as React.RefObject<HTMLElement>, 1);
    return () => unregisterLayer(calendarRef as React.RefObject<HTMLElement>);
  }, [registerLayer, unregisterLayer]);

  const monthTheme = getMonthTheme(currentMonth);
  const monthDataCache = useMemo(() => {
    return {
      current: {
        year: currentYear,
        month: currentMonth,
        days: getMonthGrid(currentYear, currentMonth),
      },
    };
  }, [currentYear, currentMonth]);

  const days = monthDataCache.current.days;
  const wrapperStyle = {
    '--month-bg-image': `url(${monthTheme.image})`,
    '--month-accent-shadow': hexToRgba(monthTheme.accentColor, 0.26),
    '--month-accent-gradient': monthTheme.accentGradient,
  } as React.CSSProperties;
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const spiralCount = isMobile ? 16 : 22;

  useEffect(() => {
    if (!isGridLoading) return;
    const shimmerTimer = window.setTimeout(() => setIsGridLoading(false), 240);
    return () => window.clearTimeout(shimmerTimer);
  }, [isGridLoading, setIsGridLoading]);

  useEffect(() => {
    return () => {
      if (swingTimeoutRef.current) {
        window.clearTimeout(swingTimeoutRef.current);
      }

      transitionTimelineRef.current?.kill();
      transitionPendingRef.current = false;
    };
  }, []);

  const resolveTransitionOrigin = useCallback((origin?: TransitionOrigin) => {
    if (typeof window === 'undefined') {
      return { x: 0, y: 0 };
    }

    const fallback = {
      x: window.innerWidth * 0.5,
      y: window.innerHeight * 0.5,
    };

    if (!origin) {
      return fallback;
    }

    return {
      x: Math.min(Math.max(origin.x, 0), window.innerWidth),
      y: Math.min(Math.max(origin.y, 0), window.innerHeight),
    };
  }, []);

  const commitMonthNavigation = useCallback((direction: 'prev' | 'next') => {
    const { year, month } = goToMonthState(direction);
    syncNotesForMonth(year, month);
    resetSelection();
    playPageFlip();
  }, [goToMonthState, syncNotesForMonth, resetSelection, playPageFlip]);

  const goToMonth = useCallback((direction: 'prev' | 'next', origin?: TransitionOrigin) => {
    if (transitionPendingRef.current) {
      return;
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commitMonthNavigation(direction);
      return;
    }

    const transitionOrigin = resolveTransitionOrigin(origin);
    const delta = direction === 'next' ? 1 : -1;
    const nextDate = new Date(yearRef.current, monthRef.current + delta, 1);
    const nextTheme = getMonthTheme(nextDate.getMonth());

    transitionPendingRef.current = true;
    setMaskTransition({ image: nextTheme.image });

    window.requestAnimationFrame(() => {
      const maskElement = maskTransitionRef.current;

      if (!maskElement) {
        commitMonthNavigation(direction);
        transitionPendingRef.current = false;
        setMaskTransition(null);
        return;
      }

      const clipAnchor = `at ${Math.round(transitionOrigin.x)}px ${Math.round(transitionOrigin.y)}px`;
      const maxRadius = Math.ceil(
        Math.hypot(
          Math.max(transitionOrigin.x, window.innerWidth - transitionOrigin.x),
          Math.max(transitionOrigin.y, window.innerHeight - transitionOrigin.y)
        ) * 1.2
      );

      transitionTimelineRef.current?.kill();

      const timeline = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => {
          transitionPendingRef.current = false;
          setMaskTransition(null);
          gsap.set(maskElement, { clearProps: 'clipPath,opacity,willChange' });
        },
      });

      transitionTimelineRef.current = timeline;

      timeline.set(maskElement, {
        opacity: 1,
        clipPath: `circle(0px ${clipAnchor})`,
        willChange: 'clip-path, opacity',
      });

      timeline.to(maskElement, {
        clipPath: `circle(${maxRadius}px ${clipAnchor})`,
        duration: 0.72,
        ease: 'power3.inOut',
      });

      timeline.call(() => {
        commitMonthNavigation(direction);
      }, undefined, 0.24);

      timeline.to(maskElement, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out',
      }, 0.54);
    });
  }, [commitMonthNavigation, monthRef, resolveTransitionOrigin, yearRef]);

  const handleThemeToggle = useCallback(() => {
    const nextTheme = toggleTheme();
    if (nextTheme === 'dark') {
      setNightSuggestionDismissed(true);
    }
  }, [setNightSuggestionDismissed, toggleTheme]);

  const applyNightTheme = useCallback(() => {
    applyTheme('dark');
    setNightSuggestionDismissed(true);
  }, [applyTheme, setNightSuggestionDismissed]);

  const dismissNightSuggestion = useCallback(() => {
    if (!nightSuggestionRef.current) {
      setNightSuggestionDismissed(true);
      return;
    }

    gsap.to(nightSuggestionRef.current, {
      xPercent: 120,
      scale: 0.9,
      opacity: 0,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: () => setNightSuggestionDismissed(true),
    });
  }, [setNightSuggestionDismissed]);

  const handleNightSuggestionSwitch = useCallback(() => {
    if (!nightSuggestionRef.current) {
      applyNightTheme();
      return;
    }

    gsap.to(nightSuggestionRef.current, {
      xPercent: 120,
      scale: 0.9,
      opacity: 0,
      duration: 0.32,
      ease: 'power2.in',
      onComplete: applyNightTheme,
    });
  }, [applyNightTheme]);

  const handleDayClick = useCallback((date: Date, isCurrentMonth: boolean) => {
    handleRangeDayClick(date, isCurrentMonth);
  }, [handleRangeDayClick]);

  const handleDayKeyDown = useCallback((e: React.KeyboardEvent, date: Date, isCurrentMonth: boolean) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRangeDayClick(date, isCurrentMonth);
    }
  }, [handleRangeDayClick]);

  const goToToday = useCallback(() => {
    if (transitionPendingRef.current) {
      return;
    }

    const { year, month } = goToTodayState(today);
    syncNotesForMonth(year, month);
    resetSelection();
    playPageFlip();
  }, [goToTodayState, today, syncNotesForMonth, resetSelection, playPageFlip]);

  const handleMiniCalendarClick = useCallback(() => {
    if (!calendarRef.current) return;
    calendarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const triggerSwingEasterEgg = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    setIsSwinging(false);
    window.requestAnimationFrame(() => {
      setIsSwinging(true);
    });

    if (swingTimeoutRef.current) {
      window.clearTimeout(swingTimeoutRef.current);
    }
    swingTimeoutRef.current = window.setTimeout(() => setIsSwinging(false), 1300);
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      if ((e.target as HTMLElement)?.tagName === 'TEXTAREA') return;

      goToMonth(e.key === 'ArrowLeft' ? 'prev' : 'next');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToMonth]);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  }, [touchStartXRef, touchStartYRef]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartXRef.current;
    const dy = e.changedTouches[0].clientY - touchStartYRef.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goToMonth(dx > 0 ? 'prev' : 'next');
    }
  }, [goToMonth, touchStartXRef, touchStartYRef]);
  const rangeDays = selectedRange.start && selectedRange.end
    ? Math.abs(differenceInDays(selectedRange.end, selectedRange.start)) + 1
    : 0;

  const rangeLabel = selectedRange.start && selectedRange.end
    ? `${format(
        isBefore(selectedRange.start, selectedRange.end) ? selectedRange.start : selectedRange.end,
        'MMM d'
      )} — ${format(
        isBefore(selectedRange.start, selectedRange.end) ? selectedRange.end : selectedRange.start,
        'MMM d'
      )}`
    : selectedRange.start
    ? `Select end date...`
    : null;

  const atmosphereClass = monthTheme.season === 'cold'
    ? styles.atmosphereWinter
    : monthTheme.season === 'monsoon'
    ? styles.atmosphereMonsoon
    : monthTheme.season === 'dry'
    ? styles.atmosphereSummer
    : styles.atmosphereMild;

  const timeClass = timeOfDay === 'morning'
    ? styles.timeMorning
    : timeOfDay === 'night'
    ? styles.timeNight
    : styles.timeAfternoon;

  const showNightSuggestion = timeOfDay === 'night' && theme === 'light' && !nightSuggestionDismissed;

  useEffect(() => {
    if (!showNightSuggestion || !nightSuggestionRef.current) return;

    gsap.fromTo(
      nightSuggestionRef.current,
      { xPercent: 120, scale: 0.94, opacity: 0 },
      {
        xPercent: 0,
        scale: 1,
        opacity: 1,
        duration: 0.85,
        ease: 'elastic.out(1, 0.5)',
      }
    );
  }, [showNightSuggestion]);

  return (
    <>
      <div className="noise-overlay" />

      {maskTransition && (
        <div
          ref={maskTransitionRef}
          className={styles.monthTransitionMask}
          style={{ backgroundImage: `url(${maskTransition.image})` }}
          aria-hidden="true"
        />
      )}
      <span className={styles.srOnly} aria-live="polite">
        Now showing {monthTheme.name} {currentYear}
      </span>

      <ThemeToggle theme={theme} onToggle={handleThemeToggle} />

      {showNightSuggestion && (
        <div ref={nightSuggestionRef} className={styles.nightModeSuggestion} role="status" aria-live="polite">
          <span className={styles.nightModeText}>
            <MoonStar size={14} className={styles.nightModeIcon} />
            Night mode suggested
          </span>
          <button className={styles.nightModeAction} onClick={handleNightSuggestionSwitch}>
            Switch
          </button>
          <button
            className={styles.nightModeDismiss}
            onClick={dismissNightSuggestion}
            aria-label="Dismiss night mode suggestion"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div
        className={`${styles.calendarWrapper} ${atmosphereClass} ${timeClass}`}
        style={wrapperStyle}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.atmosphereLayer} aria-hidden="true" />
        <div className={styles.monthBackdrop} aria-hidden="true" />
        <ParticleOverlay monthTheme={monthTheme} currentMonth={currentMonth} timeOfDay={timeOfDay} />

        <div className={`${styles.calendarBody} ${isSwinging ? styles.calendarSwing : ''}`} ref={calendarRef}>
          <CalendarHanger onSecretTrigger={triggerSwingEasterEgg} />
          <SpiralBinding count={spiralCount} flipSignal={`${currentYear}-${currentMonth}`} />

          <HeroSection
            key={`${currentYear}-${currentMonth}`}
            monthTheme={monthTheme}
            currentYear={currentYear}
            navDirection={navDirectionState}
            timeOfDay={timeOfDay}
          />
          <div className={styles.contentArea} ref={gridRef}>
            <NotesPanel
              notes={notes}
              monthName={monthTheme.name}
              rangeLabel={selectedRange.end ? rangeLabel : null}
              rangeDays={rangeDays}
              mobileOpen={mobileNotesOpen}
              onNotesChange={handleNotesChange}
            />

            <CalendarGrid
              days={days}
              currentMonth={currentMonth}
              currentYear={currentYear}
              selectedRange={selectedRange}
              isLoading={isGridLoading}
              timeOfDay={timeOfDay}
              selectingStart={selectingStart}
              hoveredDate={hoveredDate}
              expandedDate={expandedDate}
              onDayClick={handleDayClick}
              onDayDoubleClick={handleDayDoubleClick}
              onDayHover={handleDayHover}
              onDayKeyDown={handleDayKeyDown}
            />
          </div>
          {rangeLabel && (
            <div className={styles.rangeInfo}>
              <span className={styles.rangeInfoText}>
                <CalendarDays size={14} />
                {rangeLabel}{selectedRange.end ? ` · ${rangeDays} day${rangeDays !== 1 ? 's' : ''}` : ''}
              </span>
              {selectedRange.end && (
                <button className={styles.clearRange} onClick={clearRange}>
                  <X size={12} /> Clear
                </button>
              )}
            </div>
          )}
          <button
            className={styles.mobileNotesToggle}
            onClick={toggleMobileNotes}
          >
            <StickyNote size={16} />
            {mobileNotesOpen ? 'Hide Notes' : 'Show Notes'}
          </button>

          <MonthNav
            monthName={monthTheme.name}
            currentYear={currentYear}
            description={monthTheme.description}
            onPrev={(origin) => goToMonth('prev', origin)}
            onNext={(origin) => goToMonth('next', origin)}
            onToday={goToToday}
          />
        </div>
      </div>

      <FloatingMiniCalendar
        currentYear={currentYear}
        currentMonth={currentMonth}
        onClick={handleMiniCalendarClick}
      />
    </>
  );
}
