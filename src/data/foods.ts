import type { Ingredient, Macros } from '@/types';
import { ZERO } from '@/types';

/** per-100g values: [kcal, protein, fat, carbs, fiber, sugar, sodium mg, cholesterol mg] */
type Row = [number, number, number, number, number, number, number, number];
const m = (r: Row): Macros => ({ kcal: r[0], p: r[1], f: r[2], c: r[3], fiber: r[4], sugar: r[5], sodium: r[6], chol: r[7] });

/**
 * Built-in lookup used by "Estimate" (spec: a built-in table of common foods, not a live database).
 * keys are matched by whole-word keywords; state words (cooked, fried…) pick the variant.
 */
const T: Record<string, Row> = {
  'white rice cooked': [130, 2.7, 0.3, 28, 0.4, 0, 1, 0], 'brown rice cooked': [123, 2.7, 1, 26, 1.8, 0.4, 4, 0], 'rice raw': [365, 7, 0.7, 80, 1.3, 0, 5, 0],
  'oats raw': [389, 17, 7, 66, 11, 1, 2, 0], 'oatmeal cooked': [71, 2.5, 1.5, 12, 1.7, 0.3, 4, 0],
  'pasta cooked': [158, 5.8, 0.9, 31, 1.8, 0.6, 1, 0], 'pasta raw': [371, 13, 1.5, 75, 3.2, 2.7, 6, 0],
  'bread white': [265, 9, 3.2, 49, 2.7, 5, 491, 0], 'bread whole wheat': [247, 13, 3.4, 41, 7, 6, 450, 0], 'toast': [265, 9, 3.2, 49, 2.7, 5, 491, 0],
  'potato boiled': [87, 1.9, 0.1, 20, 1.8, 0.9, 6, 0], 'potato fried': [312, 3.4, 15, 41, 3.8, 0.3, 210, 0], 'sweet potato baked': [90, 2, 0.2, 21, 3.3, 6.5, 36, 0],
  'chicken breast cooked': [165, 31, 3.6, 0, 0, 0, 74, 85], 'chicken breast fried': [220, 28, 10, 7, 0.3, 0, 300, 90], 'chicken thigh cooked': [209, 26, 11, 0, 0, 0, 95, 93], 'chicken raw': [120, 22.5, 2.6, 0, 0, 0, 45, 73],
  'beef cooked': [250, 26, 15, 0, 0, 0, 72, 90], 'ground beef cooked': [254, 26, 17, 0, 0, 0, 75, 88], 'steak grilled': [271, 25, 19, 0, 0, 0, 60, 80], 'pork cooked': [242, 27, 14, 0, 0, 0, 62, 80], 'bacon cooked': [541, 37, 42, 1.4, 0, 0, 1717, 110],
  'salmon cooked': [206, 22, 12, 0, 0, 0, 61, 63], 'tuna canned': [116, 26, 1, 0, 0, 0, 247, 42], 'shrimp cooked': [99, 24, 0.3, 0.2, 0, 0, 111, 189], 'tilapia cooked': [128, 26, 2.7, 0, 0, 0, 56, 57],
  'egg whole': [143, 12.6, 9.5, 0.7, 0, 0.4, 142, 372], 'egg boiled': [155, 13, 11, 1.1, 0, 1.1, 124, 373], 'egg fried': [196, 14, 15, 0.8, 0, 0.4, 207, 401], 'egg white': [52, 11, 0.2, 0.7, 0, 0.7, 166, 0],
  'tofu firm': [144, 17, 9, 3, 2.3, 0.6, 14, 0], 'tempeh': [192, 20, 11, 8, 0, 0, 9, 0], 'lentils cooked': [116, 9, 0.4, 20, 7.9, 1.8, 2, 0], 'chickpeas cooked': [164, 8.9, 2.6, 27, 7.6, 4.8, 7, 0], 'black beans cooked': [132, 8.9, 0.5, 24, 8.7, 0.3, 1, 0],
  'milk whole': [61, 3.2, 3.3, 4.8, 0, 5, 43, 10], 'milk skim': [34, 3.4, 0.1, 5, 0, 5, 42, 2], 'yogurt plain': [61, 3.5, 3.3, 4.7, 0, 4.7, 46, 13], 'greek yogurt': [59, 10, 0.4, 3.6, 0, 3.2, 36, 5], 'cheese cheddar': [403, 25, 33, 1.3, 0, 0.5, 621, 105], 'cottage cheese': [98, 11, 4.3, 3.4, 0, 2.7, 364, 17], 'mozzarella': [280, 28, 17, 3.1, 0, 1, 627, 79], 'whey protein': [400, 80, 6, 8, 0, 4, 200, 60],
  'butter': [717, 0.9, 81, 0.1, 0, 0.1, 11, 215], 'olive oil': [884, 0, 100, 0, 0, 0, 2, 0], 'coconut oil': [862, 0, 100, 0, 0, 0, 0, 0], 'peanut butter': [588, 25, 50, 20, 6, 9, 17, 0], 'mayonnaise': [680, 1, 75, 0.6, 0, 0.6, 635, 42],
  'banana': [89, 1.1, 0.3, 23, 2.6, 12, 1, 0], 'apple': [52, 0.3, 0.2, 14, 2.4, 10, 1, 0], 'orange': [47, 0.9, 0.1, 12, 2.4, 9, 0, 0], 'mango': [60, 0.8, 0.4, 15, 1.6, 14, 1, 0], 'grapes': [69, 0.7, 0.2, 18, 0.9, 16, 2, 0], 'strawberries': [32, 0.7, 0.3, 7.7, 2, 4.9, 1, 0], 'blueberries': [57, 0.7, 0.3, 14, 2.4, 10, 1, 0], 'avocado': [160, 2, 15, 9, 6.7, 0.7, 7, 0], 'watermelon': [30, 0.6, 0.2, 7.6, 0.4, 6.2, 1, 0],
  'broccoli cooked': [35, 2.4, 0.4, 7.2, 3.3, 1.4, 41, 0], 'spinach': [23, 2.9, 0.4, 3.6, 2.2, 0.4, 79, 0], 'carrot': [41, 0.9, 0.2, 10, 2.8, 4.7, 69, 0], 'tomato': [18, 0.9, 0.2, 3.9, 1.2, 2.6, 5, 0], 'cucumber': [15, 0.7, 0.1, 3.6, 0.5, 1.7, 2, 0], 'lettuce': [15, 1.4, 0.2, 2.9, 1.3, 0.8, 28, 0], 'onion': [40, 1.1, 0.1, 9.3, 1.7, 4.2, 4, 0], 'mushroom': [22, 3.1, 0.3, 3.3, 1, 2, 5, 0], 'bell pepper': [31, 1, 0.3, 6, 2.1, 4.2, 4, 0], 'corn cooked': [96, 3.4, 1.5, 21, 2.4, 4.5, 15, 0],
  'almonds': [579, 21, 50, 22, 12, 4.4, 1, 0], 'walnuts': [654, 15, 65, 14, 6.7, 2.6, 2, 0], 'cashews': [553, 18, 44, 30, 3.3, 5.9, 12, 0], 'peanuts': [567, 26, 49, 16, 8.5, 4, 18, 0], 'chia seeds': [486, 17, 31, 42, 34, 0, 16, 0],
  'sugar': [387, 0, 0, 100, 0, 100, 1, 0], 'honey': [304, 0.3, 0, 82, 0.2, 82, 4, 0], 'chocolate dark': [598, 7.8, 43, 46, 11, 24, 20, 3], 'ice cream': [207, 3.5, 11, 24, 0.7, 21, 80, 44], 'cookie': [488, 5.9, 24, 64, 2.4, 36, 380, 15],
  'pizza': [266, 11, 10, 33, 2.3, 3.6, 598, 17], 'burger': [295, 17, 14, 24, 1.3, 5, 396, 52], 'french fries': [312, 3.4, 15, 41, 3.8, 0.3, 210, 0], 'fried chicken': [246, 19, 14, 9, 0.3, 0.3, 450, 94], 'sushi': [143, 5.8, 0.7, 28, 0.8, 4, 380, 10],
  'coffee black': [1, 0.1, 0, 0, 0, 0, 2, 0], 'soda': [41, 0, 0, 10.6, 0, 10.6, 4, 0], 'orange juice': [45, 0.7, 0.2, 10.4, 0.2, 8.4, 1, 0], 'beer': [43, 0.5, 0, 3.6, 0, 0, 4, 0],
};
const STATE_WORDS = ['cooked', 'boiled', 'fried', 'grilled', 'baked', 'raw', 'roasted', 'steamed', 'canned'];

export interface EstimateItem { name: string; grams: number }
export interface EstimateResult { total: Macros; lines: { name: string; grams: number; matched: string | null; macros: Macros }[]; unmatched: string[] }

/** Score = number of key words of the table entry present in the text; the entry with most overlap (and full coverage) wins. */
export function lookup(text: string): { key: string; per100: Macros } | null {
  const words = new Set(text.toLowerCase().replace(/[^a-z ]/g, ' ').split(/\s+/).filter(Boolean));
  const norm = (w: string) => (w.endsWith('s') && w.length > 3 ? w.slice(0, -1) : w);
  const tw = new Set([...words].map(norm));
  let best: { key: string; score: number } | null = null;
  for (const key of Object.keys(T)) {
    const kw = key.split(' ');
    const core = kw.filter((w) => !STATE_WORDS.includes(w));
    if (!core.every((w) => tw.has(norm(w)))) continue;
    const stateHit = kw.filter((w) => STATE_WORDS.includes(w) && tw.has(w)).length;
    const hasStateWord = kw.some((w) => STATE_WORDS.includes(w));
    const score = core.length * 10 + stateHit * 5 - (hasStateWord && !stateHit ? 1 : 0);
    if (!best || score > best.score) best = { key, score };
  }
  return best ? { key: best.key, per100: m(T[best.key]) } : null;
}
export function estimate(items: EstimateItem[]): EstimateResult {
  const total = { ...ZERO }; const lines: EstimateResult['lines'] = []; const unmatched: string[] = [];
  for (const it of items) {
    const hit = lookup(it.name); const k = it.grams / 100;
    const mac = hit ? (Object.fromEntries(Object.entries(hit.per100).map(([a, b]) => [a, Math.round(b * k * 10) / 10])) as unknown as Macros) : { ...ZERO };
    if (!hit) unmatched.push(it.name);
    (Object.keys(total) as (keyof Macros)[]).forEach((x) => (total[x] += mac[x]));
    lines.push({ name: it.name, grams: it.grams, matched: hit?.key ?? null, macros: mac });
  }
  return { total, lines, unmatched };
}
export const sumMacros = (xs: Macros[]): Macros => xs.reduce((a, b) => ({ kcal: a.kcal + b.kcal, p: a.p + b.p, f: a.f + b.f, c: a.c + b.c, fiber: a.fiber + b.fiber, sugar: a.sugar + b.sugar, sodium: a.sodium + b.sodium, chol: a.chol + b.chol }), { ...ZERO });
export const scaleMacros = (x: Macros, k: number): Macros => ({ kcal: x.kcal * k, p: x.p * k, f: x.f * k, c: x.c * k, fiber: x.fiber * k, sugar: x.sugar * k, sodium: x.sodium * k, chol: x.chol * k });

/** Built-in raw ingredients for the Kitchen, 11 categories (spec). */
export const INGREDIENT_CATEGORIES = ['Dairy', 'Condiments', 'Oils', 'Meats', 'Grains', 'Veggies', 'Fruits', 'Pastry', 'Sweeteners', 'Powder', 'Other'];
const ING: [string, string, string][] = [
  ['Dairy', 'Milk whole', 'milk whole'], ['Dairy', 'Greek yogurt', 'greek yogurt'], ['Dairy', 'Cheddar cheese', 'cheese cheddar'], ['Dairy', 'Mozzarella', 'mozzarella'], ['Dairy', 'Butter', 'butter'], ['Dairy', 'Cottage cheese', 'cottage cheese'], ['Dairy', 'Egg whole', 'egg whole'],
  ['Condiments', 'Mayonnaise', 'mayonnaise'], ['Condiments', 'Peanut butter', 'peanut butter'],
  ['Oils', 'Olive oil', 'olive oil'], ['Oils', 'Coconut oil', 'coconut oil'],
  ['Meats', 'Chicken breast (raw)', 'chicken raw'], ['Meats', 'Ground beef (cooked)', 'ground beef cooked'], ['Meats', 'Salmon (cooked)', 'salmon cooked'], ['Meats', 'Shrimp (cooked)', 'shrimp cooked'], ['Meats', 'Bacon', 'bacon cooked'], ['Meats', 'Tofu firm', 'tofu firm'],
  ['Grains', 'Rice (raw)', 'rice raw'], ['Grains', 'Oats (raw)', 'oats raw'], ['Grains', 'Pasta (raw)', 'pasta raw'], ['Grains', 'Lentils (cooked)', 'lentils cooked'], ['Grains', 'Chickpeas (cooked)', 'chickpeas cooked'],
  ['Veggies', 'Broccoli', 'broccoli cooked'], ['Veggies', 'Spinach', 'spinach'], ['Veggies', 'Carrot', 'carrot'], ['Veggies', 'Tomato', 'tomato'], ['Veggies', 'Onion', 'onion'], ['Veggies', 'Bell pepper', 'bell pepper'], ['Veggies', 'Mushroom', 'mushroom'], ['Veggies', 'Potato (boiled)', 'potato boiled'],
  ['Fruits', 'Banana', 'banana'], ['Fruits', 'Apple', 'apple'], ['Fruits', 'Avocado', 'avocado'], ['Fruits', 'Strawberries', 'strawberries'], ['Fruits', 'Mango', 'mango'],
  ['Pastry', 'Bread white', 'bread white'], ['Pastry', 'Bread whole wheat', 'bread whole wheat'], ['Pastry', 'Cookie', 'cookie'],
  ['Sweeteners', 'Sugar', 'sugar'], ['Sweeteners', 'Honey', 'honey'], ['Sweeteners', 'Dark chocolate', 'chocolate dark'],
  ['Powder', 'Whey protein', 'whey protein'],
  ['Other', 'Almonds', 'almonds'], ['Other', 'Walnuts', 'walnuts'], ['Other', 'Chia seeds', 'chia seeds'], ['Other', 'Peanuts', 'peanuts'],
];
export const BUILTIN_INGREDIENTS: Ingredient[] = ING.map(([category, name, key], i) => ({ id: `b${i}`, name, category, per100: m(T[key]) }));
