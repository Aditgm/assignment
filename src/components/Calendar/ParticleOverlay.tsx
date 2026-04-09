'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '@/styles/calendar.module.css';
import { MonthTheme } from '@/data/monthThemes';

interface ParticleOverlayProps {
  monthTheme: MonthTheme;
  currentMonth: number;
  timeOfDay: 'morning' | 'afternoon' | 'night';
}

interface CanvasParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  kind: 'snow' | 'yellow' | 'leaves' | 'rain' | 'droplets' | 'star';
  drift: number;
  twinkle: number;
}

export default function ParticleOverlay({ monthTheme, currentMonth, timeOfDay }: ParticleOverlayProps) {
  const [performanceMode, setPerformanceMode] = useState<'full' | 'lite' | 'off'>('full');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mobile = window.matchMedia('(max-width: 768px)');

    const updateMode = () => {
      if (reduceMotion.matches) {
        setPerformanceMode('off');
      } else if (mobile.matches) {
        setPerformanceMode('lite');
      } else {
        setPerformanceMode('full');
      }
    };

    updateMode();
    reduceMotion.addEventListener('change', updateMode);
    mobile.addEventListener('change', updateMode);

    return () => {
      reduceMotion.removeEventListener('change', updateMode);
      mobile.removeEventListener('change', updateMode);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || performanceMode === 'off') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const baseCount =
      monthTheme.particle === 'snow'
        ? 24
        : monthTheme.particle === 'yellow'
        ? 18
        : monthTheme.particle === 'leaves'
        ? 14
        : monthTheme.particle === 'droplets'
        ? 16
        : 18;

    const particleCount = performanceMode === 'lite' ? Math.max(8, Math.floor(baseCount * 0.55)) : baseCount;
    const starsCount = timeOfDay === 'night' ? (performanceMode === 'lite' ? 10 : 18) : 0;
    const particles: CanvasParticle[] = [];

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(parent.clientWidth * dpr);
      canvas.height = Math.floor(parent.clientHeight * dpr);
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawnParticle = (kind: CanvasParticle['kind']) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const isRain = kind === 'rain';

      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * (isRain ? 0.8 : 0.35),
        vy: isRain
          ? 2.9 + Math.random() * 1.8
          : kind === 'droplets'
          ? 1.35 + Math.random() * 1.1
          : 0.45 + Math.random() * 0.7,
        size: isRain
          ? 1.2 + Math.random() * 1.6
          : kind === 'droplets'
          ? 2.8 + Math.random() * 2.8
          : kind === 'leaves'
          ? 3 + Math.random() * 2.6
          : 2.2 + Math.random() * 2,
        opacity: kind === 'star' ? 0.8 : 0.22 + Math.random() * 0.58,
        kind,
        drift: (Math.random() - 0.5) * 0.8,
        twinkle: Math.random() * Math.PI * 2,
      } satisfies CanvasParticle;
    };

    resize();

    for (let i = 0; i < particleCount; i += 1) {
      particles.push(spawnParticle(monthTheme.particle));
    }

    for (let i = 0; i < starsCount; i += 1) {
      const star = spawnParticle('star');
      star.y = Math.random() * canvas.clientHeight * 0.55;
      star.vx = (Math.random() - 0.5) * 0.04;
      star.vy = 0;
      star.size = 1 + Math.random() * 1.7;
      particles.push(star);
    }

    const drawParticle = (particle: CanvasParticle) => {
      switch (particle.kind) {
        case 'rain': {
          ctx.strokeStyle = `rgba(181, 225, 255, ${particle.opacity})`;
          ctx.lineWidth = particle.size;
          ctx.beginPath();
          ctx.moveTo(particle.x, particle.y);
          ctx.lineTo(particle.x + particle.drift * 8, particle.y + particle.size * 10);
          ctx.stroke();
          break;
        }
        case 'leaves': {
          ctx.save();
          ctx.translate(particle.x, particle.y);
          ctx.rotate(particle.twinkle);
          ctx.fillStyle = `rgba(245, 158, 11, ${particle.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, particle.size * 1.3, particle.size * 0.8, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
        case 'yellow': {
          ctx.fillStyle = `rgba(255, 214, 110, ${particle.opacity})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'droplets': {
          ctx.fillStyle = `rgba(140, 214, 255, ${particle.opacity})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * 0.9, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        case 'star': {
          const twinkle = 0.5 + 0.5 * Math.sin(particle.twinkle);
          ctx.fillStyle = `rgba(215, 236, 255, ${particle.opacity * twinkle})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size * twinkle, 0, Math.PI * 2);
          ctx.fill();
          break;
        }
        default: {
          ctx.fillStyle = `rgba(245, 250, 255, ${particle.opacity})`;
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const tick = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle) => {
        if (particle.kind !== 'star') {
          particle.x += particle.vx + particle.drift * 0.4;
          particle.y += particle.vy;
          particle.twinkle += 0.015;

          if (particle.y > height + 24) {
            particle.y = -18;
            particle.x = Math.random() * width;
          }
          if (particle.x > width + 30) particle.x = -20;
          if (particle.x < -30) particle.x = width + 20;
        } else {
          particle.twinkle += 0.03;
          particle.x += particle.vx;
        }

        drawParticle(particle);
      });

      frameRef.current = window.requestAnimationFrame(tick);
    };

    frameRef.current = window.requestAnimationFrame(tick);
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [currentMonth, monthTheme.particle, performanceMode, timeOfDay]);

  if (performanceMode === 'off') return null;

  return (
    <div className={styles.outerParticles} aria-hidden="true">
      <canvas ref={canvasRef} className={styles.particleCanvas} />
    </div>
  );
}
