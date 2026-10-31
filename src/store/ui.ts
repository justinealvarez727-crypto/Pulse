import { create } from 'zustand';
import type { YMD } from '@/types';
import { logicalToday } from '@/lib/date';
import { useProfile } from './profile';

export type Tab = 'today' | 'progress' | 'kitchen' | 'me';
export interface Overlay { k: string; p?: Record<string, unknown> }
interface S {
  tab: Tab; date: YMD; stack: Overlay[]; toast: string | null; flip: boolean; macroPage: number;
  setTab: (t: Tab) => void; setDate: (d: YMD) => void; open: (k: string, p?: Record<string, unknown>) => void; close: () => void; closeAll: () => void;
  replace: (k: string, p?: Record<string, unknown>) => void; say: (m: string) => void; setFlip: (b: boolean) => void;
}
let toastTimer: ReturnType<typeof setTimeout> | undefined;
export const today = () => logicalToday(useProfile.getState().profile.dayResetHour);
export const useUI = create<S>((set) => ({
  tab: 'today', date: today(), stack: [], toast: null, flip: false, macroPage: 0,
  setTab: (tab) => set({ tab, stack: [] }), setDate: (date) => set({ date }),
  open: (k, p) => set((s) => ({ stack: [...s.stack, { k, p }] })),
  close: () => set((s) => ({ stack: s.stack.slice(0, -1) })), closeAll: () => set({ stack: [] }),
  replace: (k, p) => set((s) => ({ stack: [...s.stack.slice(0, -1), { k, p }] })),
  say: (toast) => { set({ toast }); clearTimeout(toastTimer); toastTimer = setTimeout(() => set({ toast: null }), 2600); },
  setFlip: (flip) => set({ flip }),
}));
