import { useState } from 'react';
import { Sheet, Btn, Card, Label, IconBtn, cx } from '@/components/ui';
import { useTraining, ROUTINE_COLORS } from '@/store/training';
import { useUI, today as getToday } from '@/store/ui';
import { DOW_FULL, MONTHS, monthGrid, parseYmd, monIdx } from '@/lib/date';
import type { PlanDay } from '@/types';
import type { OP } from '@/components/Overlays';

const REST_C = '#6b7a72';
/** The planner is only a map (spec): nothing starts from it and today's plan shows nowhere else. */
export function Planner({ close }: OP) {
  const { plan, routines, setPlanDay, ex } = useTraining(); const open = useUI((s) => s.open); const t = getToday(); const todayI = monIdx(t);
  const [tab, setTab] = useState<'week' | 'cal'>('week'); const [edit, setEdit] = useState<number | null>(null); const [m, setM] = useState({ y: parseYmd(t).getFullYear(), mo: parseYmd(t).getMonth() });
  // distinct colour per custom list: derived from first free palette slot, no repeats with routines
  const used = new Set(routines.map((r) => r.color)); const free = ROUTINE_COLORS.filter((c) => !used.has(c));
  const customColor = (i: number) => free[plan.slice(0, i).filter((p) => p?.kind === 'custom').length % Math.max(1, free.length)] ?? '#888';
  const info = (p: PlanDay, i: number) => { if (!p) return { label: 'Not set', sub: 'Tap to assign', color: '' }; if (p.kind === 'rest') return { label: 'Rest day', sub: '', color: REST_C, short: 'Rest' };
    if (p.kind === 'routine') { const r = routines.find((x) => x.id === p.routineId); return { label: r?.name ?? 'Routine', sub: r?.desc ?? '', color: r?.color ?? '#888', short: r?.name ?? '' }; }
    return { label: `${p.exerciseIds.length} exercises`, sub: p.exerciseIds.map((e) => ex(e)?.name).join(', '), color: customColor(i), short: `${p.exerciseIds.length} ex` }; };
  const grid = monthGrid(m.y, m.mo, 1); const nav = (d: number) => { const x = new Date(m.y, m.mo + d, 1); setM({ y: x.getFullYear(), mo: x.getMonth() }); };
  return (
    <Sheet variant="full" onClose={close} title="Workout Plan">
      <div role="tablist" aria-label="Plan view" className="mb-3 flex rounded-full bg-black/5 p-1 dark:bg-white/10">{([['week', 'MY WEEK'], ['cal', 'CALENDAR']] as const).map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('min-h-[40px] flex-1 rounded-full font-mono text-xs font-bold tracking-widest', tab === k ? 'bg-brand-600 text-white' : 'text-ink-2 dark:text-white/70')}>{l}</button>)}</div>
      {tab === 'week' ? (<><Label className="mb-2">Your weekly split · repeats every week</Label>
        <ul className="space-y-2">{plan.map((p, i) => { const f = info(p, i); return (<li key={i}><button onClick={() => setEdit(i)} className={cx('flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-card dark:bg-night-card', i === todayI && 'ring-2 ring-kcal')}><i className="h-10 w-1.5 shrink-0 rounded-full" style={{ background: f.color || 'rgba(120,120,120,.3)' }} /><span className="min-w-0 flex-1"><span className="block font-mono text-[11px] font-bold uppercase tracking-widest text-ink-3 dark:text-white/55">{DOW_FULL[(i + 1) % 7]}</span><span className="block break-words font-bold">{f.label}</span>{f.sub && <span className="block break-words text-xs text-ink-2 dark:text-white/60">{f.sub}</span>}</span></button></li>); })}</ul></>) : (<>
        <div className="mb-2 flex items-center justify-between"><IconBtn n="left" label="Previous month" onClick={() => nav(-1)} /><b>{MONTHS[m.mo]} {m.y}</b><IconBtn n="right" label="Next month" onClick={() => nav(1)} /></div>
        <Card><div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-ink-3">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}</div><div className="mt-1 grid grid-cols-7 gap-1">{grid.map((d, i) => { if (!d) return <span key={i} />; const wi = monIdx(d); const f = info(plan[wi], wi); return <div key={d} className={cx('flex h-14 flex-col items-center justify-start rounded-xl pt-1 text-sm', d === t && 'ring-2 ring-kcal')}><span className="font-semibold">{parseYmd(d).getDate()}</span>{plan[wi] && <><i className="mt-0.5 h-1 w-6 rounded-full" style={{ background: f.color }} /><span className="max-w-full truncate px-0.5 text-[9px] font-bold" style={{ color: f.color }}>{f.short}</span></>}</div>; })}</div></Card>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs">{[...routines.map((r) => [r.name, r.color]), ['Rest', REST_C]].map(([n, c]) => <li key={n} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />{n}</li>)}</ul>
        <p className="mt-3 text-center text-xs text-ink-3 dark:text-white/50">Auto-filled from your weekly split. Change it in My Week.</p></>)}
      {edit !== null && (
        <Sheet variant="center" onClose={() => setEdit(null)} title={`Every ${DOW_FULL[(edit + 1) % 7]}`} subtitle="Changes the recurring weekly split">
          <div className="space-y-2 pt-1"><Btn v="outline" block onClick={() => { setPlanDay(edit, { kind: 'rest' }); setEdit(null); }}>Rest day</Btn>
            <Label className="pt-2">Your routines — assign to every {DOW_FULL[(edit + 1) % 7]}</Label>
            <ul className="max-h-48 space-y-1.5 overflow-y-auto">{routines.map((r) => <li key={r.id}><button onClick={() => { setPlanDay(edit, { kind: 'routine', routineId: r.id }); setEdit(null); }} className="flex w-full items-center gap-2 rounded-xl bg-black/5 p-3 text-left dark:bg-white/10"><i className="h-3 w-3 rounded-full" style={{ background: r.color }} /><span className="font-semibold">{r.name}</span></button></li>)}</ul>
            <Btn v="outline" block onClick={() => { const i = edit; setEdit(null); open('picker', { title: 'Choose exercises', onDone: (ids: string[]) => setPlanDay(i, { kind: 'custom', exerciseIds: ids }) }); }}>Choose exercises</Btn>
            {plan[edit] && <Btn v="ghost" block className="!text-red-600" onClick={() => { setPlanDay(edit, null); setEdit(null); }}>Clear day</Btn>}</div></Sheet>)}
    </Sheet>
  );
}
