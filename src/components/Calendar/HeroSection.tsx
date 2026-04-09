'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';
import styles from '@/styles/calendar.module.css';
import { MonthTheme } from '@/data/monthThemes';
import { useCursor } from '@/components/CustomCursor';
import HeroLiquidCanvas from './HeroLiquidCanvas';

interface HeroSectionProps {
  monthTheme: MonthTheme;
  currentYear: number;
  navDirection: 'next' | 'prev';
  timeOfDay: 'morning' | 'afternoon' | 'night';
}

const WAVE_VARIANTS = [
  {
    primary: 'M0,100 L0,54 Q120,10 280,58 Q400,90 500,42 Q600,4 720,38 L720,100 Z',
    secondary: 'M0,100 L0,68 Q150,28 320,66 Q450,88 560,52 Q650,22 720,58 L720,100 Z',
  },
  {
    primary: 'M0,100 L0,58 Q128,20 292,62 Q412,92 512,48 Q612,12 720,42 L720,100 Z',
    secondary: 'M0,100 L0,70 Q158,34 330,70 Q458,90 570,58 Q658,28 720,60 L720,100 Z',
  },
  {
    primary: 'M0,100 L0,50 Q112,6 268,54 Q392,86 492,38 Q598,2 720,34 L720,100 Z',
    secondary: 'M0,100 L0,64 Q144,24 310,62 Q438,84 550,48 Q644,18 720,54 L720,100 Z',
  },
];

const getMonthIndex = (monthName: string) => {
  const parsed = new Date(`${monthName} 1, 2026`).getMonth();
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function HeroSection({ monthTheme, currentYear, navDirection, timeOfDay }: HeroSectionProps) {
  const heroContainerRef = useRef<HTMLDivElement>(null);
  const heroImageLayerRef = useRef<HTMLDivElement>(null);
  const monthLabelRef = useRef<HTMLDivElement>(null);
  const exploreTextRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGSVGElement>(null);
  const wavePrimaryRef = useRef<SVGPathElement>(null);
  const waveSecondaryRef = useRef<SVGPathElement>(null);
  const { setCursorMode, setCursorTarget } = useCursor();
  const [isHovered, setIsHovered] = useState(false);
  const [imageStage, setImageStage] = useState<'color' | 'full'>('color');
  const [fallbackImage, setFallbackImage] = useState(false);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const scrollVelocity = useRef(0);
  const isScrolling = useRef(false);
  useEffect(() => {
    if (!heroImageLayerRef.current) return;
    const dir = navDirection === 'next' ? 1 : -1;

    gsap.fromTo(heroImageLayerRef.current,
      { scale: 1.15, opacity: 0, x: dir * 30 },
      { scale: 1, opacity: 1, x: 0, duration: 0.8, ease: 'power3.out' }
    );
  }, [monthTheme.name, navDirection]);
  useEffect(() => {
    if (!monthLabelRef.current) return;
    const chars = monthLabelRef.current.querySelectorAll(`.${styles.heroChar}`);
    if (chars.length === 0) return;

    gsap.fromTo(chars,
      { opacity: 0, y: 20, rotateX: -40 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: 'back.out(1.5)',
      }
    );
  }, [monthTheme.name]);
  useEffect(() => {
    const container = heroContainerRef.current;
    const imageLayer = heroImageLayerRef.current;
    const monthLabel = monthLabelRef.current;
    const wave = waveRef.current;
    const exploreText = exploreTextRef.current;
    if (!container || !imageLayer || !monthLabel || !wave) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;

    const quickImageX = gsap.quickTo(imageLayer, 'x', { duration: 0.38, ease: 'power3.out' });
    const quickImageY = gsap.quickTo(imageLayer, 'y', { duration: 0.38, ease: 'power3.out' });
    const quickWaveX = gsap.quickTo(wave, 'x', { duration: 0.3, ease: 'power2.out' });
    const quickWaveY = gsap.quickTo(wave, 'y', { duration: 0.3, ease: 'power2.out' });
    const quickMonthX = gsap.quickTo(monthLabel, 'x', { duration: 0.24, ease: 'power2.out' });
    const quickMonthY = gsap.quickTo(monthLabel, 'y', { duration: 0.24, ease: 'power2.out' });
    const quickTextX = exploreText ? gsap.quickTo(exploreText, 'x', { duration: 0.24, ease: 'power2.out' }) : null;
    const quickTextY = exploreText ? gsap.quickTo(exploreText, 'y', { duration: 0.24, ease: 'power2.out' }) : null;

    const handleMouseMove = (e: MouseEvent) => {
      if (reduceMotion || coarsePointer) return;
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      const baseX = x * 28;
      const baseY = y * 18;

      quickImageX(baseX * 0.3);
      quickImageY(baseY * 0.3);
      quickWaveX(baseX * 0.6);
      quickWaveY(baseY * 0.6);
      quickMonthX(baseX);
      quickMonthY(baseY);

      if (quickTextX && quickTextY) {
        quickTextX(baseX * 1.1);
        quickTextY(baseY * 1.1);
      }
    };

    const handleMouseLeave = () => {
      quickImageX(0);
      quickImageY(0);
      quickWaveX(0);
      quickWaveY(0);
      quickMonthX(0);
      quickMonthY(0);
      quickTextX?.(0);
      quickTextY?.(0);
    };

    container.addEventListener('mousemove', handleMouseMove, { passive: true });
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [monthTheme.name]);
  useEffect(() => {
    if (!monthLabelRef.current) return;

    lastScrollTime.current = performance.now();
    lastScrollY.current = window.scrollY;
    
    const chars = monthLabelRef.current.querySelectorAll(`.${styles.heroChar}`);
    if (chars.length === 0) return;
    
    const handleScroll = () => {
      const now = performance.now();
      const deltaTime = Math.max(now - lastScrollTime.current, 16);
      const deltaY = window.scrollY - lastScrollY.current;
      
      scrollVelocity.current = deltaY / deltaTime;
      lastScrollY.current = window.scrollY;
      lastScrollTime.current = now;
      
      const velocity = Math.abs(scrollVelocity.current);
      const skewAmount = gsap.utils.clamp(-12, 12, scrollVelocity.current * 0.8);
      const spacingAmount = Math.min(velocity * 1.5, 8);

      gsap.to(chars, {
        skewY: skewAmount,
        marginRight: spacingAmount,
        duration: 0.2,
        ease: 'power2.out',
        stagger: 0.03,
        overwrite: 'auto',
      });
      
      if (!isScrolling.current) {
        isScrolling.current = true;
      }
    };
    
    const handleScrollEnd = () => {
      isScrolling.current = false;
      gsap.to(chars, {
        skewY: 0,
        marginRight: 0,
        duration: 0.62,
        ease: 'elastic.out(1, 0.4)',
        stagger: { each: 0.03, from: 'end' },
        overwrite: 'auto',
      });
    };
    
    let scrollTimeout: number;
    const debouncedScrollEnd = () => {
      window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(handleScrollEnd, 150);
    };

    const onScroll = () => {
      handleScroll();
      debouncedScrollEnd();
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.clearTimeout(scrollTimeout);
    };
  }, [monthTheme.name]);

  useEffect(() => {
    if (!wavePrimaryRef.current || !waveSecondaryRef.current) return;

    const variant = WAVE_VARIANTS[getMonthIndex(monthTheme.name) % WAVE_VARIANTS.length];

    gsap.to(wavePrimaryRef.current, {
      attr: { d: variant.primary },
      duration: 0.6,
      ease: 'power2.inOut',
    });

    gsap.to(waveSecondaryRef.current, {
      attr: { d: variant.secondary },
      duration: 0.6,
      ease: 'power2.inOut',
    });
  }, [monthTheme.name]);

  const handleHeroEnter = useCallback((e: React.MouseEvent) => {
    setIsHovered(true);
    setCursorTarget(e.currentTarget as HTMLElement);
    setCursorMode('hero-drag');
  }, [setCursorMode, setCursorTarget]);

  const handleHeroLeave = useCallback(() => {
    setIsHovered(false);
    setCursorTarget(null);
    setCursorMode('default');
  }, [setCursorMode, setCursorTarget]);

  return (
    <div 
      className={styles.heroSection} 
      ref={heroContainerRef}
      onMouseEnter={handleHeroEnter}
      onMouseLeave={handleHeroLeave}
    >
      <div className={styles.heroImageContainer} ref={heroImageLayerRef}>
        <div
          className={`${styles.heroColorPlaceholder} ${imageStage === 'color' ? styles.heroVisible : ''}`}
          style={{ ['--hero-placeholder' as string]: monthTheme.accentGradient }}
        />

        {fallbackImage ? (
          <div
            className={`${styles.heroImageFallback} ${imageStage === 'full' ? styles.heroVisible : ''}`}
            style={{ backgroundImage: `url(${monthTheme.image})` }}
            aria-hidden="true"
          />
        ) : (
          <HeroLiquidCanvas
            imageSrc={monthTheme.image}
            className={imageStage === 'full' ? styles.heroVisible : ''}
            onLoaded={() => setImageStage('full')}
            onError={() => {
              setFallbackImage(true);
              setImageStage('full');
            }}
          />
        )}
      </div>
      <div
        className={[
          styles.heroOverlay,
          timeOfDay === 'morning'
            ? styles.heroOverlayMorning
            : timeOfDay === 'night'
            ? styles.heroOverlayNight
            : styles.heroOverlayAfternoon,
        ].join(' ')}
      />
      <div 
        ref={exploreTextRef}
        className={styles.heroExploreText}
        style={{ opacity: isHovered ? 1 : 0, transform: isHovered ? 'translateY(0)' : 'translateY(10px)' }}
      >
        Explore
      </div>
      <svg ref={waveRef} className={styles.heroWave} viewBox="0 0 720 100" preserveAspectRatio="none">
        <path
          ref={wavePrimaryRef}
          className={styles.heroWavePath}
          d="M0,100 L0,54 Q120,10 280,58 Q400,90 500,42 Q600,4 720,38 L720,100 Z"
          fill={monthTheme.accentColor}
          opacity="0.6"
        />
        <path
          ref={waveSecondaryRef}
          className={styles.heroWavePath}
          d="M0,100 L0,68 Q150,28 320,66 Q450,88 560,52 Q650,22 720,58 L720,100 Z"
          fill="var(--bg-calendar)"
        />
      </svg>
      <div className={styles.heroBottomFill} aria-hidden="true" />
      <div className={styles.heroMonthLabel} ref={monthLabelRef}>
        <div className={styles.heroYear}>{currentYear}</div>
        <div className={styles.heroMonthName}>
          {monthTheme.name.split('').map((char, i) => (
            <span key={`${monthTheme.name}-${i}`} className={styles.heroChar}>
              {char}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
