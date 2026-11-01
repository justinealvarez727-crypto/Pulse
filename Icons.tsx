import type { Equipment } from '@/types';

const P: Record<string, string> = {
  x: 'M6 6l12 12M18 6L6 18', plus: 'M12 5v14M5 12h14', minus: 'M5 12h14', check: 'M5 12.5l4.5 4.5L19 7.5',
  left: 'M15 5l-7 7 7 7', right: 'M9 5l7 7-7 7', down: 'M6 9l6 6 6-6', up: 'M6 15l6-6 6 6',
  cal: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  drop: 'M12 3s6 6.2 6 10.5A6 6 0 016 13.5C6 9.2 12 3 12 3z', flame: 'M12 3c1 3.5 5 5.5 5 10a5 5 0 01-10 0c0-2 1-3.2 2-4.2.3 1.4 1 2 1.7 2.2C10.2 8 10.5 5.5 12 3z',
  steps: 'M8 4c1.7 0 2.5 1.6 2.5 3.4S9.6 11 8 11 5.5 9.2 5.5 7.4 6.3 4 8 4zM16 11c1.7 0 2.5 1.6 2.5 3.4S17.6 18 16 18s-2.5-1.8-2.5-3.6S14.3 11 16 11zM7 14h2v3H7zM15 19.5h2',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3.5 9v6M20.5 9v6M6.5 12h11', clock: 'M12 7v5l3 2M12 21a9 9 0 100-18 9 9 0 000 18z', timer: 'M12 8v4l2.5 1.5M9 2h6M12 21a8 8 0 100-16 8 8 0 000 16z',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v6h14v-6', image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9.5h.01', dots: 'M5 12h.01M12 12h.01M19 12h.01', edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  trash: 'M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13', home: 'M4 11l8-7 8 7v9h-5v-6H9v6H4z', chart: 'M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-8', user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.5-6 8-6s8 2 8 6',
  kitchen: 'M4 11h16v2a6 6 0 01-6 6h-4a6 6 0 01-6-6v-2zM8 7c0-1.5 1-1.5 1-3M12 7c0-1.5 1-1.5 1-3M16 7c0-1.5 1-1.5 1-3', search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM20 20l-4-4',
  play: 'M8 5l11 7-11 7z', pause: 'M8 5v14M16 5v14', scale: 'M5 4h14v16H5zM9 9a3 3 0 016 0z M12 9l1.5-1', info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7.5h.01',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z', bolt: 'M13 3L5 13h6l-1 8 8-10h-6z', book: 'M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3V4z M5 17a3 3 0 013-3h10', refresh: 'M20 12a8 8 0 10-2.5 5.8M20 5v5h-5',
  stop: 'M7 7h10v10H7z', camera: 'M4 8h4l1.5-2h5L16 8h4v11H4zM12 17a3.5 3.5 0 100-7 3.5 3.5 0 000 7z', brain: 'M9 4a3 3 0 00-3 3 3 3 0 00-2 3 3 3 0 002 3 3 3 0 003 4V4zM15 4a3 3 0 013 3 3 3 0 012 3 3 3 0 01-2 3 3 3 0 01-3 4V4z',
};
export type IconName = keyof typeof P;
export function Icon({ n, size = 20, className = '', stroke = 1.9 }: { n: IconName; size?: number; className?: string; stroke?: number }) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false"><path d={P[n]} /></svg>);
}
const EQ_ICON: Record<Equipment, IconName> = { Barbell: 'dumbbell', Dumbbell: 'dumbbell', Kettlebell: 'bolt', Cable: 'refresh', Machine: 'stop', 'Smith Machine': 'stop', 'EZ Bar': 'dumbbell', 'Pull-up Bar': 'up', 'Resistance Band': 'refresh', Bodyweight: 'user' };
/** Exercise pictures are replaced by icons (spec). */
export function ExerciseIcon({ equipment, size = 40 }: { equipment: Equipment; size?: number }) {
  return (<span className="grid shrink-0 place-items-center rounded-xl bg-brand-500/15 text-brand-500" style={{ width: size, height: size }}><Icon n={EQ_ICON[equipment]} size={size * 0.5} /></span>);
}
