import { useMemo, useRef, useState } from 'react';
import { motion, type PanInfo } from 'framer-motion';
import { useUI, today as getToday } from '@/store/ui';
import { useProfile } from '@/store/profile';
import { useNutrition, effective } from '@/store/nutrition';
import { useFasting, PRESETS } from '@/store/fasting';
import { useActivity } from '@/store/activity';
import { useTraining } from '@/store/training';
import { Icon } from '@/components/Icons';
import { Bar, Card, Chip, Label, Ring, WaveFill, Btn, IconBtn, cx } from '@/components/ui';
import { addDays, fmtHM, monIdx, relDay, shortDate, hhmm, longDate } from '@/lib/date';
import { stepsToKm, kcalBurned } from '@/lib/calc';
import { useNow } from '@/lib/hooks';
import { MEAL_SLOTS, type Macros, type Meal } from '@/types';

const n0 = (n: number) => Math.round(n).toLocaleString();

/** value | remaining | over-by — the three display modes of every dashboard number (spec). */
function show(eaten: number, goal: number, flip: boolean, unit = '') {
  if (!flip) return { big: n0(eaten) + unit, sub: `of ${n0(goal)}${unit}`, pct: goal ? eaten / goal : 0, over: false };
  const rem = goal - eaten;
  return rem >= 0 ? { big: n0(rem) + unit, sub: 'remaining', pct: goal ? rem / goal : 0, over: false } : { big: n0(-rem) + unit, sub: 'over by', pct: 1, over: true };
}

export default function Today() {
  const { date, setDate, open, flip, setFlip } = useUI();
  const today = getToday();
  const { profile: p, kcalGoalFor, weights } = useProfile();
  const meals = useNutrition((s) => s.meals); const water = useNutrition((s) => s.water[date] ?? 0);
  const dayMeals = useMemo(() => meals.filter((m) => m.date === date).sort((a, b) => a.time.localeCompare(b.time)), [meals, date]);
  const t = useMemo(() => dayMeals.map(effective).reduce<Macros>((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, f: a.f + m.f, c: a.c + m.c, fiber: a.fiber + m.fiber, sugar: a.sugar + m.sugar, sodium: a.sodium + m.sodium, chol: a.chol + m.chol }), { kcal: 0, p: 0, f: 0, c: 0, fiber: 0, sugar: 0, sodium: 0, chol: 0 }), [dayMeals]);
  const goal = kcalGoalFor(monIdx(date));
  const k = show(t.kcal, goal, flip); const w = show(water, p.waterGoal, flip, ' mL');
  const [page, setPage] = useState(0); const pager = useRef<HTMLDivElement>(null);

  const swipe = (_: unknown, i: PanInfo) => { if (Math.abs(i.offset.x) < 70) return; setDate(addDays(date, i.offset.x < 0 ? 1 : -1)); };

  const share = async () => {
    const txt = `${longDate(date)} — ${n0(t.kcal)}/${n0(goal)} kcal · P ${n0(t.p)}g · C ${n0(t.c)}g · F ${n0(t.f)}g · water ${n0(water)} mL`;
    try { if (navigator.share) await navigator.share({ text: txt }); else { await navigator.clipboard.writeText(txt); useUI.getState().say('Summary copied'); } } catch { /* cancelled */ }
  };

  const macros: { key: keyof Macros; label: string; unit: string; color: string; on: boolean }[] = [
    { key: 'p', label: 'Protein', unit: 'g', color: '#16a34a', on: true }, { key: 'f', label: 'Fats', unit: 'g', color: '#eab308', on: true },
    { key: 'c', label: 'Carbs', unit: 'g', color: '#3b82f6', on: true }, { key: 'fiber', label: 'Fiber', unit: 'g', color: '#a855f7', on: p.track.fiber },
  ];
  const micros: typeof macros = [
    { key: 'sugar', label: 'Sugar', unit: 'g', color: '#ec4899', on: p.track.sugar }, { key: 'sodium', label: 'Sodium', unit: 'mg', color: '#0891b2', on: p.track.sodium }, { key: 'chol', label: 'Cholesterol', unit: 'mg', color: '#ca8a04', on: p.track.chol },
  ];
  const mainMacros = macros.filter((m) => m.on); const microList = micros.filter((m) => m.on);
  const pages = microList.length ? 2 : 1;

  return (
    <div className="space-y-4 px-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center gap-1">
        <IconBtn n="left" label="Previous day" onClick={() => setDate(addDays(date, -1))} />
        <div className="min-w-0 flex-1 text-center" aria-live="polite">
          <h1 className="text-2xl font-extrabold leading-tight">{relDay(date, today)}</h1>
          <p className="text-sm text-ink-2 dark:text-white/60">{date === today ? 'Stay on track' : date === addDays(today, -1) ? 'Yesterday' : longDate(date)}</p>
        </div>
        <IconBtn n="right" label="Next day" onClick={() => setDate(addDays(date, 1))} />
        <IconBtn n="share" label="Share today's summary" onClick={share} />
      </header>

      {/* Calorie + water rings; tapping flips ALL numbers between eaten and remaining */}
      <Card className="flex flex-col items-center">
        <button onClick={() => setFlip(!flip)} aria-pressed={flip} aria-label={`${flip ? 'Showing remaining' : 'Showing eaten'}. Tap to switch.`} className="relative grid place-items-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500">
          <Ring size={230} stroke={16} pct={k.pct} color={k.over ? '#dc2626' : '#16a34a'} track="rgba(22,163,74,.14)" />
          <div className="absolute"><Ring size={178} stroke={12} pct={w.pct} color={w.over ? '#dc2626' : '#2563eb'} track="rgba(37,99,235,.14)" /></div>
          <div className="absolute text-center">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-3 dark:text-white/55">{flip ? 'Calories remaining' : 'Calories'}</p>
            <p className={cx('text-4xl font-extrabold tabular', k.over && 'text-red-600')}>{k.over ? `+${k.big}` : k.big}</p>
            <p className="text-xs font-medium text-kcal-ink dark:text-kcal">{k.over ? 'over by' : k.sub} {k.over ? '' : 'kcal'}</p>
            <p className={cx('mt-1 text-xs font-semibold', w.over ? 'text-red-600' : 'text-water-ink dark:text-blue-300')}>{w.over ? `water over by ${w.big}` : `${w.big} ${w.sub}`}</p>
          </div>
        </button>
        <p className="mt-2 text-xs text-ink-3 dark:text-white/50">Tap the ring to switch eaten ⇄ remaining</p>
      </Card>

      {/* Macro cards, swipe for page 2 */}
      <section aria-label="Macros">
        <div ref={pager} onScroll={(e) => { const el = e.currentTarget; setPage(Math.round(el.scrollLeft / el.clientWidth)); }} className="snap-x-p flex gap-3 overflow-x-auto">
          <div className="grid w-full shrink-0 grid-cols-2 gap-3">{mainMacros.map((m) => <MacroCard {...m} eaten={t[m.key]} goal={p.targets[m.key]} flip={flip} />)}</div>
          {microList.length > 0 && <div className="grid w-full shrink-0 gap-3" style={{ gridTemplateColumns: `repeat(${microList.length}, 1fr)` }}>{microList.map((m) => <MacroCard {...m} eaten={t[m.key]} goal={p.targets[m.key]} flip={flip} compact />)}</div>}
        </div>
        {pages > 1 && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex gap-1.5" aria-hidden>{[0, 1].map((i) => <span key={i} className={cx('h-1.5 rounded-full transition-all', page === i ? 'w-5 bg-brand-600' : 'w-1.5 bg-black/20 dark:bg-white/30')} />)}</div>
            <button className="text-xs text-ink-3 dark:text-white/50" onClick={() => pager.current?.scrollTo({ left: page ? 0 : pager.current.clientWidth, behavior: 'smooth' })}>{page === 0 ? 'Swipe ← for sugar · sodium · chol' : 'Swipe → for macros'}</button>
          </div>
        )}
      </section>

      <HydrationCard water={water} goal={p.waterGoal} onOpen={() => open('water', { date })} />
      <div className="grid grid-cols-2 gap-3">
        <FastCard />
        <div className="grid gap-3"><WorkoutCard /></div>
      </div>
      <StepsCard date={date} />

      <section aria-label="Recent logs">
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold">Recent logs</h2><button className="text-sm font-semibold text-brand-700 dark:text-brand-400" onClick={() => open('allLogs')}>View all ›</button></div>
        <RecentLogs meals={[...meals].sort((a, b) => (b.date + b.time).localeCompare(a.date + a.time)).slice(0, 3)} />
      </section>

      <motion.section aria-label="Logged meals" drag="x" dragDirectionLock dragConstraints={{ left: 0, right: 0 }} dragElastic={0.15} onDragEnd={swipe} className="touch-pan-y">
        <h2 className="mb-2 text-lg font-bold">Logged Meals</h2>
        <div className="mb-3 flex gap-2">
          <Btn v="outline" className="flex-1" onClick={() => open('datePick', { mode: 'ahead' })}>Advance log</Btn>
          <Btn v="outline" className="flex-1" onClick={() => open('datePick', { mode: 'back' })}>Backfill</Btn>
        </div>
        <DayCard date={date} meals={dayMeals} totals={t} water={water} />
        <p className="mt-3 text-center text-xs text-ink-3 dark:text-white/50">Swipe → for newer days</p>
      </motion.section>
    </div>
  );
}

function MacroCard({ label, unit, color, eaten, goal, flip, compact }: { label: string; unit: string; color: string; eaten: number; goal: number; flip: boolean; compact?: boolean }) {
  const s = show(eaten, goal, flip);
  return (
    <Card className={compact ? 'p-3' : ''}>
      <Label>{flip ? `${label} remaining` : label}</Label>
      <p className={cx('mt-1 font-extrabold tabular', compact ? 'text-xl' : 'text-2xl', s.over && 'text-red-600')}>{s.big}<span className="ml-0.5 text-sm font-semibold text-ink-3 dark:text-white/55">{unit}</span></p>
      <p className="mb-2 break-words text-xs text-ink-2 dark:text-white/60">{s.over ? 'over by' : s.sub} {s.over ? '' : unit}</p>
      <Bar pct={s.pct} color={s.over ? '#dc2626' : color} label={label} />
    </Card>
  );
}

function HydrationCard({ water, goal, onOpen }: { water: number; goal: number; onOpen: () => void }) {
  return (
    <WaveFill pct={water / goal} color="#2563eb" onClick={onOpen} label={`Daily hydration ${water} of ${goal} millilitres. Open water log`} className="w-full">
      <div className="flex items-center justify-between"><div><Label>Daily Hydration</Label><p className="mt-1 text-3xl font-extrabold tabular text-water-ink dark:text-blue-300">{n0(water)} <span className="text-base font-semibold">mL</span></p></div>
        <div className="text-right"><p className="text-2xl font-bold tabular">{Math.round((water / goal) * 100)}%</p><p className="text-xs text-ink-2 dark:text-white/60">of {n0(goal)} mL</p></div></div>
    </WaveFill>
  );
}

function FastCard() {
  const open = useUI((s) => s.open); const running = useFasting((s) => s.fasts.find((f) => f.status === 'running')); useNow(1000);
  const now = Date.now();
  const rem = running ? running.plannedEnd - now : 0; const extra = running && rem < 0;
  return (
    <WaveFill pct={running ? Math.min(1, (now - running.start) / (running.plannedEnd - running.start)) : 0} color="#f97316" onClick={() => open('fast')} label="Fast" className="min-h-[132px]">
      <Label>Fast</Label>
      <p className="mt-1 text-2xl font-extrabold tabular">{running ? (extra ? `+${fmtHM(-rem)}` : fmtHM(rem)) : '0h 00m'}</p>
      <p className="mt-0.5 break-words text-xs text-ink-2 dark:text-white/60">{running ? (extra ? 'Goal reached · still fasting' : 'remaining') : 'Tap to start fasting'}</p>
    </WaveFill>
  );
}
function WorkoutCard() {
  const open = useUI((s) => s.open); const active = useTraining((s) => s.active);
  return (
    <button onClick={() => open('workout')} aria-label="Open workout" className="flex min-h-[132px] flex-col justify-between rounded-3xl bg-night p-4 text-left text-white shadow-card">
      <div className="flex items-center justify-between"><Label className="!text-white/60">Workout</Label><Icon n="dumbbell" size={18} className="text-brand-400" /></div>
      <div><p className="text-xl font-extrabold">{active ? 'In progress' : 'Train'}</p><p className="text-xs text-white/60">{active ? active.name : 'Routines & history'}</p></div>
    </button>
  );
}
function StepsCard({ date }: { date: string }) {
  const open = useUI((s) => s.open); const stepsOn = useActivity((s) => s.stepsOn); useActivity((s) => s.logs); useActivity((s) => s.days);
  const { profile: p, latestKg } = useProfile(); const steps = stepsOn(date);
  const kg = latestKg(); const kcal = kcalBurned({ kg, steps, heightCm: p.heightCm });
  return (
    <WaveFill pct={steps / p.stepsGoal} color="#16a34a" onClick={() => open('steps', { date })} label={`Steps ${steps} of ${p.stepsGoal}. Open steps`} className="w-full">
      <div className="flex items-center justify-between">
        <div><Label>Steps Today</Label><p className="mt-1 text-3xl font-extrabold tabular">{n0(steps)}</p></div>
        <div className="text-right text-sm text-ink-2 dark:text-white/70"><p>{stepsToKm(steps, p.heightCm).toFixed(2)} km</p>{kcal !== undefined && <p className="text-kcal-ink dark:text-kcal">{kcal} kcal</p>}<p className="text-xs">goal {n0(p.stepsGoal)}</p></div>
      </div>
    </WaveFill>
  );
}

function MacroRow({ m }: { m: Macros }) {
  return (<p className="mt-1 flex flex-wrap gap-x-3 text-xs font-medium"><span className="text-brand-700 dark:text-brand-400">P {n0(m.p)}g</span><span className="text-yellow-700 dark:text-yellow-400">F {n0(m.f)}g</span><span className="text-blue-700 dark:text-blue-300">C {n0(m.c)}g</span></p>);
}
function RecentLogs({ meals }: { meals: Meal[] }) {
  const open = useUI((s) => s.open);
  if (!meals.length) return <Card><p className="py-4 text-center text-sm text-ink-2 dark:text-white/60">Log your first meal with the + button.</p></Card>;
  return (<ul className="space-y-2">{meals.map((m) => { const e = effective(m); return (
    <li key={m.id}><button onClick={() => open('mealDetail', { id: m.id })} className="flex w-full items-start gap-3 rounded-2xl bg-white p-3 text-left shadow-card dark:bg-night-card">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-kcal-soft text-kcal-ink dark:bg-kcal/20"><Icon n="flame" /></span>
      <span className="min-w-0 flex-1"><span className="block break-words font-semibold">{m.name}</span><span className="block break-words text-xs text-ink-2 dark:text-white/60">{m.desc}</span><MacroRow m={e} /></span>
      <span className="text-right"><span className="block font-bold text-kcal-ink dark:text-kcal">{n0(e.kcal)} kcal</span><span className="text-xs text-ink-3 dark:text-white/50">{shortDate(m.date)} · {m.time}</span></span>
    </button></li>); })}</ul>);
}
function DayCard({ date, meals, totals, water }: { date: string; meals: Meal[]; totals: Macros; water: number }) {
  const open = useUI((s) => s.open);
  return (
    <Card>
      <div className="flex items-center justify-between gap-2">
        <div><p className="font-bold">{longDate(date)}</p><p className="text-xs text-ink-2 dark:text-white/60">{meals.length} meal{meals.length === 1 ? '' : 's'} · {n0(water)} mL water</p></div>
        <div className="flex"><IconBtn n="plus" label="Add to this day" onClick={() => open('logChooser', { date })} /></div>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-kcal-ink tabular dark:text-kcal">{n0(totals.kcal)} <span className="text-sm font-semibold">kcal</span></p><MacroRow m={totals} />
      {meals.length === 0 ? <p className="py-6 text-center text-sm text-ink-2 dark:text-white/60">Log your first meal</p> : (
        <div className="mt-3 space-y-3">
          {MEAL_SLOTS.map((slot) => { const l = meals.filter((m) => m.slot === slot); if (!l.length) return null; return (
            <div key={slot}><Label className="mb-1">{slot}</Label><ul className="divide-y divide-black/5 dark:divide-white/10">{l.map((m) => { const e = effective(m); return (
              <li key={m.id}><button onClick={() => open('mealDetail', { id: m.id })} className="flex w-full items-center justify-between gap-3 py-2.5 text-left"><span className="min-w-0"><span className="block break-words font-medium">{m.name}</span><span className="block text-xs text-ink-2 dark:text-white/60">{n0(e.grams)} g · {m.time}</span>
                <span className="mt-1 flex h-1.5 w-28 overflow-hidden rounded-full"><span style={{ flex: e.p * 4 + 0.01, background: '#16a34a' }} /><span style={{ flex: e.f * 9 + 0.01, background: '#eab308' }} /><span style={{ flex: e.c * 4 + 0.01, background: '#3b82f6' }} /></span></span>
                <span className="font-bold tabular">{n0(e.kcal)}</span></button></li>); })}</ul></div>); })}
          {water > 0 && <div><Label className="mb-1">Water</Label><p className="flex justify-between py-1 text-sm"><span>{n0(water)} mL</span><span className="text-water-ink dark:text-blue-300">hydration</span></p></div>}
          <p className="text-center text-xs text-ink-3 dark:text-white/50">Tap any entry to edit or delete</p>
        </div>)}
    </Card>
  );
}
void PRESETS; void Chip; void hhmm;
