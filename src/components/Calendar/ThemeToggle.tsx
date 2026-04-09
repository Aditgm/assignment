'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from '@/styles/calendar.module.css';
import { useCursor } from '@/components/CustomCursor';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

interface WipeState {
  x: number;
  y: number;
  nextTheme: 'light' | 'dark';
}

const MOON_PATH = 'M 12 2 C 6.5 2 2 6.5 2 12 C 2 17.5 6.5 22 12 22 C 11 20.5 9.5 18.5 9.5 14.8 C 9.5 10.9 11.7 7.6 15.4 5.8 C 14.2 3.7 13.1 2.4 12 2 C 12 2 12 2 12 2 Z';
const SUN_PATH = 'M 12 2 C 6.5 2 2 6.5 2 12 C 2 17.5 6.5 22 12 22 C 17.5 22 22 17.5 22 12 C 22 6.5 17.5 2 12 2 C 12 2 12 2 12 2 C 12 2 12 2 12 2 Z';

export default function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const { setCursorMode, setCursorTarget } = useCursor();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const iconWrapRef = useRef<HTMLSpanElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const fxLayerRef = useRef<HTMLDivElement>(null);
  const wipeRef = useRef<HTMLDivElement>(null);
  const isAnimatingRef = useRef(false);
  const [wipeState, setWipeState] = useState<WipeState | null>(null);

  const iconPath = useMemo(() => (theme === 'light' ? MOON_PATH : SUN_PATH), [theme]);

  useEffect(() => {
    if (!pathRef.current) return;

    gsap.to(pathRef.current, {
      attr: { d: iconPath },
      duration: 0.48,
      ease: 'power2.inOut',
    });
  }, [iconPath]);

  const handleButtonEnter = useCallback((e: React.MouseEvent) => {
    setCursorTarget(e.currentTarget as HTMLElement);
    setCursorMode('button-hover');
  }, [setCursorMode, setCursorTarget]);

  const handleButtonLeave = useCallback(() => {
    setCursorTarget(null);
    setCursorMode('default');
  }, [setCursorMode, setCursorTarget]);

  const spawnDarkModeSparkles = useCallback((x: number, y: number) => {
    const layer = fxLayerRef.current;
    if (!layer) return;

    const starCount = 5 + Math.floor(Math.random() * 4);

    for (let i = 0; i < starCount; i += 1) {
      const star = document.createElement('span');
      star.className = styles.themeSparkle;
      star.style.left = `${x}px`;
      star.style.top = `${y}px`;
      layer.appendChild(star);

      const angle = (Math.PI * 2 * i) / starCount + Math.random() * 0.36;
      const distance = 16 + Math.random() * 34;

      gsap.fromTo(
        star,
        {
          x: 0,
          y: 0,
          scale: 0.45,
          opacity: 1,
          rotate: 0,
        },
        {
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          scale: 1.25,
          rotate: gsap.utils.random(-55, 55),
          opacity: 0,
          duration: 0.82,
          ease: 'power2.out',
          onComplete: () => star.remove(),
        }
      );
    }
  }, []);

  const handleToggle = useCallback(() => {
    if (!buttonRef.current || isAnimatingRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const nextTheme = theme === 'light' ? 'dark' : 'light';

    setWipeState({ x, y, nextTheme });
    isAnimatingRef.current = true;

    window.requestAnimationFrame(() => {
      if (!wipeRef.current) {
        onToggle();
        isAnimatingRef.current = false;
        return;
      }

      if (nextTheme === 'dark') {
        spawnDarkModeSparkles(x, y);
      }

      gsap.set(wipeRef.current, {
        clipPath: `circle(0px at ${x}px ${y}px)`,
        opacity: 1,
      });

      if (iconWrapRef.current) {
        gsap.set(iconWrapRef.current, { rotation: 0, scale: 1 });
      }

      const timeline = gsap.timeline({
        onComplete: () => {
          if (iconWrapRef.current) {
            gsap.set(iconWrapRef.current, { clearProps: 'transform' });
          }
          setWipeState(null);
          isAnimatingRef.current = false;
        },
      });

      timeline.to(iconWrapRef.current, {
        rotation: 180,
        scale: 0.72,
        duration: 0.28,
        ease: 'power2.in',
      }, 0);

      timeline.call(() => {
        if (pathRef.current) {
          gsap.set(pathRef.current, {
            attr: { d: nextTheme === 'dark' ? SUN_PATH : MOON_PATH },
          });
        }
        onToggle();
      }, [], 0.28);

      timeline.to(iconWrapRef.current, {
        rotation: 360,
        scale: 1,
        duration: 0.28,
        ease: 'power2.out',
      }, 0.28);

      timeline.to(wipeRef.current, {
        clipPath: `circle(150vmax at ${x}px ${y}px)`,
        duration: 0.6,
        ease: 'power3.inOut',
      }, 0);

      timeline.to(wipeRef.current, {
        opacity: 0,
        duration: 0.16,
        ease: 'power1.out',
      }, 0.48);
    });
  }, [onToggle, spawnDarkModeSparkles, theme]);

  return (
    <>
      <button
        ref={buttonRef}
        className={styles.themeToggle}
        onClick={handleToggle}
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        onMouseEnter={handleButtonEnter}
        onMouseLeave={handleButtonLeave}
      >
        <span ref={iconWrapRef} className={styles.themeMorphWrap} aria-hidden="true">
          <svg className={styles.themeMorphIcon} viewBox="0 0 24 24" fill="none">
            <path ref={pathRef} d={iconPath} />
          </svg>
        </span>
      </button>

      <div ref={fxLayerRef} className={styles.themeFxLayer} aria-hidden="true" />

      {wipeState && (
        <div
          ref={wipeRef}
          className={`${styles.themeWipe} ${
            wipeState.nextTheme === 'dark' ? styles.themeWipeDark : styles.themeWipeLight
          }`}
          aria-hidden="true"
        />
      )}
    </>
  );
}
