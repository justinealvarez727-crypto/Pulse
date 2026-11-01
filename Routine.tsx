import { useEffect, useMemo, useState } from 'react';
import { Sheet, Btn, Chip, Label, IconBtn, Input, Bar, cx, inputCls, Toggle, useNumDraft } from '@/components/ui';
import { Icon, ExerciseIcon } from '@/components/Icons';
import { useTraining, mkEx, newSet, activeElapsedSec } from '@/store/training';
import { useUI } from '@/store/ui';
import { useNow } from '@/lib/hooks';
import { fieldsFor, unitLabel, FIELD_LABEL, type Field } from '@/lib/exfields';
import { fmtClock, addDays, ymd } from '@/lib/date';
import { kgToLbs, lbsToKg } from '@/lib/calc';
import type { ActiveExercise, Exercise, Routine, RoutineExercise, Section } from '@/types';
import type { OP } from '@/components/Overlays';

const RESTS = [0, 60, 90, 120, 150, 180]; const restLabel = (s: number) => (s === 0 ? 'OFF' : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
const dispKg = (kg: number, u: 'kg' | 'lbs') => (u === 'kg' ? kg : Math.round(kgToLbs(kg) * 10) / 10);
const fromKg = (v: number, u: 'kg' | 'lbs') => (u === 'kg' ? v : Math.round(lbsToKg(v) * 100) / 100);
const tags = (e?: Exercise, sec: Section = 'main') => [sec === 'main' ? 'MAIN' : sec === 'warmup' ? 'WARM-UP' : 'COOL-DOWN', e?.primary, e?.equipment].filter(Boolean) as string[];
function Tags({ e, sec }: { e?: Exercise; sec: Section }) { return <p className="mt-0.5 flex flex-wrap gap-1.5">{tags(e, sec).map((t, i) => <span key={t} className={cx('rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase', i === 0 ? (sec === 'warmup' ? 'bg-orange-500/20 text-orange-300' : sec === 'cooldown' ? 'bg-blue-500/20 text-blue-300' : 'bg-brand-500/20 text-brand-400') : 'bg-white/10 text-white/70')}>{t}</span>)}</p>; }

function NumCell({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string; step?: number }) {
  const [txt, set] = useNumDraft(value, onChange);
  return <input aria-label={label} inputMode="decimal" type="text" value={txt} placeholder="0" onChange={(e) => set(e.target.value)} className="h-11 w-full min-w-0 rounded-lg bg-white/10 text-center text-base font-bold tabular text-white placeholder:text-white/30 focus:outline focus:outline-2 focus:outline-brand-500" />;
}

/* ============ Routine editor ============ */
export function RoutineEditor({ p, close }: OP) {
  const { routines, saveRoutine, deleteRoutine, ex, history } = useTraining(); const open = useUI((s) => s.open); const src = routines.find((r) => r.id === p.id);
  const [r, setR] = useState<Routine | null>(src ? structuredClone(src) : null); const [unit, setUnit] = useState<'kg' | 'lbs'>('kg'); const [menu, setMenu] = useState<string | null>(null); const [newCat, setNewCat] = useState(false); const [cat, setCat] = useState(''); const [confirm, setConfirm] = useState(false);
  if (!r) return null;
  const cats = [...new Set([...routines.map((x) => x.category), r.category])];
  const upd = (sec: Section, u: string, f: (e: RoutineExercise) => RoutineExercise) => setR({ ...r, [sec]: r[sec].map((e) => (e.uid === u ? f(e) : e)) });
  const since = ymd(new Date(Date.now() - 90 * 864e5));
  const stat = (id: string) => { const s = history.filter((h) => h.date >= since).flatMap((h) => h.sessionsByExercise.filter((x) => x.exerciseId === id)); return { vol: s.reduce((a, x) => a + x.volume, 0), reps: s.reduce((a, x) => a + x.reps, 0), sec: s.reduce((a, x) => a + x.sec, 0), n: s.length }; };
  const add = (sec: Section) => open('picker', { title: sec === 'main' ? 'Add Exercise' : sec === 'warmup' ? 'Add Warm-up' : 'Add Cool-down', onDone: (ids: string[]) => setR((cur) => cur && { ...cur, [sec]: [...cur[sec], ...ids.map((i) => mkEx(i))] }) });
  const move = (sec: Section, i: number, d: -1 | 1) => { const a = [...r[sec]]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; setR({ ...r, [sec]: a }); };
  const Sec = ({ sec, label }: { sec: Section; label: string }) => r[sec].length === 0 ? null : (
    <section><Label className="mb-2 !text-white/50">{label} · {r[sec].length} exercise{r[sec].length > 1 ? 's' : ''}</Label>
      <ul className="space-y-3">{r[sec].map((e, i) => { const x = ex(e.exerciseId); const st = stat(e.exerciseId); const fields = fieldsFor(x?.type ?? 'weight_reps', e.target); return (
        <li key={e.uid} className="rounded-3xl bg-night-card p-3">
          <div className="flex items-start gap-3">{x && <ExerciseIcon equipment={x.equipment} />}<div className="min-w-0 flex-1"><p className="break-words font-bold">{x?.name ?? 'Exercise'}</p><Tags e={x} sec={sec} /></div><IconBtn n="dots" label={`Options for ${x?.name}`} className="text-white/70" onClick={() => setMenu(menu === e.uid ? null : e.uid)} /></div>
          {menu === e.uid && <div className="mt-2 space-y-2 rounded-2xl bg-white/5 p-3"><Label className="!text-white/50">Rest timer</Label><div className="flex flex-wrap gap-1.5">{RESTS.map((s) => <Chip key={s} on={e.rest === s} onClick={() => upd(sec, e.uid, (z) => ({ ...z, rest: s }))}>{restLabel(s)}</Chip>)}</div><div className="flex gap-2"><Btn v="ghost" className="flex-1 !text-white" onClick={() => move(sec, i, -1)}>MOVE UP</Btn><Btn v="ghost" className="flex-1 !text-white" onClick={() => move(sec, i, 1)}>MOVE DOWN</Btn></div><Btn v="danger" block onClick={() => setR({ ...r, [sec]: r[sec].filter((z) => z.uid !== e.uid) })}>REMOVE EXERCISE</Btn></div>}
          <dl className="mt-3 grid grid-cols-4 gap-1 text-center text-[11px] text-white/60">{[['Volume', `${Math.round(st.vol)}kg`], ['Reps', st.reps], ['Time', `${Math.round(st.sec / 60)}m`], ['Sessions', st.n]].map(([l, v]) => <div key={l as string}><dt className="font-mono text-[9px] uppercase tracking-wider">{l}</dt><dd className="font-bold text-white">{v}</dd></div>)}</dl>
          <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-widest text-white/40">last 3 months</p>
          <div className="mt-3 flex items-center justify-between text-xs text-white/70"><span className="font-mono tracking-wider">REST {e.rest ? e.rest : 'OFF'} SEC</span>
            {(x?.type ?? '').startsWith('duration') ? null : <div className="flex items-center gap-2 font-mono"><span className="tracking-wider">TARGET</span><button role="switch" aria-checked={e.target === 'time'} aria-label="Target: toggle between weight and reps, or seconds" onClick={() => upd(sec, e.uid, (z) => ({ ...z, target: z.target === 'time' ? 'reps' : 'time' }))} className="rounded-full bg-white/10 px-3 py-1.5 font-bold text-white">{e.target === 'time' ? 'SEC' : `${unit.toUpperCase()}·REPS`}</button></div>}</div>
          <ul className="mt-2 space-y-1.5">{e.sets.map((s, si) => <li key={si} className="flex items-center gap-2"><span className="w-6 text-center font-mono text-xs text-white/50">{si + 1}</span>{fields.map((f: Field) => <div key={f} className="min-w-0 flex-1"><NumCell label={`Set ${si + 1} ${FIELD_LABEL[f]}`} step={f === 'kg' || f === 'km' ? 0.5 : 1} value={f === 'kg' ? dispKg(s.kg, unit) : f === 'time' ? s.sec : s[f === 'reps' ? 'reps' : 'km']} onChange={(n) => upd(sec, e.uid, (z) => ({ ...z, sets: z.sets.map((q, j) => (j === si ? { ...q, ...(f === 'kg' ? { kg: fromKg(n, unit) } : f === 'time' ? { sec: n } : f === 'reps' ? { reps: n } : { km: n }) } : q)) }))} /></div>)}
            <button aria-label={`Remove set ${si + 1}`} onClick={() => upd(sec, e.uid, (z) => ({ ...z, sets: z.sets.filter((_, j) => j !== si) }))} className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-red-400"><Icon n="minus" /></button></li>)}</ul>
          <button onClick={() => upd(sec, e.uid, (z) => ({ ...z, sets: [...z.sets, { ...(z.sets[z.sets.length - 1] ?? newSet()) }] }))} className="mt-2 min-h-[44px] w-full rounded-xl border-2 border-dashed border-white/25 font-mono text-xs font-bold tracking-widest text-white/70">+ ADD SET</button>
        </li>); })}</ul></section>);
  return (
    <Sheet variant="full" dark onClose={close} caption="Routine" title={r.name || 'Routine'} footer={<div className="space-y-2 pb-1"><Btn block onClick={() => { if (!r.name.trim()) return useUI.getState().say('Name your routine'); saveRoutine({ ...r, name: r.name.trim() }); useUI.getState().say('Routine saved'); close(); }} className="font-mono tracking-widest">SAVE ROUTINE</Btn>
      {confirm ? <div className="flex gap-2"><Btn v="ghost" className="flex-1 !text-white" onClick={() => setConfirm(false)}>Keep</Btn><Btn v="danger" className="flex-1" onClick={() => { deleteRoutine(r.id); close(); }}>Yes, delete</Btn></div> : <Btn v="ghost" block className="!text-red-400 font-mono tracking-widest" onClick={() => setConfirm(true)}>DELETE ROUTINE</Btn>}</div>}>
      <div className="space-y-4 pt-1 text-white">
        <Input label="Name" value={r.name} onChange={(e) => setR({ ...r, name: e.target.value })} className="!bg-night-card !text-white" /><Input label="Description" value={r.desc} onChange={(e) => setR({ ...r, desc: e.target.value })} className="!bg-night-card !text-white" />
        <div><Label className="mb-1 !text-white/50">Category</Label><div className="flex gap-2"><select aria-label="Category" value={r.category} onChange={(e) => setR({ ...r, category: e.target.value })} className={cx(inputCls, '!bg-night-card !text-white')}>{cats.map((c) => <option key={c}>{c}</option>)}</select><Btn v="ghost" className="shrink-0 !text-white" onClick={() => setNewCat(!newCat)}>Create category</Btn></div>
          {newCat && <div className="mt-2 flex gap-2"><input aria-label="New category" value={cat} onChange={(e) => setCat(e.target.value)} placeholder="e.g. Upper" className={cx(inputCls, '!bg-night-card !text-white')} /><Btn onClick={() => { if (cat.trim()) { setR({ ...r, category: cat.trim() }); setCat(''); setNewCat(false); } }}>Add</Btn></div>}</div>
        <div className="grid grid-cols-3 gap-2"><Btn onClick={() => add('main')} className="font-mono !px-2 text-xs tracking-wider">+ ADD EXERCISE</Btn><Btn v="orange" onClick={() => add('warmup')} className="font-mono !px-2 text-xs tracking-wider">+ WARM-UP</Btn><Btn v="blue" onClick={() => add('cooldown')} className="font-mono !px-2 text-xs tracking-wider">+ COOL-DOWN</Btn></div>
        <div className="flex items-center justify-between"><Label className="!text-white/50">Exercise analytics · 3 mo</Label><div role="radiogroup" aria-label="Weight unit" className="flex rounded-full bg-white/10 p-1">{(['kg', 'lbs'] as const).map((u) => <button key={u} role="radio" aria-checked={unit === u} onClick={() => setUnit(u)} className={cx('min-h-[32px] rounded-full px-3 font-mono text-xs font-bold', unit === u && 'bg-brand-600')}>{u.toUpperCase()}</button>)}</div></div>
        <Sec sec="warmup" label="WARM-UP" /><Sec sec="main" label="MAIN" /><Sec sec="cooldown" label="COOL-DOWN" />
        {!r.main.length && !r.warmup.length && !r.cooldown.length && <p className="rounded-2xl bg-night-card p-6 text-center text-sm text-white/60">No exercises yet. Tap + ADD EXERCISE.</p>}
      </div>
    </Sheet>
  );
}

/* ============ Active workout ============ */
export function ActiveWorkoutScreen({ close }: OP) {
  const { active: a, ex, history, toggleSet, patchEx, patchSet, addSet, removeSet, removeEx, moveEx, setUnit, patchActive, skipRest, adjustRest, finish, discard, togglePause } = useTraining();
  const open = useUI((s) => s.open); const now = useNow(250); const [menu, setMenu] = useState<string | null>(null); const [dc, setDc] = useState(false); const [fin, setFin] = useState(false);
  const restLeft = a?.rest ? Math.max(0, Math.ceil((a.rest.endsAt - now) / 1000)) : 0;
  useEffect(() => { if (a?.rest && a.rest.endsAt <= Date.now()) skipRest(); }, [a?.rest, now, skipRest]);
  const prev = useMemo(() => { const m: Record<string, number> = {}; for (const h of [...history].reverse()) for (const s of h.sessionsByExercise) m[s.exerciseId] = s.bestKg; return m; }, [history]);
  if (!a) return <Sheet variant="full" dark onClose={close} title="No active workout"><p className="py-10 text-center text-white/60">Start one from the Workout screen.</p></Sheet>;
  const sets = a.exercises.flatMap((e) => e.sets); const done = sets.filter((s) => s.done).length;
  const vol = a.exercises.reduce((t, e) => t + e.sets.filter((s) => s.done).reduce((q, s) => q + s.kg * s.reps, 0), 0);
  const blocked = restLeft > 0;
  const addEx = (section: Section = 'main') => open('picker', { onDone: (ids: string[]) => useTraining.getState().addExercises(ids, section) });
  const doFinish = () => { const f = finish(); close(); if (f) useUI.getState().say(f.records ? `Workout saved · ${f.records} new record${f.records > 1 ? 's' : ''}! 🎉` : 'Workout saved'); };
  const Row = ({ e }: { e: ActiveExercise }) => { const x = ex(e.exerciseId); const fields = fieldsFor(x?.type ?? 'weight_reps', e.target); return (
    <li className="rounded-3xl bg-night-card p-3">
      <div className="flex items-start gap-3">{x && <ExerciseIcon equipment={x.equipment} />}<div className="min-w-0 flex-1"><p className="break-words font-bold">{x?.name}</p><Tags e={x} sec={e.section} /></div><IconBtn n="dots" label={`Options for ${x?.name}`} className="text-white/70" onClick={() => setMenu(menu === e.uid ? null : e.uid)} /></div>
      {menu === e.uid && <div className="mt-2 space-y-2 rounded-2xl bg-white/5 p-3"><Label className="!text-white/50">Rest timer</Label><div className="flex flex-wrap gap-1.5">{RESTS.map((s) => <Chip key={s} on={e.rest === s} onClick={() => patchEx(e.uid, { rest: s })}>{restLabel(s)}</Chip>)}</div><div className="flex gap-2"><Btn v="ghost" className="flex-1 !text-white" onClick={() => moveEx(e.uid, -1)}>MOVE UP</Btn><Btn v="ghost" className="flex-1 !text-white" onClick={() => moveEx(e.uid, 1)}>MOVE DOWN</Btn></div><Btn v="ghost" block className="!text-white" onClick={() => setUnit(a.unit === 'kg' ? 'lbs' : 'kg')}>SWITCH TO {a.unit === 'kg' ? 'LBS' : 'KG'}</Btn><Btn v="danger" block onClick={() => removeEx(e.uid)}>REMOVE EXERCISE</Btn></div>}
      <input aria-label={`Notes for ${x?.name}`} placeholder="Add notes here..." value={e.note} onChange={(ev) => patchEx(e.uid, { note: ev.target.value })} className="mt-2 w-full bg-transparent text-sm text-white/80 placeholder:text-white/35 focus:outline-none" />
      <p className="font-mono text-[10px] tracking-wider text-white/50">REST {e.rest ? `${e.rest} SEC` : 'OFF'}</p>
      <div className="mt-2 grid items-center gap-1.5 text-center font-mono text-[10px] tracking-wider text-white/50" style={{ gridTemplateColumns: `2rem 3.5rem repeat(${fields.length}, 1fr) 2.75rem` }}><span>SET</span><span>PREVIOUS</span>{fields.map((f) => <span key={f}>{unitLabel(f, a.unit)}</span>)}<span aria-hidden>✓</span></div>
      <ul className="mt-1 space-y-1.5">{e.sets.map((s, i) => (<li key={i} className={cx('grid items-center gap-1.5 rounded-xl p-1', s.done && 'bg-brand-600/25')} style={{ gridTemplateColumns: `2rem 3.5rem repeat(${fields.length}, 1fr) 2.75rem` }}><span className="text-center font-mono text-xs">{i + 1}</span><span className="text-center text-[11px] text-white/45">{prev[e.exerciseId] ? `${Math.round(a.unit === 'kg' ? prev[e.exerciseId] : kgToLbs(prev[e.exerciseId]))}${a.unit}` : '—'}</span>
        {fields.map((f) => <NumCell key={f} label={`Set ${i + 1} ${FIELD_LABEL[f]}`} step={f === 'kg' || f === 'km' ? 0.5 : 1} value={f === 'kg' ? s.kg : f === 'time' ? s.sec : s[f === 'reps' ? 'reps' : 'km']} onChange={(n) => patchSet(e.uid, i, f === 'kg' ? { kg: n } : f === 'time' ? { sec: n } : f === 'reps' ? { reps: n } : { km: n })} />)}
        <button role="checkbox" aria-checked={s.done} aria-label={`Set ${i + 1} done`} disabled={blocked && !s.done} onClick={() => { if (!toggleSet(e.uid, i)) useUI.getState().say('Finish or skip the rest timer first'); }} className={cx('grid h-11 w-11 place-items-center rounded-xl transition', s.done ? 'bg-brand-600 text-white' : 'bg-white/10 text-white/40', blocked && !s.done && 'opacity-30')}><Icon n="check" stroke={3} /></button></li>))}</ul>
      <div className="mt-2 grid grid-cols-2 gap-2"><button onClick={() => addSet(e.uid)} className="min-h-[44px] rounded-xl border-2 border-dashed border-white/25 font-mono text-xs font-bold tracking-widest text-white/70">+ ADD SET</button><button onClick={() => removeSet(e.uid)} className="min-h-[44px] rounded-xl border-2 border-dashed border-white/25 font-mono text-xs font-bold tracking-widest text-white/70">– SET</button></div>
    </li>); };
  return (
    <Sheet variant="full" dark onClose={close} caption="Active workout" title={`${fmtClock(activeElapsedSec(a, now))} · ${done}/${sets.length} sets`} trailing={<Btn className="!min-h-[40px] !px-4" onClick={() => setFin(true)}>Finish</Btn>}
      footer={restLeft > 0 && a.rest ? (
        <div className="pb-1" role="timer" aria-label="Rest timer"><div className="mb-2 flex items-center justify-between"><p className="font-mono text-4xl font-extrabold tabular">{fmtClock(restLeft)}</p><div className="flex gap-2"><Btn v="ghost" className="!text-white" onClick={() => adjustRest(-15)}>−15</Btn><Btn v="ghost" className="!text-white" onClick={() => adjustRest(15)}>+15</Btn><Btn onClick={skipRest}>SKIP</Btn></div></div><Bar pct={1 - restLeft / a.rest.total} label="Rest progress" /></div>) : undefined}>
      <div className="space-y-3 pt-1 text-white">
        <section className="rounded-3xl bg-night-card p-4"><div className="flex items-center gap-2"><div className="min-w-0 flex-1"><input aria-label="Workout name" value={a.name} onChange={(e) => patchActive({ name: e.target.value })} className="w-full bg-transparent text-xl font-extrabold focus:outline-none" /><input aria-label="Workout note" placeholder="Add a workout note" value={a.note} onChange={(e) => patchActive({ note: e.target.value })} className="w-full bg-transparent text-sm text-white/70 placeholder:text-white/35 focus:outline-none" /></div>
          <button aria-label={a.pausedAt ? 'Resume timer' : 'Pause timer'} onClick={togglePause} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-water text-white"><Icon n={a.pausedAt ? 'play' : 'pause'} /></button></div>
          <div className="mt-3 flex items-center justify-between"><div><Label className="!text-white/50">Progress</Label><p className="font-bold tabular">{done}/{sets.length} · {Math.round(a.unit === 'kg' ? vol : vol)} {a.unit.toUpperCase()}</p></div>
            <div role="radiogroup" aria-label="Weight unit" className="flex rounded-full bg-white/10 p-1">{(['kg', 'lbs'] as const).map((u) => <button key={u} role="radio" aria-checked={a.unit === u} onClick={() => setUnit(u)} className={cx('min-h-[32px] rounded-full px-3 font-mono text-xs font-bold', a.unit === u && 'bg-brand-600')}>{u.toUpperCase()}</button>)}</div></div></section>
        <Btn block onClick={() => addEx()} className="font-mono tracking-widest">+ ADD EXERCISE</Btn>
        <ul className="space-y-3">{a.exercises.map((e) => <Row key={e.uid} e={e} />)}</ul>
        {dc ? <div className="flex gap-2"><Btn v="ghost" className="flex-1 !text-white" onClick={() => setDc(false)}>Keep going</Btn><Btn v="danger" className="flex-1" onClick={() => { discard(); close(); }}>Yes, discard</Btn></div> : <Btn v="ghost" block className="!text-red-400 font-mono tracking-widest" onClick={() => setDc(true)}>DISCARD WORKOUT</Btn>}
      </div>
      {fin && <Sheet variant="center" dark onClose={() => setFin(false)} title="Finish workout?" subtitle={`${done} of ${sets.length} sets done. Unchecked sets aren't saved.`} footer={<div className="flex gap-2 pb-1"><Btn v="ghost" className="flex-1 !text-white" onClick={() => setFin(false)}>Back</Btn><Btn className="flex-1" onClick={doFinish}>Save workout</Btn></div>}><p className="py-2 text-sm text-white/70">Time {fmtClock(activeElapsedSec(a, now))} · Volume {Math.round(vol)} {a.unit}</p></Sheet>}
    </Sheet>
  );
}
void addDays; void ymd; void Toggle; void mkEx;
