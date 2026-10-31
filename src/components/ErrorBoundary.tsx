import { Component, type ReactNode } from 'react';
import { reportError } from '@/lib/perf';

interface P { children: ReactNode; label?: string; compact?: boolean; onReset?: () => void }
/** Catches render errors per-screen so one broken overlay never white-screens the app. */
export class ErrorBoundary extends Component<P, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidCatch(err: Error, info: { componentStack?: string | null }) { reportError(err, info.componentStack ?? this.props.label); }
  reset = () => { this.setState({ err: null }); this.props.onReset?.(); };
  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div role="alert" className={`m-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-900 ${this.props.compact ? '' : 'mx-auto mt-16 max-w-md'}`}>
        <p className="font-semibold">Something went wrong{this.props.label ? ` in ${this.props.label}` : ''}.</p>
        <p className="mt-1 break-words text-sm opacity-80">{this.state.err.message}</p>
        <div className="mt-4 flex gap-2">
          <button className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white" onClick={this.reset}>Try again</button>
          {!this.props.compact && <button className="rounded-xl border border-red-300 px-4 py-2 text-sm font-semibold" onClick={() => location.reload()}>Reload app</button>}
        </div>
      </div>
    );
  }
}
