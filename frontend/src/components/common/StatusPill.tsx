import type { FC } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Wifi,
  WifiOff,
  RefreshCw,
  Radio,
  PlayCircle,
  Activity,
} from 'lucide-react';

export type StatusType =
  | 'HEALTHY'
  | 'DEGRADED'
  | 'ERROR'
  | 'UNAVAILABLE'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'RECONNECTING'
  | 'LIVE'
  | 'REPLAY';

export interface StatusPillProps {
  status: StatusType | string | null | undefined;
  size?: 'sm' | 'md';
  className?: string;
}

export const StatusPill: FC<StatusPillProps> = ({
  status,
  size = 'md',
  className = '',
}) => {
  const displayStatus = (status || '').toUpperCase() || 'N/A';

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1 font-mono tracking-wider'
      : 'px-2.5 py-1 text-xs gap-1.5 font-mono tracking-wider';

  const iconSizes = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  switch (displayStatus) {
    case 'HEALTHY':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-emerald-500/40 bg-emerald-950/30 text-emerald-300 select-none ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <CheckCircle2 className={`${iconSizes} text-emerald-400 shrink-0`} aria-hidden="true" />
          <span>HEALTHY</span>
        </span>
      );

    case 'DEGRADED':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-amber-500/40 bg-amber-950/30 text-amber-300 select-none ${sizeClasses} ${className}`}
        >
          <AlertTriangle className={`${iconSizes} text-amber-400 shrink-0`} aria-hidden="true" />
          <span>DEGRADED</span>
        </span>
      );

    case 'ERROR':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-rose-500/40 bg-rose-950/30 text-rose-300 select-none ${sizeClasses} ${className}`}
        >
          <XCircle className={`${iconSizes} text-rose-400 shrink-0`} aria-hidden="true" />
          <span>ERROR</span>
        </span>
      );

    case 'UNAVAILABLE':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-slate-700/60 bg-slate-800/40 text-slate-400 select-none ${sizeClasses} ${className}`}
        >
          <HelpCircle className={`${iconSizes} text-slate-400 shrink-0`} aria-hidden="true" />
          <span>UNAVAILABLE</span>
        </span>
      );

    case 'CONNECTED':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-emerald-500/40 bg-emerald-950/30 text-emerald-300 select-none ${sizeClasses} ${className}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <Wifi className={`${iconSizes} text-emerald-400 shrink-0`} aria-hidden="true" />
          <span>CONNECTED</span>
        </span>
      );

    case 'DISCONNECTED':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-rose-500/40 bg-rose-950/30 text-rose-300 select-none ${sizeClasses} ${className}`}
        >
          <WifiOff className={`${iconSizes} text-rose-400 shrink-0`} aria-hidden="true" />
          <span>DISCONNECTED</span>
        </span>
      );

    case 'RECONNECTING':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-amber-500/40 bg-amber-950/30 text-amber-300 select-none ${sizeClasses} ${className}`}
        >
          <RefreshCw className={`${iconSizes} text-amber-400 animate-spin shrink-0`} aria-hidden="true" />
          <span>RECONNECTING</span>
        </span>
      );

    case 'LIVE':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-emerald-500/50 bg-emerald-950/40 text-emerald-300 shadow-xs shadow-emerald-950/50 select-none ${sizeClasses} ${className}`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <Radio className={`${iconSizes} text-emerald-400 shrink-0`} aria-hidden="true" />
          <span>LIVE</span>
        </span>
      );

    case 'REPLAY':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-cyan-500/40 bg-cyan-950/30 text-cyan-300 select-none ${sizeClasses} ${className}`}
        >
          <PlayCircle className={`${iconSizes} text-cyan-400 shrink-0`} aria-hidden="true" />
          <span>REPLAY</span>
        </span>
      );

    default:
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-slate-700/60 bg-slate-800/40 text-slate-300 select-none ${sizeClasses} ${className}`}
        >
          <Activity className={`${iconSizes} text-slate-400 shrink-0`} aria-hidden="true" />
          <span>{displayStatus}</span>
        </span>
      );
  }
};

