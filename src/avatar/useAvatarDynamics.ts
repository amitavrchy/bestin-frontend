import { useEffect, type RefObject } from 'react';
import type { Viseme, WordTime } from '../lib/types';
import type { Expression } from './characters/Avatar';
import { browEmphasis, sentenceNod, spring } from './motion';

export function useAvatarDynamics(ref: RefObject<SVGSVGElement | null>, expression: Expression, audio: HTMLAudioElement | null, words: WordTime[], visemes: Viseme[]) {
  useEffect(() => {
    const svg = ref.current;
    if (!svg || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const head = svg.querySelector<SVGGElement>('.avatar-head');
    const brows = svg.querySelector<SVGElement>('.eyebrows');
    let frame = 0, previous = 0, position = 0, velocity = 0;
    const tick = (now: number) => {
      const time = audio?.currentTime ?? 0;
      const speaking = expression === 'speaking' && !!audio && !audio.paused;
      const open = speaking && visemes.some(v => time >= v.start && time < v.end && ['C', 'D', 'H'].includes(v.value));
      const target = expression === 'listening' ? 4 : expression === 'thinking' ? -5 : Math.sin(now / 1900) * 1.6 + (open ? 1.5 : 0) + (speaking && sentenceNod(words, time) ? 3 : 0);
      ({ position, velocity } = spring(position, velocity, target, previous ? (now - previous) / 1000 : 0));
      previous = now;
      head?.style.setProperty('transform', `rotate(${position}deg) ${expression === 'listening' ? 'translateY(3px)' : ''}`);
      brows?.style.setProperty('transform', `translateY(${speaking && browEmphasis(words, time) ? -4 : expression === 'thinking' ? 2 : expression === 'listening' || expression === 'happy' ? -2 : 0}px)`);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); head?.style.removeProperty('transform'); brows?.style.removeProperty('transform'); };
  }, [ref, expression, audio, words, visemes]);
}
