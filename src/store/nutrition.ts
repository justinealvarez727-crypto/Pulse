import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Meal, PantryFood, Recipe, Ingredient, YMD, Macros } from '@/types';
import { ZERO } from '@/types';
import { storage, KEY } from './persist';
import { uid } from '@/lib/date';
import { sumMacros, scaleMacros } from '@/data/foods';

export const effective = (m: Meal): Macros & { grams: number } => {
  const k = m.portion / 100; return { ...scaleMacros(m, k), grams: m.grams * k };
};
export const recipeTotals = (r: Recipe) => {
  const total = sumMacros(r.items.map((i) => scaleMacros(i.per100, i.grams / 100)));
  const raw = r.items.reduce((a, i) => a + i.grams, 0);
  const weight = r.cookedWeight && r.cookedWeight > 0 ? r.cookedWeight : raw;
  return { total, weight, perServing: scaleMacros(total, 1 / Math.max(1, r.servings)), per100: scaleMacros(total, 100 / Math.max(1, weight)) };
};

interface S {
  meals: Meal[]; water: Record<YMD, number>; pantry: PantryFood[]; recipes: Recipe[]; ingredients: Ingredient[];
  addMeal: (m: Omit<Meal, 'id' | 'portion'> & { portion?: number }) => string;
  updateMeal: (id: string, p: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  addWater: (d: YMD, ml: number) => void; setWater: (d: YMD, ml: number) => void;
  addPantry: (f: Omit<PantryFood, 'id'>) => void; removePantry: (id: string) => void;
  saveRecipe: (r: Omit<Recipe, 'id' | 'created'>) => void; deleteRecipe: (id: string) => void;
  addIngredient: (i: Omit<Ingredient, 'id' | 'custom'>) => void; removeIngredient: (id: string) => void;
  mealsOn: (d: YMD) => Meal[]; totalsOn: (d: YMD) => Macros;
}
export const useNutrition = create<S>()(persist((set, get) => ({
  meals: [], water: {}, pantry: [], recipes: [], ingredients: [],
  addMeal: (m) => { const id = uid(); set((s) => ({ meals: [...s.meals, { ...m, id, portion: m.portion ?? 100 }] })); return id; },
  updateMeal: (id, p) => set((s) => ({ meals: s.meals.map((m) => (m.id === id ? { ...m, ...p } : m)) })),
  deleteMeal: (id) => set((s) => ({ meals: s.meals.filter((m) => m.id !== id) })),
  addWater: (d, ml) => set((s) => ({ water: { ...s.water, [d]: Math.max(0, (s.water[d] ?? 0) + ml) } })),
  setWater: (d, ml) => set((s) => ({ water: { ...s.water, [d]: Math.max(0, ml) } })),
  addPantry: (f) => set((s) => ({ pantry: [...s.pantry, { ...f, id: uid() }] })),
  removePantry: (id) => set((s) => ({ pantry: s.pantry.filter((p) => p.id !== id) })),
  saveRecipe: (r) => set((s) => ({ recipes: [...s.recipes, { ...r, id: uid(), created: Date.now() }] })),
  deleteRecipe: (id) => set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) })),
  addIngredient: (i) => set((s) => ({ ingredients: [...s.ingredients, { ...i, id: uid(), custom: true }] })),
  removeIngredient: (id) => set((s) => ({ ingredients: s.ingredients.filter((i) => i.id !== id) })),
  mealsOn: (d) => get().meals.filter((m) => m.date === d).sort((a, b) => a.time.localeCompare(b.time)),
  totalsOn: (d) => { const l = get().meals.filter((m) => m.date === d); return l.length ? sumMacros(l.map(effective)) : { ...ZERO }; },
}), { name: KEY('nutrition'), storage, version: 1 }));
