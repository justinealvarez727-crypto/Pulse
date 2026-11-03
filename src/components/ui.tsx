import { useEffect, useRef, useId, useState, type ReactNode, type ButtonHTMLAttributes } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Icon } from './Icons';

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ');

/* ---------- Buttons & inputs ---------- */
type BP = ButtonHTMLAttributes<HTMLButtonElement> & { v?: 'primary' | 'ghost' | 'danger' | 'outline' | 'dark' | 'orange' | 'blue'; block?: boolean };
export function Btn({ v = 'primary', block, className, ...p }: BP) {
  const s = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700', ghost: 'bg-black/5 text-ink dark:bg-white/10 dark:text-white', outline: 'border border-black/15 text-ink dark:border-white/20 dark:text-white',
    danger: 'bg-red-600 text-white', dark: 'bg-night text-white', orange: 'bg-kcal text-white', blue: 'bg-water text-white',
  }[v];
  return <button type="button" {...p} className={cx('min-h-[44px] rounded-2xl px-5 text-sm font-semibold transition active:scale-[.97] disabled:opacity-40 disabled:active:scale-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500', s, block && 'w-full', className)} />;
}
export function IconBtn({ n, label, onClick, className, size = 20 }: { n: Parameters<typeof Icon>[0]['n']; label: string; onClick?: () => void; className?: string; size?: number }) {
  return <button type="button" aria-label={label} onClick={onClick} className={cx('grid h-11 w-11 shrink-0 place-items-center rounded-full transition active:scale-90 hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500', className)}><Icon n={n} size={size} /></button>;
}
export function Chip({ on, children, onClick, className, tone = 'green' }: { on?: boolean; children: ReactNode; onClick?: () => void; className?: string; tone?: 'green' | 'orange' | 'blue' }) {
  const onC = { green: 'bg-brand-600 text-white', orange: 'bg-kcal text-white', blue: 'bg-water text-white' }[tone];
  return <button type="button" aria-pressed={on} onClick={onClick} className={cx('min-h-[36px] shrink-0 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-500', on ? onC : 'bg-black/5 text-ink-2 dark:bg-white/10 dark:text-white/80', className)}>{children}</button>;
}
export function Card({ children, className, onClick, as: As = 'div' }: { children: ReactNode; className?: string; onClick?: () => void; as?: 'div' | 'section' }) {
  return <As onClick={onClick} className={cx('rounded-3xl bg-white p-4 shadow-card dark:bg-night-card dark:text-white', className)}>{children}</As>;
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  const id = useId();
  return (<div className="block"><label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-2 dark:text-white/60">{label}</label><div id={id + 'w'}>{children}</div>{hint && <p className="mt-1 text-xs text-ink-3 dark:text-white/50">{hint}</p>}</div>);
}
export const inputCls = 'min-h-[44px] w-full rounded-xl border border-black/10 bg-white px-3 text-base text-ink placeholder:text-ink-3 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/15 dark:bg-night dark:text-white';
export function Input({ label, hint, className, ...p }: { label: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (<div><label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-2 dark:text-white/60">{label}</label><input id={id} {...p} className={cx(inputCls, className)} />{hint && <p className="mt-1 text-xs text-ink-3 dark:text-white/50">{hint}</p>}</div>);
}
/** Text-draft hook: typing "0." or "0.5" no longer collapses to 0, and leading zeros ("05") are stripped. */
export function useNumDraft(value: number | '', onChange: (n: number) => void) {
  const show = (v: number | '') => (v === '' || v === 0 ? '' : String(v));
  const [txt, setTxt] = useState(show(value));
  useEffect(() => { if (Number(txt || 0) !== Number(value || 0)) setTxt(show(value)); }, [value]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (raw: string) => {
    let v = raw.replace(',', '.'); if (v !== '' && !/^\d*\.?\d*$/.test(v)) return;
    v = v.replace(/^0+(?=\d)/, ''); setTxt(v); onChange(v === '' || v === '.' ? 0 : Number(v));
  };
  return [txt, set] as const;
}
export function NumInput({ label, value, onChange, unit, hint }: { label: string; value: number | ''; onChange: (n: number) => void; unit?: string; hint?: string; step?: number; min?: number }) {
  const [txt, set] = useNumDraft(value, onChange);
  return <Input label={label + (unit ? ` (${unit})` : '')} hint={hint} inputMode="decimal" type="text" placeholder="0" value={txt} onChange={(e) => set(e.target.value)} />;
}
export function Stepper({ value, onChange, step = 1, min = 0, max = 1e9, label, format }: { value: number; onChange: (n: number) => void; step?: number; min?: number; max?: number; label: string; format?: (n: number) => string }) {
  return (
    <div className="flex items-center justify-center gap-3" role="group" aria-label={label}>
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} className="grid h-11 w-11 place-items-center rounded-full bg-black/5 active:scale-90 disabled:opacity-30 dark:bg-white/10"><Icon n="minus" /></button>
      <output aria-live="polite" className="min-w-[4.5rem] text-center text-xl font-bold tabular-nums">{format ? format(value) : value}</output>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} className="grid h-11 w-11 place-items-center rounded-full bg-black/5 active:scale-90 disabled:opacity-30 dark:bg-white/10"><Icon n="plus" /></button>
    </div>
  );
}
export function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (<div role="radiogroup" aria-label={label} className="flex rounded-full bg-black/5 p-1 dark:bg-white/10">{options.map((o) => (<button key={o.id} role="radio" aria-checked={value === o.id} type="button" onClick={() => onChange(o.id)} className={cx('min-h-[36px] flex-1 rounded-full px-3 text-sm font-semibold transition', value === o.id ? 'bg-white text-ink shadow dark:bg-brand-600 dark:text-white' : 'text-ink-2 dark:text-white/70')}>{o.label}</button>))}</div>);
}
export function Toggle({ on, onChange, label }: { on: boolean; onChange: (b: boolean) => void; label: string }) {
  return (<button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={cx('relative h-7 w-12 shrink-0 rounded-full transition', on ? 'bg-brand-600' : 'bg-black/20 dark:bg-white/25')}><span className={cx('absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all', on ? 'left-[22px]' : 'left-0.5')} /></button>);
}
export function Empty({ icon = 'star', title, text, action }: { icon?: Parameters<typeof Icon>[0]['n']; title: string; text?: string; action?: ReactNode }) {
  return (<div className="flex flex-col items-center px-6 py-10 text-center"><span className="mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-500/10 text-brand-500"><Icon n={icon} size={26} /></span><p className="font-semibold">{title}</p>{text && <p className="mt-1 max-w-xs break-words text-sm text-ink-2 dark:text-white/60">{text}</p>}{action && <div className="mt-4">{action}</div>}</div>);
}
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cx('relative overflow-hidden rounded-2xl bg-black/5 dark:bg-white/10', className)}><div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/50 to-transparent dark:via-white/10" /></div>;
}
export const Label = ({ children, className }: { children: ReactNode; className?: string }) => <p className={cx('font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-3 dark:text-white/55', className)}>{children}</p>;

/* ---------- Progress visuals ---------- */
/** Wave-filled card background. Level animates; wave drifts unless the user prefers reduced motion. */
export function WaveFill({ pct, color, children, className, onClick, label }: { pct: number; color: string; children: ReactNode; className?: string; onClick?: () => void; label: string }) {
  const reduce = useReducedMotion(); const p = Math.max(0, Math.min(1, pct));
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag onClick={onClick} aria-label={label} className={cx('relative overflow-hidden rounded-3xl bg-white p-4 text-left shadow-card dark:bg-night-card dark:text-white', className)}>
      <motion.div aria-hidden className="absolute inset-x-0 bottom-0" initial={{ height: 0 }} animate={{ height: `${p * 100}%` }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} style={{ background: color, opacity: 0.22 }}>
        <svg className={cx('absolute -top-2 left-0 h-3 w-[200%]', !reduce && 'animate-wave')} viewBox="0 0 200 12" preserveAspectRatio="none"><path d="M0 6 Q12.5 0 25 6 T50 6 T75 6 T100 6 T125 6 T150 6 T175 6 T200 6 V12 H0z" fill={color} /></svg>
      </motion.div>
      <div className="relative">{children}</div>
    </Tag>
  );
}
export function Bar({ pct, color = '#16a34a', h = 8, label }: { pct: number; color?: string; h?: number; label?: string }) {
  return (<div role="progressbar" aria-label={label} aria-valuenow={Math.round(Math.min(100, pct * 100))} aria-valuemin={0} aria-valuemax={100} className="w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/15" style={{ height: h }}><motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${Math.min(1, Math.max(0, pct)) * 100}%` }} transition={{ duration: 0.5 }} /></div>);
}
export function Ring({ size, stroke, pct, color, track = 'rgba(0,0,0,.08)', children }: { size: number; stroke: number; pct: number; color: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  return (<svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} /><motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - Math.min(1, Math.max(0, pct))) }} transition={{ type: 'spring', stiffness: 60, damping: 16 }} />{children}</svg>);
}

/* ---------- Sheet / modal ---------- */
interface SP { title?: string; caption?: string; subtitle?: string; onClose: () => void; children: ReactNode; footer?: ReactNode; variant?: 'sheet' | 'full' | 'center'; dark?: boolean; back?: () => void; leading?: ReactNode; trailing?: ReactNode }
/**
 * Accessible modal: role=dialog + aria-modal, labelled, focus moves in on open, Tab is trapped, focus returns to the
 * opener on close. Escape is handled centrally by <Overlays/> so only the top-most dialog closes.
 */
export function Sheet({ title, caption, subtitle, onClose, children, footer, variant = 'sheet', dark, back, leading, trailing }: SP) {
  const ref = useRef<HTMLDivElement>(null); const tid = useId(); const reduce = useReducedMotion();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null; const el = ref.current;
    const first = el?.querySelector<HTMLElement>('[data-autofocus]') ?? el?.querySelector<HTMLElement>('button, input, [href]'); (first ?? el)?.focus({ preventScroll: true });
    return () => prev?.focus?.({ preventScroll: true });
  }, []);
  const trap = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !ref.current) return;
    const f = [...ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, textarea, [href], [tabindex]:not([tabindex="-1"])')].filter((x) => x.offsetParent !== null);
    if (!f.length) return; const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  const full = variant === 'full'; const center = variant === 'center';
  const panel = cx('relative flex max-h-[100dvh] w-full flex-col outline-none', full ? 'h-[100dvh] rounded-none' : center ? 'max-w-sm rounded-3xl' : 'max-w-xl rounded-t-[28px] max-h-[92dvh]', dark ? 'bg-night text-white' : 'bg-canvas text-ink dark:bg-night dark:text-white');
  return (
    <div className={cx('fixed inset-0 z-40 flex', full ? '' : center ? 'items-center justify-center p-4' : 'items-end justify-center')}>
      <motion.div aria-hidden className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={full ? undefined : onClose} />
      <motion.div ref={ref} role="dialog" aria-modal="true" aria-labelledby={title ? tid : undefined} tabIndex={-1} onKeyDown={trap} className={panel}
        initial={reduce ? { opacity: 0 } : full ? { opacity: 0, x: 40 } : center ? { opacity: 0, scale: 0.94 } : { y: '100%' }} animate={{ opacity: 1, x: 0, y: 0, scale: 1 }} exit={reduce ? { opacity: 0 } : full ? { opacity: 0, x: 40 } : center ? { opacity: 0, scale: 0.96 } : { y: '100%' }} transition={{ type: 'spring', stiffness: 380, damping: 36 }}>
        {(title || caption) && (
          <header className="flex items-start gap-2 px-4 pb-2 pt-4" style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
            {back ? <IconBtn n="left" label="Back" onClick={back} /> : leading}
            <div className="min-w-0 flex-1 pt-1.5">{caption && <Label>{caption}</Label>}{title && <h2 id={tid} className="break-words text-xl font-bold leading-tight">{title}</h2>}{subtitle && <p className="mt-0.5 break-words text-sm text-ink-2 dark:text-white/60">{subtitle}</p>}</div>
            {trailing}<IconBtn n="x" label="Close" onClick={onClose} />
          </header>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {footer && <footer className="border-t border-black/5 px-4 pt-3 dark:border-white/10" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>{footer}</footer>}
      </motion.div>
    </div>
  );
}
export { AnimatePresence };
export function Toast({ msg }: { msg: string | null }) {
  return (<div aria-live="polite" role="status" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4"><AnimatePresence>{msg && <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="max-w-sm break-words rounded-full bg-ink px-5 py-3 text-sm font-medium text-white shadow-lg">{msg}</motion.div>}</AnimatePresence></div>);
}
