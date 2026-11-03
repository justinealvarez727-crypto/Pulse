import type { Equipment, ExerciseType } from '@/types';

/** Muscle taxonomy from the spec (group → muscles). */
export const MUSCLE_GROUPS: Record<string, string[]> = {
  Chest: ['Pectoralis Major', 'Serratus Anterior'],
  Back: ['Latissimus Dorsi', 'Trapezius', 'Rhomboids', 'Erector Spinae'],
  Shoulders: ['Front Delts', 'Side Delts', 'Rear Delts'],
  'Upper Arms': ['Biceps', 'Triceps', 'Brachialis'],
  'Lower Arms': ['Brachioradialis', 'Forearm Flexors', 'Forearm Extensors'],
  Core: ['Abs', 'Transverse Abs', 'Obliques', 'Hip Flexors'],
  'Upper Legs': ['Quadriceps', 'Hamstrings', 'Glutes', 'Glute Medius', 'Adductors', 'Abductors'],
  'Lower Legs': ['Calves', 'Soleus'],
};
export const ALL_MUSCLES = Object.values(MUSCLE_GROUPS).flat();
export const EQUIPMENT: Equipment[] = ['Bodyweight', 'Barbell', 'Dumbbell', 'Kettlebell', 'Cable', 'Machine', 'Smith Machine', 'EZ Bar', 'Pull-up Bar', 'Resistance Band'];

/** Weekly-frequency buckets used on the Workout Progress tab. */
export const FREQ_GROUPS = ['Chest', 'Legs', 'Calves', 'Back', 'Shoulders', 'Arms', 'Core'] as const;
export function freqGroup(muscle: string): (typeof FREQ_GROUPS)[number] {
  for (const [g, ms] of Object.entries(MUSCLE_GROUPS)) if (ms.includes(muscle)) {
    if (g === 'Upper Legs') return 'Legs'; if (g === 'Lower Legs') return 'Calves';
    if (g === 'Upper Arms' || g === 'Lower Arms') return 'Arms'; return g as (typeof FREQ_GROUPS)[number];
  }
  return 'Core';
}
export const EXERCISE_TYPES: { id: ExerciseType; label: string; fields: ('reps' | 'kg' | 'time' | 'km' | 'incline' | 'speed')[]; hint: string }[] = [
  { id: 'weight_reps', label: 'Weight & Reps', fields: ['kg', 'reps'], hint: 'Reps + Kg' },
  { id: 'bodyweight_reps', label: 'Bodyweight Reps', fields: ['reps'], hint: 'Reps' },
  { id: 'weighted_bodyweight', label: 'Weighted Bodyweight', fields: ['kg', 'reps'], hint: 'Reps + Kg added' },
  { id: 'assisted_bodyweight', label: 'Assisted Bodyweight', fields: ['kg', 'reps'], hint: 'Reps − Kg assistance' },
  { id: 'duration', label: 'Duration', fields: ['time'], hint: 'Time' },
  { id: 'duration_weight', label: 'Duration & Weight', fields: ['kg', 'time'], hint: 'Kg + Time' },
  { id: 'distance_duration', label: 'Distance & Duration', fields: ['time', 'km'], hint: 'Time + Km' },
  { id: 'weight_distance', label: 'Weight & Distance', fields: ['kg', 'km'], hint: 'Kg + Km' },
  { id: 'treadmill', label: 'Treadmill', fields: ['incline', 'speed', 'time'], hint: 'Incline % + Speed + Time' },
];
export const typeMeta = (t: ExerciseType) => EXERCISE_TYPES.find((x) => x.id === t)!;
