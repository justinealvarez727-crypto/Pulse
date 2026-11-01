/**
 * Leitner spaced-repetition engine.
 *
 * Model
 *  - Cards live in boxes 1..N. Box k is reviewed every I_k days where
 *        I_k = ceil( b · r^(k-1) )            (geometric growth; defaults b = 1 day, r = 2 → 1, 2, 4, 8, 16)
 *  - Correct answer  → promote one box (capped at N). Wrong → demote to box 1 (classic) or box k-1 ("gentle").
 *  - Memory is modelled as exponential decay  R(t) = exp(−t / S_k).  Choosing S_k = I_k / −ln(R*) makes the
 *    predicted recall exactly R* (default 90 %) at the moment a card falls due — so the interval ladder is
 *    anchored to a target retention instead of being arbitrary.
 *  - Due ordering: most-overdue first, ties broken by lower box (weaker memories first).
 */
import type { LeitnerCard } from '@/types';

export interface LeitnerConfig { boxes: number; baseDays: number; ratio: number; targetRetention: number; demote: 'reset' | 'gentle' }
export const DEFAULT_CONFIG: LeitnerConfig = { boxes: 5, baseDays: 1, ratio: 2, targetRetention: 0.9, demote: 'reset' };
export const DAY = 86_400_000;

export const intervalDays = (box: number, c: LeitnerConfig = DEFAULT_CONFIG) =>
  Math.ceil(c.baseDays * Math.pow(c.ratio, Math.min(Math.max(box, 1), c.boxes) - 1));
export const stability = (box: number, c: LeitnerConfig = DEFAULT_CONFIG) => (intervalDays(box, c) * DAY) / -Math.log(c.targetRetention);
export const retention = (card: LeitnerCard, now: number, c: LeitnerConfig = DEFAULT_CONFIG) =>
  card.lastReviewed == null ? 0 : Math.exp(-(now - card.lastReviewed) / stability(card.box, c));

export function newCard(id: string, front: string, back: string, now = Date.now()): LeitnerCard {
  return { id, front, back, box: 1, lastReviewed: null, due: now, reviews: 0, lapses: 0 };
}
export function review(card: LeitnerCard, correct: boolean, now = Date.now(), c: LeitnerConfig = DEFAULT_CONFIG): LeitnerCard {
  const box = correct ? Math.min(c.boxes, card.box + 1) : c.demote === 'gentle' ? Math.max(1, card.box - 1) : 1;
  return { ...card, box, lastReviewed: now, due: now + intervalDays(box, c) * DAY, reviews: card.reviews + 1, lapses: card.lapses + (correct ? 0 : 1) };
}
export function dueCards(cards: LeitnerCard[], now = Date.now()) {
  return cards.filter((k) => k.due <= now).sort((a, b) => a.due - b.due || a.box - b.box);
}
export function boxCounts(cards: LeitnerCard[], c: LeitnerConfig = DEFAULT_CONFIG) {
  const out = Array(c.boxes).fill(0) as number[]; cards.forEach((k) => out[k.box - 1]++); return out;
}
/** Mastery = share of cards in the top two boxes. */
export const mastery = (cards: LeitnerCard[], c: LeitnerConfig = DEFAULT_CONFIG) =>
  cards.length ? cards.filter((k) => k.box >= c.boxes - 1).length / cards.length : 0;
