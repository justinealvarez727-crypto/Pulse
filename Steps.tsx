import { useState } from 'react';
import { Sheet, Btn, Card, Bar, Input, NumInput, Chip, Label, IconBtn, cx } from '@/components/ui';
import { useActivity } from '@/store/activity';
import { useProfile } from '@/store/profile';
import { useUI, today as getToday } from '@/store/ui';
import { addDays, longDate, MONTHS, monthGrid, parseYmd, shortDate, hhmm, relDay } from '@/lib/date';
import { kcalBurned, stepsToKm } from '@/lib/calc';
import type { OP } from '@/components/Overlays';

export function StepsSheet({ close }: OP) {
  const { profile, setProfile, latestKg } = useProfile(); const open = useUI((s) => s.open); const t = getToday();
  const days = useActivity((s) => s.days); const logs = useActivity((s) => s.logs); const stepsOn = useActivity((s) => s.stepsOn);
  const [view, setView] = useState<'log' | 'history'>('log'); const [editGoal, setEditGoal] = useState(false); const [goal, setGoal] = useState(profile.stepsGoal);
  const [m, setM] = useState({ y: parseYmd(t).getFullYear(), mo: parseYmd(t).getMonth() }); const today = stepsOn(t);
  void days; void logs;
  const nav = (d: number) => { const x = new Date(m.y, m.mo + d, 1); setM({ y: x.getFullYear(), mo: x.getMonth() }); };
  const share = async () => { const s = `${today.toLocaleString()} steps today (${stepsToKm(today, profile.heightCm).toFixed(1)} km)`; try { if (navigator.share) await navigator.share({ text: s }); else { await navigator.clipboard.writeText(s); useUI.getState().say('Copied'); } } catch { /* cancelled */ } };

  if (view === 'history') return (
    <Sheet onClose={close} caption="Log activity" title="Steps + workouts · last 7 days" trailing={<Btn v="ghost" className="!min-h-[36px] !px-3" onClick={() => setView('log')}>← Log</Btn>}>
      <ul className="space-y-2 pt-1">{Array.from({ length: 7 }, (_, i) => addDays(t, -i)).map((d) => { const s = stepsOn(d); const ws = logs.filter((l) => l.date === d); return (
        <li key={d}><Card className="!p-3"><div className="flex justify-between text-sm"><b>{relDay(d, t) === shortDate(d) ? longDate(d) : relDay(d, t)}</b><span className="tabular">{s ? `${s.toLocaleString()} steps` : '— steps'}</span></div><div className="my-2"><Bar pct={s / profile.stepsGoal} label={`${d} steps`} /></div>
          {ws.length ? ws.map((w) => <p key={w.id} className="break-words text-xs text-ink-2 dark:text-white/65">{w.type} · {w.minutes} min{w.kcal !== undefined ? ` · ${w.kcal} kcal` : ''}</p>) : <p className="text-xs text-ink-3 dark:text-white/50">No workouts</p>}</Card></li>); })}</ul>
      <p className="mt-3 text-center text-xs text-ink-3 dark:text-white/50">Goal {profile.stepsGoal.toLocaleString()} steps / day · walks & runs listed under each day</p>
    </Sheet>);

  const grid = monthGrid(m.y, m.mo, 0);
  return (
    <Sheet onClose={close} caption="Log activity" title="Log your steps" subtitle="Track your steps manually" trailing={<Btn v="ghost" className="!min-h-[36px] !px-3" onClick={() => setView('history')}>History ›</Btn>}
      footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" onClick={() => open('activityForm', { date: t })}>Add walk / run</Btn></div>}>
      <div className="space-y-3 pt-1">
        <Card><div className="flex items-start justify-between gap-2"><div><p className="text-2xl font-extrabold tabular">{today.toLocaleString()} <span className="text-sm font-semibold text-ink-2">of {profile.stepsGoal.toLocaleString()} goal</span></p></div><IconBtn n="share" label="Share steps" onClick={share} className="bg-black/5 dark:bg-white/10" /></div>
          <div className="my-2"><Bar pct={today / profile.stepsGoal} label="Steps goal" /></div>
          {editGoal ? <div className="flex items-end gap-2"><NumInput label="Daily goal" value={goal} onChange={setGoal} step={500} /><Btn onClick={() => { if (goal >= 100) { setProfile({ stepsGoal: goal }); setEditGoal(false); } }}>Done</Btn></div> : <button className="text-sm font-semibold text-brand-700 dark:text-brand-400" onClick={() => setEditGoal(true)}>Edit goal</button>}</Card>
        <Btn v="outline" block onClick={() => open('stepsReport')}>Generate report</Btn>
        <Card><div className="mb-1 flex items-center justify-between"><IconBtn n="left" label="Previous month" onClick={() => nav(-1)} /><div className="text-center"><p className="font-bold">{MONTHS[m.mo]} {m.y}</p><Label>Days you moved · steps per day</Label></div><IconBtn n="right" label="Next month" onClick={() => nav(1)} /></div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-3 dark:text-white/50">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">{grid.map((d, i) => { if (!d) return <span key={i} />; const future = d > t; const s = stepsOn(d); return (
            <button key={d} disabled={future} onClick={() => open('stepsAdd', { date: d })} aria-label={`${longDate(d)}: ${s ? s + ' steps' : 'no steps'}`} className={cx('flex h-12 flex-col items-center justify-center rounded-xl text-sm', future ? 'opacity-35' : 'hover:bg-black/5', d === t && 'ring-2 ring-brand-500')}><span className="font-semibold">{parseYmd(d).getDate()}</span>{s ? <span className="text-[10px] font-bold text-kcal-ink dark:text-kcal">{s >= 1000 ? (s / 1000).toFixed(1) + 'k' : s}</span> : !future ? <span className="h-1 w-1 rounded-full bg-black/25 dark:bg-white/30" /> : null}</button>); })}</div></Card>
        {!latestKg() && <p className="rounded-2xl bg-orange-50 p-3 text-xs text-orange-900">Log your weight in Progress to see estimated calories burned.</p>}
      </div>
    </Sheet>
  );
}

export function StepsAdd({ p, close }: OP) {
  const date = p.date as string; const { days, setSteps } = useActivity(); const { profile, latestKg } = useProfile();
  const [steps, setS] = useState(days[date]?.steps ?? 0); const [min, setMin] = useState(days[date]?.minutes ?? 0);
  const kg = latestKg(); const est = kcalBurned({ kg, minutes: min || undefined, steps, heightCm: profile.heightCm });
  return (
    <Sheet variant="center" onClose={close} caption="Add steps" title={longDate(date)} footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" onClick={() => { setSteps(date, steps, min || undefined); close(); }}>Save</Btn></div>}>
      <div className="space-y-3 pt-1"><NumInput label="Steps" value={steps || ''} onChange={setS} /><NumInput label="Minutes (optional)" value={min || ''} onChange={setMin} hint="Add minutes to estimate calories burned (log your weight first)" />
        {est !== undefined && <p className="rounded-xl bg-kcal-soft p-3 text-sm font-semibold text-kcal-ink">≈ {est} kcal burned · {stepsToKm(steps, profile.heightCm).toFixed(2)} km</p>}</div>
    </Sheet>
  );
}

export function ActivityForm({ p, close }: OP) {
  const t = getToday(); const { addLog } = useActivity(); const { profile, latestKg } = useProfile();
  const [type, setType] = useState<'Walking' | 'Running'>('Walking'); const [date, setDate] = useState((p.date as string) ?? t); const [time, setTime] = useState(hhmm());
  const [dur, setDur] = useState(30); const [kcal, setKcal] = useState(0); const [steps, setSteps] = useState(0); const [km, setKm] = useState(0); const [notes, setNotes] = useState(''); const [pick, setPick] = useState(false);
  const est = kcalBurned({ kg: latestKg(), minutes: dur, heightCm: profile.heightCm, type });
  const save = () => { if (dur <= 0) return; addLog({ date, time, type, minutes: dur, kcal: kcal || est, steps: steps || undefined, km: km || undefined, notes: notes || undefined }); useUI.getState().say(`${type} logged`); close(); };
  return (
    <Sheet onClose={close} title="Log activity" footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Cancel</Btn><Btn className="flex-1" onClick={save} disabled={dur <= 0}>Save activity</Btn></div>}>
      <div className="space-y-4 pt-1">
        <div className="flex gap-2">{(['Walking', 'Running'] as const).map((a) => <Chip key={a} on={type === a} onClick={() => setType(a)} className="flex-1">{a}</Chip>)}</div>
        <div><Label className="mb-1">Date & time</Label><button className="flex w-full items-center justify-between rounded-xl border border-black/10 bg-white px-3 py-3 text-left dark:border-white/15 dark:bg-night" onClick={() => setPick(!pick)} aria-expanded={pick}><span>{relDay(date, t)} · {time}</span><span aria-hidden>▾</span></button>
          {pick && <div className="mt-2 space-y-2"><div className="flex gap-2 overflow-x-auto pb-1">{Array.from({ length: 14 }, (_, i) => addDays(t, -i)).map((d) => <Chip key={d} on={date === d} onClick={() => setDate(d)}>{relDay(d, t)}</Chip>)}</div><Input label="Time (24-hour)" type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>}</div>
        <NumInput label="Duration" unit="min" value={dur || ''} onChange={setDur} />
        <NumInput label="Active calories (optional)" unit="kcal" value={kcal || ''} onChange={setKcal} hint={est !== undefined ? `Leave empty to estimate (≈ ${est} kcal)` : 'Log your weight to enable estimates'} />
        <NumInput label="Steps (optional)" value={steps || ''} onChange={setSteps} hint="Added to that day's step total" /><NumInput label="Distance (optional)" unit="km" step={0.1} value={km || ''} onChange={setKm} />
        <Input label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Sheet>
  );
}

/** Monthly steps report: totals, averages, goal hits, best day, streak, and a day-by-day table. */
export function StepsReport({ close }: OP) {
  const t = getToday(); const { profile: p, latestKg } = useProfile(); const stepsOn = useActivity((s) => s.stepsOn); const logs = useActivity((s) => s.logs); const days = useActivity((s) => s.days);
  const [m, setM] = useState({ y: parseYmd(t).getFullYear(), mo: parseYmd(t).getMonth() }); void logs; void days;
  const nav = (d: number) => { const x = new Date(m.y, m.mo + d, 1); setM({ y: x.getFullYear(), mo: x.getMonth() }); };
  const cur = m.y === parseYmd(t).getFullYear() && m.mo === parseYmd(t).getMonth(); const kg = latestKg();
  const dim = new Date(m.y, m.mo + 1, 0).getDate(); const all = Array.from({ length: dim }, (_, i) => `${m.y}-${String(m.mo + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`).filter((d) => d <= t);
  const rows = all.map((d) => { const s = stepsOn(d); return { d, s, km: stepsToKm(s, p.heightCm), kcal: kcalBurned({ kg, steps: s, heightCm: p.heightCm }) }; });
  const active = rows.filter((r) => r.s > 0); const total = rows.reduce((a, r) => a + r.s, 0); const avg = active.length ? total / active.length : 0;
  const hit = rows.filter((r) => r.s >= p.stepsGoal).length; const best = active.reduce((a, r) => (r.s > (a?.s ?? 0) ? r : a), undefined as (typeof rows)[0] | undefined);
  let run = 0, longest = 0; rows.forEach((r) => { if (r.s >= p.stepsGoal) longest = Math.max(longest, ++run); else run = 0; });
  const prev = (() => { const x = new Date(m.y, m.mo - 1, 1); const n = new Date(x.getFullYear(), x.getMonth() + 1, 0).getDate(); const v = Array.from({ length: n }, (_, i) => stepsOn(`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)).filter((q) => q > 0); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; })();
  const delta = prev ? ((avg - prev) / prev) * 100 : null; const burn = rows.reduce((a, r) => a + (r.kcal ?? 0), 0);
  return (
    <Sheet variant="full" onClose={close} caption="Steps" title="Steps report" subtitle={`${MONTHS[m.mo]} ${m.y}`} footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1" onClick={close}>Close</Btn><Btn className="flex-1" onClick={() => window.print()}>Print / save PDF</Btn></div>}>
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between"><IconBtn n="left" label="Previous month" onClick={() => nav(-1)} /><b>{MONTHS[m.mo]} {m.y}</b><IconBtn n="right" label="Next month" onClick={() => nav(1)} className={cur ? 'pointer-events-none opacity-30' : ''} /></div>
        <Card><Label>Summary</Label><p className="mt-1 text-sm">{active.length ? `You walked ${total.toLocaleString()} steps over ${active.length} active day${active.length > 1 ? 's' : ''}, averaging ${Math.round(avg).toLocaleString()} per day and reaching your ${p.stepsGoal.toLocaleString()}-step goal on ${hit} day${hit === 1 ? '' : 's'}.` : 'No steps logged this month yet.'}{delta !== null && active.length > 0 && ` That is ${Math.abs(Math.round(delta))}% ${delta >= 0 ? 'more' : 'fewer'} per day than last month.`}</p></Card>
        <div className="grid grid-cols-2 gap-2">{[['Total steps', total.toLocaleString()], ['Daily average', Math.round(avg).toLocaleString()], ['Goal hit', `${hit}/${rows.length} days`], ['Best day', best ? `${best.s.toLocaleString()} · ${shortDate(best.d)}` : '–'], ['Distance', `${stepsToKm(total, p.heightCm).toFixed(1)} km`], ['Longest goal streak', `${longest} day${longest === 1 ? '' : 's'}`]].map(([l, v]) => <Card key={l} className="!p-3"><Label>{l}</Label><b className="break-words tabular">{v}</b></Card>)}</div>
        {kg ? <Card className="!p-3"><Label>Estimated calories burned</Label><b className="tabular text-kcal-ink dark:text-kcal">{burn.toLocaleString()} kcal</b></Card> : <p className="rounded-2xl bg-orange-50 p-3 text-xs text-orange-900">Log your weight in Progress to include estimated calories burned.</p>}
        <Card><Label className="mb-2">Day by day</Label><table className="w-full text-sm tabular"><thead><tr className="text-left text-[11px] text-ink-3"><th className="pb-1">Date</th><th>Steps</th><th>Km</th><th>Goal</th></tr></thead><tbody>{rows.map((r) => <tr key={r.d} className="border-t border-black/5 dark:border-white/10"><td className="py-1.5">{longDate(r.d)}</td><td className="font-semibold">{r.s ? r.s.toLocaleString() : '–'}</td><td>{r.s ? r.km.toFixed(1) : '–'}</td><td className={cx('font-bold', r.s >= p.stepsGoal ? 'text-green-600' : 'text-ink-3')}>{r.s >= p.stepsGoal ? '✓' : r.s ? `${Math.round((r.s / p.stepsGoal) * 100)}%` : '–'}</td></tr>)}</tbody></table></Card>
        <p className="text-center text-[11px] text-ink-3">SELF-REPORTED ESTIMATES</p>
      </div>
    </Sheet>
  );
}
