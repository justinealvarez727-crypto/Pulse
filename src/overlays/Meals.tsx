import { useMemo, useState } from 'react';
import { Sheet, Btn, Card, Chip, Field, Input, NumInput, Label, IconBtn, Empty, Bar, cx, inputCls } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { useNutrition, effective, recipeTotals } from '@/store/nutrition';
import { useUI, today as getToday } from '@/store/ui';
import { estimate, lookup, scaleMacros, BUILTIN_INGREDIENTS } from '@/data/foods';
import { addDays, hhmm, longDate, relDay, shortDate, uid } from '@/lib/date';
import { MEAL_SLOTS, ZERO, type Macros, type Meal, type MealSlot } from '@/types';
import type { OP } from '@/components/Overlays';

const r0 = (n: number) => Math.round(n);
const slotNow = (): MealSlot => { const h = new Date().getHours(); return h < 11 ? 'Breakfast' : h < 15 ? 'Lunch' : h < 18 ? 'Snacks' : 'Dinner'; };
const keyOf = (m: Macros) => `${r0(m.kcal)}`;
void keyOf;

export function LogChooser({ p, close }: OP) {
  const open = useUI((s) => s.open); const date = (p.date as string) ?? useUI.getState().date;
  const tiles: [string, string, string, () => void][] = [
    ['Log a meal', 'Describe foods & grams', 'flame', () => open('logMeal', { date })], ['Enter macros', 'Type the numbers yourself', 'edit', () => open('enterMacros', { date })],
    ['From pantry', 'Your saved foods', 'star', () => open('logMeal', { date, panel: 'pantry' })], ['From recipes', 'Saved in the Kitchen', 'kitchen', () => open('recipes', { date })], ['Add water', 'Log a drink', 'drop', () => open('water', { date })],
  ];
  return (
    <Sheet onClose={close} title="How are you logging?" subtitle={date !== getToday() ? `We'll save it under ${longDate(date)}` : undefined} footer={<Btn v="ghost" block onClick={close}>Cancel</Btn>}>
      <ul className="grid grid-cols-2 gap-3 pt-1">{tiles.map(([t, s, ic, f], i) => (<li key={t} className={i === 4 ? 'col-span-2' : ''}><button onClick={f} className="flex h-full w-full flex-col items-start gap-1 rounded-2xl bg-white p-4 text-left shadow-card active:scale-[.97] dark:bg-night-card"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-600"><Icon n={ic as 'flame'} /></span><span className="font-bold">{t}</span><span className="text-xs text-ink-2 dark:text-white/60">{s}</span></button></li>))}</ul>
    </Sheet>
  );
}

interface Item { id: string; name: string; grams: number }
export function LogMeal({ p, close }: OP) {
  const date = (p.date as string) ?? useUI.getState().date; const { addMeal, pantry, meals } = useNutrition();
  const [items, setItems] = useState<Item[]>([{ id: uid(), name: '', grams: 100 }]); const [panel, setPanel] = useState<null | 'pantry' | 'list' | 'history'>((p.panel as 'pantry') ?? null); const [q, setQ] = useState('');
  const [res, setRes] = useState<ReturnType<typeof run> | null>(null); const [slot, setSlot] = useState<MealSlot>(slotNow());
  function run() {
    const clean = items.filter((i) => i.name.trim() && i.grams > 0); const pan = (n: string) => pantry.find((f) => f.name.toLowerCase() === n.trim().toLowerCase());
    const a = clean.filter((i) => !pan(i.name)); const est = estimate(a.map(({ name, grams }) => ({ name, grams })));
    const pantryLines = clean.filter((i) => pan(i.name)).map((i) => { const f = pan(i.name)!; return { name: i.name, grams: i.grams, matched: 'pantry', macros: scaleMacros(f.macros, i.grams / f.grams) }; });
    const lines = [...est.lines, ...pantryLines]; const total = lines.reduce((t, l) => ({ kcal: t.kcal + l.macros.kcal, p: t.p + l.macros.p, f: t.f + l.macros.f, c: t.c + l.macros.c, fiber: t.fiber + l.macros.fiber, sugar: t.sugar + l.macros.sugar, sodium: t.sodium + l.macros.sodium, chol: t.chol + l.macros.chol }), { ...ZERO });
    return { total, lines, unmatched: est.unmatched, clean };
  }
  const desc = (c: Item[]) => c.map((i) => `${i.grams}g ${i.name.trim()}`).join(', ');
  const log = () => { if (!res) return; addMeal({ date, time: date === getToday() ? hhmm() : '12:00', slot, name: res.clean[0].name.trim().replace(/^\w/, (c) => c.toUpperCase()) + (res.clean.length > 1 ? ` + ${res.clean.length - 1} more` : ''), desc: desc(res.clean), grams: res.clean.reduce((a, i) => a + i.grams, 0), ...Object.fromEntries(Object.entries(res.total).map(([k, v]) => [k, Math.round(v * 10) / 10])) as unknown as Macros }); useUI.getState().say('Meal logged'); useUI.getState().closeAll(); };

  if (res) { const t = res.total; return (
    <Sheet onClose={close} caption="Estimate" title="Your meal" trailing={<Btn v="ghost" className="!min-h-[36px] !px-3" onClick={() => setRes(null)}>Edit meal</Btn>} footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" onClick={log}>Log it</Btn></div>}>
      <div className="space-y-3 pt-1"><p className="inline-block rounded-full bg-black/5 px-3 py-1 text-xs font-semibold dark:bg-white/10">Built-in food table · estimate</p>
        <p className="text-5xl font-extrabold tabular text-kcal-ink dark:text-kcal">{r0(t.kcal)}<span className="ml-1 text-lg">kcal</span></p>
        <div className="flex h-3 overflow-hidden rounded-full"><span style={{ flex: t.p * 4 + 0.01, background: '#16a34a' }} /><span style={{ flex: t.f * 9 + 0.01, background: '#eab308' }} /><span style={{ flex: t.c * 4 + 0.01, background: '#3b82f6' }} /></div>
        <div className="grid grid-cols-4 gap-2 text-center">{[['Protein', t.p], ['Carbs', t.c], ['Fat', t.f], ['Fiber', t.fiber]].map(([l, v]) => <Card key={l as string} className="!p-2"><Label>{l as string}</Label><p className="font-bold">{(v as number).toFixed(1)}g</p></Card>)}</div>
        <div><Label className="mb-1">Meal</Label><div className="flex flex-wrap gap-2">{MEAL_SLOTS.map((s) => <Chip key={s} on={slot === s} onClick={() => setSlot(s)}>{s}</Chip>)}</div></div>
        <p className="break-words text-sm text-ink-2 dark:text-white/70">{desc(res.clean)}</p>
        {res.unmatched.length > 0 && <p role="alert" className="rounded-xl bg-orange-50 p-3 text-sm text-orange-900">Not in the food table (counted as 0): {res.unmatched.join(', ')}. Use “Enter macros” for exact values.</p>}</div>
    </Sheet>); }

  const set = (id: string, patch: Partial<Item>) => setItems((l) => l.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const past = [...meals].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)); const seen = new Set<string>(); const uniq = past.filter((m) => (seen.has(m.desc) ? false : (seen.add(m.desc), true))).slice(0, 30);
  return (
    <Sheet onClose={close} title="Log a meal" subtitle="Describe each food clearly — include the amount in grams and how it was cooked" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" disabled={!items.some((i) => i.name.trim() && i.grams > 0)} onClick={() => setRes(run())}>Estimate</Btn></div>}>
      <div className="space-y-3 pt-1">
        <div className="flex gap-2">{(['list', 'pantry', 'history'] as const).map((k) => <Chip key={k} on={panel === k} onClick={() => setPanel(panel === k ? null : k)}>{k === 'list' ? 'List' : k === 'pantry' ? 'Pantry' : 'History'}</Chip>)}</div>
        {panel === 'pantry' && (<Card><Label className="mb-2">Tap to add — saved macros used on Estimate</Label><input aria-label="Search pantry" placeholder="Search pantry…" value={q} onChange={(e) => setQ(e.target.value)} className={inputCls} />
          {pantry.length === 0 ? <p className="py-4 text-center text-sm text-ink-2">Pantry is empty — save foods from “My pantry” first.</p> : <ul className="mt-2 space-y-1">{pantry.filter((f) => f.name.toLowerCase().includes(q.toLowerCase())).map((f) => <li key={f.id}><button className="flex w-full justify-between rounded-xl p-2 text-left hover:bg-black/5" onClick={() => setItems((l) => [...l.filter((i) => i.name.trim()), { id: uid(), name: f.name, grams: f.grams }])}><span className="break-words font-medium">{f.name}</span><span className="text-sm text-ink-2">{f.grams}g · {r0(f.macros.kcal)} kcal</span></button></li>)}</ul>}</Card>)}
        {(panel === 'list' || panel === 'history') && (<Card><Label className="mb-2">{panel === 'list' ? 'Past logs' : 'Tap to reuse'}</Label>{uniq.length === 0 ? <p className="py-3 text-center text-sm text-ink-2">No past logs yet.</p> : <ul className="space-y-1">{uniq.map((m) => <li key={m.id}><button disabled={panel === 'list'} className="flex w-full justify-between gap-2 rounded-xl p-2 text-left enabled:hover:bg-black/5" onClick={() => { setItems(m.desc.split(', ').map((x) => { const g = x.match(/^(\d+(?:\.\d+)?)g (.*)$/); return { id: uid(), grams: g ? Number(g[1]) : 100, name: g ? g[2] : x }; })); setPanel(null); }}><span className="break-words text-sm">{m.desc}</span><span className="shrink-0 text-xs text-ink-2">{shortDate(m.date)}</span></button></li>)}</ul>}</Card>)}
        <ul className="space-y-2">{items.map((i, idx) => (<li key={i.id} className="flex items-end gap-2 rounded-2xl bg-white p-2 shadow-card dark:bg-night-card">
          <div className="min-w-0 flex-1"><Input label="Food" placeholder="e.g. chicken breast cooked" value={i.name} onChange={(e) => set(i.id, { name: e.target.value })} data-autofocus={idx === 0 ? true : undefined} hint={i.name && !lookup(i.name) && !pantry.some((f) => f.name.toLowerCase() === i.name.toLowerCase()) ? 'Not in food table yet' : undefined} /></div>
          <div className="w-24"><NumInput label="G" value={i.grams || ''} onChange={(n) => set(i.id, { grams: n })} /></div>
          <IconBtn n="x" label={`Remove item ${idx + 1}`} onClick={() => setItems((l) => (l.length > 1 ? l.filter((x) => x.id !== i.id) : l))} /></li>))}</ul>
        <button onClick={() => setItems((l) => [...l, { id: uid(), name: '', grams: 100 }])} className="flex min-h-[48px] w-full items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-black/20 text-sm font-semibold text-ink-2 dark:border-white/25 dark:text-white/70"><Icon n="plus" size={18} /> Add item</button>
      </div>
    </Sheet>
  );
}

export function EnterMacros({ p, close }: OP) {
  const date = (p.date as string) ?? useUI.getState().date; const add = useNutrition((s) => s.addMeal); const [slot, setSlot] = useState<MealSlot>(slotNow());
  const [f, setF] = useState({ name: '', grams: 100, kcal: 0, p: 0, f: 0, c: 0, fiber: 0, sugar: 0, sodium: 0, chol: 0 }); const n = (k: keyof typeof f) => (v: number) => setF((x) => ({ ...x, [k]: v }));
  const ok = f.name.trim() && f.kcal >= 0 && f.grams > 0;
  return (
    <Sheet onClose={close} title="Log a meal" subtitle="Enter the macros yourself" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" disabled={!ok} onClick={() => { add({ ...f, name: f.name.trim(), desc: `${f.grams}g ${f.name.trim()}`, date, slot, time: date === getToday() ? hhmm() : '12:00' }); useUI.getState().say('Meal logged'); useUI.getState().closeAll(); }}>Log it</Btn></div>}>
      <div className="space-y-3 pt-1"><div className="flex flex-wrap gap-2">{MEAL_SLOTS.map((s) => <Chip key={s} on={slot === s} onClick={() => setSlot(s)}>{s}</Chip>)}</div>
        <Input label="Food name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} data-autofocus />
        <div className="grid grid-cols-2 gap-3"><NumInput label="Grams" value={f.grams || ''} onChange={n('grams')} /><NumInput label="Calories" value={f.kcal || ''} onChange={n('kcal')} /><NumInput label="Protein" unit="g" value={f.p || ''} onChange={n('p')} step={0.1} /><NumInput label="Fats" unit="g" value={f.f || ''} onChange={n('f')} step={0.1} /><NumInput label="Carbs" unit="g" value={f.c || ''} onChange={n('c')} step={0.1} /><NumInput label="Fiber" unit="g" value={f.fiber || ''} onChange={n('fiber')} step={0.1} /><NumInput label="Sugar (g) opt" value={f.sugar || ''} onChange={n('sugar')} step={0.1} /><NumInput label="Sodium (mg) opt" value={f.sodium || ''} onChange={n('sodium')} /><NumInput label="Cholesterol (mg) opt" value={f.chol || ''} onChange={n('chol')} /></div>
        <p className="text-center text-xs text-ink-3 dark:text-white/50">Full control. No AI — you decide every number.</p></div>
    </Sheet>
  );
}

export function MyPantry({ close }: OP) {
  const { pantry, addPantry, removePantry, recipes, ingredients } = useNutrition(); const [mode, setMode] = useState<null | 'menu' | 'manual' | 'recipe' | 'ing'>(null);
  const [f, setF] = useState({ name: '', grams: 100, kcal: 0, p: 0, f: 0, c: 0, fiber: 0 }); const all = [...BUILTIN_INGREDIENTS, ...ingredients]; const [cat, setCat] = useState('');
  if (mode === 'menu') return (<Sheet onClose={close} back={() => setMode(null)} caption="Add to my pantry" title="Choose a method"><ul className="space-y-2 pt-1">{[['manual', 'Manual', 'Enter macros yourself'], ['recipe', 'Pick from Recipe', 'Use a saved recipe from the Kitchen'], ['ing', 'Choose from your saved ingredients', 'Raw ingredients']].map(([k, t, s]) => <li key={k}><button onClick={() => setMode(k as 'manual')} className="w-full rounded-2xl bg-white p-4 text-left shadow-card dark:bg-night-card"><p className="font-bold">{t}</p><p className="text-sm text-ink-2 dark:text-white/60">{s}</p></button></li>)}</ul></Sheet>);
  if (mode === 'manual') return (<Sheet onClose={close} back={() => setMode('menu')} title="Save a food" footer={<Btn block disabled={!f.name.trim() || f.grams <= 0} onClick={() => { addPantry({ name: f.name.trim(), grams: f.grams, macros: { ...ZERO, kcal: f.kcal, p: f.p, f: f.f, c: f.c, fiber: f.fiber } }); setMode(null); }}>Save to pantry</Btn>}><div className="grid grid-cols-2 gap-3 pt-1"><div className="col-span-2"><Input label="Food name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div><NumInput label="Serving (g)" value={f.grams || ''} onChange={(n) => setF({ ...f, grams: n })} /><NumInput label="Calories" value={f.kcal || ''} onChange={(n) => setF({ ...f, kcal: n })} /><NumInput label="Protein (g)" value={f.p || ''} onChange={(n) => setF({ ...f, p: n })} step={0.1} /><NumInput label="Fats (g)" value={f.f || ''} onChange={(n) => setF({ ...f, f: n })} step={0.1} /><NumInput label="Carbs (g)" value={f.c || ''} onChange={(n) => setF({ ...f, c: n })} step={0.1} /><NumInput label="Fiber (g)" value={f.fiber || ''} onChange={(n) => setF({ ...f, fiber: n })} step={0.1} /></div></Sheet>);
  if (mode === 'recipe') return (<Sheet onClose={close} back={() => setMode('menu')} title="Pick from Recipe">{recipes.length === 0 ? <Empty icon="kitchen" title="No saved recipes yet" text="Cook one from the Kitchen tab." /> : <ul className="space-y-2 pt-1">{recipes.map((r) => { const t = recipeTotals(r); return <li key={r.id}><button className="w-full rounded-2xl bg-white p-4 text-left shadow-card dark:bg-night-card" onClick={() => { addPantry({ name: r.name, grams: 100, macros: t.per100 }); setMode(null); }}><p className="font-bold">{r.name}</p><p className="text-sm text-ink-2">{r0(t.per100.kcal)} kcal / 100 g</p></button></li>; })}</ul>}</Sheet>);
  if (mode === 'ing') return (<Sheet onClose={close} back={() => setMode('menu')} title="Saved ingredients"><div className="flex gap-2 overflow-x-auto pb-2">{['', ...new Set(all.map((i) => i.category))].map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c || 'All'}</Chip>)}</div><ul className="space-y-1">{all.filter((i) => !cat || i.category === cat).map((i) => <li key={i.id}><button className="flex w-full justify-between rounded-xl p-3 text-left hover:bg-black/5" onClick={() => { addPantry({ name: i.name, grams: 100, macros: i.per100 }); setMode(null); }}><span className="break-words font-medium">{i.name}</span><span className="text-sm text-ink-2">{r0(i.per100.kcal)} kcal/100g</span></button></li>)}</ul></Sheet>);
  return (
    <Sheet onClose={close} title="My pantry" subtitle="Save once · log instantly forever" trailing={<Btn className="!min-h-[36px] !px-3" onClick={() => setMode('menu')}>+ ADD</Btn>}>
      {pantry.length === 0 ? <Empty icon="star" title="Your pantry is empty" text="Save foods with your own macro values and reuse them in one tap." action={<Btn onClick={() => setMode('menu')}>ADD YOUR FIRST FOOD</Btn>} /> : (
        <ul className="space-y-2 pt-1">{pantry.map((x) => <li key={x.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><div className="min-w-0 flex-1"><p className="break-words font-semibold">{x.name}</p><p className="text-xs text-ink-2 dark:text-white/60">{x.grams}g · {r0(x.macros.kcal)} kcal · P {r0(x.macros.p)} F {r0(x.macros.f)} C {r0(x.macros.c)}</p></div><IconBtn n="trash" label={`Delete ${x.name}`} onClick={() => removePantry(x.id)} /></li>)}</ul>)}
    </Sheet>
  );
}

export function Recipes({ p, close }: OP) {
  const { recipes, addMeal } = useNutrition(); const date = (p.date as string) ?? useUI.getState().date; const [sel, setSel] = useState<string | null>(null); const [g, setG] = useState(200); const [slot, setSlot] = useState<MealSlot>(slotNow());
  const r = recipes.find((x) => x.id === sel);
  return (
    <Sheet onClose={close} title="Recipes" subtitle={r ? 'Log by the weight you ate' : undefined}>
      {recipes.length === 0 ? <Empty icon="kitchen" title="No saved recipes yet" text="Cook one from the Kitchen tab and it shows up here." action={<Btn onClick={() => { useUI.getState().closeAll(); useUI.getState().setTab('kitchen'); }}>Open kitchen</Btn>} /> : (
        <ul className="space-y-2 pt-1">{recipes.map((x) => { const t = recipeTotals(x); const on = sel === x.id; return (
          <li key={x.id} className="rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><button className="w-full text-left" onClick={() => setSel(on ? null : x.id)} aria-expanded={on}><p className="font-bold">{x.name}</p><p className="text-xs text-ink-2 dark:text-white/60">{r0(t.per100.kcal)} kcal / 100 g · {r0(t.perServing.kcal)} kcal / serving</p></button>
            {on && <div className="mt-3 space-y-3"><NumInput label="Weight eaten" unit="g" value={g || ''} onChange={setG} /><div className="flex flex-wrap gap-2">{MEAL_SLOTS.map((s) => <Chip key={s} on={slot === s} onClick={() => setSlot(s)}>{s}</Chip>)}</div><p className="text-sm font-semibold text-kcal-ink">≈ {r0((t.per100.kcal * g) / 100)} kcal</p>
              <Btn block disabled={g <= 0} onClick={() => { const m = scaleMacros(t.per100, g / 100); addMeal({ ...m, name: x.name, desc: `${g}g ${x.name}`, grams: g, date, slot, time: date === getToday() ? hhmm() : '12:00' }); useUI.getState().say('Meal logged'); useUI.getState().closeAll(); }}>Log it</Btn></div>}</li>); })}</ul>)}
    </Sheet>
  );
}

export function DatePick({ p, close }: OP) {
  const mode = p.mode as 'back' | 'ahead'; const t = getToday(); const days = Array.from({ length: 14 }, (_, i) => addDays(t, mode === 'back' ? -(i + 1) : i + 1)); const [sel, setSel] = useState(days[0]);
  return (
    <Sheet variant="center" onClose={close} title={mode === 'back' ? 'Backfill' : 'Advance log'} subtitle={mode === 'back' ? 'Choose an earlier date for this meal log.' : 'Choose a future date for this meal log.'} footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>CANCEL</Btn><Btn className="flex-1" onClick={() => useUI.getState().replace('logChooser', { date: sel })}>{mode === 'back' ? 'Backfill this date' : 'Log in advance'}</Btn></div>}>
      <div role="radiogroup" aria-label="Date" className="max-h-64 space-y-1 overflow-y-auto pt-1">{days.map((d) => <button key={d} role="radio" aria-checked={sel === d} onClick={() => setSel(d)} className={cx('flex min-h-[44px] w-full items-center justify-between rounded-xl px-4 text-left font-semibold', sel === d ? 'bg-brand-600 text-white' : 'bg-black/5 dark:bg-white/10')}><span>{relDay(d, t) === shortDate(d) ? longDate(d) : relDay(d, t)}</span><span className="text-xs opacity-70">{shortDate(d)}</span></button>)}</div>
    </Sheet>
  );
}

export function AllLogs({ close }: OP) {
  const meals = useNutrition((s) => s.meals); const open = useUI((s) => s.open); const dates = useMemo(() => [...new Set(meals.map((m) => m.date))].sort().reverse(), [meals]);
  return (<Sheet onClose={close} title="All logs" variant="full">{dates.length === 0 ? <Empty icon="flame" title="Log your first meal" text="Tap the + button to start." /> : dates.map((d) => (<section key={d} className="mb-4"><Label className="mb-1">{longDate(d)}</Label><ul className="space-y-1.5">{meals.filter((m) => m.date === d).sort((a, b) => a.time.localeCompare(b.time)).map((m) => <li key={m.id}><button onClick={() => open('mealDetail', { id: m.id })} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-3 text-left shadow-card dark:bg-night-card"><span className="min-w-0"><span className="block break-words font-semibold">{m.name}</span><span className="text-xs text-ink-2 dark:text-white/60">{m.slot} · {m.time}</span></span><b className="tabular">{r0(effective(m).kcal)}</b></button></li>)}</ul></section>))}</Sheet>);
}

export function MealDetail({ p, close }: OP) {
  const { meals, updateMeal, deleteMeal, addMeal } = useNutrition(); const open = useUI((s) => s.open); const m = meals.find((x) => x.id === p.id); const [confirm, setConfirm] = useState(false);
  if (!m) return <Sheet onClose={close} title="Meal not found"><Empty title="This entry was deleted." /></Sheet>;
  const e = effective(m);
  const rows: [string, number, string, string][] = [['Protein', e.p, '#16a34a', 'g'], ['Fats', e.f, '#eab308', 'g'], ['Carbs', e.c, '#3b82f6', 'g'], ['Fiber', e.fiber, '#a855f7', 'g'], ['Sugar', e.sugar, '#ec4899', 'g'], ['Sodium', e.sodium, '#0891b2', 'mg'], ['Cholesterol', e.chol, '#ca8a04', 'mg']];
  const mx = Math.max(...rows.map((r) => r[1]), 1);
  return (
    <Sheet onClose={close} variant="full" caption={`${m.slot} · ${shortDate(m.date)} · ${m.time}`} title={m.name} subtitle={m.desc}
      footer={confirm ? <div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={() => setConfirm(false)}>Keep</Btn><Btn v="danger" className="flex-1" onClick={() => { deleteMeal(m.id); close(); }}>Yes, delete</Btn></div> : <div className="grid grid-cols-3 gap-2 pb-1"><Btn v="outline" onClick={() => open('editMeal', { id: m.id })}>EDIT</Btn><Btn v="outline" onClick={() => { const { id, ...rest } = m; void id; addMeal({ ...rest, date: getToday(), time: hhmm() }); useUI.getState().say('Re-logged today'); close(); }}>RE-LOG</Btn><Btn v="danger" onClick={() => setConfirm(true)}>DELETE</Btn></div>}>
      <div className="space-y-3 pt-2">
        <button onClick={() => open('editMeal', { id: m.id })} className="flex w-full items-center justify-between rounded-2xl bg-kcal-soft p-4 text-left text-kcal-ink dark:bg-kcal/20 dark:text-kcal"><span className="flex items-center gap-2 text-3xl font-extrabold tabular"><Icon n="flame" size={26} />{r0(e.kcal)} kcal</span><span className="text-xs font-bold">EDIT · {r0(e.grams)} g</span></button>
        <Card><ul className="space-y-2.5">{rows.map(([l, v, c, u]) => <li key={l}><div className="flex justify-between text-sm"><span>{l}</span><b className="tabular">{v.toFixed(1)}{u}</b></div><Bar pct={v / mx} color={c} h={6} label={l} /></li>)}</ul></Card>
        <Card><label htmlFor="portion" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-2 dark:text-white/60">Portion · {m.portion}%</label><input id="portion" type="range" min={25} max={100} step={25} value={m.portion} onChange={(ev) => updateMeal(m.id, { portion: Number(ev.target.value) })} className="w-full accent-brand-600" aria-valuetext={`${m.portion} percent`} /><div className="flex justify-between text-xs text-ink-3"><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div></Card>
        <div><Label className="mb-1">Meal</Label><div className="flex flex-wrap gap-2">{MEAL_SLOTS.map((s) => <Chip key={s} on={m.slot === s} onClick={() => updateMeal(m.id, { slot: s })}>{s}</Chip>)}</div></div>
      </div>
    </Sheet>
  );
}

export function EditMeal({ p, close }: OP) {
  const { meals, updateMeal } = useNutrition(); const m = meals.find((x) => x.id === p.id); const [unit, setUnit] = useState<'g' | 'oz'>('g');
  const base = useMemo(() => (m ? effective(m) : null), [m]);
  const [f, setF] = useState(() => ({ name: m?.name ?? '', slot: m?.slot ?? ('Snacks' as MealSlot), grams: base?.grams ?? 0, kcal: base?.kcal ?? 0, p: base?.p ?? 0, c: base?.c ?? 0, f: base?.f ?? 0, fiber: base?.fiber ?? 0 }));
  if (!m || !base) return null;
  const OZ = 28.3495; const shown = unit === 'g' ? f.grams : Math.round((f.grams / OZ) * 100) / 100;
  /** Changing the amount rescales calories & macros proportionally (spec). */
  const setAmount = (v: number) => { const g = unit === 'g' ? v : v * OZ; const k = base.grams ? g / base.grams : 1; setF((x) => ({ ...x, grams: g, kcal: Math.round(base.kcal * k), p: Math.round(base.p * k * 10) / 10, c: Math.round(base.c * k * 10) / 10, f: Math.round(base.f * k * 10) / 10, fiber: Math.round(base.fiber * k * 10) / 10 })); };
  const num = (k: 'kcal' | 'p' | 'c' | 'f' | 'fiber') => (v: number) => setF((x) => ({ ...x, [k]: v }));
  return (
    <Sheet onClose={close} title="Edit meal" subtitle="Adjust portions or enter nutrition from your food label." footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" onClick={() => { updateMeal(m.id, { name: f.name.trim() || m.name, slot: f.slot, grams: f.grams, kcal: f.kcal, p: f.p, c: f.c, f: f.f, fiber: f.fiber, portion: 100, sugar: base.sugar * (base.grams ? f.grams / base.grams : 1), sodium: base.sodium * (base.grams ? f.grams / base.grams : 1), chol: base.chol * (base.grams ? f.grams / base.grams : 1) }); close(); }}>Save changes</Btn></div>}>
      <div className="space-y-3 pt-1"><div className="flex flex-wrap gap-2">{MEAL_SLOTS.map((s) => <Chip key={s} on={f.slot === s} onClick={() => setF({ ...f, slot: s })}>{s}</Chip>)}</div>
        <Input label="Food name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="flex items-end gap-2"><div className="flex-1"><NumInput label={`Amount (${unit})`} value={shown || ''} onChange={setAmount} step={unit === 'g' ? 1 : 0.1} /></div><div className="flex rounded-full bg-black/5 p-1 dark:bg-white/10">{(['g', 'oz'] as const).map((u) => <button key={u} aria-pressed={unit === u} onClick={() => setUnit(u)} className={cx('min-h-[36px] rounded-full px-4 text-sm font-semibold', unit === u && 'bg-white shadow dark:bg-brand-600')}>{u}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-3"><NumInput label="Calories" value={f.kcal || ''} onChange={num('kcal')} /><NumInput label="Protein (g)" value={f.p || ''} onChange={num('p')} step={0.1} /><NumInput label="Carbs (g)" value={f.c || ''} onChange={num('c')} step={0.1} /><NumInput label="Fat (g)" value={f.f || ''} onChange={num('f')} step={0.1} /><NumInput label="Fiber (g)" value={f.fiber || ''} onChange={num('fiber')} step={0.1} /></div>
        <Card><Label>Meal total</Label><p className="text-3xl font-extrabold text-kcal-ink tabular dark:text-kcal">{r0(f.kcal)} kcal</p><p className="text-sm text-ink-2 dark:text-white/60">P {f.p.toFixed(1)}g · C {f.c.toFixed(1)}g · F {f.f.toFixed(1)}g · Fiber {f.fiber.toFixed(1)}g</p></Card></div>
    </Sheet>
  );
}
void Field;
