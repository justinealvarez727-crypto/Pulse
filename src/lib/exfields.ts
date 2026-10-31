import type { Exercise, ExerciseType } from '@/types';
import { typeMeta } from '@/data/muscles';

export type Field = 'kg' | 'reps' | 'time' | 'km';
/** Which inputs a set row shows for an exercise type and (routine) target mode. */
export function fieldsFor(type: ExerciseType, target: 'reps' | 'time' = 'reps'): Field[] {
  const base = typeMeta(type).fields as Field[];
  if (target === 'time') return base.includes('kg') ? ['kg', 'time'] : ['time'];
  const f = base.filter((x) => x !== 'time'); return f.length ? f : ['time'];
}
export const FIELD_LABEL: Record<Field, string> = { kg: 'KG', reps: 'REPS', time: 'SEC', km: 'KM' };
export const unitLabel = (f: Field, unit: 'kg' | 'lbs') => (f === 'kg' ? unit.toUpperCase() : FIELD_LABEL[f]);
/** Per-exercise metric shown in progress screens: volume for weighted work, time/km/reps otherwise. */
export function metricOf(e: Exercise | undefined, s: { volume: number; reps: number; sec: number; km: number }) {
  const t = e?.type ?? 'weight_reps';
  if (t === 'weight_reps' || t === 'weighted_bodyweight' || t === 'assisted_bodyweight') return { v: s.volume, label: `${Math.round(s.volume).toLocaleString()} kg` };
  if (t === 'bodyweight_reps') return { v: s.reps, label: `${s.reps} reps` };
  if (t === 'distance_duration' || t === 'weight_distance') return { v: s.km || s.sec, label: s.km ? `${s.km.toFixed(1)} km` : `${Math.round(s.sec / 60)} min` };
  return { v: s.sec, label: `${Math.floor(s.sec / 60)}:${String(s.sec % 60).padStart(2, '0')}` };
}
