import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Fast, FastPlan, YMD } from '@/types';
import { storage, KEY } from './persist';
import { uid, ymd, dateAtMs } from '@/lib/date';

export const PRESETS: { id: string; label: string; hours: number }[] = [
  { id: '16:8', label: '16:8', hours: 16 }, { id: '18:6', label: '18:6', hours: 18 }, { id: '20:4', label: '20:4', hours: 20 }, { id: 'OMAD', label: 'OMAD', hours: 23 },
];
const H = 3_600_000;
/** A fast belongs to the day it ENDED (spec). */
export const fastDay = (f: Fast): YMD => ymd(new Date(f.end ?? f.plannedEnd));
export const fastHours = (f: Fast, now = Date.now()) => ((f.end ?? Math.min(now, Math.max(f.plannedEnd, now))) - f.start) / H;

interface S {
  plan: FastPlan; fasts: Fast[];
  setPlan: (p: Partial<FastPlan>) => void;
  start: () => string | null; end: () => void;
  schedule: (start: number, end: number) => string | null;
  logMissed: (start: number, end: number) => string | null;
  remove: (id: string) => void;
  /** Called every second by <Ticker/>: promotes a scheduled fast whose time has arrived. */
  tick: (now: number) => void;
  running: () => Fast | undefined; scheduled: () => Fast | undefined;
}
const overlaps = (fasts: Fast[], a: number, b: number, ignore?: string) =>
  fasts.some((f) => f.id !== ignore && a < (f.end ?? Math.max(f.plannedEnd, Date.now())) && b > f.start);

export const useFasting = create<S>()(persist((set, get) => ({
  plan: { startMin: 22 * 60, hours: 16, preset: '16:8' }, // eat window 2:00 PM–10:00 PM  ⇒ fast starts 10 PM, ends 2 PM
  fasts: [],
  setPlan: (p) => set((s) => {
    const plan = { ...s.plan, ...p };
    // editing affects a RUNNING fast only; past fasts keep their original hours (spec)
    const fasts = s.fasts.map((f) => (f.status === 'running' ? { ...f, plannedEnd: f.start + plan.hours * H } : f));
    return { plan, fasts };
  }),
  start: () => {
    const now = Date.now(); const { plan, fasts } = get();
    if (fasts.some((f) => f.status === 'running')) return 'A fast is already running.';
    const end = now + plan.hours * H;
    if (overlaps(fasts, now, end)) return 'This overlaps a scheduled or logged fast.';
    set({ fasts: [...fasts, { id: uid(), start: now, plannedEnd: end, end: null, status: 'running' }] }); return null;
  },
  end: () => set((s) => ({ fasts: s.fasts.map((f) => (f.status === 'running' ? { ...f, end: Date.now(), status: 'done' as const } : f)) })),
  schedule: (start, end) => {
    if (end <= start) return 'End must be after start.'; if (start <= Date.now()) return 'Pick a start time in the future.';
    if (overlaps(get().fasts, start, end)) return 'Overlaps another fast.';
    set((s) => ({ fasts: [...s.fasts.filter((f) => f.status !== 'scheduled'), { id: uid(), start, plannedEnd: end, end: null, status: 'scheduled' }] })); return null;
  },
  logMissed: (start, end) => {
    if (end <= start) return 'End must be after start.'; if (end > Date.now()) return 'A logged fast must already be over.';
    if (overlaps(get().fasts, start, end)) return 'Overlaps another fast.';
    set((s) => ({ fasts: [...s.fasts, { id: uid(), start, plannedEnd: end, end, status: 'done' }] })); return null;
  },
  remove: (id) => set((s) => ({ fasts: s.fasts.filter((f) => f.id !== id) })),
  tick: (now) => {
    const f = get().fasts.find((x) => x.status === 'scheduled' && x.start <= now);
    if (f && !get().fasts.some((x) => x.status === 'running')) set((s) => ({ fasts: s.fasts.map((x) => (x.id === f.id ? { ...x, status: 'running' as const } : x)) }));
  },
  running: () => get().fasts.find((f) => f.status === 'running'),
  scheduled: () => get().fasts.find((f) => f.status === 'scheduled'),
}), { name: KEY('fasting'), storage, version: 1 }));
export { dateAtMs };
