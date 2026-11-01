import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { initPerf } from './lib/perf';
import './index.css';

initPerf();
registerSW({ immediate: true });
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><ErrorBoundary label="the app"><App /></ErrorBoundary></React.StrictMode>,
);
