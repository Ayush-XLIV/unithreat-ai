import type { FC } from 'react';
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from 'lucide-react';
import type { SeverityLevel } from '../../types';

export interface SeverityBadgeProps {
  severity: SeverityLevel;
  size?: 'sm' | 'md';
  className?: string;
}

export const SeverityBadge: FC<SeverityBadgeProps> = ({
  severity,
  size = 'md',
  className = '',
}) => {
  const normalizedSeverity = (severity || 'LOW').toUpperCase() as SeverityLevel;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1 font-mono tracking-wider'
      : 'px-2.5 py-1 text-xs gap-1.5 font-mono tracking-wider';

  const iconSizes = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  switch (normalizedSeverity) {
    case 'CRITICAL':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-bold border-rose-500/50 bg-rose-950/40 text-rose-300 shadow-xs shadow-rose-950/50 select-none ${sizeClasses} ${className}`}
          title="Severity: CRITICAL"
        >
          <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" aria-hidden="true" />
          <AlertOctagon className={`${iconSizes} text-rose-400 shrink-0`} aria-hidden="true" />
          <span>CRITICAL</span>
        </span>
      );
    case 'HIGH':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-bold border-orange-500/45 bg-orange-950/35 text-orange-300 shadow-xs shadow-orange-950/40 select-none ${sizeClasses} ${className}`}
          title="Severity: HIGH"
        >
          <AlertTriangle className={`${iconSizes} text-orange-400 shrink-0`} aria-hidden="true" />
          <span>HIGH</span>
        </span>
      );
    case 'MEDIUM':
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-amber-500/40 bg-amber-950/30 text-amber-300 select-none ${sizeClasses} ${className}`}
          title="Severity: MEDIUM"
        >
          <AlertCircle className={`${iconSizes} text-amber-400 shrink-0`} aria-hidden="true" />
          <span>MEDIUM</span>
        </span>
      );
    case 'LOW':
    default:
      return (
        <span
          className={`inline-flex items-center rounded-md border font-semibold border-slate-700/60 bg-slate-800/40 text-slate-300 select-none ${sizeClasses} ${className}`}
          title="Severity: LOW"
        >
          <Info className={`${iconSizes} text-slate-400 shrink-0`} aria-hidden="true" />
          <span>LOW</span>
        </span>
      );
  }
};

