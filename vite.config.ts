/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { fileURLToPath } from 'node:url';

/**
 * Architecture notes
 * - manualChunks splits heavy vendors (react, framer-motion) from app code so
 *   the first paint ships only what the Today tab needs; every overlay and
 *   tab screen is React.lazy() (see components/Overlays.tsx).
 * - PWA: generateSW with autoUpdate. App shell + hashed assets are precached,
 *   so the app is fully usable offline (all data lives in localStorage).
 */
export default defineConfig(({ mode }) => ({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          motion: ['framer-motion'],
          state: ['zustand'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'Pulse — Fitness, Nutrition & Fasting Tracker',
        short_name: 'Pulse',
        description: 'Routines, workouts, calories, water, steps, fasting and weight in one offline-first app.',
        theme_color: '#14532d',
        background_color: '#f4f5f4',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['health', 'fitness', 'lifestyle'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Log water', url: '/?action=water' },
          { name: 'Start workout', url: '/?action=workout' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallback: '/index.html' },
    }),
    mode === 'analyze' && visualizer({ filename: 'dist/stats.html', gzipSize: true }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
}));
