import { Suspense, lazy, useEffect } from 'react';
import { useUI, type Tab } from '@/store/ui';
import { useFasting } from '@/store/fasting';
import { useProfile } from '@/store/profile';
import { Icon, type IconName } from '@/components/Icons';
import { Skeleton, Toast, cx } from '@/components/ui';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Overlays } from '@/components/Overlays';
import { logicalToday } from '@/lib/date';
import { useTraining } from '@/store/training';
import Today from '@/screens/Today';

// Code-split every non-default tab (Today ships in the entry chunk for fast first paint).
const Progress = lazy(() => import('@/screens/Progress'));
const Kitchen = lazy(() => import('@/screens/Kitchen'));
const Me = lazy(() => import('@/screens/Me'));

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'today', label: 'Today', icon: 'home' }, { id: 'progress', label: 'Progress', icon: 'chart' },
  { id: 'kitchen', label: 'Kitchen', icon: 'kitchen' }, { id: 'me', label: 'Me', icon: 'user' },
];

/** 1 Hz heartbeat: promotes scheduled fasts and rolls "today" over at the user's reset time. */
function Ticker() {
  useEffect(() => {
    const t = setInterval(() => {
      useFasting.getState().tick(Date.now());
      const ui = useUI.getState(); const today = logicalToday(useProfile.getState().profile.dayResetHour);
      const last = (Ticker as unknown as { last?: string }).last;
      if (last && last !== today && ui.date === last) ui.setDate(today);
      (Ticker as unknown as { last?: string }).last = today;
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return null;
}

export default function App() {
  const { tab, setTab, open, toast, stack } = useUI();
  const active = useTraining((s) => s.active);

  // PWA shortcuts (?action=water | workout)
  useEffect(() => {
    const a = new URLSearchParams(location.search).get('action');
    if (a === 'water') open('water'); if (a === 'workout') open('workout');
  }, [open]);

  const modalOpen = stack.length > 0;
  return (
    <div className="mx-auto flex h-full max-w-xl flex-col bg-canvas dark:bg-night">
      <a href="#main" className="skip-link">Skip to content</a>
      <Ticker />
      <main id="main" aria-hidden={modalOpen} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-28">
        <ErrorBoundary label={tab} key={tab} compact>
          <Suspense fallback={<div className="space-y-3 p-4"><Skeleton className="h-16" /><Skeleton className="h-64" /><Skeleton className="h-28" /></div>}>
            {tab === 'today' && <Today />}{tab === 'progress' && <Progress />}{tab === 'kitchen' && <Kitchen />}{tab === 'me' && <Me />}
          </Suspense>
        </ErrorBoundary>
      </main>

      {active && !modalOpen && (
        <button onClick={() => open('activeWorkout')} className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-brand-700 px-4 py-3 text-sm font-semibold text-white shadow-lg">
          <span className="flex items-center gap-2"><Icon n="dumbbell" size={18} /> {active.name} in progress</span><span>Resume ›</span>
        </button>
      )}

      <nav aria-label="Primary" aria-hidden={modalOpen} className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-xl border-t border-black/5 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-night-card/95" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <ul className="relative grid grid-cols-5 items-end px-2 pb-1 pt-1">
          {TABS.slice(0, 2).map((t) => <NavBtn key={t.id} t={t} on={tab === t.id} onClick={() => setTab(t.id)} />)}
          <li className="flex justify-center"><button aria-label="Log something" onClick={() => open('logChooser')} className="-mt-6 grid h-14 w-14 place-items-center rounded-full bg-brand-600 text-white shadow-lg shadow-brand-600/40 transition active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"><Icon n="plus" size={28} stroke={2.4} /></button></li>
          {TABS.slice(2).map((t) => <NavBtn key={t.id} t={t} on={tab === t.id} onClick={() => setTab(t.id)} />)}
        </ul>
      </nav>
      <Overlays />
      <Toast msg={toast} />
    </div>
  );
}
function NavBtn({ t, on, onClick }: { t: (typeof TABS)[number]; on: boolean; onClick: () => void }) {
  return (<li><button onClick={onClick} aria-current={on ? 'page' : undefined} className={cx('flex min-h-[52px] w-full flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold', on ? 'text-brand-700 dark:text-brand-400' : 'text-ink-3 dark:text-white/55')}><Icon n={t.icon} size={22} />{t.label}</button></li>);
}
