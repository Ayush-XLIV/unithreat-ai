import type { FC, ReactNode } from 'react';
import {
  Inbox,
  AlertTriangle,
  HelpCircle,
  WifiOff,
  RefreshCw,
  Loader2,
} from 'lucide-react';

export type DataState =
  | 'loading'
  | 'empty'
  | 'error'
  | 'unavailable'
  | 'disconnected'
  | 'ready';

export interface DataStateWrapperProps {
  state: DataState;
  children?: ReactNode;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  errorMessage?: string;
  onRetry?: () => void;
  className?: string;
}

export const DataStateWrapper: FC<DataStateWrapperProps> = ({
  state,
  children,
  loadingMessage = 'Loading backend data observations...',
  emptyTitle = 'No Data Available',
  emptyMessage = 'No matching network observations found for the selected criteria.',
  errorMessage = 'Unable to load data from backend service.',
  onRetry,
  className = '',
}) => {
  if (state === 'ready') {
    return <>{children}</>;
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-[#1b2433] bg-[#0c1017] p-8 text-center min-h-[200px] ${className}`}
      role={state === 'error' ? 'alert' : 'status'}
    >
      {state === 'loading' && (
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center p-2">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-400" aria-hidden="true" />
          </div>
          <p className="text-xs font-semibold text-cyan-300 font-mono tracking-wider uppercase">
            {loadingMessage}
          </p>
        </div>
      )}

      {state === 'empty' && (
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <div className="rounded-full bg-slate-900/90 p-3 text-slate-400 border border-slate-800">
            <Inbox className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-slate-200 mt-1 font-sans">{emptyTitle}</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">{emptyMessage}</p>
        </div>
      )}

      {state === 'error' && (
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <div className="rounded-full bg-rose-950/80 p-3 text-rose-400 border border-rose-800/60 shadow-xs shadow-rose-950/60">
            <AlertTriangle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-rose-300 mt-1 font-sans">Data Error</h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">{errorMessage}</p>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-mono font-semibold text-slate-200 hover:bg-slate-700 hover:text-white focus-ring transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Request</span>
            </button>
          )}
        </div>
      )}

      {state === 'unavailable' && (
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <div className="rounded-full bg-slate-900/90 p-3 text-slate-400 border border-slate-800">
            <HelpCircle className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-slate-300 mt-1 font-sans">
            Telemetry Unavailable
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            The requested data telemetry is not currently defined or supplied by backend.
          </p>
        </div>
      )}

      {state === 'disconnected' && (
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <div className="rounded-full bg-amber-950/80 p-3 text-amber-400 border border-amber-800/60 shadow-xs shadow-amber-950/60">
            <WifiOff className="h-6 w-6" aria-hidden="true" />
          </div>
          <h3 className="text-sm font-bold text-amber-300 mt-1 font-sans">
            Data Source Disconnected
          </h3>
          <p className="text-xs text-slate-400 font-sans leading-relaxed">
            Data transport connection between frontend and service is offline.
          </p>
        </div>
      )}
    </div>
  );
};

