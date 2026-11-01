import { describe, it, expect } from 'vitest';
import { DEFAULT_CONFIG, intervalDays, newCard, review, retention, dueCards, DAY, stability } from './leitner';

describe('leitner', () => {
  it('uses geometric intervals 1,2,4,8,16', () => {
    expect([1, 2, 3, 4, 5].map((b) => intervalDays(b))).toEqual([1, 2, 4, 8, 16]);
  });
  it('promotes on success, resets on failure', () => {
    let c = newCard('a', 'q', 'a', 0);
    c = review(c, true, 0); expect(c.box).toBe(2); expect(c.due).toBe(2 * DAY);
    c = review(c, true, 2 * DAY); expect(c.box).toBe(3);
    c = review(c, false, 6 * DAY); expect(c.box).toBe(1); expect(c.lapses).toBe(1);
  });
  it('caps at the last box', () => {
    let c = newCard('a', 'q', 'a', 0); for (let i = 0; i < 9; i++) c = review(c, true, i);
    expect(c.box).toBe(DEFAULT_CONFIG.boxes);
  });
  it('predicts 90% recall exactly at the due date', () => {
    const c = review(newCard('a', 'q', 'a', 0), true, 0);
    expect(retention(c, c.due)).toBeCloseTo(0.9, 10);
    expect(stability(2)).toBeGreaterThan(stability(1));
  });
  it('orders due cards most-overdue first', () => {
    const a = { ...newCard('a', '', '', 0), due: 5 }, b = { ...newCard('b', '', '', 0), due: 1 }, c = { ...newCard('c', '', '', 0), due: 99 };
    expect(dueCards([a, b, c], 10).map((x) => x.id)).toEqual(['b', 'a']);
  });
});
