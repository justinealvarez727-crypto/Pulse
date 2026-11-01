import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { storage, KEY } from './persist';
import { uid } from '@/lib/date';
interface S { photos: { id: string; date: string; src: string }[]; add: (date: string, src: string) => void; remove: (id: string) => void }
export const useGallery = create<S>()(persist((set) => ({ photos: [], add: (date, src) => set((s) => ({ photos: [{ id: uid(), date, src }, ...s.photos].slice(0, 40) })), remove: (id) => set((s) => ({ photos: s.photos.filter((p) => p.id !== id) })) }), { name: KEY('gallery'), storage, version: 1 }));
