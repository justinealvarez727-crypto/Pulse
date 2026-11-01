import { useEffect, useMemo, useState } from 'react';
import { Sheet, Btn, Card, Label, Bar, Empty } from '@/components/ui';
import { useReview } from '@/store/review';
import { useTraining } from '@/store/training';
import { BUILTIN_EXERCISES, POPULAR_NAMES, slug } from '@/data/exercises';
import { boxCounts, dueCards, mastery, intervalDays, retention } from '@/lib/leitner';
import type { OP } from '@/components/Overlays';

/** Form-check flashcards scheduled by the Leitner engine (lib/leitner.ts). Cards come from your routines + popular lifts. */
export function FormReview({ close }: OP) {
  const { cards, ensure, answer } = useReview(); const routines = useTraining((s) => s.routines); const [show, setShow] = useState(false); const [now] = useState(() => Date.now());
  useEffect(() => { ensure([...new Set([...routines.flatMap((r) => r.main.map((e) => e.exerciseId)), ...POPULAR_NAMES.map(slug)])].filter((id) => BUILTIN_EXERCISES.some((e) => e.id === id))); }, [routines, ensure]);
  const due = useMemo(() => dueCards(cards, now), [cards, now, show]); const cur = due[0]; const counts = boxCounts(cards);
  return (
    <Sheet onClose={close} title="Form check" subtitle="Recall the key cues. Cards you know come back later (Leitner boxes)." >
      <div className="space-y-3 pt-1">
        <Card><Label className="mb-2">Boxes · review every</Label><ul className="grid grid-cols-5 gap-1 text-center">{counts.map((n, i) => <li key={i} className="rounded-xl bg-black/5 p-2 dark:bg-white/10"><b className="block text-lg">{n}</b><span className="text-[10px] text-ink-2 dark:text-white/60">{intervalDays(i + 1)}d</span></li>)}</ul><p className="mt-2 text-xs text-ink-2 dark:text-white/60">Mastery {Math.round(mastery(cards) * 100)}% · {due.length} due</p></Card>
        {!cur ? <Empty icon="check" title="All caught up" text="Nothing due right now. Come back later." /> : (
          <Card className="space-y-3 text-center"><Label>{cur.reviews ? `Box ${cur.box} · recall ${Math.round(retention(cur, now) * 100)}%` : 'New card'}</Label><p className="text-xl font-extrabold break-words">{cur.front}</p><p className="text-sm text-ink-2 dark:text-white/60">What are the key technique cues?</p>
            {show ? <ul className="space-y-1 rounded-2xl bg-brand-500/10 p-3 text-left text-sm">{cur.back.split('\n').map((l) => <li key={l}>• {l}</li>)}</ul> : <Btn block onClick={() => setShow(true)}>Show answer</Btn>}
            {show && <div className="grid grid-cols-2 gap-2"><Btn v="outline" onClick={() => { answer(cur.id, false); setShow(false); }}>Missed it</Btn><Btn onClick={() => { answer(cur.id, true); setShow(false); }}>Got it</Btn></div>}</Card>)}
      </div>
    </Sheet>
  );
}
void Bar;
