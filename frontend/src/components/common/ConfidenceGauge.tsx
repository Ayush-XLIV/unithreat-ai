import type { FC } from 'react';

export interface ConfidenceGaugeProps {
  confidence: number | null | undefined;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export const ConfidenceGauge: FC<ConfidenceGaugeProps> = ({
  confidence,
  showLabel = true,
  size = 'md',
  className = '',
}) => {
  // Valid contract range for confidence score is 0..1
  if (
    confidence === null ||
    confidence === undefined ||
    Number.isNaN(confidence) ||
    confidence < 0 ||
    confidence > 1
  ) {
    return (
      <span className={`text-slate-500 font-mono text-xs ${className}`}>
        N/A
      </span>
    );
  }

  // Display formatting only: scale 0..1 to percentage 0..100
  const percentage = Math.round(confidence * 100);
  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const barWidth = size === 'sm' ? 'w-14' : 'w-20';

  // Multi-tier color coding (visually distinct telemetry cyan/teal tones)
  let barColor = 'bg-cyan-400 shadow-xs shadow-cyan-500/50';
  let textColor = 'text-cyan-300';
  if (confidence < 0.5) {
    barColor = 'bg-slate-400';
    textColor = 'text-slate-300';
  } else if (confidence < 0.8) {
    barColor = 'bg-teal-400 shadow-xs shadow-teal-500/40';
    textColor = 'text-teal-300';
  }

  return (
    <div
      className={`inline-flex items-center gap-2 select-none ${className}`}
      title={`Confidence: ${percentage}% (${confidence.toFixed(3)})`}
    >
      {/* Neutral confidence visualization bar */}
      <div
        className={`${barWidth} rounded-full bg-slate-900 border border-slate-700/60 overflow-hidden ${barHeight}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Confidence score: ${percentage}%`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {showLabel && (
        <span className={`font-mono text-xs font-semibold ${textColor} min-w-[34px] text-right`}>
          {percentage}%
        </span>
      )}
    </div>
  );
};

