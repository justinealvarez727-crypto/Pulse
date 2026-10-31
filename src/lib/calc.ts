import type { Profile, Macros, GoalType, YMD } from '@/types';
import { diffDays } from './date';

export const kgToLbs = (kg: number) => kg * 2.2046226218;
export const lbsToKg = (lb: number) => lb / 2.2046226218;
export const cmToFtIn = (cm: number) => { const t = cm / 2.54; return { ft: Math.floor(t / 12), inch: Math.round(t % 12) }; };
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** Asian-Pacific BMI cut-offs (WHO Asia-Pacific): <18.5, 18.5–22.9, 23–27.4, ≥27.5 */
export function bmi(kg: number, cm: number) { return kg / Math.pow(cm / 100, 2); }
export function bmiCategory(b: number): { label: 'Under' | 'Healthy' | 'Over' | 'Obese'; tone: string } {
  if (b < 18.5) return { label: 'Under', tone: 'text-water' };
  if (b < 23) return { label: 'Healthy', tone: 'text-brand-600' };
  if (b < 27.5) return { label: 'Over', tone: 'text-kcal' };
  return { label: 'Obese', tone: 'text-red-600' };
}
/** Marker position (0..1) on a 15..35 BMI scale. */
export const bmiPos = (b: number) => Math.min(1, Math.max(0, (b - 15) / 20));

/**
 * Mifflin–St Jeor BMR. Sex "unspecified" uses the midpoint of the male (+5) and
 * female (−161) constants (−78) so the app never has to assume.
 */
export function bmr(kg: number, cm: number, age: number, sex: Profile['sex']) {
  const c = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  return 10 * kg + 6.25 * cm - 5 * age + c;
}
/** Targets from height/weight/goal. Activity factor fixed at 1.375 (light) — calories burned never alter the goal (spec). */
export function computeTargets(p: Profile, kg: number, today: YMD): Macros {
  const tdee = bmr(kg, p.heightCm, p.age, p.sex) * 1.375;
  const days = Math.max(14, diffDays(p.goalDate, today));
  const delta = p.goalType === 'maintain' ? 0 : ((p.goalWeightKg - kg) * 7700) / days;       // kcal/day to hit goal by date
  const capped = Math.max(-0.25 * tdee, Math.min(0.15 * tdee, delta));                         // safe-rate clamp
  const kcal = Math.round(Math.max(1200, tdee + capped) / 10) * 10;
  const protein = Math.round(kg * (p.goalType === 'gain' ? 2.0 : 1.8));
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, p: protein, f: fat, c: carbs, fiber: Math.round((kcal / 1000) * 14), sugar: Math.round((kcal * 0.1) / 4), sodium: 2300, chol: 300 };
}
/** Zigzag: per-weekday calories that average exactly to the target (3 lower, 2 normal, 2 higher days). */
export function zigzag(kcal: number): number[] {
  const pattern = [0.9, 1.1, 0.9, 1.1, 0.95, 1.05, 1.0]; // mean = 1
  const out = pattern.map((m) => Math.round((kcal * m) / 10) * 10);
  out[6] += kcal * 7 - out.reduce((a, b) => a + b, 0);
  return out;
}

/** Stride ≈ 0.415 × height (cm) — distance per step derives from height (spec). */
export const stepsToKm = (steps: number, heightCm: number) => (steps * heightCm * 0.415) / 100000;
const MET = { Walking: 3.5, Running: 8.5 } as const;
/** Estimated kcal burned. Needs a logged weight; otherwise returns undefined (UI shows nothing). */
export function kcalBurned(opts: { kg?: number; minutes?: number; steps?: number; heightCm: number; type?: 'Walking' | 'Running' }): number | undefined {
  const { kg, minutes, steps, heightCm, type = 'Walking' } = opts; if (!kg) return undefined;
  if (minutes) return Math.round((MET[type] * 3.5 * kg * minutes) / 200);
  if (steps) return Math.round(stepsToKm(steps, heightCm) * kg * (type === 'Running' ? 1.0 : 0.75));
  return undefined;
}

/**
 * "Bits": automatic score for how heavy each activity is.
 *  meal logged 8 · water goal 12 · steps 4/1k (cap 12k) · fasted hour 2 (cap 20) · workout 30 + 1/500 kg volume + 10/record
 * 30 bits = 1 star. Levels every 20 stars.
 */
export const BITS = { meal: 8, water: 12, stepsPerK: 4, fastHour: 2, workout: 30, volumePer500: 1, record: 10 };
export const BITS_PER_STAR = 30;
const LEVELS = ['Starter', 'Mover', 'Regular', 'Dedicated', 'Athlete', 'Elite', 'Legend'];
export function levelOf(totalBits: number) {
  const stars = Math.floor(totalBits / BITS_PER_STAR);
  return { stars, name: LEVELS[Math.min(LEVELS.length - 1, Math.floor(stars / 20))], toNext: totalBits % BITS_PER_STAR };
}
export function goalLabel(g: GoalType) { return g === 'lose' ? 'Lose weight' : g === 'gain' ? 'Build muscle' : 'Maintain'; }
