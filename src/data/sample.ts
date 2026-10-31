import { addDays, ymd, uid, dateAtMs } from '@/lib/date';
import { useNutrition } from '@/store/nutrition';
import { useProfile } from '@/store/profile';
import { useActivity } from '@/store/activity';
import { useFasting } from '@/store/fasting';
import { useTraining } from '@/store/training';
import { estimate } from '@/data/foods';
import type { FinishedWorkout, Fast, MealSlot, Meal } from '@/types';

/** Deterministic PRNG so the demo data is identical for every user (mulberry32). */
function rng(seed: number) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const DAYS: { slot: MealSlot; time: string; items: { name: string; grams: number }[] }[][] = [
  [{ slot: 'Breakfast', time: '08:10', items: [{ name: 'oats raw', grams: 60 }, { name: 'milk whole', grams: 200 }, { name: 'banana', grams: 100 }] }, { slot: 'Lunch', time: '12:45', items: [{ name: 'chicken breast cooked', grams: 170 }, { name: 'white rice cooked', grams: 220 }, { name: 'broccoli cooked', grams: 120 }] }, { slot: 'Snacks', time: '16:00', items: [{ name: 'greek yogurt', grams: 170 }, { name: 'almonds', grams: 20 }] }, { slot: 'Dinner', time: '19:30', items: [{ name: 'salmon cooked', grams: 150 }, { name: 'sweet potato baked', grams: 200 }, { name: 'spinach', grams: 80 }] }],
  [{ slot: 'Breakfast', time: '08:30', items: [{ name: 'egg boiled', grams: 120 }, { name: 'bread whole wheat', grams: 70 }, { name: 'avocado', grams: 60 }] }, { slot: 'Lunch', time: '13:00', items: [{ name: 'tuna canned', grams: 120 }, { name: 'pasta cooked', grams: 200 }, { name: 'tomato', grams: 100 }] }, { slot: 'Dinner', time: '19:15', items: [{ name: 'beef cooked', grams: 150 }, { name: 'potato boiled', grams: 220 }, { name: 'carrot', grams: 100 }] }],
  [{ slot: 'Breakfast', time: '09:00', items: [{ name: 'whey protein', grams: 30 }, { name: 'milk skim', grams: 250 }, { name: 'banana', grams: 120 }] }, { slot: 'Lunch', time: '13:10', items: [{ name: 'tofu firm', grams: 200 }, { name: 'brown rice cooked', grams: 200 }, { name: 'mushroom', grams: 100 }] }, { slot: 'Snacks', time: '17:00', items: [{ name: 'apple', grams: 180 }, { name: 'peanut butter', grams: 20 }] }, { slot: 'Dinner', time: '20:00', items: [{ name: 'shrimp cooked', grams: 150 }, { name: 'pasta cooked', grams: 180 }, { name: 'olive oil', grams: 10 }] }],
];

/** Fills every tracker (meals, water, steps, fasts, weight, workouts, activity) for the last 14 days. */
export function loadSampleData() {
  const R = rng(42); const today = ymd(); const meals: Meal[] = [];
  const act = useActivity.getState(); const nut = useNutrition.getState(); const prof = useProfile.getState();
  for (let i = 14; i >= 1; i--) {
    const d = addDays(today, -i); const tpl = DAYS[i % 3];
    for (const m of tpl) {
      const est = estimate(m.items).total;
      meals.push({ id: uid(), date: d, time: m.time, slot: m.slot, name: m.items[0].name.replace(/\b\w/g, (c) => c.toUpperCase()), desc: m.items.map((x) => `${x.grams}g ${x.name}`).join(', '), grams: m.items.reduce((a, b) => a + b.grams, 0), portion: 100, ...Object.fromEntries(Object.entries(est).map(([k, v]) => [k, Math.round(v)])) } as Meal);
    }
    nut.setWater(d, Math.round((1400 + R() * 900) / 50) * 50);
    act.setSteps(d, Math.round(5500 + R() * 7500), R() > 0.5 ? Math.round(30 + R() * 40) : undefined);
  }
  useNutrition.setState({ meals: [...nut.meals.filter((m) => !m.id.startsWith('s-')), ...meals.map((m) => ({ ...m, id: 's-' + m.id }))] });
  // weights: gentle downward trend from 64.0 kg
  for (let i = 14; i >= 0; i--) prof.logWeight(addDays(today, -i), Math.round((64 - (14 - i) * 0.12 + (R() - 0.5) * 0.4) * 10) / 10);
  prof.setProfile({ goalWeightKg: 58, goalDate: addDays(today, 100) });
  // fasts: 16h on most days
  const fasts: Fast[] = [];
  for (let i = 12; i >= 1; i--) { if (R() < 0.2) continue; const end = dateAtMs(addDays(today, -i), 14 * 60); const start = end - (15 + Math.round(R() * 3)) * 3_600_000; fasts.push({ id: uid(), start, plannedEnd: end, end, status: 'done' }); }
  useFasting.setState({ fasts });
  // activity logs
  act.addLog({ date: addDays(today, -2), time: '07:00', type: 'Running', minutes: 30, kcal: 280, km: 4.6 });
  act.addLog({ date: addDays(today, -4), time: '18:30', type: 'Walking', minutes: 45, steps: 5200, km: 3.7 });
  // workouts (history) – Push / Pull / Legs rotation with progressive overload
  const tr = useTraining.getState(); const hist: FinishedWorkout[] = [];
  const rot = tr.routines.slice(0, 3);
  [12, 10, 8, 6, 4, 2, 1].forEach((back, n) => {
    const r = rot[n % rot.length]; if (!r) return; const d = addDays(today, -back); const muscles: Record<string, number> = {}; let vol = 0;
    const sessions = r.main.map((e, j) => { const ex = tr.ex(e.exerciseId); const kg = Math.round((20 + j * 12 + n * 2.5) / 2.5) * 2.5; const v = kg * 5 * 3; vol += v; if (ex) muscles[ex.primary] = (muscles[ex.primary] ?? 0) + 3; return { exerciseId: e.exerciseId, sets: 3, volume: v, reps: 15, sec: 0, km: 0, bestKg: kg }; });
    hist.push({ id: uid(), name: r.name, date: d, startedAt: dateAtMs(d, 18 * 60), durationSec: 2700 + Math.round(R() * 1500), volume: vol, records: n < 3 ? 2 : 1, muscles, sessionsByExercise: sessions });
  });
  useTraining.setState({ history: hist.sort((a, b) => b.startedAt - a.startedAt) });
}
export function clearAllData() {
  Object.keys(localStorage).filter((k) => k.startsWith('pulse.')).forEach((k) => localStorage.removeItem(k)); location.reload();
}
