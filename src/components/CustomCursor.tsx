'use client';

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import gsap from 'gsap';

type CursorMode =
  | 'default'
  | 'day-hover'
  | 'selecting'
  | 'button-hover'
  | 'hero-drag'
  | 'text-input'
  | 'spiral-hover'
  | 'mini-hover';

interface CursorContextType {
  setCursorMode: (mode: CursorMode) => void;
  setCursorTarget: (element: HTMLElement | null) => void;
  cursorMode: CursorMode;
}

const CursorContext = createContext<CursorContextType | null>(null);

export const useCursor = () => {
  const context = useContext(CursorContext);
  if (!context) throw new Error('useCursor must be used within CursorProvider');
  return context;
};

export default function CustomCursor({ children }: { children: React.ReactNode }) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [cursorMode, setCursorMode] = useState<CursorMode>('default');
  const targetRef = useRef<HTMLElement | null>(null);
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const ringPhysics = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const pulseTweenRef = useRef<gsap.core.Tween | null>(null);
  const blinkTweenRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    const coarsePointer = window.matchMedia('(pointer: coarse)');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updateEnabled = () => {
      setEnabled(!coarsePointer.matches && !reduceMotion.matches);
    };

    updateEnabled();
    coarsePointer.addEventListener('change', updateEnabled);
    reduceMotion.addEventListener('change', updateEnabled);

    return () => {
      coarsePointer.removeEventListener('change', updateEnabled);
      reduceMotion.removeEventListener('change', updateEnabled);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !cursorRef.current || !ringRef.current) return;

    const quickX = gsap.quickTo(cursorRef.current, 'x', { duration: 0.14, ease: 'power3.out' });
    const quickY = gsap.quickTo(cursorRef.current, 'y', { duration: 0.14, ease: 'power3.out' });
    const clampSkew = gsap.utils.clamp(-2.5, 2.5);

    const resolveTarget = () => {
      if (!targetRef.current) {
        return { x: mouseX.current, y: mouseY.current };
      }

      const rect = targetRef.current.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;

      if (cursorMode === 'button-hover') {
        return {
          x: gsap.utils.interpolate(mouseX.current, targetX, 0.62),
          y: gsap.utils.interpolate(mouseY.current, targetY, 0.62),
        };
      }

      if (cursorMode === 'day-hover' || cursorMode === 'spiral-hover') {
        return { x: targetX, y: targetY };
      }

      if (cursorMode === 'mini-hover') {
        return {
          x: gsap.utils.interpolate(mouseX.current, targetX, 0.28),
          y: gsap.utils.interpolate(mouseY.current, targetY, 0.28),
        };
      }

      return { x: mouseX.current, y: mouseY.current };
    };

    const getSpring = () => {
      switch (cursorMode) {
        case 'button-hover':
          return { mass: 0.92, stiffness: 0.34, damping: 0.83 };
        case 'day-hover':
          return { mass: 0.96, stiffness: 0.31, damping: 0.81 };
        case 'selecting':
          return { mass: 0.88, stiffness: 0.38, damping: 0.86 };
        case 'text-input':
          return { mass: 0.82, stiffness: 0.42, damping: 0.88 };
        case 'spiral-hover':
          return { mass: 0.84, stiffness: 0.39, damping: 0.87 };
        case 'mini-hover':
          return { mass: 0.9, stiffness: 0.35, damping: 0.84 };
        case 'hero-drag':
          return { mass: 1.04, stiffness: 0.25, damping: 0.76 };
        default:
          return { mass: 1.08, stiffness: 0.27, damping: 0.79 };
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.current = e.clientX;
      mouseY.current = e.clientY;
      const target = resolveTarget();
      quickX(target.x);
      quickY(target.y);
    };

    const ringState = ringPhysics.current;
    ringState.x = mouseX.current;
    ringState.y = mouseY.current;
    ringState.vx = 0;
    ringState.vy = 0;

    let frameId = 0;
    let prevTime = performance.now();

    const step = (time: number) => {
      const dt = Math.min((time - prevTime) / 1000, 0.034);
      prevTime = time;
      const target = resolveTarget();
      const spring = getSpring();
      const normalizedStep = dt * 60;

      const dx = target.x - ringState.x;
      const dy = target.y - ringState.y;
      const ax = (dx * spring.stiffness - ringState.vx * spring.damping) / spring.mass;
      const ay = (dy * spring.stiffness - ringState.vy * spring.damping) / spring.mass;

      ringState.vx += ax * normalizedStep;
      ringState.vy += ay * normalizedStep;
      ringState.x += ringState.vx * normalizedStep;
      ringState.y += ringState.vy * normalizedStep;

      quickX(target.x);
      quickY(target.y);
      gsap.set(ringRef.current, {
        x: ringState.x,
        y: ringState.y,
        rotate: clampSkew(ringState.vx * 0.2),
      });

      frameId = window.requestAnimationFrame(step);
    };

    window.addEventListener('mousemove', handleMouseMove);
    frameId = window.requestAnimationFrame(step);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.cancelAnimationFrame(frameId);
    };
  }, [cursorMode, enabled]);

  useEffect(() => {
    if (!enabled || !ringRef.current || !cursorRef.current) return;

    pulseTweenRef.current?.kill();
    blinkTweenRef.current?.kill();
    pulseTweenRef.current = null;
    blinkTweenRef.current = null;
    
    switch (cursorMode) {
      case 'day-hover':
        gsap.to(ringRef.current, { 
          scale: 3.2, 
          opacity: 0.76,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderStyle: 'solid',
          duration: 0.26,
          ease: 'power3.out'
        });
        gsap.to(cursorRef.current, { scale: 0.88, opacity: 0.8, duration: 0.2, ease: 'power2.out' });
        break;
      case 'selecting':
        gsap.to(ringRef.current, { 
          scale: 2.5, 
          opacity: 0.9, 
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderStyle: 'dashed',
          duration: 0.2,
          ease: 'power2.out'
        });
        gsap.to(cursorRef.current, { scale: 0.82, opacity: 0.85, duration: 0.18, ease: 'power2.out' });
        break;
      case 'button-hover':
        gsap.to(ringRef.current, { 
          scale: 2.2, 
          opacity: 0.72,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderStyle: 'solid',
          duration: 0.24,
          ease: 'power3.out'
        });
        gsap.to(cursorRef.current, { scale: 0.92, opacity: 0.84, duration: 0.2, ease: 'power2.out' });
        break;
      case 'text-input':
        gsap.to(ringRef.current, {
          scale: 1,
          opacity: 0.92,
          width: 3,
          height: 26,
          borderRadius: 2,
          borderWidth: 0,
          borderStyle: 'solid',
          backgroundColor: 'rgba(14, 165, 233, 0.85)',
          duration: 0.18,
          ease: 'power2.out',
        });
        gsap.to(cursorRef.current, { scale: 0.35, opacity: 0.2, duration: 0.16, ease: 'power2.out' });
        blinkTweenRef.current = gsap.to(ringRef.current, {
          opacity: 0.25,
          duration: 0.48,
          repeat: -1,
          yoyo: true,
          ease: 'steps(1)',
        });
        break;
      case 'spiral-hover':
        gsap.to(ringRef.current, {
          scale: 1,
          opacity: 0.9,
          width: 16,
          height: 16,
          borderRadius: '50%',
          borderWidth: 2,
          borderStyle: 'solid',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          duration: 0.2,
          ease: 'power2.out',
        });
        gsap.to(cursorRef.current, { scale: 0.75, opacity: 0.76, duration: 0.2, ease: 'power2.out' });
        break;
      case 'mini-hover':
        gsap.to(ringRef.current, {
          scale: 1,
          opacity: 0.85,
          width: 20,
          height: 20,
          borderRadius: '50%',
          borderWidth: 2,
          borderStyle: 'solid',
          backgroundColor: 'rgba(14, 165, 233, 0.08)',
          duration: 0.22,
          ease: 'power2.out',
        });
        gsap.to(cursorRef.current, { scale: 0.7, opacity: 0.72, duration: 0.2, ease: 'power2.out' });
        pulseTweenRef.current = gsap.to(ringRef.current, {
          scale: 1.18,
          duration: 0.78,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        });
        break;
      case 'hero-drag':
        gsap.to(ringRef.current, { 
          scale: 1.5, 
          opacity: 0, 
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderStyle: 'solid',
          duration: 0.3,
          ease: 'power2.out'
        });
        gsap.to(cursorRef.current, { scale: 1.05, opacity: 0.78, duration: 0.2, ease: 'power2.out' });
        break;
      default:
        gsap.to(ringRef.current, { 
          scale: 1, 
          opacity: 0.66,
          width: 24,
          height: 24,
          borderRadius: '50%',
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderStyle: 'solid',
          duration: 0.3, 
          ease: 'power2.out' 
        });
        gsap.to(cursorRef.current, {
          scale: 1,
          opacity: 0.88,
          duration: 0.22,
          ease: 'power2.out',
        });
    }

    return () => {
      pulseTweenRef.current?.kill();
      blinkTweenRef.current?.kill();
    };
  }, [cursorMode, enabled]);

  const setCursorTarget = useCallback((element: HTMLElement | null) => {
    targetRef.current = element;
  }, []);

  return (
    <CursorContext.Provider value={{ setCursorMode, setCursorTarget, cursorMode }}>
      {children}

      {enabled && (
        <>
          <div
            ref={cursorRef}
            className="custom-cursor"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.82)',
              boxShadow: '0 0 0 1px rgba(14, 165, 233, 0.46), 0 0 12px rgba(255, 255, 255, 0.2)',
              opacity: 0.88,
              pointerEvents: 'none',
              zIndex: 10001,
              transform: 'translate(-50%, -50%)',
            }}
          />

          <div
            ref={ringRef}
            className="custom-cursor-ring"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1.5px solid var(--accent)',
              opacity: 0.66,
              pointerEvents: 'none',
              zIndex: 10000,
              transform: 'translate(-50%, -50%)',
            }}
          />

          <style jsx global>{`
            * {
              cursor: none !important;
            }
          `}</style>
        </>
      )}
    </CursorContext.Provider>
  );
}