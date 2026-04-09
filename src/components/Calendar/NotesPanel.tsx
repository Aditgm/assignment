'use client';

import React, { useCallback, useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { Pencil } from 'lucide-react';
import styles from '@/styles/calendar.module.css';
import { useCursor } from '@/components/CustomCursor';

interface NotesPanelProps {
  notes: string;
  monthName: string;
  rangeLabel: string | null;
  rangeDays: number;
  mobileOpen: boolean;
  onNotesChange: (value: string) => void;
}

export default function NotesPanel({
  notes,
  monthName,
  rangeLabel,
  rangeDays,
  mobileOpen,
  onNotesChange,
}: NotesPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);
  const { setCursorMode, setCursorTarget } = useCursor();
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    if (!isMobile) {
      gsap.set(panel, { clearProps: 'transform,opacity,pointerEvents' });
      return;
    }

    gsap.killTweensOf(panel);
    gsap.to(panel, {
      scaleY: mobileOpen ? 1 : 0,
      opacity: mobileOpen ? 1 : 0,
      transformOrigin: 'top center',
      pointerEvents: mobileOpen ? 'auto' : 'none',
      duration: mobileOpen ? 0.4 : 0.28,
      ease: mobileOpen ? 'power3.out' : 'power2.in',
    });
  }, [mobileOpen]);
  useEffect(() => {
    const textarea = textareaRef.current;
    const cursor = cursorRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !cursor || !mirror) return;

    const syncMirrorStyles = () => {
      const computed = window.getComputedStyle(textarea);
      const mirroredProps = [
        'fontFamily',
        'fontSize',
        'fontWeight',
        'fontStyle',
        'lineHeight',
        'letterSpacing',
        'paddingTop',
        'paddingRight',
        'paddingBottom',
        'paddingLeft',
        'borderTopWidth',
        'borderRightWidth',
        'borderBottomWidth',
        'borderLeftWidth',
        'textTransform',
        'textIndent',
        'wordSpacing',
      ] as const;

      mirroredProps.forEach((prop) => {
        mirror.style[prop] = computed[prop];
      });
      mirror.style.width = `${textarea.clientWidth}px`;
    };
    
    const updateCursor = () => {
      if (!textarea || !cursor) return;

      syncMirrorStyles();

      const selectionStart = textarea.selectionStart ?? 0;
      const textBeforeCaret = textarea.value.slice(0, selectionStart).replace(/ /g, '\u00a0');

      mirror.textContent = '';
      mirror.appendChild(document.createTextNode(textBeforeCaret));

      const marker = document.createElement('span');
      marker.textContent = '\u200b';
      mirror.appendChild(marker);

      const lineHeight = parseFloat(window.getComputedStyle(textarea).lineHeight) || 22;
      cursor.style.height = `${lineHeight}px`;
      cursor.style.top = `${textarea.offsetTop + marker.offsetTop - textarea.scrollTop}px`;
      cursor.style.left = `${textarea.offsetLeft + marker.offsetLeft - textarea.scrollLeft}px`;
    };

    updateCursor();
    textarea.addEventListener('input', updateCursor);
    textarea.addEventListener('click', updateCursor);
    textarea.addEventListener('keyup', updateCursor);
    textarea.addEventListener('scroll', updateCursor);
    textarea.addEventListener('select', updateCursor);

    const handleSelectionChange = () => {
      if (document.activeElement === textarea) {
        updateCursor();
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('resize', updateCursor);
    
    return () => {
      textarea.removeEventListener('input', updateCursor);
      textarea.removeEventListener('click', updateCursor);
      textarea.removeEventListener('keyup', updateCursor);
      textarea.removeEventListener('scroll', updateCursor);
      textarea.removeEventListener('select', updateCursor);
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('resize', updateCursor);
    };
  }, [notes]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onNotesChange(e.target.value);
    setIsTyping(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => setIsTyping(false), 800);
  }, [onNotesChange]);

  const activateTextCursor = useCallback(() => {
    setCursorTarget(textareaRef.current);
    setCursorMode('text-input');
  }, [setCursorMode, setCursorTarget]);

  const deactivateTextCursor = useCallback(() => {
    setCursorTarget(null);
    setCursorMode('default');
  }, [setCursorMode, setCursorTarget]);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  return (
    <div
      ref={panelRef}
      className={`${styles.notesPanel} ${mobileOpen ? styles.mobileOpen : ''}`}
      onMouseEnter={activateTextCursor}
      onMouseLeave={() => {
        if (!isFocused) {
          deactivateTextCursor();
        }
      }}
    >
      <div className={styles.notesTitle}>Notes</div>
      {rangeLabel && rangeDays > 0 && (
        <div className={styles.notesRangeLabel}>
          📌 {rangeLabel} ({rangeDays} day{rangeDays !== 1 ? 's' : ''})
        </div>
      )}
      <div className={`${styles.notesTextareaContainer} ${isTyping ? styles.typing : ''}`}>
        <div ref={cursorRef} className={styles.typewriterCursor} />
        <div ref={mirrorRef} className={styles.notesCaretMirror} aria-hidden="true" />
        <Pencil size={14} className={styles.pencilIcon} />
        <textarea
          ref={textareaRef}
          className={styles.notesTextarea}
          value={notes}
          onChange={handleChange}
          onFocus={() => {
            setIsFocused(true);
            activateTextCursor();
          }}
          onBlur={() => {
            setIsFocused(false);
            deactivateTextCursor();
          }}
          placeholder={`Notes for ${monthName}...`}
          rows={8}
          maxLength={500}
        />
      </div>
      <div className={styles.notesCharCount}>{notes.length}/500</div>
    </div>
  );
}
