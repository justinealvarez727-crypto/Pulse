import { useState } from 'react';
import { Sheet, Btn, Chip, Input, NumInput, Toggle, Label, Segmented, Card } from '@/components/ui';
import { Icon } from '@/components/Icons';
import { useProfile } from '@/store/profile';
import { useUI, today as getToday } from '@/store/ui';
import { computeTargets, zigzag, cmToFtIn, goalLabel } from '@/lib/calc';
import { loadSampleData, clearAllData } from '@/data/sample';
import type { GoalType, Sex } from '@/types';
import type { OP } from '@/components/Overlays';

export function GoalsMenu({ close }: OP) {
  const open = useUI((s) => s.open); const p = useProfile((s) => s.profile);
  const rows: [string, string, string][] = [['goalSet', 'Goals', `${goalLabel(p.goalType)} · goal ${p.goalWeightKg} kg`], ['goalCustom', 'Custom goal', 'Set calories & macros manually'], ['zigzag', 'Zigzag method', 'Different calories for each day'], ['track', 'Track', 'Choose which macros to track'], ['resetTime', 'Reset time preference', `Recent logs reset at ${p.dayResetHour % 12 || 12}:00 ${p.dayResetHour < 12 ? 'AM' : 'PM'}`], ['height', 'Height', `${p.heightCm} cm · ${cmToFtIn(p.heightCm).ft}′${cmToFtIn(p.heightCm).inch}″`]];
  return (<Sheet variant="center" onClose={close} title="Choose an option" footer={<Btn v="ghost" block onClick={close}>Close</Btn>}><ul className="space-y-2 pt-1">{rows.map(([k, t, s]) => <li key={k}><button onClick={() => open(k)} className="flex w-full items-center justify-between rounded-2xl bg-white p-3 text-left shadow-card dark:bg-night-card"><span><span className="block font-bold">{t}</span><span className="text-xs text-ink-2 dark:text-white/60">{s}</span></span><Icon n="right" size={18} /></button></li>)}</ul></Sheet>);
}
export function GoalSet({ close }: OP) {
  const { profile: p, setProfile, latestKg, recalcTargets } = useProfile(); const [g, setG] = useState<GoalType>(p.goalType); const [w, setW] = useState(p.goalWeightKg); const [d, setD] = useState(p.goalDate); const [age, setAge] = useState(p.age); const [sex, setSex] = useState<Sex>(p.sex); const kg = latestKg();
  return (<Sheet onClose={close} back={close} title="Goals" subtitle="Targets are calculated from your height, weight and goal." footer={<Btn block onClick={() => { setProfile({ goalType: g, goalWeightKg: w, goalDate: d, age, sex, customTargets: false }); if (kg) { recalcTargets(getToday()); useUI.getState().say('Targets updated'); } else useUI.getState().say('Saved. Log your weight to calculate targets.'); close(); }}>Save goal</Btn>}>
    <div className="space-y-4 pt-1"><Segmented label="Goal" value={g} onChange={setG} options={[{ id: 'lose', label: 'Lose weight' }, { id: 'maintain', label: 'Maintain' }, { id: 'gain', label: 'Build muscle' }]} />
      <NumInput label="Goal weight" unit="kg" value={w} onChange={setW} step={0.5} /><Input label="Goal date" type="date" value={d} onChange={(e) => setD(e.target.value)} />
      <NumInput label="Age" value={age} onChange={setAge} hint="Used only for the calorie formula" /><div><Label className="mb-1">Sex (for the formula)</Label><Segmented label="Sex" value={sex} onChange={setSex} options={[{ id: 'female', label: 'Female' }, { id: 'male', label: 'Male' }, { id: 'unspecified', label: 'Skip' }]} /></div>
      {kg && <Card><Label>Preview</Label><p className="font-bold">{computeTargets({ ...p, goalType: g, goalWeightKg: w, goalDate: d, age, sex }, kg, getToday()).kcal} kcal / day</p></Card>}</div></Sheet>);
}
export function CustomGoal({ close }: OP) {
  const { profile: p, setProfile } = useProfile(); const [t, setT] = useState(p.targets); const n = (k: keyof typeof t) => (v: number) => setT({ ...t, [k]: v });
  return (<Sheet onClose={close} back={close} title="Custom goal" subtitle="Type your own calories and macros." footer={<Btn block onClick={() => { setProfile({ targets: t, customTargets: true }); close(); }}>Save</Btn>}><div className="grid grid-cols-2 gap-3 pt-1"><NumInput label="Calories" value={t.kcal} onChange={n('kcal')} /><NumInput label="Protein (g)" value={t.p} onChange={n('p')} /><NumInput label="Carbs (g)" value={t.c} onChange={n('c')} /><NumInput label="Fats (g)" value={t.f} onChange={n('f')} /><NumInput label="Fiber (g)" value={t.fiber} onChange={n('fiber')} /><NumInput label="Sugar (g)" value={t.sugar} onChange={n('sugar')} /><NumInput label="Sodium (mg)" value={t.sodium} onChange={n('sodium')} /><NumInput label="Cholesterol (mg)" value={t.chol} onChange={n('chol')} /></div></Sheet>);
}
export function Zigzag({ close }: OP) {
  const { profile: p, setProfile } = useProfile(); const [on, setOn] = useState(p.zigzag.on); const [k, setK] = useState(p.zigzag.kcal); const avg = Math.round(k.reduce((a, b) => a + b, 0) / 7);
  return (<Sheet onClose={close} back={close} title="Zigzag method" subtitle="A different calorie goal for each weekday." footer={<Btn block onClick={() => { setProfile({ zigzag: { on, kcal: k } }); close(); }}>Save</Btn>}><div className="space-y-3 pt-1"><div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><span className="font-bold">Use zigzag</span><Toggle on={on} onChange={setOn} label="Use zigzag" /></div>
    <div className="grid grid-cols-2 gap-3">{['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((d, i) => <NumInput key={d} label={d} value={k[i]} onChange={(v) => setK(k.map((x, j) => (j === i ? v : x)))} />)}</div>
    <p className="text-sm text-ink-2 dark:text-white/70">Weekly average: <b>{avg}</b> kcal (target {p.targets.kcal})</p><Btn v="ghost" block onClick={() => setK(zigzag(p.targets.kcal))}>Auto-fill around {p.targets.kcal} kcal</Btn></div></Sheet>);
}
export function Track({ close }: OP) {
  const { profile: p, setProfile } = useProfile(); const rows: [keyof typeof p.track, string][] = [['fiber', 'Fiber'], ['sugar', 'Sugar'], ['sodium', 'Sodium'], ['chol', 'Cholesterol']];
  return (<Sheet onClose={close} back={close} title="Track" subtitle="Choose which macros show on the dashboard. Calories, protein, fats and carbs always show."><ul className="space-y-2 pt-1">{rows.map(([k, l]) => <li key={k} className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><span className="font-semibold">{l}</span><Toggle label={l} on={p.track[k]} onChange={(v) => setProfile({ track: { ...p.track, [k]: v } })} /></li>)}</ul></Sheet>);
}
export function ResetTime({ close }: OP) {
  const { profile: p, setProfile } = useProfile(); const [h, setH] = useState(p.dayResetHour);
  return (<Sheet onClose={close} back={close} title="Reset time preference" subtitle="The time your day rolls over. Default 12:00 AM." footer={<Btn block onClick={() => { setProfile({ dayResetHour: h }); useUI.getState().setDate(getToday()); close(); }}>Save</Btn>}><div className="flex flex-wrap gap-2 pt-1">{Array.from({ length: 12 }, (_, i) => i).map((x) => <Chip key={x} on={h === x} onClick={() => setH(x)}>{x % 12 || 12}:00 {x < 12 ? 'AM' : 'PM'}</Chip>)}</div></Sheet>);
}
export function Height({ close }: OP) {
  const { profile: p, setProfile } = useProfile(); const [u, setU] = useState<'cm' | 'ft'>('cm'); const [cm, setCm] = useState(p.heightCm); const f = cmToFtIn(cm); const [ft, setFt] = useState(f.ft); const [inch, setIn] = useState(f.inch);
  return (<Sheet onClose={close} back={close} title="Height" footer={<Btn block onClick={() => { const v = u === 'cm' ? cm : Math.round((ft * 12 + inch) * 2.54); if (v >= 100 && v <= 250) { setProfile({ heightCm: v }); close(); } else useUI.getState().say('Enter a height between 100 and 250 cm'); }}>Save</Btn>}><div className="space-y-4 pt-1"><Segmented label="Unit" value={u} onChange={setU} options={[{ id: 'cm', label: 'cm' }, { id: 'ft', label: 'ft / in' }]} />{u === 'cm' ? <NumInput label="Height" unit="cm" value={cm} onChange={setCm} /> : <div className="grid grid-cols-2 gap-3"><NumInput label="Feet" value={ft} onChange={setFt} /><NumInput label="Inches" value={inch} onChange={setIn} /></div>}</div></Sheet>);
}
export function EditProfile({ close }: OP) {
  const { profile: p, setProfile } = useProfile(); const [n, setN] = useState(p.name); const [a, setA] = useState(p.avatar);
  return (<Sheet onClose={close} title="Edit profile" footer={<Btn block disabled={!n.trim()} onClick={() => { setProfile({ name: n.trim(), avatar: a }); close(); }}>Save</Btn>}><div className="space-y-4 pt-1"><Input label="Name" value={n} onChange={(e) => setN(e.target.value)} data-autofocus /><div><Label className="mb-1">Avatar</Label><div className="flex flex-wrap gap-2">{['🙂', '😎', '💪', '🏃', '🧘', '🥗', '🐯', '🦊', '🌿', '⚡'].map((e) => <button key={e} aria-label={`Avatar ${e}`} aria-pressed={a === e} onClick={() => setA(e)} className={`grid h-12 w-12 place-items-center rounded-full text-2xl ${a === e ? 'bg-brand-600 ring-2 ring-brand-400' : 'bg-black/5 dark:bg-white/10'}`}>{e}</button>)}</div></div></div></Sheet>);
}
export function Manage({ close }: OP) {
  const [c, setC] = useState(false); const exportData = () => { const o: Record<string, unknown> = {}; Object.keys(localStorage).filter((k) => k.startsWith('pulse.')).forEach((k) => (o[k] = JSON.parse(localStorage.getItem(k)!))); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(o, null, 2)], { type: 'application/json' })); a.download = 'pulse-backup.json'; a.click(); };
  return (<Sheet onClose={close} back={close} title="Manage"><div className="space-y-3 pt-1"><Card><p className="font-bold">Appearance</p><p className="text-sm text-ink-2 dark:text-white/60">Light and dark follow your device setting.</p></Card><Btn v="outline" block onClick={() => { loadSampleData(); useUI.getState().say('Sample data loaded'); close(); }}>Load sample data</Btn><Btn v="outline" block onClick={exportData}>Export backup (JSON)</Btn>
    {c ? <div className="flex gap-2"><Btn v="ghost" className="flex-1" onClick={() => setC(false)}>Cancel</Btn><Btn v="danger" className="flex-1" onClick={clearAllData}>Erase everything</Btn></div> : <Btn v="ghost" block className="!text-red-600" onClick={() => setC(true)}>Erase all data</Btn>}</div></Sheet>);
}
