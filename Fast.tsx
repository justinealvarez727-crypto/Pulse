import { useMemo, useState } from 'react';
import { Sheet, Btn, Card, IconBtn, Label, Ring, Bar, Chip, cx, Segmented } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { useFasting, PRESETS, fastDay } from '@/store/fasting';
import { useNutrition } from '@/store/nutrition';
import { useProfile } from '@/store/profile';
import { useUI, today as getToday } from '@/store/ui';
import { hourInfo, hourLabel, hourLong, eatWindow, inFastWindow } from '@/lib/fastcalc';
import { addDays, dateAtMs, fmt12, fmtHM, longDate, MONTHS, monthGrid, parseYmd, ymd, relDay, shortDate, pad } from '@/lib/date';
import { useNow } from '@/lib/hooks';
import type { OP } from '@/components/Overlays';

const HR = 3_600_000;
const LEG = [['Fasting', 'bg-orange-200 dark:bg-orange-300/40'], ['Can eat', 'bg-brand-100 dark:bg-brand-700/40'], ['Logged', 'bg-brand-700']] as const;

function Pills({ date, big }: { date: string; big?: boolean }) {
  const plan = useFasting((s) => s.plan); const fasts = useFasting((s) => s.fasts); const meals = useNutrition((s) => s.meals); const now = useNow(30000);
  const info = useMemo(() => hourInfo(date, plan, fasts, meals, now), [date, plan, fasts, meals, now]); const curH = new Date(now).getHours(); const isToday = date === getToday();
  return (
    <div>
      <ul className={cx('grid gap-1.5', big ? 'grid-cols-6' : 'grid-cols-8')} aria-label="Hours of the day">
        {info.map((x) => (
          <li key={x.h} aria-label={`${hourLong(x.h)} ${x.state}`} className={cx('relative overflow-hidden rounded-lg py-1.5 text-center text-[11px] font-semibold', x.state === 'logged' ? 'bg-brand-700 text-white' : x.state === 'eat' ? 'bg-brand-100 text-brand-900 dark:bg-brand-700/40 dark:text-white' : 'bg-orange-100 text-orange-900 dark:bg-orange-300/30 dark:text-white', isToday && x.h === curH && 'ring-2 ring-kcal')}>
            <span aria-hidden className="absolute inset-x-0 bottom-0 bg-orange-400/70" style={{ height: `${x.fill * 100}%` }} /><span className="relative">{hourLabel(x.h)}</span>
          </li>))}
      </ul>
      <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-2 dark:text-white/60">{LEG.map(([l, c]) => <span key={l} className="flex items-center gap-1"><i className={cx('inline-block h-2.5 w-2.5 rounded-sm', c)} />{l}</span>)}</p>
    </div>
  );
}
function WindowIntake({ date }: { date: string }) {
  const plan = useFasting((s) => s.plan); const meals = useNutrition((s) => s.meals); const goal = useProfile((s) => s.profile.targets.kcal);
  const kcal = meals.filter((m) => m.date === date && !inFastWindow(plan, Number(m.time.slice(0, 2)) * 60)).reduce((a, m) => a + (m.kcal * m.portion) / 100, 0);
  return (<Card><Label>Window intake</Label><p className="mb-2 mt-1 text-xl font-bold tabular"><span className="text-kcal-ink dark:text-kcal">{Math.round(kcal).toLocaleString()}</span> / {goal.toLocaleString()} kcal</p><Bar pct={kcal / goal} color="#f97316" label="Window intake" /></Card>);
}

export function FastScreen({ close }: OP) {
  const { plan, fasts, start, end, remove } = useFasting(); const open = useUI((s) => s.open); const now = useNow(1000);
  const running = fasts.find((f) => f.status === 'running'); const sched = fasts.find((f) => f.status === 'scheduled');
  const w = eatWindow(plan); const date = getToday();
  const el = running ? now - running.start : 0; const total = running ? running.plannedEnd - running.start : plan.hours * HR; const done = running && el >= total;
  const begin = () => { const e = start(); if (e) useUI.getState().say(e); };
  const day = (ms: number) => { const d = ymd(new Date(ms)); return d === ymd(new Date(now + 864e5)) ? 'Tomorrow' : d === date ? 'Today' : shortDate(d); };
  return (
    <Sheet variant="full" onClose={close} caption="Intermittent fasting" title="Fast" leading={<IconBtn n="cal" label="Fasting history" onClick={() => open('fastHistory')} />}
      footer={<div className="grid gap-2 pb-1">
        {running ? <Btn v="orange" block onClick={() => { end(); useUI.getState().say('Fast ended'); }}>End fast</Btn> : <Btn block className="!bg-orange-600" onClick={begin}>Start fasting</Btn>}
      </div>}>
      <div className="space-y-3 pt-1">
        <button onClick={() => open('fastPlan')} className="flex w-full items-center gap-4 rounded-3xl bg-white p-4 text-left shadow-card dark:bg-night-card" aria-label="Edit fasting plan">
          <div className="relative grid place-items-center"><Ring size={96} stroke={9} pct={el / total} color={done ? '#16a34a' : '#f97316'} track="rgba(249,115,22,.15)" /><span className="absolute text-center text-xs font-bold leading-tight">{running ? <>{fmtHM(done ? el : el)}<br /><span className="font-normal text-ink-3">elapsed</span></> : <>{plan.hours}<br />hrs</>}</span></div>
          <div className="min-w-0 flex-1"><Label>{plan.preset} Plan · tap to edit</Label><p className="text-2xl font-extrabold">{plan.hours} hrs</p><p className="break-words text-sm text-ink-2 dark:text-white/70">Eat window {fmt12(w.from)} – {fmt12(w.to)}</p>
            {running && <p className="mt-1 text-sm font-semibold text-orange-700 dark:text-orange-300">{done ? `Complete · +${fmtHM(el - total)} extra` : `${fmtHM(total - el)} remaining`}</p>}</div>
        </button>
        <Card><div className="mb-2 flex items-center justify-between"><Label>Today's hours</Label><Btn v="ghost" className="!min-h-[36px] !px-3" onClick={() => open('fastFull')}>Full view</Btn></div><Pills date={date} /></Card>
        <WindowIntake date={date} />
        {sched ? (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-orange-400 p-3"><Icon n="cal" className="text-orange-600" /><div className="min-w-0 flex-1"><Label className="!text-orange-700">Scheduled</Label><p className="break-words font-semibold">{day(sched.start)} · {fmt12(new Date(sched.start).getHours() * 60 + new Date(sched.start).getMinutes())} – {fmt12(new Date(sched.plannedEnd).getHours() * 60 + new Date(sched.plannedEnd).getMinutes())}</p></div><IconBtn n="x" label="Delete scheduled fast" onClick={() => remove(sched.id)} /></div>
        ) : <Btn v="outline" block onClick={() => open('fastWhen', { mode: 'schedule' })}>Schedule your fast</Btn>}
        <Btn v="outline" block onClick={() => open('fastWhen', { mode: 'missed' })}>Log missed fast</Btn>
      </div>
    </Sheet>
  );
}

/* ---- time picker: hour / minute / AM-PM ---- */
function TimeField({ value, onChange, label }: { value: number; onChange: (m: number) => void; label: string }) {
  const h24 = Math.floor(value / 60) % 24, m = value % 60, pm = h24 >= 12, h12 = h24 % 12 || 12;
  const set = (h: number, mm: number, isPm: boolean) => onChange(((h % 12) + (isPm ? 12 : 0)) * 60 + mm);
  const Step = ({ v, on, l, f }: { v: string; on: (d: number) => void; l: string; f?: boolean }) => (<div className="flex flex-col items-center"><IconBtn n="up" label={`${l} up`} onClick={() => on(1)} /><output className="text-2xl font-bold tabular" aria-label={l}>{v}</output><IconBtn n="down" label={`${l} down`} onClick={() => on(-1)} /></div>);
  return (<div role="group" aria-label={label} className="flex items-center justify-center gap-3"><Step l="hour" v={String(h12)} on={(d) => set(((h12 - 1 + d + 12) % 12) + 1, m, pm)} /><span className="pb-1 text-2xl font-bold">:</span><Step l="minute" v={pad(m)} on={(d) => set(h12, (m + d * 5 + 60) % 60, pm)} /><div className="ml-2"><Segmented label="AM or PM" value={pm ? 'pm' : 'am'} options={[{ id: 'am', label: 'AM' }, { id: 'pm', label: 'PM' }]} onChange={(v) => set(h12, m, v === 'pm')} /></div></div>);
}
const dur = (a: number, b: number) => { const m = (b - a + 1440) % 1440 || 1440; return m; };
const durLabel = (min: number) => `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ''}`;

export function FastPlanEdit({ close }: OP) {
  const { plan, setPlan } = useFasting(); const [start, setStart] = useState(plan.startMin); const [end, setEnd] = useState((plan.startMin + plan.hours * 60) % 1440); const [step, setStep] = useState<'start' | 'end'>('start'); const [preset, setPreset] = useState(plan.preset);
  const minutes = dur(start, end);
  const pick = (id: string) => { const pr = PRESETS.find((x) => x.id === id)!; setPreset(id); setEnd((start + pr.hours * 60) % 1440); };
  const done = () => { setPlan({ startMin: start, hours: Math.round((minutes / 60) * 100) / 100, preset: PRESETS.find((x) => x.hours * 60 === minutes)?.id ?? 'Custom' }); close(); };
  return (
    <Sheet variant="center" onClose={close} title="Set your fast" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn>{step === 'start' ? <Btn className="flex-1" onClick={() => setStep('end')}>Next</Btn> : <Btn className="flex-1" onClick={done}>Done</Btn>}</div>}>
      <div className="space-y-4 pt-1">
        <div><label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-2 dark:text-white/60" htmlFor="pre">Preset</label>
          <select id="pre" value={preset} onChange={(e) => pick(e.target.value)} className="min-h-[44px] w-full rounded-xl border border-black/10 bg-white px-3 dark:border-white/15 dark:bg-night"><option value="Custom" disabled>Custom</option>{PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label} — {p.hours}h fasting</option>)}</select></div>
        <div className="grid grid-cols-2 gap-2">{(['start', 'end'] as const).map((k) => (<button key={k} onClick={() => setStep(k)} aria-pressed={step === k} className={cx('rounded-2xl p-3 text-left', step === k ? 'bg-orange-100 ring-2 ring-kcal dark:bg-orange-300/20' : 'bg-black/5 dark:bg-white/10')}><Label>{k === 'start' ? 'Starts' : 'Ends'}</Label><p className="text-lg font-bold">{fmt12(k === 'start' ? start : end)}</p></button>))}</div>
        <p className="text-center text-sm font-semibold text-orange-700 dark:text-orange-300">Duration: {durLabel(minutes)}</p>
        {step === 'start' ? <TimeField label="Start time" value={start} onChange={(v) => { setStart(v); setPreset('Custom'); }} /> : <TimeField label="End time" value={end} onChange={(v) => { setEnd(v); setPreset('Custom'); }} />}
      </div>
    </Sheet>
  );
}

/** schedule: pick the day it STARTS. missed: pick the day it ENDED (spec). */
export function FastWhen({ p, close }: OP) {
  const mode = p.mode as 'schedule' | 'missed'; const { plan, schedule, logMissed } = useFasting(); const t = getToday();
  const [date, setDate] = useState(mode === 'schedule' ? addDays(t, 1) : addDays(t, -1));
  const [start, setStart] = useState(plan.startMin); const [end, setEnd] = useState((plan.startMin + plan.hours * 60) % 1440); const [step, setStep] = useState<'start' | 'end'>('start'); const [err, setErr] = useState('');
  const minutes = dur(start, end);
  const save = () => {
    const s = mode === 'schedule' ? dateAtMs(date, start) : dateAtMs(date, end) - minutes * 60000; const e = mode === 'schedule' ? s + minutes * 60000 : dateAtMs(date, end);
    const r = mode === 'schedule' ? schedule(s, e) : logMissed(s, e); if (r) setErr(r); else { useUI.getState().say(mode === 'schedule' ? 'Fast scheduled' : 'Fast logged'); close(); }
  };
  return (
    <Sheet variant="center" onClose={close} title={mode === 'schedule' ? 'Schedule your fast' : 'Log missed fast'} subtitle={mode === 'schedule' ? 'Pick a day, then start & end time' : 'Pick the day it ended, then start & end time'}
      footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn>{step === 'start' ? <Btn className="flex-1" onClick={() => setStep('end')}>Next</Btn> : <Btn className="flex-1" onClick={save}>Done</Btn>}</div>}>
      <div className="space-y-4 pt-1">
        <div className="flex items-center justify-between gap-2"><IconBtn n="left" label="Previous day" onClick={() => setDate(addDays(date, -1))} /><div className="text-center"><input type="date" aria-label="Day" value={date} min={mode === 'schedule' ? t : undefined} max={mode === 'missed' ? t : undefined} onChange={(e) => e.target.value && setDate(e.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 text-center font-semibold dark:border-white/15 dark:bg-night" /><p className="mt-1 text-xs text-ink-2 dark:text-white/60">{MONTHS[parseYmd(date).getMonth()]} {parseYmd(date).getFullYear()} · {relDay(date, t)}</p></div><IconBtn n="right" label="Next day" onClick={() => setDate(addDays(date, 1))} /></div>
        <div className="grid grid-cols-2 gap-2">{(['start', 'end'] as const).map((k) => (<button key={k} onClick={() => setStep(k)} aria-pressed={step === k} className={cx('rounded-2xl p-3 text-left', step === k ? 'bg-orange-100 ring-2 ring-kcal dark:bg-orange-300/20' : 'bg-black/5 dark:bg-white/10')}><Label>{k === 'start' ? 'Starts' : 'Ends'}</Label><p className="text-lg font-bold">{fmt12(k === 'start' ? start : end)}</p><p className="text-xs text-ink-2 dark:text-white/60">{mode === 'missed' ? (k === 'end' ? relDay(date, t) : relDay(minutes > 0 && start > end ? addDays(date, -1) : date, t)) : k === 'start' ? relDay(date, t) : relDay(start >= end ? addDays(date, 1) : date, t)}</p></button>))}</div>
        <p className="text-center text-sm font-semibold text-orange-700 dark:text-orange-300">Duration: {durLabel(minutes)}</p>
        {step === 'start' ? <TimeField label="Start time" value={start} onChange={setStart} /> : <TimeField label="End time" value={end} onChange={setEnd} />}
        {err && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p>}
      </div>
    </Sheet>
  );
}

export function FastFull({ close }: OP) {
  const plan = useFasting((s) => s.plan); const fasts = useFasting((s) => s.fasts); const meals = useNutrition((s) => s.meals); const now = useNow(30000); const date = getToday();
  const info = hourInfo(date, plan, fasts, meals, now); const cur = new Date(now).getHours();
  return (
    <Sheet variant="full" onClose={close} title="Today's hours" subtitle="Your eating window & hourly intake">
      <div className="space-y-3 pt-1"><Card><Pills date={date} big /></Card><WindowIntake date={date} />
        <Card><Label className="mb-2">Hour by hour</Label><ul className="divide-y divide-black/5 dark:divide-white/10">{info.map((x) => (
          <li key={x.h} className={cx('flex items-center gap-3 rounded-xl px-2 py-2.5', x.h === cur && 'ring-2 ring-kcal')}><span className="w-20 text-sm font-semibold tabular">{hourLong(x.h)}</span>
            <i className={cx('h-2.5 w-2.5 rounded-full', x.state === 'logged' ? 'bg-brand-700' : x.state === 'eat' ? 'bg-brand-400' : 'bg-orange-400')} /><span className="flex-1 text-sm">{x.state === 'logged' ? 'Logged' : x.state === 'eat' ? 'Can eat' : 'Fasting'}{x.h === cur && <b className="ml-2 text-kcal-ink">Now</b>}</span>
            <span className="text-sm tabular text-ink-2 dark:text-white/60">{x.kcal ? `${Math.round(x.kcal)} kcal` : '–'}</span></li>))}</ul></Card></div>
    </Sheet>
  );
}

export function FastHistory({ close }: OP) {
  const fasts = useFasting((s) => s.fasts); const open = useUI((s) => s.open); const t = getToday(); const [m, setM] = useState({ y: parseYmd(t).getFullYear(), mo: parseYmd(t).getMonth() }); const [sel, setSel] = useState(t);
  const byDay = useMemo(() => { const o: Record<string, number> = {}; fasts.filter((f) => f.status === 'done').forEach((f) => { const d = fastDay(f); o[d] = (o[d] ?? 0) + ((f.end ?? 0) - f.start) / HR; }); return o; }, [fasts]);
  const grid = monthGrid(m.y, m.mo, 1); const isCur = m.y === parseYmd(t).getFullYear() && m.mo === parseYmd(t).getMonth();
  const monthDays = Object.entries(byDay).filter(([d]) => d.startsWith(`${m.y}-${pad(m.mo + 1)}`)); const vals = monthDays.map(([, v]) => v);
  const nav = (d: number) => { const x = new Date(m.y, m.mo + d, 1); setM({ y: x.getFullYear(), mo: x.getMonth() }); };
  return (
    <Sheet variant="full" onClose={close} title="Fasting history" footer={<Btn v="outline" block onClick={() => open('fastWhen', { mode: 'missed' })}>Log missed fast</Btn>}>
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between"><IconBtn n="left" label="Previous month" onClick={() => nav(-1)} /><p className="font-bold">{MONTHS[m.mo]} {m.y}</p><IconBtn n="right" label="Next month" onClick={() => nav(1)} className={isCur ? 'opacity-30 pointer-events-none' : ''} /></div>
        <Card><div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-3 dark:text-white/50">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">{grid.map((d, i) => d ? (<button key={d} onClick={() => setSel(d)} aria-label={`${longDate(d)}${byDay[d] ? `, ${Math.round(byDay[d])} hours fasted` : ''}`} className={cx('flex h-12 flex-col items-center justify-center rounded-xl text-sm', d === sel ? 'bg-orange-100 ring-2 ring-kcal dark:bg-orange-300/25' : byDay[d] ? 'bg-brand-50 dark:bg-brand-700/30' : '')}><span className="font-semibold">{parseYmd(d).getDate()}</span>{byDay[d] ? <span className="text-[10px] font-bold text-orange-700 dark:text-orange-300">{Math.round(byDay[d])}h</span> : null}</button>) : <span key={i} />)}</div></Card>
        <p className="rounded-2xl bg-white p-3 text-center text-sm font-semibold dark:bg-night-card">{longDate(sel)} — {byDay[sel] ? `${Math.round(byDay[sel])} hours fasted` : <b className="text-orange-600">No fast logged</b>}</p>
        <div className="grid grid-cols-3 gap-2 text-center">{[['Fasts', String(fasts.filter((f) => f.status === 'done' && fastDay(f).startsWith(`${m.y}-${pad(m.mo + 1)}`)).length)], ['Avg', vals.length ? `${(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)}h` : '–'], ['Longest', vals.length ? `${Math.round(Math.max(...vals))}h` : '–']].map(([l, v]) => <Card key={l} className="!p-3"><Label>{l}</Label><p className="text-xl font-extrabold">{v}</p></Card>)}</div>
      </div>
    </Sheet>
  );
}
void Chip;
