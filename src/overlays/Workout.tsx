import { useMemo, useState } from 'react';
import { Sheet, Btn, Chip, Label, IconBtn, Empty, cx } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { useTraining, READY_MADE } from '@/store/training';
import { useUI, today as getToday } from '@/store/ui';
import { addDays, mondayOf, monIdx, longDate, DOW, parseYmd, fmtClock, uid } from '@/lib/date';
import { FREQ_GROUPS, freqGroup } from '@/data/muscles';
import { metricOf } from '@/lib/exfields';
import type { Routine } from '@/types';
import type { OP } from '@/components/Overlays';

const darkCard = 'rounded-3xl bg-night-card p-4';
function streak(dates: Set<string>, t: string) { let s = 0; let d = dates.has(t) ? t : addDays(t, -1); while (dates.has(d)) { s++; d = addDays(d, -1); } return s; }

/** Front-view body: each region is lit when that muscle bucket was trained this week. */
function Body({ lit }: { lit: Set<string> }) {
  const f = (g: string) => (lit.has(g) ? '#f97316' : '#2a3430');
  return (
    <svg viewBox="0 0 120 240" className="mx-auto h-56" role="img" aria-label={`Muscles trained this week: ${[...lit].join(', ') || 'none'}`}>
      <circle cx="60" cy="18" r="13" fill="#2a3430" />
      <path d="M36 40q24-8 48 0l4 12q-8 6-8 6H40q0 0-8-6z" fill={f('Shoulders')} />
      <path d="M42 56h36v24q-18 8-36 0z" fill={f('Chest')} />
      <path d="M44 82h32v34q-16 6-32 0z" fill={f('Core')} />
      <path d="M26 46l10 4 2 40-12 2z M94 46l-10 4-2 40 12 2z" fill={f('Arms')} />
      <path d="M44 120h32l-3 60H47z" fill={f('Legs')} /><path d="M47 182h26l-2 46H49z" fill={f('Calves')} />
    </svg>
  );
}

export function WorkoutScreen({ close }: OP) {
  const { routines, history, start, active, ex, plan } = useTraining(); const open = useUI((s) => s.open); const t = getToday();
  const [tab, setTab] = useState<'dash' | 'progress' | 'history'>('dash'); const [cat, setCat] = useState('ALL');
  const dates = useMemo(() => new Set(history.map((h) => h.date)), [history]); const mon = mondayOf(t); const week = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
  const thisWeek = history.filter((h) => h.date >= mon && h.date <= addDays(mon, 6)); const st = streak(dates, t);
  const cats = ['ALL', ...new Set([...routines.map((r) => r.category.toUpperCase()), 'CARDIO'])];
  const go = (id?: string) => { if (active) { open('activeWorkout'); return; } start(id); open('activeWorkout'); };

  const prog = useMemo(() => {
    const lit = new Set<string>(); const freq: Record<string, number> = {}; const per: Record<string, { sessions: number; volume: number; reps: number; sec: number; km: number }> = {};
    thisWeek.forEach((w) => { const groups = new Set(Object.keys(w.muscles).map(freqGroup)); groups.forEach((g) => { lit.add(g); freq[g] = (freq[g] ?? 0) + 1; }); w.sessionsByExercise.forEach((s) => { const x = (per[s.exerciseId] ??= { sessions: 0, volume: 0, reps: 0, sec: 0, km: 0 }); x.sessions++; x.volume += s.volume; x.reps += s.reps; x.sec += s.sec; x.km += s.km; }); });
    const top = Object.entries(per).sort((a, b) => b[1].sessions - a[1].sessions || b[1].volume - a[1].volume)[0];
    return { lit, freq, top, vol: thisWeek.reduce((a, w) => a + w.volume, 0), records: thisWeek.reduce((a, w) => a + w.records, 0) };
  }, [thisWeek]);

  return (
    <Sheet variant="full" dark onClose={close} title="Workout" trailing={undefined}>
      <div role="tablist" aria-label="Workout sections" className="mb-3 flex gap-1 rounded-full bg-night-card p-1">{([['dash', 'Dashboard'], ['progress', 'Progress'], ['history', 'History']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('min-h-[40px] flex-1 rounded-full text-sm font-semibold', tab === k ? 'bg-brand-600 text-white' : 'text-white/70')}>{l}</button>)}</div>

      {tab === 'dash' && (<div className="space-y-3">
        <section className={darkCard}><div className="flex items-center justify-between"><div><Label className="!text-white/50">Streak status</Label><p className="text-2xl font-extrabold">{st ? `${st} day${st > 1 ? 's' : ''}` : 'No streak'}</p></div><Icon n="flame" className={st ? 'text-kcal' : 'text-white/30'} size={28} /></div>
          <Label className="mb-1 mt-3 !text-white/50">This week</Label><ol className="grid grid-cols-7 gap-1.5">{week.map((d, i) => <li key={d} aria-label={`${longDate(d)}${dates.has(d) ? ', trained' : ''}`} className={cx('rounded-xl py-2 text-center text-[11px] font-bold', dates.has(d) ? 'bg-brand-600' : 'bg-white/10', d === t && 'ring-2 ring-kcal')}>{DOW[(i + 1) % 7].slice(0, 1)}<br />{parseYmd(d).getDate()}</li>)}</ol></section>
        <Btn v="dark" block className="!bg-night-card" onClick={() => open('planner')}><span className="font-mono tracking-[0.18em]">WORKOUT PLANNER</span></Btn>
        <Btn block className="!min-h-[56px] font-mono tracking-wider" onClick={() => go()}>{active ? 'RESUME WORKOUT' : '+ START EMPTY WORKOUT'}</Btn>
        <div className="flex items-center justify-between pt-1"><h3 className="text-lg font-bold">Your Routines</h3><Btn className="!min-h-[36px] !px-3 font-mono" onClick={() => open('newRoutine')}>+ NEW ROUTINE</Btn></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{cats.map((c) => <Chip key={c} on={cat === c} onClick={() => setCat(c)}>{c}</Chip>)}</div>
        {routines.length === 0 && <Empty icon="dumbbell" title="No routines" text="Tap + NEW ROUTINE to restore Push / Pull / Legs or build your own." />}
        <ul className="space-y-2">{routines.filter((r) => cat === 'ALL' || r.category.toUpperCase() === cat).map((r) => (
          <li key={r.id} className={cx(darkCard, 'flex items-center gap-3')}><button className="min-w-0 flex-1 text-left" onClick={() => open('routineEditor', { id: r.id })} aria-label={`Edit routine ${r.name}`}><p className="text-lg font-extrabold" style={{ color: r.color }}>{r.name}</p><p className="break-words text-sm text-white/65">{r.desc}</p><p className="mt-1 text-xs text-white/45">{r.main.length} exercises</p></button>
            <IconBtn n="dots" label={`Edit ${r.name}`} onClick={() => open('routineEditor', { id: r.id })} className="text-white/70" /><button aria-label={`Start ${r.name}`} onClick={() => go(r.id)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-600 text-white active:scale-90"><Icon n="right" size={24} stroke={2.6} /></button></li>))}</ul>
      </div>)}

      {tab === 'progress' && (<div className="space-y-3">
        <div><h3 className="text-lg font-bold">Workout Progress</h3><p className="text-sm text-white/60">This week &middot; {thisWeek.length} session{thisWeek.length === 1 ? '' : 's'}</p></div>
        <section className={darkCard}><Body lit={prog.lit} /></section>
        <section className={darkCard}><Label className="!text-white/50">Most trained this week</Label>{prog.top ? (() => { const e = ex(prog.top[0]); return <><p className="text-xl font-extrabold">{e?.name ?? 'Exercise'}</p><p className="text-sm text-white/65">{e?.primary} &middot; {prog.top[1].sessions} session{prog.top[1].sessions > 1 ? 's' : ''} &middot; {metricOf(e, prog.top[1]).label}</p></>; })() : <p className="py-2 text-white/60">Finish a workout to see this.</p>}</section>
        <section className={darkCard}><Label className="mb-2 !text-white/50">Weekly frequency</Label><ul className="space-y-2">{FREQ_GROUPS.map((g) => { const n = prog.freq[g] ?? 0; return <li key={g} className="flex items-center gap-3 text-sm"><span className="w-20">{g}</span><span className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-brand-500" style={{ width: `${Math.min(1, n / 4) * 100}%` }} /></span><b className="w-8 text-right tabular">{n}&times;</b></li>; })}</ul></section>
        <div className="grid grid-cols-2 gap-3"><section className={darkCard}><Label className="!text-white/50">Volume</Label><p className="text-2xl font-extrabold tabular">{Math.round(prog.vol).toLocaleString()} kg</p></section><section className={darkCard}><Label className="!text-white/50">Records</Label><p className="text-2xl font-extrabold tabular">{prog.records}</p>{!prog.records && <p className="text-xs text-white/50">Log a workout with weight to set personal records.</p>}</section></div>
        <section className={darkCard}><Label className="mb-2 !text-white/50">Sessions per day</Label><ol className="grid grid-cols-7 gap-1.5 text-center">{week.map((d, i) => <li key={d}><span className="text-[11px] text-white/60">{DOW[(i + 1) % 7].slice(0, 3)}</span><b className="mt-1 block rounded-lg bg-white/10 py-1.5 tabular">{thisWeek.filter((w) => w.date === d).length}</b></li>)}</ol></section>
      </div>)}

      {tab === 'history' && (history.length === 0 ? <Empty icon="clock" title="No workouts yet" text="Finished workouts appear here." /> : <ul className="space-y-2">{history.map((h) => (
        <li key={h.id} className={darkCard}><p className="break-words text-lg font-extrabold">{h.name}</p><p className="text-xs text-white/50">{longDate(h.date)}</p><dl className="mt-3 grid grid-cols-3 gap-2 text-center">{[['Time', fmtClock(h.durationSec)], ['Volume', `${Math.round(h.volume).toLocaleString()} kg`], ['Records', String(h.records)]].map(([l, v]) => <div key={l} className="rounded-xl bg-white/5 p-2"><dt className="font-mono text-[10px] uppercase tracking-widest text-white/50">{l}</dt><dd className="font-bold tabular">{v}</dd></div>)}</dl></li>))}</ul>)}
    </Sheet>
  );
}

export function NewRoutine({ close }: OP) {
  const { addRoutine, restoreDefaults } = useTraining(); const open = useUI((s) => s.open); const say = useUI.getState().say;
  const blank = (): Omit<Routine, 'id'> => ({ name: 'New routine', desc: '', category: 'Custom', color: '#16a34a', warmup: [], main: [], cooldown: [] });
  const opts: [string, string, () => void][] = [
    ['Create your own routine', 'Start from a blank list', () => { const id = addRoutine(blank()); close(); open('routineEditor', { id }); }],
    ['Explore routines', 'Ready-made plans', () => { close(); open('explore'); }],
    ['Restore default routines', 'Push, Pull & Legs', () => { restoreDefaults(); say('Default routines restored'); close(); }],
    ['Add new exercise', 'With photos', () => { close(); open('customExercise', {}); }],
    ['Workout Planner', 'Plan your week', () => { close(); open('planner'); }],
  ];
  return (<Sheet onClose={close} title="How do you want to start?" footer={<Btn v="ghost" block onClick={close}>CANCEL</Btn>}><ul className="space-y-2 pt-1">{opts.map(([t, s, f]) => <li key={t}><button onClick={f} className="w-full rounded-2xl bg-white p-4 text-left shadow-card active:scale-[.98] dark:bg-night-card"><p className="font-bold">{t}</p><p className="text-sm text-ink-2 dark:text-white/60">{s}</p></button></li>)}</ul></Sheet>);
}
export function Explore({ close }: OP) {
  const { addRoutine } = useTraining(); const { ex } = useTraining.getState();
  return (<Sheet onClose={close} title="Explore routines" subtitle="Tap to add to Your Routines"><ul className="space-y-2 pt-1">{READY_MADE.map((r) => <li key={r.name}><button className="w-full rounded-2xl bg-white p-4 text-left shadow-card dark:bg-night-card" onClick={() => { addRoutine({ ...r, main: r.main.map((m) => ({ ...m, uid: uid() })) }); useUI.getState().say(`${r.name} added`); close(); }}><p className="text-lg font-extrabold" style={{ color: r.color }}>{r.name}</p><p className="text-sm text-ink-2 dark:text-white/60">{r.desc}</p><p className="mt-1 break-words text-xs text-ink-3">{r.main.map((m) => ex(m.exerciseId)?.name).join(' \u00b7 ')}</p></button></li>)}</ul></Sheet>);
}
void monIdx;
