import { useUI } from '@/store/ui';
import { useNutrition, recipeTotals } from '@/store/nutrition';
import { Btn, Card, Empty, Label } from '@/components/ui';
import { Icon } from '@/components/Icons';

export default function Kitchen() {
  const open = useUI((s) => s.open); const recipes = useNutrition((s) => s.recipes); const del = useNutrition((s) => s.deleteRecipe);
  return (
    <div className="space-y-4 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
      <header><h1 className="text-2xl font-extrabold">Kitchen</h1><p className="text-sm text-ink-2 dark:text-white/60">Cook with real macros</p></header>
      <section className="grid grid-cols-5 gap-3 rounded-3xl bg-brand-800 p-4 text-white">
        <div className="col-span-3 flex flex-col justify-between gap-3"><div><h2 className="text-xl font-extrabold leading-tight">Cook with real macros</h2><p className="mt-1 text-sm text-white/80">Add ingredients your way, then Pulse calculates the full recipe.</p></div><button onClick={() => open('cook')} className="min-h-[44px] self-start rounded-2xl bg-white px-4 text-sm font-bold text-brand-800 active:scale-95">Start cooking ›</button></div>
        <div className="col-span-2 grid gap-2">{[['Ingredients', 'Browse & add', 'ingredients', 'search'], ['Pantry', 'Organize your pantry', 'kitchenPantry', 'star']].map(([t, s, k, ic]) => <button key={t} onClick={() => open(k)} className="rounded-2xl bg-white/15 p-3 text-left active:scale-95"><Icon n={ic as 'star'} size={18} /><p className="mt-1 text-sm font-bold">{t}</p><p className="text-[11px] text-white/75">{s}</p></button>)}</div>
      </section>
      <section><h2 className="mb-2 text-lg font-bold">Saved recipes</h2>
        {recipes.length === 0 ? <Card><Empty icon="kitchen" title="No saved recipes yet" text="Cook one and it will be here, ready to log by weight." /></Card> : <ul className="space-y-2">{recipes.map((r) => { const t = recipeTotals(r); return <li key={r.id}><Card className="flex items-center gap-3"><div className="min-w-0 flex-1"><p className="break-words font-bold">{r.name}</p><Label>{Math.round(t.perServing.kcal)} kcal / serving · {Math.round(t.per100.kcal)} / 100 g</Label></div><Btn v="ghost" onClick={() => open('recipes')}>Log</Btn><Btn v="ghost" className="!text-red-600" onClick={() => del(r.id)} aria-label={`Delete ${r.name}`}>✕</Btn></Card></li>; })}</ul>}</section>
    </div>
  );
}
