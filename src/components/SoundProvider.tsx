'use client';

import React, { createContext, useContext, useRef, useState, useCallback, useEffect } from 'react';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

interface SoundContextType {
  playPageFlip: () => void;
  playDayClick: () => void;
  playHolidayHover: () => void;
  soundsEnabled: boolean;
  toggleSounds: () => void;
}

const SoundContext = createContext<SoundContextType | null>(null);

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) throw new Error('useSound must be used within SoundProvider');
  return context;
};

export default function SoundProvider({ children }: { children: React.ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const [soundsEnabled, setSoundsEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    return window.localStorage.getItem('calendar-sounds') === 'true';
  });
  const soundsEnabledRef = useRef(soundsEnabled);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      audioContextRef.current = new AudioContextClass();
    }
    return audioContextRef.current;
  }, []);

  const playSound = useCallback((frequency: number, duration: number, volume: number, type: OscillatorType = 'sine') => {
    const ctx = audioContextRef.current;
    if (!soundsEnabledRef.current || !ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, []);

  const playNoiseBurst = useCallback((
    startTime: number,
    duration: number,
    startFreq: number,
    endFreq: number,
    volume: number,
    qValue: number
  ) => {
    const ctx = audioContextRef.current;
    if (!soundsEnabledRef.current || !ctx) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.setValueAtTime(180, startTime);

    const bandPass = ctx.createBiquadFilter();
    bandPass.type = 'bandpass';
    bandPass.frequency.setValueAtTime(startFreq, startTime);
    bandPass.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 80), startTime + duration);
    bandPass.Q.setValueAtTime(qValue, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.012);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    source.connect(highPass);
    highPass.connect(bandPass);
    bandPass.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(startTime);
    source.stop(startTime + duration + 0.02);
  }, []);

  const playWhoosh = useCallback((startTime: number, duration: number) => {
    const ctx = audioContextRef.current;
    if (!soundsEnabledRef.current || !ctx) return;

    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * 0.7;
    }

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;

    const bandPass = ctx.createBiquadFilter();
    bandPass.type = 'bandpass';
    bandPass.frequency.setValueAtTime(1000, startTime);
    bandPass.frequency.exponentialRampToValueAtTime(200, startTime + duration);
    bandPass.Q.setValueAtTime(0.7, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.03, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    source.connect(bandPass);
    bandPass.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.start(startTime);
    source.stop(startTime + duration + 0.02);
  }, []);

  const playPageFlip = useCallback(() => {
    const ctx = initAudioContext();
    if (!soundsEnabledRef.current || !ctx) return;

    const start = ctx.currentTime + 0.01;

    playWhoosh(start, 0.18);
    playNoiseBurst(start, 0.14, 2400, 950, 0.08, 0.95);
    playNoiseBurst(start + 0.045, 0.18, 1700, 640, 0.06, 0.85);
    playNoiseBurst(start + 0.09, 0.12, 900, 320, 0.04, 0.7);
  }, [initAudioContext, playNoiseBurst, playWhoosh]);

  const playDayClick = useCallback(() => {
    playSound(1200, 0.03, 0.05, 'sine');
  }, [playSound]);

  const playHolidayHover = useCallback(() => {
    playSound(1760, 0.05, 0.028, 'sine');
  }, [playSound]);

  const toggleSounds = useCallback(() => {
    if (!soundsEnabledRef.current) {
      initAudioContext();
    }
    setSoundsEnabled(prev => !prev);
  }, [initAudioContext]);

  useEffect(() => {
    if (soundsEnabled) {
      initAudioContext();
    }
  }, [soundsEnabled, initAudioContext]);

  useEffect(() => {
    soundsEnabledRef.current = soundsEnabled;
  }, [soundsEnabled]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('calendar-sounds', soundsEnabled.toString());
    }
  }, [soundsEnabled]);

  return (
    <SoundContext.Provider value={{ playPageFlip, playDayClick, playHolidayHover, soundsEnabled, toggleSounds }}>
      {children}
    </SoundContext.Provider>
  );
}