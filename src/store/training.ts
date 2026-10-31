import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ActiveExercise, ActiveWorkout, Exercise, FinishedWorkout, PlanDay, Routine, RoutineExercise, Section, SetTarget } from '@/types';
import { storage, KEY } from './persist';
import { uid, ymd } from '@/lib/date';
import { BUILTIN_EXERCISES, exerciseIndex } from '@/data/exercises';

export const ROUTINE_COLORS = ['#16a34a', '#2563eb', '#f97316', '#a855f7', '#e11d48', '#0891b2', '#ca8a04', '#db2777', '#4f46e5', '#65a30d'];
export const DEFAULT_REST = 150;
export const newSet = (): SetTarget => ({ kg: 0, reps: 5, sec: 60, km: 0 });
export const mkEx = (exerciseId: string, sets = 3): RoutineExercise => ({ uid: uid(), exerciseId, rest: DEFAULT_REST, target: exerciseIndex.get(exerciseId)?.type.startsWith('duration') ? 'time' : 'reps', sets: Array.from({ length: sets }, newSet) });

/** Default Push / Pull / Legs — 3×5 @ 150s rest, every exercise tagged MAIN (spec). */
export function defaultRoutines(): Routine[] {
  const r = (name: string, desc: string, category: string, color: string, ids: string[]): Routine => ({ id: uid(), name, desc, category, color, warmup: [], main: ids.map((i) => mkEx(i)), cooldown: [] });
  return [
    r('Push', 'Chest, shoulders, and triceps.', 'Push Day', ROUTINE_COLORS[0], ['barbell-bench-press', 'barbell-overhead-press', 'chest-dips', 'dumbbell-lateral-raise']),
    r('Pull', 'Back, lats, rear delts, and biceps.', 'Pull Day', ROUTINE_COLORS[1], ['barbell-deadlift', 'bent-over-barbell-row', 'lat-pulldown', 'dumbbell-bicep-curl']),
    r('Legs', 'Lower · Quads, hamstrings, glutes, and calves.', 'Lower', ROUTINE_COLORS[2], ['barbell-back-squat', 'leg-press', 'lying-leg-curl', 'standing-calf-raise']),
  ];
}
export const READY_MADE: Omit<Routine, 'id'>[] = [
  { name: 'Upper Body', desc: 'Chest, back, shoulders and arms.', category: 'Upper', color: ROUTINE_COLORS[3], warmup: [], cooldown: [], main: ['dumbbell-bench-press', 'one-arm-dumbbell-row', 'dumbbell-shoulder-press', 'seated-cable-row', 'hammer-curl', 'triceps-pushdown'].map((i) => mkEx(i, 3)) },
  { name: 'Full Body A', desc: 'Squat, press, row — three days a week.', category: 'Full Body', color: ROUTINE_COLORS[4], warmup: [], cooldown: [], main: ['barbell-back-squat', 'barbell-bench-press', 'bent-over-barbell-row', 'plank'].map((i) => mkEx(i, 3)) },
  { name: 'Core & Glutes', desc: 'Hips, glutes and trunk stability.', category: 'Lower', color: ROUTINE_COLORS[5], warmup: [], cooldown: [], main: ['barbell-hip-thrust', 'bulgarian-split-squat', 'cable-crunch', 'side-plank'].map((i) => mkEx(i, 3)) },
];

const WARM = ['arm-circles', 'leg-swings', 'jumping-jacks'], COOL = ['child-s-pose', 'hamstring-stretch', 'doorway-chest-stretch'];
export { WARM, COOL };

interface S {
  custom: Exercise[]; routines: Routine[]; history: FinishedWorkout[]; plan: PlanDay[]; planColors: Record<string, string>;
  active: ActiveWorkout | null;
  allExercises: () => Exercise[]; ex: (id: string) => Exercise | undefined;
  addCustom: (e: Omit<Exercise, 'id' | 'custom'> & { id?: string }) => string; removeCustom: (id: string) => void;
  saveRoutine: (r: Routine) => void; deleteRoutine: (id: string) => void; restoreDefaults: () => void; addRoutine: (r: Omit<Routine, 'id'>) => string;
  setPlanDay: (i: number, d: PlanDay) => void;
  // active workout
  start: (routineId?: string) => void; discard: () => void; finish: () => FinishedWorkout | null;
  patchActive: (p: Partial<ActiveWorkout>) => void;
  addExercises: (ids: string[], section?: Section) => void;
  patchEx: (uid: string, p: Partial<ActiveExercise>) => void; removeEx: (uid: string) => void; moveEx: (uid: string, dir: -1 | 1) => void;
  addSet: (uid: string) => void; removeSet: (uid: string) => void; patchSet: (uid: string, i: number, p: Partial<ActiveExercise['sets'][0]>) => void;
  toggleSet: (uid: string, i: number) => boolean; skipRest: () => void; adjustRest: (sec: number) => void; togglePause: () => void;
  setUnit: (u: 'kg' | 'lbs') => void;
}
const mapEx = (a: ActiveWorkout, uidv: string, f: (e: ActiveExercise) => ActiveExercise): ActiveWorkout => ({ ...a, exercises: a.exercises.map((e) => (e.uid === uidv ? f(e) : e)) });

export const useTraining = create<S>()(persist((set, get) => ({
  custom: [], routines: defaultRoutines(), history: [], plan: Array(7).fill(null), planColors: {}, active: null,
  allExercises: () => [...get().custom, ...BUILTIN_EXERCISES],
  ex: (id) => exerciseIndex.get(id) ?? get().custom.find((e) => e.id === id),
  addCustom: (e) => { const id = e.id ?? `c-${uid()}`; set((s) => ({ custom: [...s.custom.filter((x) => x.id !== id), { ...e, id, custom: true }] })); return id; },
  removeCustom: (id) => set((s) => ({ custom: s.custom.filter((e) => e.id !== id) })),
  saveRoutine: (r) => set((s) => ({ routines: s.routines.some((x) => x.id === r.id) ? s.routines.map((x) => (x.id === r.id ? r : x)) : [...s.routines, r] })),
  addRoutine: (r) => { const id = uid(); set((s) => ({ routines: [...s.routines, { ...r, id }] })); return id; },
  deleteRoutine: (id) => set((s) => ({ routines: s.routines.filter((r) => r.id !== id), plan: s.plan.map((p) => (p && p.kind === 'routine' && p.routineId === id ? null : p)) })),
  restoreDefaults: () => set((s) => ({ routines: [...defaultRoutines(), ...s.routines.filter((r) => !['Push', 'Pull', 'Legs'].includes(r.name))] })),
  setPlanDay: (i, d) => set((s) => ({ plan: s.plan.map((p, j) => (j === i ? d : p)) })),

  start: (routineId) => {
    if (get().active) return;
    const r = get().routines.find((x) => x.id === routineId);
    const mk = (sec: Section) => (r ? r[sec] : []).map((e): ActiveExercise => ({ uid: uid(), exerciseId: e.exerciseId, rest: e.rest, note: '', section: sec, target: e.target, sets: e.sets.map((s) => ({ ...s, done: false })) }));
    set({ active: { id: uid(), routineId, name: r?.name ?? 'Workout', note: '', startedAt: Date.now(), pausedAt: null, pausedMs: 0, unit: 'kg', exercises: [...mk('warmup'), ...mk('main'), ...mk('cooldown')], rest: null } });
  },
  discard: () => set({ active: null }),
  patchActive: (p) => set((s) => (s.active ? { active: { ...s.active, ...p } } : s)),
  addExercises: (ids, section = 'main') => set((s) => !s.active ? s : { active: { ...s.active, exercises: [...s.active.exercises, ...ids.map((id): ActiveExercise => ({ ...mkEx(id), note: '', section, sets: mkEx(id).sets.map((x) => ({ ...x, done: false })) }))] } }),
  patchEx: (u, p) => set((s) => (s.active ? { active: mapEx(s.active, u, (e) => ({ ...e, ...p })) } : s)),
  removeEx: (u) => set((s) => (s.active ? { active: { ...s.active, exercises: s.active.exercises.filter((e) => e.uid !== u) } } : s)),
  moveEx: (u, dir) => set((s) => {
    if (!s.active) return s; const a = [...s.active.exercises]; const i = a.findIndex((e) => e.uid === u); const j = i + dir;
    if (i < 0 || j < 0 || j >= a.length) return s; [a[i], a[j]] = [a[j], a[i]]; return { active: { ...s.active, exercises: a } };
  }),
  addSet: (u) => set((s) => (s.active ? { active: mapEx(s.active, u, (e) => ({ ...e, sets: [...e.sets, { ...(e.sets[e.sets.length - 1] ?? newSet()), done: false }] })) } : s)),
  removeSet: (u) => set((s) => (s.active ? { active: mapEx(s.active, u, (e) => ({ ...e, sets: e.sets.slice(0, -1) })) } : s)),
  patchSet: (u, i, p) => set((s) => (s.active ? { active: mapEx(s.active, u, (e) => ({ ...e, sets: e.sets.map((x, j) => (j === i ? { ...x, ...p } : x)) })) } : s)),
  /** Ticking a set starts the rest timer; while it runs no other set can be ticked until it ends or is skipped (spec). */
  toggleSet: (u, i) => {
    const a = get().active; if (!a) return false;
    if (a.rest && a.rest.endsAt > Date.now()) return false;
    const e = a.exercises.find((x) => x.uid === u); if (!e) return false;
    const done = !e.sets[i].done;
    set({ active: { ...mapEx(a, u, (x) => ({ ...x, sets: x.sets.map((st, j) => (j === i ? { ...st, done } : st)) })), rest: done && e.rest > 0 ? { endsAt: Date.now() + e.rest * 1000, total: e.rest } : null } });
    return true;
  },
  skipRest: () => set((s) => (s.active ? { active: { ...s.active, rest: null } } : s)),
  adjustRest: (sec) => set((s) => (s.active?.rest ? { active: { ...s.active, rest: { endsAt: s.active.rest.endsAt + sec * 1000, total: Math.max(1, s.active.rest.total + sec) } } } : s)),
  togglePause: () => set((s) => {
    const a = s.active; if (!a) return s; const now = Date.now();
    return { active: a.pausedAt ? { ...a, pausedAt: null, pausedMs: a.pausedMs + (now - a.pausedAt) } : { ...a, pausedAt: now } };
  }),
  setUnit: (u) => set((s) => {
    const a = s.active; if (!a || a.unit === u) return s;
    const k = u === 'lbs' ? 2.2046226 : 1 / 2.2046226; // convert every entered weight so numbers stay meaningful
    return { active: { ...a, unit: u, exercises: a.exercises.map((e) => ({ ...e, sets: e.sets.map((x) => ({ ...x, kg: Math.round(x.kg * k * 10) / 10 })) })) } };
  }),

  finish: () => {
    const { active: a, history, ex } = get(); if (!a) return null;
    const now = Date.now(); const durMs = now - a.startedAt - a.pausedMs - (a.pausedAt ? now - a.pausedAt : 0);
    const prevBest: Record<string, number> = {}; history.forEach((h) => h.sessionsByExercise.forEach((s) => (prevBest[s.exerciseId] = Math.max(prevBest[s.exerciseId] ?? 0, s.bestKg))));
    let volume = 0, records = 0; const muscles: Record<string, number> = {}; const sessions: FinishedWorkout['sessionsByExercise'] = [];
    for (const e of a.exercises) {
      const done = e.sets.filter((s) => s.done); if (!done.length) continue;
      const kgUnit = a.unit === 'lbs' ? 1 / 2.2046226 : 1; // stored in kg
      const info = ex(e.exerciseId);
      const rows = done.map((s) => ({ kg: s.kg * kgUnit, reps: s.reps, sec: s.sec, km: s.km }));
      const vol = rows.reduce((t, s) => t + s.kg * s.reps, 0);
      const bestKg = Math.max(0, ...rows.map((s) => s.kg));
      if (bestKg > 0 && bestKg > (prevBest[e.exerciseId] ?? 0)) records++;
      volume += vol;
      if (info) muscles[info.primary] = (muscles[info.primary] ?? 0) + done.length;
      sessions.push({ exerciseId: e.exerciseId, sets: done.length, volume: vol, reps: rows.reduce((t, s) => t + s.reps, 0), sec: rows.reduce((t, s) => t + s.sec, 0), km: rows.reduce((t, s) => t + s.km, 0), bestKg });
    }
    const fin: FinishedWorkout = { id: a.id, name: a.name, date: ymd(new Date(a.startedAt)), startedAt: a.startedAt, durationSec: Math.round(durMs / 1000), volume: Math.round(volume), records, muscles, sessionsByExercise: sessions };
    set({ history: [fin, ...history], active: null }); return fin;
  },
}), { name: KEY('training'), storage, version: 1 }));

export const activeElapsedSec = (a: ActiveWorkout, now = Date.now()) => Math.max(0, Math.round((now - a.startedAt - a.pausedMs - (a.pausedAt ? now - a.pausedAt : 0)) / 1000));
