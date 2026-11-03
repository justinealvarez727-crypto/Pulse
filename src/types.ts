/**
 * Domain model. Everything is plain JSON so it persists to localStorage and
 * can later be synced to a backend (e.g. a Vercel function) without mapping.
 * Dates are local-calendar strings (YYYY-MM-DD); instants are epoch-ms.
 */
export type YMD = string;
export type MealSlot = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';
export const MEAL_SLOTS: MealSlot[] = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

export interface Macros { kcal: number; p: number; f: number; c: number; fiber: number; sugar: number; sodium: number; chol: number }
export const ZERO: Macros = { kcal: 0, p: 0, f: 0, c: 0, fiber: 0, sugar: 0, sodium: 0, chol: 0 };

/** A logged meal. Values are for the FULL portion; `portion` (%) scales them (meal-detail slider). */
export interface Meal extends Macros {
  id: string; date: YMD; time: string; slot: MealSlot; name: string; desc: string; grams: number; portion: number;
}

export type Sex = 'female' | 'male' | 'unspecified';
export type GoalType = 'lose' | 'maintain' | 'gain';
export interface Profile {
  name: string; avatar: string; heightCm: number; age: number; sex: Sex;
  goalType: GoalType; goalWeightKg: number; goalDate: YMD;
  targets: Macros; waterGoal: number; waterStep: number; stepsGoal: number;
  zigzag: { on: boolean; kcal: number[] };               // index 0 = Monday
  track: { fiber: boolean; sugar: boolean; sodium: boolean; chol: boolean };
  dayResetHour: number; unitWeight: 'kg' | 'lbs';
  customTargets: boolean;
}
export interface WeightEntry { date: YMD; kg: number }

/* ---------------- Exercises & training ---------------- */
export type Equipment = 'Bodyweight' | 'Barbell' | 'Dumbbell' | 'Kettlebell' | 'Cable' | 'Machine' | 'Smith Machine' | 'EZ Bar' | 'Pull-up Bar' | 'Resistance Band';
export type ExerciseType = 'weight_reps' | 'bodyweight_reps' | 'weighted_bodyweight' | 'assisted_bodyweight' | 'duration' | 'duration_weight' | 'distance_duration' | 'weight_distance' | 'treadmill';
export interface Exercise {
  id: string; name: string; equipment: Equipment; primary: string; others: string[]; type: ExerciseType;
  details?: string; custom?: boolean; popular?: boolean; warmup?: boolean; cardio?: boolean; zone2?: boolean; photos?: string[];
}
export interface SetTarget { kg: number; reps: number; sec: number; km: number; incline?: number; speed?: number }
export interface RoutineExercise { uid: string; exerciseId: string; rest: number; target: 'reps' | 'time'; sets: SetTarget[]; note?: string }
export type Section = 'warmup' | 'main' | 'cooldown';
export interface Routine {
  id: string; name: string; desc: string; category: string; color: string;
  warmup: RoutineExercise[]; main: RoutineExercise[]; cooldown: RoutineExercise[];
}
export interface ActiveSet extends SetTarget { done: boolean }
export interface ActiveExercise { uid: string; exerciseId: string; rest: number; note: string; sets: ActiveSet[]; section: Section; target?: 'reps' | 'time' }
export interface ActiveWorkout {
  id: string; routineId?: string; name: string; note: string; startedAt: number;
  pausedAt: number | null; pausedMs: number; unit: 'kg' | 'lbs';
  exercises: ActiveExercise[]; rest: { endsAt: number; total: number } | null;
}
export interface FinishedWorkout {
  id: string; name: string; date: YMD; startedAt: number; durationSec: number; volume: number; records: number;
  muscles: Record<string, number>; sessionsByExercise: { exerciseId: string; sets: number; volume: number; reps: number; sec: number; km: number; bestKg: number }[];
}
export type PlanDay = { kind: 'rest' } | { kind: 'routine'; routineId: string } | { kind: 'custom'; exerciseIds: string[] } | null;

/* ---------------- Food ---------------- */
export interface Ingredient { id: string; name: string; category: string; per100: Macros; custom?: boolean }
export interface PantryFood { id: string; name: string; grams: number; macros: Macros }
export interface RecipeItem { id: string; ingredientId: string; name: string; grams: number; per100: Macros; component?: string }
export interface Recipe {
  id: string; name: string; servings: number; items: RecipeItem[]; components: string[]; cookedWeight?: number; created: number;
}

/* ---------------- Fasting, activity ---------------- */
export interface FastPlan { startMin: number; hours: number; preset: string }
export interface Fast { id: string; start: number; plannedEnd: number; end: number | null; status: 'scheduled' | 'running' | 'done' }
export interface StepDay { steps: number; minutes?: number }
export interface ActivityLog { id: string; date: YMD; time: string; type: 'Walking' | 'Running'; minutes: number; kcal?: number; steps?: number; km?: number; notes?: string }

/* ---------------- Spaced repetition ---------------- */
export interface LeitnerCard { id: string; front: string; back: string; box: number; lastReviewed: number | null; due: number; reviews: number; lapses: number }
