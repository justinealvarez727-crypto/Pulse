import type { Fast, FastPlan, Meal, YMD } from '@/types';
import { dateAtMs } from './date';

export type HourState = 'fasting' | 'eat' | 'logged';
export interface HourInfo { h: number; state: HourState; fill: number; kcal: number }
const HR = 3_600_000;

/** Is clock-minute `m` inside the repeating fasting window of the plan? */
export const inFastWindow = (plan: FastPlan, m: number) => ((m - plan.startMin + 1440) % 1440) < plan.hours * 60;
export const eatWindow = (plan: FastPlan) => ({ from: (plan.startMin + plan.hours * 60) % 1440, to: plan.startMin });

/** 24 hour-pills for a day: plan colour + how much of the hour was ACTUALLY fasted (fill 0..1) + logged calories. */
export function hourInfo(date: YMD, plan: FastPlan, fasts: Fast[], meals: Meal[], now = Date.now()): HourInfo[] {
  return Array.from({ length: 24 }, (_, h) => {
    const a = dateAtMs(date, h * 60), b = a + HR;
    const covered = fasts.reduce((t, f) => { const e = f.status === 'scheduled' ? 0 : f.end ?? now; const s = f.start; return t + (e > s ? Math.max(0, Math.min(b, e) - Math.max(a, s)) : 0); }, 0);
    const kcal = meals.filter((m) => m.date === date && Number(m.time.slice(0, 2)) === h).reduce((t, m) => t + (m.kcal * m.portion) / 100, 0);
    const state: HourState = kcal > 0 ? 'logged' : inFastWindow(plan, h * 60) ? 'fasting' : 'eat';
    return { h, state, fill: Math.min(1, covered / HR), kcal };
  });
}
export const hourLabel = (h: number) => `${h % 12 || 12}${h < 12 ? 'a' : 'p'}`;
export const hourLong = (h: number) => `${h % 12 || 12}:00 ${h < 12 ? 'AM' : 'PM'}`;
