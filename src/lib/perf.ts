/**
 * Lightweight performance monitoring (no dependency): LCP, CLS, INP-ish (longest event), FCP and long tasks.
 * Logged in dev; in prod beaconed to VITE_TELEMETRY_URL only when it is set (the app is local-only otherwise).
 */
type Metric = { name: string; value: number };
const url = import.meta.env.VITE_TELEMETRY_URL as string | undefined;
const sent: Metric[] = [];

function report(m: Metric) {
  sent.push(m);
  if (import.meta.env.DEV) console.info(`[perf] ${m.name}: ${m.value.toFixed(1)}`);
  if (url && navigator.sendBeacon) navigator.sendBeacon(url, JSON.stringify({ ...m, t: Date.now(), ua: navigator.userAgent }));
}
export function reportError(error: unknown, info?: string) {
  const message = error instanceof Error ? error.message : String(error);
  if (import.meta.env.DEV) console.error('[error]', message, info);
  if (url && navigator.sendBeacon) navigator.sendBeacon(url, JSON.stringify({ name: 'error', message, info, t: Date.now() }));
}
export function initPerf() {
  if (typeof PerformanceObserver === 'undefined') return;
  const obs = (type: string, cb: (e: PerformanceEntry[]) => void) => {
    try { new PerformanceObserver((l) => cb(l.getEntries())).observe({ type, buffered: true } as PerformanceObserverInit); } catch { /* unsupported */ }
  };
  let cls = 0;
  obs('largest-contentful-paint', (e) => report({ name: 'LCP', value: e[e.length - 1].startTime }));
  obs('paint', (e) => e.forEach((x) => x.name === 'first-contentful-paint' && report({ name: 'FCP', value: x.startTime })));
  obs('layout-shift', (e) => { e.forEach((x) => { const ls = x as PerformanceEntry & { value: number; hadRecentInput: boolean }; if (!ls.hadRecentInput) cls += ls.value; }); });
  obs('longtask', (e) => e.forEach((x) => x.duration > 120 && report({ name: 'longtask', value: x.duration })));
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') report({ name: 'CLS', value: cls }); });
  window.addEventListener('error', (e) => reportError(e.error ?? e.message, 'window.onerror'));
  window.addEventListener('unhandledrejection', (e) => reportError(e.reason, 'unhandledrejection'));
}
export const metrics = () => sent;
