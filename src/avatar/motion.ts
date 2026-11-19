import type { WordTime } from '../lib/types';

/** Stable critically damped spring, using seconds for the time step. */
export function spring(position: number, velocity: number, target: number, dt: number, frequency = 7) {
  const t = Math.min(Math.max(dt, 0), 0.05);
  const offset = position - target;
  const decay = Math.exp(-frequency * t);
  const helper = velocity + frequency * offset;
  return { position: target + (offset + helper * t) * decay, velocity: (velocity - frequency * helper * t) * decay };
}
export function browEmphasis(words: WordTime[], time: number) {
  return words.some((word) => time >= word.start && time <= word.end && (word.word.length >= 7 || word.end - word.start >= 0.55 || word.word.includes('?')));
}
export function sentenceNod(words: WordTime[], time: number) {
  return words.some((word) => /[.!?]["']?$/.test(word.word) && time >= word.end && time < word.end + 0.28);
}
export function nextBlink(now: number, random: () => number = Math.random) {
  return { next: now + 2500 + random() * 4000, double: random() < 0.2 ? now + 260 : 0 };
}
