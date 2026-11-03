import { useMemo, useRef, useState } from 'react';
import { useUI, today as getToday } from '@/store/ui';
import { useProfile } from '@/store/profile';
import { useNutrition } from '@/store/nutrition';
import { useActivity } from '@/store/activity';
import { useFasting, fastDay } from '@/store/fasting';
import { useTraining } from '@/store/training';
import { useGallery } from '@/store/gallery';
import { dayTotals } from '@/overlays/Report';
import { Btn, Card, Chip, IconBtn, Label, Bar, Ring } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { BITS, BITS_PER_STAR, levelOf, bmi, bmiCategory, bmiPos } from '@/lib/calc';
import { addDays, diffDays, mondayOf, monthGrid, MONTHS, parseYmd, shortDate, DOW } from '@/lib/date';
import { shrinkImage } from '@/lib/image';
import type { Macros } from '@/types';

type Metric = 'kcal' | 'p' | 'c' | 'f' | 'fiber' | 'sugar';
const METRICS: [Metric, string][] = [['kcal', 'Calories'], ['p', 'Protein'], ['c', 'Carbs'], ['f', 'Fats'], ['fiber', 'Fiber'], ['sugar', 'Sugar']];
const n0 = (n: number) => Math.round(n).toLocaleString();

export default function Progress() {
  const open = useUI((s) => s.open); const t = getToday(); const { profile: p, weights, latestKg } = useProfile(); const meals = useNutrition((s) => s.meals); const water = useNutrition((s) => s.water);
  const stepsOn = useActivity((s) => s.stepsOn); useActivity((s) => s.days); useActivity((s) => s.logs); const fasts = useFasting((s) => s.fasts); const history = useTraining((s) => s.history); const gallery = useGallery(); const file = useRef<HTMLInputElement>(null);
  const [metric, setMetric] = useState<Metric>('kcal'); const [range, setRange] = useState<'week' | 'last' | 'm1' | 'm6'>('week'); const [mo, setMo] = useState({ y: parseYmd(t).getFullYear(), m: parseYmd(t).getMonth() });
  const mon = mondayOf(t); const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));

  /* ---- bits: auto score from how heavy each activity is ---- */
  const bits = useMemo(() => {
    const mealsN = meals.length; const waterDays = Object.values(water).filter((v) => v >= p.waterGoal).length;
    const allDays = [...new Set([...Object.keys(water), ...meals.map((m) => m.date)])]; const steps = allDays.reduce((a, d) => a + Math.min(12000, stepsOn(d)), 0) / 1000;
    const fastH = fasts.filter((f) => f.status === 'done').reduce((a, f) => a + Math.min(20, ((f.end ?? 0) - f.start) / 3.6e6), 0);
    const wk = history.reduce((a, h) => a + BITS.workout + h.volume / 500 * BITS.volumePer500 + h.records * BITS.record, 0);
    return Math.round(mealsN * BITS.meal + waterDays * BITS.water + steps * BITS.stepsPerK + fastH * BITS.fastHour + wk);
  }, [meals, water, p.waterGoal, fasts, history, stepsOn]);
  const lv = levelOf(bits);
  const logStreak = useMemo(() => { const ds = new Set(meals.map((m) => m.date)); let s = 0, d = ds.has(t) ? t : addDays(t, -1); while (ds.has(d)) { s++; d = addDays(d, -1); } return s; }, [meals, t]);

  const dayVals = (days: string[], key: Metric) => days.map((d) => ({ d, v: dayTotals(meals, d)[key], n: dayTotals(meals, d).n }));
  const goalOf = (k: Metric) => p.targets[k];
  const ranges = { week: [mon, t], last: [addDays(mon, -7), addDays(mon, -1)], m1: [addDays(t, -29), t], m6: [addDays(t, -182), t] } as const;
  const span = (a: string, b: string) => Array.from({ length: diffDays(b, a) + 1 }, (_, i) => addDays(a, i));
  const avgOver = (days: string[], f: (d: string) => number, skipZero = true) => { const v = days.map(f).filter((x) => (skipZero ? x > 0 : true)); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  const rd = span(...ranges[range] as [string, string]);
  const mAvg = (k: Metric) => avgOver(rd, (d) => dayTotals(meals, d)[k]);
  const fastH = (d: string) => fasts.filter((f) => f.status === 'done' && fastDay(f) === d).reduce((a, f) => a + ((f.end ?? 0) - f.start) / 3.6e6, 0);

  /* ---- journey ---- */
  const cur = latestKg(); const start = weights[0]?.kg; const remaining = cur !== undefined ? cur - p.goalWeightKg : undefined;
  const daysLeft = Math.max(1, diffDays(p.goalDate, t)); const weeklyDelta = remaining !== undefined ? Math.max(-1, Math.min(1, -remaining / (daysLeft / 7))) : 0;
  const b = cur ? bmi(cur, p.heightCm) : null; const cat = b ? bmiCategory(b) : null;
  const wChart = weights.slice(-30); const wMin = Math.min(...wChart.map((w) => w.kg), p.goalWeightKg) - 1; const wMax = Math.max(...wChart.map((w) => w.kg), p.goalWeightKg) + 1;
  const wx = (i: number) => (wChart.length > 1 ? 10 + (i / (wChart.length - 1)) * 280 : 150); const wy = (v: number) => 10 + (1 - (v - wMin) / (wMax - wMin || 1)) * 100;
  const grid = monthGrid(mo.y, mo.m, 1);
  const calBars = dayVals(week, 'kcal'); const maxK = Math.max(p.targets.kcal * 1.2, ...calBars.map((x) => x.v));
  const logged = calBars.filter((x) => x.n); const avgWeek = logged.length ? logged.reduce((a, x) => a + x.v, 0) / logged.length : 0;

  return (
    <div className="space-y-4 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header><h1 className="text-2xl font-extrabold">Progress</h1><p className="text-sm text-ink-2 dark:text-white/60">Your journey, one check-in at a time.</p></header>

      <Card className="bg-gradient-to-br from-brand-700 to-brand-900 !text-white dark:from-brand-800">
        <div className="flex items-center justify-between"><div><Label className="!text-white/60">Level</Label><p className="text-2xl font-extrabold">{lv.name}</p><p className="text-sm text-white/80">{bits.toLocaleString()} bits lifetime</p></div>
          <div className="flex" aria-label={`${lv.stars} stars`}>{Array.from({ length: Math.min(5, lv.stars % 5 || (lv.stars ? 5 : 0)) }, (_, i) => <Icon key={i} n="star" className="text-yellow-300" />)}{lv.stars === 0 && <span className="text-sm text-white/60">No stars yet</span>}</div></div>
        <div className="mt-3 grid grid-cols-2 gap-2"><div className="rounded-2xl bg-white/10 p-3"><b className="text-xl tabular">{lv.toNext}/{BITS_PER_STAR}</b><p className="text-xs text-white/70">To next star</p></div><div className="rounded-2xl bg-white/10 p-3"><b className="text-xl tabular">{logStreak} Day{logStreak === 1 ? '' : 's'}</b><p className="text-xs text-white/70">Current streak</p></div></div>
        <p className="mt-2 text-[11px] text-white/60">Bits: meal {BITS.meal} · water goal {BITS.water} · steps {BITS.stepsPerK}/1k · fasted hour {BITS.fastHour} · workout {BITS.workout} + volume + {BITS.record}/record</p></Card>

      <Card as="section"><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Weekly Overview</h2><div className="flex gap-1"><Btn v="ghost" className="!min-h-[36px] !px-3" onClick={() => { useUI.getState().say('Everything is already saved on this device'); }}>Sync logs</Btn><Btn className="!min-h-[36px] !px-3" onClick={() => open('report')}>Generate report</Btn></div></div>
        <div className="flex gap-2 overflow-x-auto pb-2">{METRICS.map(([k, l]) => <Chip key={k} on={metric === k} onClick={() => setMetric(k)}>{l}</Chip>)}</div>
        <div className="mb-1 flex items-center justify-between"><IconBtn n="left" label="Previous month" onClick={() => { const x = new Date(mo.y, mo.m - 1, 1); setMo({ y: x.getFullYear(), m: x.getMonth() }); }} /><b>{MONTHS[mo.m]} {mo.y}</b><IconBtn n="right" label="Next month" onClick={() => { const x = new Date(mo.y, mo.m + 1, 1); setMo({ y: x.getFullYear(), m: x.getMonth() }); }} /></div>
        <div className="grid grid-cols-8 gap-1 text-center text-[10px] font-semibold text-ink-3">{['M', 'T', 'W', 'T', 'F', 'S', 'S', 'Wk'].map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="mt-1 grid grid-cols-8 gap-1">{Array.from({ length: grid.length / 7 }, (_, w) => { const row = grid.slice(w * 7, w * 7 + 7); const tots = row.map((d) => (d ? dayTotals(meals, d) : null)); const sum = tots.reduce((a, x) => a + (x ? x[metric] : 0), 0); return [...row.map((d, i) => { if (!d) return <span key={`${w}${i}`} />; const x = tots[i]!; const pct = x[metric] / goalOf(metric); return (
          <div key={d} className="flex h-14 flex-col items-center justify-center rounded-lg" aria-label={`${shortDate(d)}: ${n0(x[metric])}`}><span className="relative grid place-items-center"><Ring size={30} stroke={3.5} pct={pct} color={pct > 1.1 ? '#dc2626' : '#16a34a'} track="rgba(0,0,0,.08)" />{x.n > 0 && pct >= 0.9 && pct <= 1.1 ? <Icon n="check" size={12} stroke={3} className="absolute text-green-600" /> : <span className="absolute text-[9px] font-bold">{parseYmd(d).getDate()}</span>}</span><span className="text-[9px] font-semibold tabular text-ink-2 dark:text-white/65">{x.n ? n0(x[metric]) : ''}</span></div>); }), <div key={`w${w}`} className="flex h-14 items-center justify-center rounded-lg bg-black/5 text-[10px] font-bold tabular dark:bg-white/10">{sum ? n0(sum) : '–'}</div>]; })}</div></Card>

      <Card as="section"><h2 className="mb-2 font-bold">Calories per day</h2>
        <svg viewBox="0 0 320 140" className="w-full" role="img" aria-label={`Calories this week. Average ${n0(avgWeek)} of ${n0(p.targets.kcal)} goal`}>
          {calBars.map((x, i) => { const h = (x.v / maxK) * 100; return <g key={x.d}><rect x={14 + i * 40} y={110 - h} width={26} height={h} rx={6} fill={x.v > p.targets.kcal * 1.1 ? '#dc2626' : '#16a34a'} opacity={x.n ? 1 : 0.2} /><text x={27 + i * 40} y={128} textAnchor="middle" fontSize="10" className="fill-ink-3">{DOW[(i + 1) % 7].slice(0, 1)}</text></g>; })}
          <line x1="0" x2="320" y1={110 - (p.targets.kcal / maxK) * 100} y2={110 - (p.targets.kcal / maxK) * 100} stroke="#f97316" strokeDasharray="4 3" /><text x="316" y={106 - (p.targets.kcal / maxK) * 100} textAnchor="end" fontSize="9" fill="#c2410c">goal {n0(p.targets.kcal)}</text>
          {avgWeek > 0 && <line x1="0" x2="320" y1={110 - (avgWeek / maxK) * 100} y2={110 - (avgWeek / maxK) * 100} stroke="#2563eb" strokeDasharray="2 3" />}</svg>
        <p className="text-sm text-ink-2 dark:text-white/65">Avg {n0(avgWeek)} kcal over {logged.length} logged day{logged.length === 1 ? '' : 's'}</p></Card>

      <Card as="section"><div className="mb-2 flex items-center justify-between"><h2 className="font-bold">Macros average</h2></div><div className="mb-2 flex gap-2 overflow-x-auto">{([['week', 'This week'], ['last', 'Last week'], ['m1', '1 month'], ['m6', '6 months']] as const).map(([k, l]) => <Chip key={k} on={range === k} onClick={() => setRange(k)}>{l}</Chip>)}</div>
        <ul className="space-y-2">{([['kcal', 'Calories', '#f97316'], ['p', 'Protein', '#16a34a'], ['c', 'Carbs', '#3b82f6'], ['f', 'Fats', '#eab308']] as [Metric, string, string][]).map(([k, l, c]) => <li key={k}><div className="flex justify-between text-sm"><span>{l}</span><b className="tabular">{n0(mAvg(k))} / day</b></div><Bar pct={mAvg(k) / goalOf(k)} color={c} h={6} label={l} /></li>)}</ul>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">{[['Water', `${n0(avgOver(rd, (d) => water[d] ?? 0))} mL`], ['Fasting', `${avgOver(rd, fastH).toFixed(1)} h`], ['Steps', n0(avgOver(rd, stepsOn))]].map(([l, v]) => <div key={l} className="rounded-2xl bg-black/5 p-2 dark:bg-white/10"><Label>{l} avg</Label><b className="tabular">{v}</b></div>)}</div></Card>

      <Card as="section"><h2 className="font-bold">Your Journey</h2><p className="mb-3 text-sm text-ink-2 dark:text-white/65">Every step brings you closer to your goal.</p>
        {wChart.length === 0 ? <p className="rounded-2xl bg-black/5 p-4 text-center text-sm dark:bg-white/10">Log your weight to start the chart.</p> : (
          <svg viewBox="0 0 300 120" className="w-full" role="img" aria-label={`Weight from ${start} to ${cur} kilograms, goal ${p.goalWeightKg}`}><line x1="0" x2="300" y1={wy(p.goalWeightKg)} y2={wy(p.goalWeightKg)} stroke="#16a34a" strokeDasharray="4 3" /><text x="296" y={wy(p.goalWeightKg) - 3} textAnchor="end" fontSize="9" fill="#15803d">goal {p.goalWeightKg}</text>
            <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinejoin="round" points={wChart.map((w, i) => `${wx(i)},${wy(w.kg)}`).join(' ')} />{wChart.map((w, i) => (i === 0 || i === wChart.length - 1) && <circle key={w.date} cx={wx(i)} cy={wy(w.kg)} r="4.5" fill={i ? '#2563eb' : '#6b7a72'} />)}</svg>)}
        <div className="mt-3 grid grid-cols-4 gap-1 text-center">{[['Start', start], ['Current', cur], ['Goal', p.goalWeightKg], ['Remaining', remaining !== undefined ? Math.abs(Math.round(remaining * 10) / 10) : undefined]].map(([l, v]) => <div key={l as string} className="rounded-xl bg-black/5 p-2 dark:bg-white/10"><b className="block tabular">{v ?? '–'}</b><span className="text-[10px] text-ink-2 dark:text-white/60">{l}</span></div>)}</div>
        {cur !== undefined && <p className="mt-3 rounded-2xl bg-brand-500/10 p-3 text-sm">Eat <b>{n0(p.targets.kcal)} cal/day</b> to reach <b>{p.goalWeightKg} kg</b> by {shortDate(p.goalDate)}. Your first target is to {weeklyDelta <= 0 ? 'lose' : 'gain'} <b>{Math.abs(weeklyDelta).toFixed(1)} kg</b> this week — small steps one week at a time.</p>}
        <div className="mt-3 grid grid-cols-2 gap-2"><Btn v="outline" onClick={() => open('macroJournal')}>Macro Journal</Btn><Btn onClick={() => open('weight', {})}>Update Weight</Btn></div><Btn v="outline" block className="mt-2" onClick={() => open('weightReport')}>Weekly weight report</Btn></Card>

      <Card as="section"><h2 className="mb-2 font-bold">Workout progress</h2><p className="text-sm text-ink-2 dark:text-white/65">{history.filter((h) => h.date >= mon).length} session(s) this week · {n0(history.filter((h) => h.date >= mon).reduce((a, h) => a + h.volume, 0))} kg volume</p><Btn v="outline" block className="mt-2" onClick={() => open('workout')}>Open workout progress</Btn></Card>

      <Card as="section"><h2 className="font-bold">Progress Gallery</h2><p className="mb-2 text-sm text-ink-2 dark:text-white/65">Track your visual progress over time</p>
        <div className="flex gap-2 overflow-x-auto pb-1">{gallery.photos.map((ph) => <figure key={ph.id} className="relative shrink-0"><img src={ph.src} alt={`Progress photo ${shortDate(ph.date)}`} className="h-28 w-24 rounded-xl object-cover" /><figcaption className="text-center text-[10px]">{shortDate(ph.date)}</figcaption><button aria-label="Delete photo" onClick={() => gallery.remove(ph.id)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"><Icon n="x" size={14} /></button></figure>)}</div>
        <input ref={file} type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { gallery.add(t, await shrinkImage(f, 640)); } catch { useUI.getState().say('Could not read that photo'); } } e.target.value = ''; }} /><Btn v="outline" block onClick={() => file.current?.click()}>Add progress photo</Btn></Card>

      <Card as="section"><Label>Your BMI</Label>{b && cat ? <><p className="text-3xl font-extrabold tabular">{b.toFixed(1)} <span className={`text-base ${cat.tone}`}>{cat.label}</span></p>
        <div className="relative mt-3 h-3 rounded-full" style={{ background: 'linear-gradient(90deg,#2563eb 0 17.5%,#16a34a 17.5% 40%,#f97316 40% 62.5%,#dc2626 62.5%)' }}><span aria-hidden className="absolute -top-1 h-5 w-1.5 rounded bg-ink dark:bg-white" style={{ left: `${bmiPos(b) * 100}%` }} /></div>
        <div className="mt-1 flex justify-between text-[10px] text-ink-3"><span>Under</span><span>Healthy</span><span>Over</span><span>Obese</span></div><p className="mt-2 text-xs text-ink-3">Asian BMI cut-offs: healthy 18.5–22.9, over 23–27.4, obese ≥ 27.5.</p></> : <p className="text-sm text-ink-2 dark:text-white/65">Log your weight to see your BMI (height {p.heightCm} cm).</p>}</Card>
    </div>
  );
}
void ((_: Macros) => 0);
