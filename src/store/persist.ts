import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * localStorage can throw (private mode, quota, blocked storage). Fall back to an in-memory map so the app
 * still runs — it just won't persist. All stores share this wrapper.
 */
const mem = new Map<string, string>();
const memory: StateStorage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) };
function pick(): StateStorage {
  try { const t = '__pulse_probe'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage; } catch { return memory; }
}
export const storage = createJSONStorage(pick);
export const KEY = (n: string) => `pulse.${n}.v1`;
