import type { Exercise, ExerciseType, SetTarget } from '@/types';
import { typeMeta } from '@/data/muscles';

export type Field = 'kg' | 'reps' | 'time' | 'km' | 'incline' | 'speed';
/** Which inputs a set row shows for an exercise type and (routine) target mode. */
export function fieldsFor(type: ExerciseType, target: 'reps' | 'time' = 'reps'): Field[] {
  const base = typeMeta(type).fields as Field[];
  if (type === 'distance_duration' || type === 'weight_distance' || type === 'treadmill') return base; // cardio: always logs its full set of fields
  if (target === 'time') return base.includes('kg') ? ['kg', 'time'] : ['time'];
  const f = base.filter((x) => x !== 'time'); return f.length ? f : ['time'];
}
export const FIELD_LABEL: Record<Field, string> = { kg: 'KG', reps: 'REPS', time: 'SEC', km: 'KM', incline: 'INCL %', speed: 'KM/H' };
export const unitLabel = (f: Field, unit: 'kg' | 'lbs') => (f === 'kg' ? unit.toUpperCase() : FIELD_LABEL[f]);
/** Read / write one field of a set (time is stored as `sec`). */
export const getField = (s: SetTarget, f: Field): number => (f === 'time' ? s.sec : f === 'incline' ? s.incline ?? 0 : f === 'speed' ? s.speed ?? 0 : s[f]);
export const fieldPatch = (f: Field, n: number): Partial<SetTarget> => (f === 'time' ? { sec: n } : ({ [f]: n } as Partial<SetTarget>));
/** Distance of a set: typed km, or speed × time on the treadmill. */
export const setKm = (s: SetTarget) => s.km || ((s.speed ?? 0) * s.sec) / 3600;
/** Per-exercise metric shown in progress screens: volume for weighted work, time/km/reps otherwise. */
export function metricOf(e: Exercise | undefined, s: { volume: number; reps: number; sec: number; km: number }) {
  const t = e?.type ?? 'weight_reps';
  if (t === 'weight_reps' || t === 'weighted_bodyweight' || t === 'assisted_bodyweight') return { v: s.volume, label: `${Math.round(s.volume).toLocaleString()} kg` };
  if (t === 'bodyweight_reps') return { v: s.reps, label: `${s.reps} reps` };
  if (t === 'distance_duration' || t === 'weight_distance' || t === 'treadmill') return { v: s.km || s.sec, label: s.km ? `${s.km.toFixed(1)} km` : `${Math.round(s.sec / 60)} min` };
  return { v: s.sec, label: `${Math.floor(s.sec / 60)}:${String(s.sec % 60).padStart(2, '0')}` };
}
