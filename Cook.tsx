import { useState } from 'react';
import { Sheet, Btn, Chip, Input, NumInput, Label, IconBtn, Empty, Stepper, cx } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { useNutrition, recipeTotals } from '@/store/nutrition';
import { useUI } from '@/store/ui';
import { BUILTIN_INGREDIENTS, INGREDIENT_CATEGORIES } from '@/data/foods';
import { uid } from '@/lib/date';
import { ZERO, type Ingredient, type RecipeItem } from '@/types';
import type { OP } from '@/components/Overlays';

const r0 = Math.round;
function AddIngredient({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const add = useNutrition((s) => s.addIngredient); const [f, setF] = useState({ name: '', category: 'Other', kcal: 0, p: 0, f: 0, c: 0, fiber: 0 });
  return (<Sheet onClose={onBack} back={onBack} title="Add ingredient" subtitle="Values per 100 g" footer={<Btn block disabled={!f.name.trim()} onClick={() => { add({ name: f.name.trim(), category: f.category, per100: { ...ZERO, kcal: f.kcal, p: f.p, f: f.f, c: f.c, fiber: f.fiber } }); onDone(); }}>Save ingredient</Btn>}>
    <div className="grid grid-cols-2 gap-3 pt-1"><div className="col-span-2"><Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
      <div className="col-span-2"><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-2" htmlFor="cat">Category</label><select id="cat" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="min-h-[44px] w-full rounded-xl border border-black/10 bg-white px-3 dark:bg-night">{INGREDIENT_CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
      <NumInput label="Calories" value={f.kcal || ''} onChange={(n) => setF({ ...f, kcal: n })} /><NumInput label="Protein (g)" value={f.p || ''} onChange={(n) => setF({ ...f, p: n })} step={0.1} /><NumInput label="Fats (g)" value={f.f || ''} onChange={(n) => setF({ ...f, f: n })} step={0.1} /><NumInput label="Carbs (g)" value={f.c || ''} onChange={(n) => setF({ ...f, c: n })} step={0.1} /><NumInput label="Fiber (g)" value={f.fiber || ''} onChange={(n) => setF({ ...f, fiber: n })} step={0.1} /></div></Sheet>);
}

/** Browse / select ingredients. In select mode (p.select) it returns ids through p.onPick. */
export function Ingredients({ p, close }: OP) {
  const { ingredients, removeIngredient } = useNutrition(); const all = [...BUILTIN_INGREDIENTS, ...ingredients]; const [cat, setCat] = useState('ALL'); const [q, setQ] = useState(''); const [adding, setAdding] = useState(false); const [sel, setSel] = useState<string[]>([]);
  const select = !!p.select;
  if (adding) return <AddIngredient onBack={() => setAdding(false)} onDone={() => setAdding(false)} />;
  const list = all.filter((i) => (cat === 'ALL' || i.category.toUpperCase() === cat) && i.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <Sheet variant="full" onClose={close} title="Ingredients" subtitle={`${all.length} saved · ${INGREDIENT_CATEGORIES.length} categories`} trailing={<Btn className="!min-h-[36px] !px-3" onClick={() => setAdding(true)}>+ Add</Btn>}
      footer={select ? <div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" disabled={!sel.length} onClick={() => { (p.onPick as (i: Ingredient[]) => void)(all.filter((i) => sel.includes(i.id))); close(); }}>Proceed ({sel.length})</Btn></div> : undefined}>
      <div className="space-y-2 pt-1"><Input label="Search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ingredients" />
        <div className="flex gap-2 overflow-x-auto pb-1">{['ALL', ...INGREDIENT_CATEGORIES.map((c) => c.toUpperCase())].map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div>
        {list.length === 0 ? <Empty icon="search" title="No ingredients here" text="Tap + Add to save your own with its macros." /> : <ul>{list.map((i) => { const on = sel.includes(i.id); return (
          <li key={i.id} className="flex items-center gap-2 border-b border-black/5 py-1 dark:border-white/10"><button className="flex min-h-[48px] min-w-0 flex-1 items-center justify-between gap-2 text-left" disabled={!select} role={select ? 'checkbox' : undefined} aria-checked={select ? on : undefined} onClick={() => setSel(on ? sel.filter((x) => x !== i.id) : [...sel, i.id])}><span className="min-w-0"><span className="block break-words font-semibold">{i.name}</span><span className="text-xs text-ink-2 dark:text-white/60">{i.category} · {r0(i.per100.kcal)} kcal/100g · P {r0(i.per100.p)} F {r0(i.per100.f)} C {r0(i.per100.c)}</span></span>
            {select && <span aria-hidden className={cx('grid h-6 w-6 shrink-0 place-items-center rounded-full border-2', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-black/25')}>{on && <Icon n="check" size={14} stroke={3} />}</span>}</button>
            {i.custom && !select && <IconBtn n="trash" label={`Delete ${i.name}`} onClick={() => removeIngredient(i.id)} />}</li>); })}</ul>}</div>
    </Sheet>
  );
}

/** Start cooking: name → pick ingredients → set amounts → save recipe. */
export function Cook({ close }: OP) {
  const open = useUI((s) => s.open); const save = useNutrition((s) => s.saveRecipe);
  const [step, setStep] = useState<1 | 2>(1); const [name, setName] = useState(''); const [items, setItems] = useState<RecipeItem[]>([]); const [servings, setServ] = useState(1); const [comps, setComps] = useState<string[]>([]); const [cooked, setCooked] = useState(0);
  const [pop, setPop] = useState<null | 'comp' | 'cooked'>(null); const [cn, setCn] = useState(''); const [cw, setCw] = useState(0);
  const pick = () => open('ingredients', { select: true, onPick: (ing: Ingredient[]) => setItems((cur) => [...cur, ...ing.filter((i) => !cur.some((c) => c.ingredientId === i.id)).map((i): RecipeItem => ({ id: uid(), ingredientId: i.id, name: i.name, grams: 100, per100: i.per100 }))]) });
  const draft = { id: '', created: 0, name, servings, items, components: comps, cookedWeight: cooked || undefined };
  const t = recipeTotals(draft);
  if (step === 1) return (
    <Sheet variant="center" onClose={close} title="Name your recipe" subtitle="What are you cooking?" footer={<Btn block disabled={!name.trim()} onClick={() => { setStep(2); if (!items.length) pick(); }}>Next · pick ingredients</Btn>}>
      <Input label="Recipe name" value={name} onChange={(e) => setName(e.target.value)} data-autofocus placeholder="e.g. Chicken fried rice" /></Sheet>);
  return (
    <Sheet variant="full" onClose={close} back={() => setStep(1)} title={name} subtitle="Adjust grams · live macro preview" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={() => setStep(1)}>Back</Btn><Btn className="flex-1" disabled={!items.length || items.some((i) => i.grams <= 0)} onClick={() => { save({ name: name.trim(), servings, items, components: comps, cookedWeight: cooked || undefined }); useUI.getState().say('Recipe saved'); close(); }}>Save recipe</Btn></div>}>
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><div><Label>Servings</Label><Stepper label="servings" value={servings} min={1} max={50} onChange={setServ} /></div><div className="text-right"><Label>Ingredients</Label><p className="font-bold">{items.length} picked</p><button aria-label="Add more ingredients" onClick={pick} className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-brand-600 text-white"><Icon n="plus" size={18} /></button></div></div>
        <button className="w-full rounded-2xl border-2 border-dashed border-black/20 py-3 text-sm font-semibold text-ink-2 dark:border-white/25 dark:text-white/70" onClick={() => setPop('comp')}>Want parts? + Add component</button>
        {comps.length > 0 && <p className="text-xs text-ink-2">Components: {comps.join(', ')}</p>}
        {items.length === 0 ? <Empty icon="kitchen" title="No ingredients yet" action={<Btn onClick={pick}>Pick ingredients</Btn>} /> : <ul className="space-y-2">{items.map((i) => (
          <li key={i.id} className="flex items-end gap-2 rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><div className="min-w-0 flex-1"><p className="break-words font-semibold">{i.name}</p><p className="text-xs text-ink-2 dark:text-white/60">{r0((i.per100.kcal * i.grams) / 100)} kcal · {i.grams}g{i.component ? ` · ${i.component}` : ''}</p></div>
            <div className="w-24"><NumInput label="G" value={i.grams || ''} onChange={(n) => setItems(items.map((x) => (x.id === i.id ? { ...x, grams: n } : x)))} /></div><IconBtn n="x" label={`Remove ${i.name}`} onClick={() => setItems(items.filter((x) => x.id !== i.id))} /></li>))}</ul>}
        <div className="rounded-3xl bg-white p-4 shadow-card dark:bg-night-card"><Label>Estimated macros per serving</Label><p className="text-4xl font-extrabold tabular text-kcal-ink dark:text-kcal">{r0(t.perServing.kcal)}<span className="ml-1 text-base">kcal</span></p><p className="text-sm text-ink-2 dark:text-white/70">P {t.perServing.p.toFixed(1)}g · F {t.perServing.f.toFixed(1)}g · C {t.perServing.c.toFixed(1)}g · Fiber {t.perServing.fiber.toFixed(1)}g</p><p className="mt-1 text-xs text-ink-3">{r0(t.per100.kcal)} kcal per 100 g of dish ({r0(t.weight)} g{cooked ? ' cooked' : ''})</p></div>
        <button className="w-full rounded-2xl border-2 border-dashed border-black/20 py-3 text-sm font-semibold text-ink-2 dark:border-white/25 dark:text-white/70" onClick={() => { setCw(cooked); setPop('cooked'); }}>{cooked ? `Cooked weight: ${cooked} g (edit)` : '+ Add cooked weight'}</button>
      </div>
      {pop === 'comp' && <Sheet variant="center" onClose={() => setPop(null)} title="Name this component" subtitle="e.g. Sauce, Marinade, Topping" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={() => setPop(null)}>Cancel</Btn><Btn className="flex-1" disabled={!cn.trim()} onClick={() => { setComps([...comps, cn.trim()]); setPop(null); useUI.getState().say('Tap an ingredient’s part below'); setItems(items.map((x, idx) => (idx === items.length - 1 && !x.component ? { ...x, component: cn.trim() } : x))); setCn(''); }}>Next</Btn></div>}><Input label="Component name" value={cn} onChange={(e) => setCn(e.target.value)} data-autofocus /><p className="mt-2 text-xs text-ink-3">The last ingredient is assigned to it; reassign by tapping a chip below an ingredient.</p></Sheet>}
      {pop === 'cooked' && <Sheet variant="center" onClose={() => setPop(null)} title="Cooked weight" subtitle="Weigh your finished dish · macros will scale to match" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={() => setPop(null)}>Cancel</Btn><Btn className="flex-1" onClick={() => { setCooked(cw); setPop(null); }}>Save</Btn></div>}><NumInput label="Final weight in grams" value={cw || ''} onChange={setCw} /><p className="mt-2 text-xs text-ink-3">This only changes per-gram density. Total calories stay the same — cooking doesn't add or remove energy.</p></Sheet>}
    </Sheet>
  );
}
