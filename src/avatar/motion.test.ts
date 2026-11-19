import { describe, expect, it } from 'vitest';
import { spring, browEmphasis, nextBlink, sentenceNod } from './motion';
describe('avatar motion scheduling', () => {
  it('settles smoothly at its spring target', () => {
    let state = { position: 0, velocity: 0 };
    for (let i = 0; i < 180; i++) state = spring(state.position, state.velocity, 5, 1 / 60);
    expect(state.position).toBeCloseTo(5, 3);
    expect(state.velocity).toBeCloseTo(0, 3);
  });
  it('emphasizes long and questioning words and nods after a sentence', () => {
    const words = [{ word: 'wonderful?', start: 1, end: 1.7 }];
    expect(browEmphasis(words, 1.2)).toBe(true);
    expect(browEmphasis(words, 2)).toBe(false);
    expect(sentenceNod(words, 1.8)).toBe(true);
  });
  it('schedules occasional double blinks', () => {
    expect(nextBlink(100, () => 0)).toEqual({ next: 2600, double: 360 });
    expect(nextBlink(100, () => 0.5).double).toBe(0);
  });
});
