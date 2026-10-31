import type { YMD } from '@/types';

export const pad = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date = new Date()): YMD => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseYmd = (s: YMD) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const addDays = (s: YMD, n: number): YMD => { const d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); };
export const diffDays = (a: YMD, b: YMD) => Math.round((parseYmd(a).getTime() - parseYmd(b).getTime()) / 864e5);

/** "Today" honours the user's day-rollover preference (default 12:00 AM). */
export function logicalToday(resetHour = 0, now = new Date()): YMD {
  const d = new Date(now); if (d.getHours() < resetHour) d.setDate(d.getDate() - 1); return ymd(d);
}
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const MON_S = MONTHS.map((m) => m.slice(0, 3));
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/** Monday-first index 0..6 */
export const monIdx = (s: YMD) => (parseYmd(s).getDay() + 6) % 7;
export const mondayOf = (s: YMD) => addDays(s, -monIdx(s));
export const shortDate = (s: YMD) => { const d = parseYmd(s); return `${MON_S[d.getMonth()]} ${d.getDate()}`; };
export const longDate = (s: YMD) => { const d = parseYmd(s); return `${DOW[d.getDay()]}, ${MON_S[d.getMonth()]} ${d.getDate()}`; };
export function relDay(s: YMD, today: YMD): string {
  const n = diffDays(s, today);
  return n === 0 ? 'Today' : n === -1 ? 'Yesterday' : n === 1 ? 'Tomorrow' : shortDate(s);
}
export const hhmm = (d: Date = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
export function fmt12(min: number) { const m = ((min % 1440) + 1440) % 1440; const h = Math.floor(m / 60); const mm = m % 60; return `${h % 12 || 12}:${pad(mm)} ${h < 12 ? 'AM' : 'PM'}`; }
export function fmtHM(ms: number) { const t = Math.max(0, Math.floor(ms / 60000)); return `${Math.floor(t / 60)}h ${pad(t % 60)}m`; }
export function fmtClock(sec: number) { const s = Math.max(0, Math.floor(sec)); const h = Math.floor(s / 3600); const m = Math.floor((s % 3600) / 60); return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`; }
/** Month grid, `weekStart` 0=Sunday 1=Monday. null = padding cell. */
export function monthGrid(year: number, month: number, weekStart: 0 | 1): (YMD | null)[] {
  const first = new Date(year, month, 1); const lead = (first.getDay() - weekStart + 7) % 7;
  const days = new Date(year, month + 1, 0).getDate(); const out: (YMD | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d++) out.push(ymd(new Date(year, month, d)));
  while (out.length % 7) out.push(null); return out;
}
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const dateAtMs = (date: YMD, minutes: number) => { const d = parseYmd(date); d.setMinutes(minutes); return d.getTime(); };
