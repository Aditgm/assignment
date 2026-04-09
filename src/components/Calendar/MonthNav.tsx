'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import gsap from 'gsap';
import styles from '@/styles/calendar.module.css';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useCursor } from '@/components/CustomCursor';
import { useSound } from '@/components/SoundProvider';

interface MonthNavProps {
  monthName: string;
  currentYear: number;
  description: string;
  onPrev: (origin?: TransitionOrigin) => void;
  onNext: (origin?: TransitionOrigin) => void;
  onToday: () => void;
}

interface TransitionOrigin {
  x: number;
  y: number;
}

interface MagneticButtonProps {
  className: string;
  ariaLabel?: string;
  onClick: (origin?: TransitionOrigin) => void;
  direction?: -1 | 0 | 1;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

function MagneticButton({ className, ariaLabel, onClick, direction = 0, style, children }: MagneticButtonProps) {
  const { setCursorMode, setCursorTarget } = useCursor();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const quickToRef = useRef<{
    x: (value: number) => void;
    y: (value: number) => void;
    iconX: (value: number) => void;
  } | null>(null);

  useEffect(() => {
    const button = buttonRef.current;
    const icon = iconRef.current;
    if (!button || !icon) return;

    quickToRef.current = {
      x: gsap.quickTo(button, 'x', { duration: 0.3, ease: 'power2.out' }),
      y: gsap.quickTo(button, 'y', { duration: 0.3, ease: 'power2.out' }),
      iconX: gsap.quickTo(icon, 'x', { duration: 0.22, ease: 'power2.out' }),
    };

    return () => {
      gsap.killTweensOf(button);
      gsap.killTweensOf(icon);
    };
  }, []);

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    setCursorTarget(e.currentTarget);
    setCursorMode('button-hover');
  }, [setCursorMode, setCursorTarget]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current || !quickToRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;
    const maxDistance = 80;
    const distance = Math.hypot(deltaX, deltaY);
    const intensity = distance < maxDistance ? 1 - distance / maxDistance : 0;

    quickToRef.current.x(deltaX * 0.3 * intensity);
    quickToRef.current.y(deltaY * 0.3 * intensity);
    quickToRef.current.iconX(direction !== 0 ? direction * 4 * intensity : 0);
  }, [direction]);

  const handleMouseLeave = useCallback(() => {
    if (quickToRef.current) {
      quickToRef.current.x(0);
      quickToRef.current.y(0);
      quickToRef.current.iconX(0);
    }
    setCursorTarget(null);
    setCursorMode('default');
  }, [setCursorMode, setCursorTarget]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (button) {
      gsap.fromTo(
        button,
        { scale: 0.9 },
        { scale: 1, duration: 0.55, ease: 'elastic.out(1, 0.5)' }
      );

      const rect = button.getBoundingClientRect();
      const hasPointerCoordinates = event.clientX !== 0 || event.clientY !== 0;
      const origin = hasPointerCoordinates
        ? { x: event.clientX, y: event.clientY }
        : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

      onClick(origin);
      return;
    }

    onClick();
  }, [onClick]);

  return (
    <button
      ref={buttonRef}
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={style}
    >
      <span ref={iconRef} className={styles.navButtonContent}>
        {children}
      </span>
    </button>
  );
}

export default function MonthNav({ monthName, currentYear, description, onPrev, onNext, onToday }: MonthNavProps) {
  const { soundsEnabled, toggleSounds } = useSound();

  return (
    <div className={styles.monthNav}>
      <MagneticButton
        className={styles.navButton} 
        onClick={onPrev}
        aria-label="Previous month"
        direction={-1}
      >
        <ChevronLeft size={20} />
      </MagneticButton>

      <MagneticButton
        className={styles.todayButton} 
        onClick={onToday}
      >
        Today
      </MagneticButton>

      <span className={styles.monthNavLabel}>
        {monthName} {currentYear}
      </span>

      <span className={styles.monthDescription}>{description}</span>

      <MagneticButton
        className={styles.navButton} 
        onClick={onNext}
        aria-label="Next month"
        direction={1}
      >
        <ChevronRight size={20} />
      </MagneticButton>

      <MagneticButton
        className={styles.navButton} 
        onClick={toggleSounds}
        aria-label={soundsEnabled ? "Disable sounds" : "Enable sounds"}
        style={{ marginLeft: '8px' }}
      >
        {soundsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </MagneticButton>
    </div>
  );
}
