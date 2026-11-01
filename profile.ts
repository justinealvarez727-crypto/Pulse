import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile, WeightEntry, YMD } from '@/types';
import { storage, KEY } from './persist';
import { addDays, ymd } from '@/lib/date';
import { computeTargets, zigzag } from '@/lib/calc';

export const defaultProfile = (): Profile => ({
  name: 'You', avatar: '🙂', heightCm: 156, age: 30, sex: 'unspecified',
  goalType: 'lose', goalWeightKg: 55, goalDate: addDays(ymd(), 90),
  targets: { kcal: 1778, p: 140, f: 60, c: 170, fiber: 25, sugar: 44, sodium: 2300, chol: 300 },
  waterGoal: 2000, waterStep: 50, stepsGoal: 10000,
  zigzag: { on: false, kcal: zigzag(1778) },
  track: { fiber: true, sugar: true, sodium: true, chol: true },
  dayResetHour: 0, unitWeight: 'kg', customTargets: false,
});

interface S {
  profile: Profile; weights: WeightEntry[];
  setProfile: (p: Partial<Profile>) => void;
  logWeight: (date: YMD, kg: number) => void;
  removeWeight: (date: YMD) => void;
  latestKg: () => number | undefined;
  weightOn: (date: YMD) => number | undefined;
  /** Recompute calorie/macro targets from height, weight and goal (not used when custom targets are on). */
  recalcTargets: (today: YMD) => void;
  /** Today's calorie goal, honouring the zigzag schedule. weekdayMon0: 0=Mon. */
  kcalGoalFor: (weekdayMon0: number) => number;
}
export const useProfile = create<S>()(persist((set, get) => ({
  profile: defaultProfile(), weights: [],
  setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
  logWeight: (date, kg) => { set((s) => ({ weights: [...s.weights.filter((w) => w.date !== date), { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) })); },
  removeWeight: (date) => set((s) => ({ weights: s.weights.filter((w) => w.date !== date) })),
  latestKg: () => get().weights[get().weights.length - 1]?.kg,
  weightOn: (date) => get().weights.find((w) => w.date === date)?.kg,
  recalcTargets: (today) => { const kg = get().latestKg(); if (!kg || get().profile.customTargets) return; set((s) => ({ profile: { ...s.profile, targets: computeTargets(s.profile, kg, today) } })); },
  kcalGoalFor: (i) => { const { profile: p } = get(); return p.zigzag.on ? p.zigzag.kcal[i] : p.targets.kcal; },
}), { name: KEY('profile'), storage, version: 1 }));
