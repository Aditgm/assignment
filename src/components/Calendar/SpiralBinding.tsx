'use client';

import React, { useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import styles from '@/styles/calendar.module.css';
import { useCursor } from '@/components/CustomCursor';

interface SpiralBindingProps {
  count: number;
  flipSignal: string;
}

export default function SpiralBinding({ count, flipSignal }: SpiralBindingProps) {
  const { setCursorMode, setCursorTarget } = useCursor();
  const bindingRef = useRef<HTMLDivElement>(null);
  const loopRefs = useRef<Array<HTMLDivElement | null>>([]);

  const setLoopRef = useCallback((index: number, node: HTMLDivElement | null) => {
    loopRefs.current[index] = node;
  }, []);

  useEffect(() => {
    const loops = loopRefs.current.filter((loop): loop is HTMLDivElement => Boolean(loop));
    if (loops.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const swayTweens = loops.map((loop, index) =>
      gsap.to(loop, {
        rotate: index % 2 === 0 ? 1.5 : -1.5,
        duration: 2.2 + (index % 6) * 0.18,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: index * 0.04,
      })
    );

    return () => {
      swayTweens.forEach((tween) => tween.kill());
    };
  }, [count]);

  useEffect(() => {
    const loops = loopRefs.current.filter((loop): loop is HTMLDivElement => Boolean(loop));
    if (loops.length === 0) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.fromTo(loops,
      { scaleY: 0.85 },
      {
        scaleY: 1,
        duration: 0.62,
        ease: 'elastic.out(1, 0.42)',
        stagger: { each: 0.012, from: 'center' },
      }
    );
  }, [flipSignal]);

  const handleBindingMouseMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const loops = loopRefs.current.filter((loop): loop is HTMLDivElement => Boolean(loop));
    if (loops.length === 0) return;

    loops.forEach((loop) => {
      const rect = loop.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = event.clientX - centerX;
      const dy = event.clientY - centerY;
      const distance = Math.hypot(dx, dy);
      const influence = Math.max(0, 1 - distance / 110);
      const tiltY = gsap.utils.clamp(-7, 7, (dx / 30) * influence * 5);
      const lift = -influence * 1.6;

      gsap.to(loop, {
        rotationY: tiltY,
        y: lift,
        duration: 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });
  }, []);

  const handleBindingMouseLeave = useCallback(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCursorTarget(null);
      setCursorMode('default');
      return;
    }

    const loops = loopRefs.current.filter((loop): loop is HTMLDivElement => Boolean(loop));
    if (loops.length > 0) {
      gsap.to(loops, {
        rotationY: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    }
    setCursorTarget(null);
    setCursorMode('default');
  }, [setCursorMode, setCursorTarget]);

  return (
    <div
      ref={bindingRef}
      className={styles.spiralBinding}
      onMouseMove={handleBindingMouseMove}
      onMouseLeave={handleBindingMouseLeave}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          ref={(node) => setLoopRef(i, node)}
          className={styles.spiralLoop}
          onMouseEnter={(e) => {
            setCursorTarget(e.currentTarget as HTMLElement);
            setCursorMode('spiral-hover');
          }}
        />
      ))}
    </div>
  );
}
