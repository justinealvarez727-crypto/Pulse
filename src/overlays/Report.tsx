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

/** Weekly weight report: pick a week, see average / change / range, the trend of weekly averages, and a pace-to-goal estimate. */
export function WeightReport({ close }: OP) {
  const { weights, profile: p } = useProfile(); const open = useUI((s) => s.open); const t = getToday(); const [off, setOff] = useState(0);
  const byWeek = useMemo(() => {
    const m = new Map<string, number[]>(); weights.forEach((w) => { const k = mondayOf(w.date); m.set(k, [...(m.get(k) ?? []), w.kg]); });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([w, v]) => ({ w, avg: v.reduce((a, b) => a + b, 0) / v.length, min: Math.min(...v), max: Math.max(...v), n: v.length }));
  }, [weights]);
  const mon = addDays(mondayOf(t), off * 7); const days = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const cur = byWeek.find((x) => x.w === mon); const prev = [...byWeek].filter((x) => x.w < mon).pop(); const delta = cur && prev ? cur.avg - prev.avg : null;
  const last4 = byWeek.filter((x) => x.w <= mon).slice(-4); const rate = last4.length >= 2 ? (last4[last4.length - 1].avg - last4[0].avg) / (last4.length - 1) : null;
  const toGoal = cur ? cur.avg - p.goalWeightKg : null; const towards = rate !== null && toGoal !== null && rate !== 0 && Math.sign(rate) === -Math.sign(toGoal);
  const eta = towards ? Math.ceil(Math.abs(toGoal! / rate!)) : null;
  const chart = byWeek.slice(-12); const lo = Math.min(...chart.map((x) => x.avg), p.goalWeightKg) - 0.5; const hi = Math.max(...chart.map((x) => x.avg), p.goalWeightKg) + 0.5;
  const cx2 = (i: number) => (chart.length > 1 ? 12 + (i / (chart.length - 1)) * 276 : 150); const cy = (v: number) => 10 + (1 - (v - lo) / (hi - lo || 1)) * 90;
  const f1 = (n: number) => (Math.round(n * 10) / 10).toFixed(1);
  return (
    <Sheet variant="full" onClose={close} title="Weekly weight report" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Close</Btn><Btn className="flex-1" onClick={() => open('weight', {})}>Update weight</Btn></div>}>
      {byWeek.length === 0 ? <p className="py-10 text-center text-sm text-ink-2 dark:text-white/65">Log your weight first (Progress → Update Weight) and your weekly report will appear here.</p> : (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between"><IconBtn n="left" label="Previous week" onClick={() => setOff(off - 1)} /><b className="text-center font-mono text-xs tracking-widest">{shortDate(mon).toUpperCase()} – {shortDate(addDays(mon, 6)).toUpperCase()}{off === 0 && <span className="block text-[10px] text-ink-3">THIS WEEK</span>}</b><IconBtn n="right" label="Next week" onClick={() => setOff(Math.min(0, off + 1))} className={off === 0 ? 'pointer-events-none opacity-30' : ''} /></div>
          <Card><Label>Summary</Label><p className="mt-1 text-sm">{cur ? `You logged ${cur.n} weigh-in${cur.n > 1 ? 's' : ''} and averaged ${f1(cur.avg)} kg${delta !== null ? `, ${Math.abs(delta) < 0.05 ? 'unchanged from' : `${delta < 0 ? 'down' : 'up'} ${f1(Math.abs(delta))} kg from`} the week before` : ''}.` : 'No weigh-ins this week.'}{toGoal !== null && ` You are ${f1(Math.abs(toGoal))} kg ${toGoal > 0 ? 'above' : toGoal < 0 ? 'below' : 'at'} your ${p.goalWeightKg} kg goal.`}{eta !== null && ` At your recent pace of ${f1(Math.abs(rate!))} kg/week, that is about ${eta} week${eta > 1 ? 's' : ''} away.`}{rate !== null && toGoal !== null && !towards && rate !== 0 && ' Your recent trend is moving away from the goal.'}</p></Card>
          <div className="grid grid-cols-2 gap-2">{[['Average', cur ? `${f1(cur.avg)} kg` : '–'], ['Change vs last week', delta !== null ? `${delta > 0 ? '+' : ''}${f1(delta)} kg` : '–'], ['Lowest', cur ? `${f1(cur.min)} kg` : '–'], ['Highest', cur ? `${f1(cur.max)} kg` : '–']].map(([l, v]) => <Card key={l} className="!p-3"><Label>{l}</Label><b className="text-lg tabular">{v}</b></Card>)}</div>
          <Card><Label className="mb-2">Daily weigh-ins</Label><ul className="divide-y divide-black/5 dark:divide-white/10">{days.map((d) => { const w = weights.find((x) => x.date === d)?.kg; return <li key={d}><button disabled={d > t} onClick={() => open('weight', { date: d })} className="flex min-h-[44px] w-full items-center justify-between text-left disabled:opacity-40"><span>{longDate(d)}</span><b className="tabular">{w !== undefined ? `${w} kg` : d > t ? '' : '+ add'}</b></button></li>; })}</ul></Card>
          <Card><Label className="mb-2">Weekly average trend</Label>
            <svg viewBox="0 0 300 110" className="w-full" role="img" aria-label={`Weekly average weight over ${chart.length} weeks`}><line x1="0" x2="300" y1={cy(p.goalWeightKg)} y2={cy(p.goalWeightKg)} stroke="#16a34a" strokeDasharray="4 3" /><text x="296" y={cy(p.goalWeightKg) - 3} textAnchor="end" fontSize="9" fill="#15803d">goal {p.goalWeightKg}</text>
              <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" points={chart.map((x, i) => `${cx2(i)},${cy(x.avg)}`).join(' ')} />{chart.map((x, i) => <circle key={x.w} cx={cx2(i)} cy={cy(x.avg)} r={x.w === mon ? 5 : 3} fill={x.w === mon ? '#f97316' : '#2563eb'} />)}</svg></Card>
          <Card className="overflow-x-auto"><Label className="mb-2">All weeks</Label><table className="w-full text-sm tabular"><thead><tr className="text-left text-[11px] text-ink-3"><th className="pb-1">Week of</th><th>Avg</th><th>Δ</th><th>Entries</th></tr></thead><tbody>{[...byWeek].reverse().map((x) => { const pv = byWeek[byWeek.indexOf(x) - 1]; const d = pv ? x.avg - pv.avg : null; return <tr key={x.w} className={`border-t border-black/5 dark:border-white/10 ${x.w === mon ? 'font-bold' : ''}`}><td className="py-1.5">{shortDate(x.w)}</td><td>{f1(x.avg)} kg</td><td className={d === null ? '' : (d < 0) === (p.goalWeightKg < x.avg) ? 'text-green-600' : 'text-orange-600'}>{d === null ? '–' : `${d > 0 ? '+' : ''}${f1(d)}`}</td><td>{x.n}</td></tr>; })}</tbody></table></Card>
          <p className="text-center text-[11px] text-ink-3">SELF-REPORTED · weekly averages smooth out daily water-weight swings</p>
        </div>)}
    </Sheet>
  );
}