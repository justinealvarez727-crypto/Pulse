import { useProfile } from '@/store/profile';
import { useActivity } from '@/store/activity';
import { useTraining } from '@/store/training';
import { useUI, today as getToday } from '@/store/ui';
import { Card, Label, IconBtn } from '@/components/ui';
import { Icon, type IconName } from '@/components/Icons';
import { kcalBurned } from '@/lib/calc';
import { useState } from 'react';

export default function Me() {
  const { profile: p, latestKg } = useProfile(); const open = useUI((s) => s.open); const t = getToday(); const [tick, setTick] = useState(0); void tick;
  const logs = useActivity((s) => s.logs); const stepsOn = useActivity((s) => s.stepsOn); const history = useTraining((s) => s.history);
  const kg = latestKg(); const today = logs.filter((l) => l.date === t);
  const move = today.reduce((a, l) => a + (l.kcal ?? 0), 0) + (kcalBurned({ kg, steps: stepsOn(t), heightCm: p.heightCm }) ?? 0);
  const workoutMin = history.filter((h) => h.date === t).reduce((a, h) => a + h.durationSec / 60, 0) + today.reduce((a, l) => a + l.minutes, 0);
  const stats: [string, string, string][] = [['MOVE', kg || move ? `${Math.round(move)} kcal` : '–', 'bg-red-500'], ['EXERCISE', `${Math.round(workoutMin)} min`, 'bg-brand-500'], ['STEPS', stepsOn(t).toLocaleString(), 'bg-water']];
  const rows: [IconName, string, string, () => void][] = [['bolt', 'Set / edit goals', 'Calories · macros · track · reset', () => open('goals')], ['brain', 'Form check', 'Spaced-repetition technique cards', () => open('review')], ['user', 'Manage', 'Appearance · backup · sample data', () => open('manage')]];
  return (
    <div className="space-y-4 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header><Label>Member · Settings · Goals</Label><h1 className="text-2xl font-extrabold">Profile</h1></header>
      <Card><div className="mb-3 flex items-center justify-between"><Label>Today · Activity</Label><IconBtn n="refresh" label="Refresh activity" onClick={() => setTick((x) => x + 1)} /></div><dl className="grid grid-cols-3 gap-2 text-center">{stats.map(([l, v, c]) => <div key={l} className="rounded-2xl bg-black/5 p-2 dark:bg-white/10"><dt className="flex items-center justify-center gap-1 font-mono text-[10px] tracking-wider text-ink-2 dark:text-white/65"><i className={`h-2 w-2 rounded-full ${c}`} />{l}</dt><dd className="font-bold tabular">{v}</dd></div>)}</dl></Card>
      <Card><button onClick={() => open('editProfile')} className="flex w-full items-center gap-4 text-left" aria-label="Edit profile"><span className="grid h-16 w-16 place-items-center rounded-full bg-brand-500/15 text-3xl">{p.avatar}</span><span><span className="block text-xl font-extrabold">{p.name}</span><span className="text-sm text-ink-2 dark:text-white/60">{p.heightCm} cm · {kg ? `${kg} kg` : 'no weight yet'}</span></span></button></Card>
      <ul className="space-y-2">{rows.map(([ic, ti, s, f]) => <li key={ti}><button onClick={f} className="flex w-full items-center gap-3 rounded-2xl bg-white p-4 text-left shadow-card dark:bg-night-card"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-brand-600"><Icon n={ic} /></span><span className="min-w-0 flex-1"><span className="block font-bold">{ti}</span><span className="text-sm text-ink-2 dark:text-white/60">{s}</span></span><Icon n="right" size={18} className="text-ink-3" /></button></li>)}</ul>
    </div>
  );
}
