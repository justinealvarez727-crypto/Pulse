import { useMemo, useRef, useState } from 'react';
import { Sheet, Btn, Chip, Input, Label, IconBtn, Empty, Field, cx, inputCls, Segmented } from '@/components/ui';
import { Icon, ExerciseIcon } from '@/components/Icons';
import { useTraining } from '@/store/training';
import { EQUIPMENT, MUSCLE_GROUPS, ALL_MUSCLES, EXERCISE_TYPES } from '@/data/muscles';
import { POPULAR_NAMES } from '@/data/exercises';
import { useUI } from '@/store/ui';
import type { Equipment, Exercise, ExerciseType } from '@/types';
import type { OP } from '@/components/Overlays';

/** Exercise picker: search + Equipment / Muscles / My Workouts, multi-select. Used by routines, warm-up, cool-down, planner. */
/** Forgiving search: "1 arm", "one-arm" and "single arm" all match "One-Arm …"; hyphens/punctuation are ignored. */
const norm = (t: string) => t.toLowerCase().replace(/[-_/]/g, ' ').replace(/\b(1|single|uni)\b/g, 'one').replace(/dumbbel+s?\b/g, 'dumbbell').replace(/\s+/g, ' ').trim();
export function Picker({ p, close }: OP) {
  const { custom, allExercises } = useTraining(); const open = useUI((s) => s.open);
  const [tab, setTab] = useState<'equipment' | 'muscles' | 'mine'>('equipment'); const [q, setQ] = useState(''); const [eq, setEq] = useState<Equipment | null>(null);
  const [grp, setGrp] = useState<string | null>(null); const [mus, setMus] = useState<string | null>(null); const [sel, setSel] = useState<string[]>([]);
  const title = (p.title as string) ?? 'Add Exercise'; const [warm, setWarm] = useState(/warm/i.test(title)); const [cardio, setCardio] = useState(/cardio/i.test(title)); const [z2, setZ2] = useState(false); const onDone = p.onDone as (ids: string[]) => void;
  const list = useMemo(() => allExercises().filter((e) => (tab !== 'mine' || e.custom) && (!warm || e.warmup) && (!cardio || e.cardio) && (!z2 || e.zone2) && (!eq || e.equipment === eq) && (!mus ? !grp || [e.primary, ...e.others].some((m) => MUSCLE_GROUPS[grp].includes(m)) : [e.primary, ...e.others].includes(mus)) && norm(e.name).includes(norm(q))).sort((a, b) => a.name.localeCompare(b.name)), [allExercises, custom, tab, eq, grp, mus, q, warm, cardio, z2]);
  const popular = !q && tab !== 'mine' && !warm && !cardio ? list.filter((e) => POPULAR_NAMES.includes(e.name)).sort((a, b) => POPULAR_NAMES.indexOf(a.name) - POPULAR_NAMES.indexOf(b.name)) : [];
  const toggle = (id: string) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const Row = ({ e }: { e: Exercise }) => { const on = sel.includes(e.id); return (
    <li><div className={cx('flex items-center gap-3 rounded-2xl p-2', on && 'bg-brand-500/10')}>
      <button role="checkbox" aria-checked={on} onClick={() => toggle(e.id)} className="flex min-h-[52px] min-w-0 flex-1 items-center gap-3 text-left"><ExerciseIcon equipment={e.equipment} /><span className="min-w-0 flex-1"><span className="block break-words font-semibold">{e.name}</span><span className="text-xs text-ink-2 dark:text-white/60">{e.primary} · {e.equipment}{e.warmup && <b className="ml-1.5 rounded bg-orange-100 px-1 text-[10px] text-orange-800">WARM-UP</b>}{e.cardio && <b className="ml-1.5 rounded bg-blue-100 px-1 text-[10px] text-blue-800">{e.zone2 ? 'ZONE 2' : 'CARDIO'}</b>}</span></span>
        <span aria-hidden className={cx('grid h-6 w-6 place-items-center rounded-md border-2', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-black/25 dark:border-white/30')}>{on && <Icon n="check" size={16} stroke={3} />}</span></button>
      {e.custom && <><IconBtn n="edit" label={`Edit ${e.name}`} onClick={() => open('customExercise', { id: e.id })} /><IconBtn n="trash" label={`Delete ${e.name}`} onClick={() => useTraining.getState().removeCustom(e.id)} /></>}
    </div></li>); };
  return (
    <Sheet variant="full" onClose={close} title={title} trailing={<Btn v="ghost" className="!min-h-[36px] !px-3" onClick={() => open('customExercise', {})}>+ Custom</Btn>}
      footer={<Btn block disabled={!sel.length} onClick={() => { onDone(sel); close(); }}>Add Exercises ({sel.length})</Btn>}>
      <div className="sticky top-0 z-10 -mx-4 space-y-2 bg-canvas px-4 pb-2 pt-1 dark:bg-night">
        <div className="relative"><Icon n="search" className="absolute left-3 top-3 text-ink-3" /><input aria-label="Search exercises" placeholder="Search exercises" value={q} onChange={(e) => setQ(e.target.value)} className={cx(inputCls, 'pl-10')} /></div>
        <div className="flex gap-2 overflow-x-auto pb-1"><Chip on={warm} tone="orange" onClick={() => setWarm(!warm)}>🔥 Warm-up</Chip><Chip on={cardio} tone="blue" onClick={() => { setCardio(!cardio); if (cardio) setZ2(false); }}>❤️ Cardio</Chip><Chip on={z2} tone="blue" onClick={() => { setZ2(!z2); if (!z2) setCardio(true); }}>Zone 2</Chip></div>
        <Segmented label="Browse by" value={tab} onChange={(v) => { setTab(v); }} options={[{ id: 'equipment', label: 'Equipment' }, { id: 'muscles', label: 'Muscles' }, { id: 'mine', label: 'My Workouts' }]} />
        {tab === 'equipment' && <div className="flex gap-2 overflow-x-auto pb-1"><Chip on={!eq} onClick={() => setEq(null)}>All</Chip>{EQUIPMENT.map((x) => <Chip key={x} on={eq === x} onClick={() => setEq(eq === x ? null : x)}>{x}</Chip>)}</div>}
        {tab === 'muscles' && (<><div className="flex gap-2 overflow-x-auto pb-1"><Chip on={!grp} onClick={() => { setGrp(null); setMus(null); }}>All</Chip>{Object.keys(MUSCLE_GROUPS).map((g) => <Chip key={g} on={grp === g} onClick={() => { setGrp(grp === g ? null : g); setMus(null); }}>{g}</Chip>)}</div>
          {grp && <div className="flex gap-2 overflow-x-auto pb-1">{MUSCLE_GROUPS[grp].map((m) => <Chip key={m} on={mus === m} onClick={() => setMus(mus === m ? null : m)}>{m}</Chip>)}</div>}</>)}
      </div>
      {list.length === 0 ? <Empty icon="search" title={tab === 'mine' ? 'No custom exercises yet' : 'No matches'} text={tab === 'mine' ? 'Tap “+ Custom” to create one.' : 'Try another filter or search.'} /> : (<>
        {popular.length > 0 && <section><Label className="my-2">Popular</Label><ul>{popular.map((e) => <Row key={'p' + e.id} e={e} />)}</ul></section>}
        <section><Label className="my-2">{tab === 'mine' ? 'My exercises' : 'All exercises'} · {list.length}</Label><ul>{list.map((e) => <Row key={e.id} e={e} />)}</ul></section></>)}
    </Sheet>
  );
}

/** Down-scale a user photo to ≤480px JPEG so localStorage doesn't blow its quota. */
async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file); const img = new Image(); img.src = url; await img.decode();
  const k = Math.min(1, 480 / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k;
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); return c.toDataURL('image/jpeg', 0.7);
}
export function CustomExercise({ p, close }: OP) {
  const { custom, addCustom } = useTraining(); const ex = custom.find((e) => e.id === p.id); const file = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(ex?.name ?? ''); const [equipment, setEq] = useState<Equipment>(ex?.equipment ?? 'Barbell'); const [primary, setPrimary] = useState(ex?.primary ?? 'Pectoralis Major');
  const [others, setOthers] = useState<string[]>(ex?.others ?? []); const [type, setType] = useState<ExerciseType>(ex?.type ?? 'weight_reps'); const [details, setDetails] = useState(ex?.details ?? ''); const [photos, setPhotos] = useState<string[]>(ex?.photos ?? []); const [warmup, setWarmup] = useState(!!ex?.warmup); const [err, setErr] = useState('');
  const save = () => { if (!name.trim()) return setErr('Give the exercise a name.'); addCustom({ id: ex?.id, name: name.trim(), equipment, primary, others: others.filter((o) => o !== primary), type, details: details.trim() || undefined, warmup, photos }); useUI.getState().say('Exercise saved'); close(); };
  return (
    <Sheet variant="full" onClose={close} title={ex ? 'Edit exercise' : 'Custom exercise'} footer={<Btn block onClick={save}>Save exercise</Btn>}>
      <div className="space-y-4 pt-1">
        <div><Label className="mb-1">Photos · up to 6</Label><div className="flex gap-2 overflow-x-auto pb-1">{photos.map((s, i) => <div key={i} className="relative h-20 w-20 shrink-0"><img src={s} alt={`Exercise photo ${i + 1}`} className="h-full w-full rounded-xl object-cover" /><button aria-label={`Remove photo ${i + 1}`} onClick={() => setPhotos(photos.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-white"><Icon n="x" size={14} /></button></div>)}
          {photos.length < 6 && <button onClick={() => file.current?.click()} className="grid h-20 w-20 shrink-0 place-items-center rounded-xl border-2 border-dashed border-black/25 text-xs font-semibold text-ink-2 dark:border-white/25 dark:text-white/70"><span><Icon n="plus" className="mx-auto" />Add photos</span></button>}</div>
          <input ref={file} type="file" accept="image/*" multiple hidden onChange={async (e) => { const fs = [...(e.target.files ?? [])].slice(0, 6 - photos.length); const out = await Promise.all(fs.map(shrink).map((x) => x.catch(() => ''))); setPhotos([...photos, ...out.filter(Boolean)]); e.target.value = ''; }} /></div>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} data-autofocus />{err && <p role="alert" className="text-sm font-medium text-red-600">{err}</p>}
        <Field label="Equipment"><select aria-label="Equipment" value={equipment} onChange={(e) => setEq(e.target.value as Equipment)} className={inputCls}>{EQUIPMENT.map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Primary muscle (one)"><select aria-label="Primary muscle" value={primary} onChange={(e) => setPrimary(e.target.value)} className={inputCls}>{Object.entries(MUSCLE_GROUPS).map(([g, ms]) => <optgroup key={g} label={g}>{ms.map((m) => <option key={m}>{m}</option>)}</optgroup>)}</select></Field>
        <div><Label className="mb-1">Other muscles (optional)</Label><div className="flex flex-wrap gap-2">{ALL_MUSCLES.filter((m) => m !== primary).map((m) => <Chip key={m} on={others.includes(m)} onClick={() => setOthers(others.includes(m) ? others.filter((x) => x !== m) : [...others, m])}>{m}</Chip>)}</div></div>
        <div role="radiogroup" aria-label="Exercise type"><Label className="mb-1">Exercise type</Label><ul className="space-y-1.5">{EXERCISE_TYPES.map((t) => <li key={t.id}><button role="radio" aria-checked={type === t.id} onClick={() => setType(t.id)} className={cx('flex min-h-[48px] w-full items-center justify-between rounded-xl px-4 text-left', type === t.id ? 'bg-brand-600 text-white' : 'bg-white dark:bg-night-card')}><span className="font-semibold">{t.label}</span><span className="text-xs opacity-75">{t.hint}</span></button></li>)}</ul></div>
        <div className="flex items-center justify-between rounded-2xl bg-white p-3 shadow-card dark:bg-night-card"><span><b className="block">Warm-up exercise</b><span className="text-xs text-ink-2 dark:text-white/60">Shows under the “Warm-up only” filter</span></span><Chip on={warmup} tone="orange" onClick={() => setWarmup(!warmup)}>{warmup ? 'Yes' : 'No'}</Chip></div>
        <Field label="Details · how to · optional"><textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className={cx(inputCls, 'py-2')} /></Field>
      </div>
    </Sheet>
  );
}
