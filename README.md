# Pulse — Fitness, Nutrition & Fasting Tracker

React 18 + TypeScript + Zustand (persisted) + Tailwind + Framer Motion, offline-first PWA, WCAG 2.1 AA oriented.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Leitner engine tests
npm run build      # typecheck + production build (+ service worker)
npm run analyze    # bundle report at dist/stats.html
```

Deploy: Vercel (`vercel.json`) or Netlify (`netlify.toml`) — SPA rewrite + immutable asset caching + no-cache service worker.
Optional `VITE_TELEMETRY_URL` (see `.env.example`) receives perf/error beacons; empty = fully local.

## Architecture
- `src/types.ts` – all domain interfaces. `src/lib/` – pure logic (dates, calc/BMI/targets/bits, Leitner, fasting hours, food estimate, perf).
- `src/store/` – one persisted Zustand store per domain (profile, nutrition, fasting, activity, training, review, gallery) + non-persisted `ui` overlay stack. Safe storage falls back to memory when localStorage is blocked.
- `src/components/Overlays.tsx` – registry of lazy-loaded screens/sheets; each is its own chunk, wrapped in an ErrorBoundary. Sheets are focus-trapped `role=dialog`, Esc closes the top one.
- `src/data/` – ~250-exercise library (filter by equipment / muscle), muscle taxonomy, food table, sample-data generator (Me → Manage → Load sample data).
- Leitner: `src/lib/leitner.ts` — intervals I_k = ceil(b·r^(k−1)) (1,2,4,8,16 d), promote/reset, exponential-decay retention anchored to 90% at due date. Used by Me → Form check (technique cue cards).
