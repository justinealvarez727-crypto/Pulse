import { useMemo, useState } from 'react';
import { Sheet, Btn, Label, NumInput, IconBtn, Card } from '@/components/ui';
import { useNutrition, effective } from '@/store/nutrition';
import { useProfile } from '@/store/profile';
import { useFasting, fastDay } from '@/store/fasting';
import { useUI, today as getToday } from '@/store/ui';
import { addDays, mondayOf, MONTHS, parseYmd, shortDate, DOW, longDate, monIdx } from '@/lib/date';
import { sumMacros } from '@/data/foods';
import { useGallery } from '@/store/gallery';
import type { Macros } from '@/types';
import type { OP } from '@/components/Overlays';

export function dayTotals(meals: ReturnType<typeof useNutrition.getState>['meals'], d: string): Macros & { n: number } {
  const l = meals.filter((m) => m.date === d); return { ...sumMacros(l.map(effective)), n: l.length };
}
const tone = (delta: number, goal: number, over: 'bad' | 'ok') => { const r = goal ? delta / goal : 0; return Math.abs(r) <= 0.1 ? 'text-green-600' : (over === 'bad' ? r > 0 : r < 0) ? 'text-red-600' : 'text-yellow-600'; };

export function Report({ close }: OP) {
  const meals = useNutrition((s) => s.meals); const { profile: p, weights } = useProfile(); const fasts = useFasting((s) => s.fasts); const t = getToday(); const add = useGallery((s) => s.add);
  const d = parseYmd(t); const first = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  const r = useMemo(() => {
    const days: string[] = []; for (let x = first; x <= t; x = addDays(x, 1)) days.push(x);
    const tot = days.map((x) => ({ d: x, ...dayTotals(meals, x) })); const logged = tot.filter((x) => x.n); const avg = (k: keyof Macros) => (logged.length ? logged.reduce((a, b) => a + b[k], 0) / logged.length : 0);
    const weeks: { w: string; days: typeof logged }[] = []; logged.forEach((x) => { const w = mondayOf(x.d); const g = weeks.find((y) => y.w === w) ?? (weeks.push({ w, days: [] }), weeks[weeks.length - 1]); g.days.push(x); });
    let best = 0, run = 0; days.forEach((x) => { if (tot.find((y) => y.d === x)!.n) best = Math.max(best, ++run); else run = 0; });
    const under = logged.reduce((a, b) => a + Math.max(0, p.targets.kcal - b.kcal), 0); const adherence = logged.length ? logged.filter((x) => Math.abs(x.kcal - p.targets.kcal) <= p.targets.kcal * 0.1).length / logged.length : 0;
    return { days, logged, avg, weeks, best, under, adherence };
  }, [meals, first, t, p.targets.kcal]);
  const avgK = Math.round(r.avg('kcal')); const diff = avgK - p.targets.kcal;
  const rid = `PLS-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}-${r.logged.length}${avgK}`;
  void fasts; void fastDay; void weights;
  return (
    <Sheet variant="full" onClose={close} dark title="Nutrition progress report" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1 !text-white" onClick={close}>Close</Btn><Btn v="outline" className="flex-1 !bg-white !text-ink" onClick={() => { window.print(); }}>Print / save PDF</Btn></div>}>
      <article className="space-y-4 pb-4 pt-1 text-white">
        <p className="font-mono text-[11px] uppercase tracking-widest text-white/50">Pulse · {MONTHS[d.getMonth()].toUpperCase()} {d.getFullYear()} · as of {shortDate(t).toUpperCase()} · {rid}</p>
        <section><h3 className="font-bold">Executive summary</h3><p className="mt-1 text-sm text-white/80">{r.logged.length ? `Across ${r.logged.length} logged day${r.logged.length > 1 ? 's' : ''}, you averaged ${avgK} kcal/day — ${Math.abs(diff)} kcal ${diff <= 0 ? 'under' : 'over'} your ${p.targets.kcal} kcal goal. Protein averaged ${Math.round(r.avg('p'))} g against a ${p.targets.p} g target.` : 'No meals logged this month yet.'}</p></section>
        <section><h3 className="mb-2 font-bold">Key metrics</h3><div className="grid grid-cols-3 gap-2 text-center">{[['Avg cal/day', avgK], ['Total under target', Math.round(r.under)], ['Days logged', `${r.logged.length}/${r.days.length}`]].map(([l, v]) => <div key={l as string} className="rounded-2xl bg-white/10 p-2"><b className="block text-lg tabular">{v}</b><span className="text-[10px] text-white/60">{l}</span></div>)}</div></section>
        <section><h3 className="mb-2 font-bold">Weekly breakdown</h3><div className="overflow-x-auto"><table className="w-full text-sm tabular"><thead><tr className="text-left text-[11px] text-white/50">{['Week', 'Cal', 'Prot', 'Carb', 'Fat', 'Fiber'].map((h) => <th key={h} className="pb-1 pr-2">{h}</th>)}</tr></thead><tbody>{r.weeks.map(({ w, days }) => { const a = (k: keyof Macros) => days.reduce((s, x) => s + x[k], 0) / days.length; const cell = (k: keyof Macros, goal: number, kind: 'bad' | 'ok') => { const dl = Math.round(a(k) - goal); return <td className={`py-1 pr-2 font-semibold ${tone(dl, goal, kind)}`}>{dl > 0 ? '+' : ''}{dl}</td>; }; return <tr key={w} className="border-t border-white/10"><td className="py-1 pr-2">{shortDate(w)}</td>{cell('kcal', p.targets.kcal, 'bad')}{cell('p', p.targets.p, 'ok')}{cell('c', p.targets.c, 'bad')}{cell('f', p.targets.f, 'bad')}{cell('fiber', p.targets.fiber, 'ok')}</tr>; })}</tbody></table></div><p className="mt-1 text-[11px] text-white/50">Δ vs target · colour = good for your goal (green on target, yellow short, red over limit)</p></section>
        <section><h3 className="mb-2 font-bold">Daily averages</h3><div className="grid grid-cols-4 gap-2 text-center">{([['Protein', 'p'], ['Carbs', 'c'], ['Fats', 'f'], ['Fiber', 'fiber']] as const).map(([l, k]) => <div key={l} className="rounded-2xl bg-white/10 p-2"><b className="block tabular">{Math.round(r.avg(k))}g</b><span className="text-[10px] text-white/60">{l}</span></div>)}</div></section>
        <section><h3 className="mb-2 font-bold">Consistency</h3><p className="text-sm text-white/80">Adherence (±10% of goal): <b>{Math.round(r.adherence * 100)}%</b> · Best streak: <b>{r.best} days</b> · Est. change: <b>{(-(r.under) / 7700).toFixed(2)} kg</b></p></section>
        <p className="text-center font-mono text-[10px] tracking-widest text-white/40">SELF-REPORTED ESTIMATES · PULSE</p>
        <Btn v="outline" block className="!bg-white !text-ink print:hidden" onClick={() => { useUI.getState().say('Use Print / save PDF to keep a copy'); void add; }}>How to save</Btn>
      </article>
    </Sheet>
  );
}

export function MacroJournal({ close }: OP) {
  const meals = useNutrition((s) => s.meals); const { weights } = useProfile(); const open = useUI((s) => s.open); const t = getToday(); const [off, setOff] = useState(0);
  const mon = addDays(mondayOf(t), off * 7); const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i)); const rows = days.map((d) => ({ d, ...dayTotals(meals, d) })); const lg = rows.filter((x) => x.n);
  const a = (k: keyof Macros) => (lg.length ? Math.round(lg.reduce((s, x) => s + x[k], 0) / lg.length) : 0); const tracked = new Set(meals.map((m) => m.date)).size;
  return (
    <Sheet variant="full" onClose={close} title="Macro journal" caption={`${tracked} day${tracked === 1 ? '' : 's'} tracked`}>
      <div className="space-y-3 pt-1"><div className="grid grid-cols-5 gap-1 text-center">{[['AVG KCAL', a('kcal')], ['P', a('p')], ['F', a('f')], ['C', a('c')], ['FIB', a('fiber')]].map(([l, v]) => <Card key={l as string} className="!p-2"><Label className="!text-[9px]">{l}</Label><b className="tabular">{v}</b></Card>)}</div>
        <div className="flex items-center justify-between"><IconBtn n="left" label="Previous week" onClick={() => setOff(off - 1)} /><b className="font-mono text-xs tracking-widest">{shortDate(mon).toUpperCase()} – {shortDate(addDays(mon, 6)).toUpperCase()}</b><IconBtn n="right" label="Next week" onClick={() => setOff(Math.min(0, off + 1))} /></div>
        <Card className="overflow-x-auto"><table className="w-full text-center text-sm tabular"><thead><tr className="font-mono text-[10px] text-ink-3">{['DATE', 'KCAL', 'P', 'F', 'C', 'FIB', 'WT'].map((h) => <th key={h} className="pb-2">{h}</th>)}</tr></thead><tbody>{rows.map((r) => { const w = weights.find((x) => x.date === r.d)?.kg; return <tr key={r.d} className="border-t border-black/5 dark:border-white/10"><td className="py-2 text-left"><b>{parseYmd(r.d).getDate()}</b> <span className="text-xs text-ink-3">{DOW[parseYmd(r.d).getDay()]}</span></td>{r.n ? [r.kcal, r.p, r.f, r.c, r.fiber].map((v, i) => <td key={i}>{Math.round(v)}</td>) : [0, 1, 2, 3, 4].map((i) => <td key={i} className="text-ink-3">–</td>)}<td><button aria-label={`Log weight for ${longDate(r.d)}`} onClick={() => open('weight', { date: r.d })} className="min-h-[36px] min-w-[36px] font-semibold text-brand-700 dark:text-brand-400">{w ?? '+'}</button></td></tr>; })}</tbody></table></Card>
        <p className="text-center text-xs text-ink-3">Tap the WT column to log weight. Use ‹ › for other weeks.</p></div>
    </Sheet>
  );
}

export function WeightUpdate({ p, close }: OP) {
  const { weights, logWeight, removeWeight, latestKg, recalcTargets } = useProfile(); const date = (p.date as string) ?? getToday(); const [kg, setKg] = useState(weights.find((w) => w.date === date)?.kg ?? latestKg() ?? 60);
  return (
    <Sheet variant="center" onClose={close} title="Update weight" subtitle={longDate(date)} footer={<div className="flex gap-2 pb-1">{weights.some((w) => w.date === date) && <Btn v="ghost" className="!text-red-600" onClick={() => { removeWeight(date); close(); }}>Delete</Btn>}<Btn className="flex-1" disabled={kg < 20 || kg > 400} onClick={() => { logWeight(date, kg); recalcTargets(getToday()); useUI.getState().say('Weight saved'); close(); }}>Save</Btn></div>}>
      <NumInput label="Weight" unit="kg" value={kg} onChange={setKg} step={0.1} /></Sheet>
  );
}
void monIdx;
