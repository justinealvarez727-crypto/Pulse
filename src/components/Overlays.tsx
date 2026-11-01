import { Suspense, lazy, useEffect, type ComponentType } from 'react';
import { useUI } from '@/store/ui';
import { ErrorBoundary } from './ErrorBoundary';
import { AnimatePresence, Skeleton } from './ui';

export interface OP { p: Record<string, any>; close: () => void } // eslint-disable-line @typescript-eslint/no-explicit-any
const L = (f: () => Promise<Record<string, unknown>>, n: string) => lazy(() => f().then((m) => ({ default: m[n] as ComponentType<OP> })));

/** Every overlay is its own lazy chunk — it is only downloaded the first time it opens. */
const REG: Record<string, ComponentType<OP>> = {
  water: L(() => import('@/overlays/Water'), 'WaterPopup'), waterHistory: L(() => import('@/overlays/Water'), 'WaterHistory'),
  fast: L(() => import('@/overlays/Fast'), 'FastScreen'), fastPlan: L(() => import('@/overlays/Fast'), 'FastPlanEdit'), fastWhen: L(() => import('@/overlays/Fast'), 'FastWhen'),
  fastFull: L(() => import('@/overlays/Fast'), 'FastFull'), fastHistory: L(() => import('@/overlays/Fast'), 'FastHistory'),
  steps: L(() => import('@/overlays/Steps'), 'StepsSheet'), stepsAdd: L(() => import('@/overlays/Steps'), 'StepsAdd'), activityForm: L(() => import('@/overlays/Steps'), 'ActivityForm'), stepsReport: L(() => import('@/overlays/Steps'), 'StepsReport'),
  logChooser: L(() => import('@/overlays/Meals'), 'LogChooser'), logMeal: L(() => import('@/overlays/Meals'), 'LogMeal'), enterMacros: L(() => import('@/overlays/Meals'), 'EnterMacros'),
  myPantry: L(() => import('@/overlays/Meals'), 'MyPantry'), recipes: L(() => import('@/overlays/Meals'), 'Recipes'), mealDetail: L(() => import('@/overlays/Meals'), 'MealDetail'),
  editMeal: L(() => import('@/overlays/Meals'), 'EditMeal'), datePick: L(() => import('@/overlays/Meals'), 'DatePick'), allLogs: L(() => import('@/overlays/Meals'), 'AllLogs'),
  workout: L(() => import('@/overlays/Workout'), 'WorkoutScreen'), newRoutine: L(() => import('@/overlays/Workout'), 'NewRoutine'), explore: L(() => import('@/overlays/Workout'), 'Explore'),
  routineEditor: L(() => import('@/overlays/Routine'), 'RoutineEditor'), activeWorkout: L(() => import('@/overlays/Routine'), 'ActiveWorkoutScreen'),
  picker: L(() => import('@/overlays/Picker'), 'Picker'), customExercise: L(() => import('@/overlays/Picker'), 'CustomExercise'), planner: L(() => import('@/overlays/Planner'), 'Planner'),
  cook: L(() => import('@/overlays/Cook'), 'Cook'), ingredients: L(() => import('@/overlays/Cook'), 'Ingredients'), kitchenPantry: L(() => import('@/overlays/Meals'), 'MyPantry'),
  goals: L(() => import('@/overlays/Goals'), 'GoalsMenu'), goalSet: L(() => import('@/overlays/Goals'), 'GoalSet'), goalCustom: L(() => import('@/overlays/Goals'), 'CustomGoal'),
  zigzag: L(() => import('@/overlays/Goals'), 'Zigzag'), track: L(() => import('@/overlays/Goals'), 'Track'), resetTime: L(() => import('@/overlays/Goals'), 'ResetTime'), height: L(() => import('@/overlays/Goals'), 'Height'),
  editProfile: L(() => import('@/overlays/Goals'), 'EditProfile'), manage: L(() => import('@/overlays/Goals'), 'Manage'),
  report: L(() => import('@/overlays/Report'), 'Report'), macroJournal: L(() => import('@/overlays/Report'), 'MacroJournal'), weight: L(() => import('@/overlays/Report'), 'WeightUpdate'), weightReport: L(() => import('@/overlays/Report'), 'WeightReport'),
  review: L(() => import('@/overlays/Review'), 'FormReview'),
};

export function Overlays() {
  const { stack, close } = useUI();
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && useUI.getState().stack.length) { e.preventDefault(); useUI.getState().close(); } };
    addEventListener('keydown', h); return () => removeEventListener('keydown', h);
  }, []);
  return (
    <AnimatePresence>
      {stack.map((o, i) => {
        const C = REG[o.k]; if (!C) return null;
        // Only the top overlay is exposed to assistive tech; lower ones are inert.
        return (
          <div key={`${o.k}-${i}`} aria-hidden={i < stack.length - 1} {...(i < stack.length - 1 ? { inert: '' as unknown as boolean } : {})}>
            <ErrorBoundary label={o.k} compact onReset={close}>
              <Suspense fallback={<div className="fixed inset-0 z-40 grid place-items-center bg-black/40"><Skeleton className="h-40 w-64" /></div>}><C p={o.p ?? {}} close={close} /></Suspense>
            </ErrorBoundary>
          </div>
        );
      })}
    </AnimatePresence>
  );
}