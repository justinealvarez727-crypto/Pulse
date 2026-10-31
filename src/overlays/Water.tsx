import { useState } from 'react';
import { Sheet, Btn, Stepper, IconBtn, Input, Bar, cx } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { useNutrition } from '@/store/nutrition';
import { useProfile } from '@/store/profile';
import { useUI, today as getToday } from '@/store/ui';
import { addDays, longDate, relDay } from '@/lib/date';
import type { OP } from '@/components/Overlays';

export function WaterPopup({ p, close }: OP) {
  const date = (p.date as string) ?? useUI.getState().date; const open = useUI((s) => s.open);
  const water = useNutrition((s) => s.water[date] ?? 0); const add = useNutrition((s) => s.addWater);
  const { profile, setProfile } = useProfile();
  const [amt, setAmt] = useState(250); const [edit, setEdit] = useState(false); const [goal, setGoal] = useState(profile.waterGoal);
  return (
    <Sheet onClose={close} variant="center" leading={<IconBtn n="cal" label="Water history" onClick={() => open('waterHistory', { date })} />}
      title="Drink More Water" subtitle={relDay(date, getToday()) === 'Today' ? 'Today' : longDate(date)}>
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-water-soft text-water"><Icon n="drop" size={32} /></span>
        <p className="text-sm text-ink-2 dark:text-white/70">How much did you drink?</p>
        {edit ? (
          <div className="flex w-full items-end gap-2"><Input label="Daily target (mL)" type="number" inputMode="numeric" value={goal} onChange={(e) => setGoal(Number(e.target.value))} /><Btn v="blue" onClick={() => { if (goal >= 250) { setProfile({ waterGoal: goal }); setEdit(false); } }}>Save</Btn></div>
        ) : (
          <button onClick={() => setEdit(true)} aria-label="Edit daily water target" className="rounded-full bg-water-soft px-4 py-1.5 text-sm font-semibold text-water-ink">{water.toLocaleString()} / {profile.waterGoal.toLocaleString()} mL ✎ today</button>
        )}
        <Stepper label="amount" value={amt} step={profile.waterStep} min={profile.waterStep} max={3000} onChange={setAmt} format={(n) => `${n} mL`} />
        <Btn v="blue" block onClick={() => { add(date, amt); useUI.getState().say(`+${amt} mL water`); close(); }}>Add water</Btn>
      </div>
    </Sheet>
  );
}

export function WaterHistory({ p, close }: OP) {
  const date = (p.date as string) ?? useUI.getState().date; const water = useNutrition((s) => s.water); const goal = useProfile((s) => s.profile.waterGoal);
  const t = getToday();
  return (
    <Sheet onClose={close} back={close} title="Water history" subtitle="Last 14 days">
      <ul className="space-y-2 pt-1">
        {Array.from({ length: 14 }, (_, i) => addDays(t, -i)).map((d) => { const ml = water[d] ?? 0; return (
          <li key={d} className={cx('rounded-2xl p-3', d === date ? 'bg-water-soft ring-2 ring-water dark:bg-water/20' : 'bg-white dark:bg-night-card')}>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">{relDay(d, t) === d.slice(5) ? longDate(d) : relDay(d, t) + (['Today', 'Yesterday'].includes(relDay(d, t)) ? '' : '')}</span><span className={cx('font-bold tabular', ml > 0 ? 'text-water-ink dark:text-blue-300' : 'text-ink-3')}>{ml.toLocaleString()} mL</span></div>
            <Bar pct={ml / goal} color="#2563eb" label={`${longDate(d)} water`} />
          </li>); })}
      </ul>
    </Sheet>
  );
}
