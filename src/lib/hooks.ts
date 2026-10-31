import { useEffect, useState } from 'react';
/** Re-renders every `ms` with the current epoch ms (timers, countdowns). Pauses while the tab is hidden. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') setNow(Date.now()); }, ms);
    const v = () => setNow(Date.now()); document.addEventListener('visibilitychange', v);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', v); };
  }, [ms]);
  return now;
}
export function useLocalState<T>(key: string, init: T) {
  const [v, setV] = useState<T>(() => { try { const s = sessionStorage.getItem(key); return s ? (JSON.parse(s) as T) : init; } catch { return init; } });
  useEffect(() => { try { sessionStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } }, [key, v]);
  return [v, setV] as const;
}
