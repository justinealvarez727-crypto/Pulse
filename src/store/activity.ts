import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActivityLog, StepDay, YMD } from '@/types';
import { storage, KEY } from './persist';
import { uid } from '@/lib/date';

interface S {
  days: Record<YMD, StepDay>; logs: ActivityLog[];
  setSteps: (d: YMD, steps: number, minutes?: number) => void;
  addLog: (l: Omit<ActivityLog, 'id'>) => void; removeLog: (id: string) => void;
  stepsOn: (d: YMD) => number; minutesOn: (d: YMD) => number; logsOn: (d: YMD) => ActivityLog[];
}
export const useActivity = create<S>()(persist((set, get) => ({
  days: {}, logs: [],
  setSteps: (d, steps, minutes) => set((s) => ({ days: { ...s.days, [d]: { steps: Math.max(0, steps), minutes } } })),
  addLog: (l) => set((s) => ({ logs: [...s.logs, { ...l, id: uid() }] })),
  removeLog: (id) => set((s) => ({ logs: s.logs.filter((l) => l.id !== id) })),
  /** Steps typed manually + steps entered inside walking/running logs (spec: they add to the day's total). */
  stepsOn: (d) => (get().days[d]?.steps ?? 0) + get().logs.filter((l) => l.date === d).reduce((a, l) => a + (l.steps ?? 0), 0),
  minutesOn: (d) => (get().days[d]?.minutes ?? 0) + get().logs.filter((l) => l.date === d).reduce((a, l) => a + l.minutes, 0),
  logsOn: (d) => get().logs.filter((l) => l.date === d),
}), { name: KEY('activity'), storage, version: 1 }));
