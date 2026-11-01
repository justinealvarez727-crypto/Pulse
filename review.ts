import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LeitnerCard } from '@/types';
import { storage, KEY } from './persist';
import { newCard, review } from '@/lib/leitner';
import { BUILTIN_EXERCISES, cuesFor } from '@/data/exercises';

interface S {
  cards: LeitnerCard[];
  /** Create form-check cards for the given exercise ids (idempotent). */
  ensure: (exerciseIds: string[]) => void;
  answer: (id: string, correct: boolean) => void;
}
export const useReview = create<S>()(persist((set, get) => ({
  cards: [],
  ensure: (ids) => {
    const have = new Set(get().cards.map((c) => c.id)); const add: LeitnerCard[] = [];
    for (const id of ids) { const e = BUILTIN_EXERCISES.find((x) => x.id === id); if (!e || have.has(id)) continue; add.push(newCard(id, e.name, cuesFor(e).join('\n'))); }
    if (add.length) set((s) => ({ cards: [...s.cards, ...add] }));
  },
  answer: (id, ok) => set((s) => ({ cards: s.cards.map((c) => (c.id === id ? review(c, ok) : c)) })),
}), { name: KEY('review'), storage, version: 1 }));
