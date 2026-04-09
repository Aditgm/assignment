'use client';

import React, { createContext, useContext, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

interface ParallaxContextType {
  registerLayer: (ref: React.RefObject<HTMLElement>, speed: number) => void;
  unregisterLayer: (ref: React.RefObject<HTMLElement>) => void;
}

const ParallaxContext = createContext<ParallaxContextType | null>(null);

export const useParallax = () => {
  const context = useContext(ParallaxContext);
  if (!context) throw new Error('useParallax must be used within ParallaxProvider');
  return context;
};

export default function ParallaxProvider({ children }: { children: React.ReactNode }) {
  const layersRef = useRef<Map<React.RefObject<HTMLElement>, number>>(new Map());
  const enabledRef = useRef(true);
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  const registerLayer = useCallback((ref: React.RefObject<HTMLElement>, speed: number) => {
    layersRef.current.set(ref, speed);
  }, []);

  const unregisterLayer = useCallback((ref: React.RefObject<HTMLElement>) => {
    layersRef.current.delete(ref);
  }, []);

  useEffect(() => {
    const layers = layersRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)');

    const updateEnabled = () => {
      enabledRef.current = !reduceMotion.matches && !coarsePointer.matches;
      if (!enabledRef.current) {
        layers.forEach((_, ref) => {
          if (ref.current) {
            gsap.set(ref.current, { x: 0, y: 0 });
          }
        });
      }
    };

    updateEnabled();

    const handleMouseMove = (e: MouseEvent) => {
      if (!enabledRef.current) return;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      targetX.current = (e.clientX - centerX) / centerX;
      targetY.current = (e.clientY - centerY) / centerY;
    };

    const tick = () => {
      if (enabledRef.current) {
        currentX.current += (targetX.current - currentX.current) * 0.12;
        currentY.current += (targetY.current - currentY.current) * 0.12;

        layers.forEach((speed, ref) => {
          if (!ref.current) return;
          const x = currentX.current * speed * 10;
          const y = currentY.current * speed * 7;
          gsap.set(ref.current, { x, y });
        });
      }

      rafIdRef.current = window.requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    reduceMotion.addEventListener('change', updateEnabled);
    coarsePointer.addEventListener('change', updateEnabled);
    rafIdRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        window.cancelAnimationFrame(rafIdRef.current);
      }
      window.removeEventListener('mousemove', handleMouseMove);
      reduceMotion.removeEventListener('change', updateEnabled);
      coarsePointer.removeEventListener('change', updateEnabled);

      layers.forEach((speed, ref) => {
        if (!ref.current) return;
        gsap.set(ref.current, { x: 0, y: 0 });
      });
    };
  }, []);

  return (
    <ParallaxContext.Provider value={{ registerLayer, unregisterLayer }}>
      {children}
    </ParallaxContext.Provider>
  );
}