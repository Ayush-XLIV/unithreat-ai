import { useEffect, useRef, useState, type FC } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ExternalLink,
  ShieldAlert,
  Cpu,
  Network,
  FileText,
  CheckCircle,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import type { ThreatAlert } from '../../types/alert';
import { SeverityBadge } from '../common/SeverityBadge';
import { ThreatClassBadge } from '../common/ThreatClassBadge';
import { ConfidenceGauge } from '../common/ConfidenceGauge';

export interface AlertDetailDrawerProps {
  alert: ThreatAlert | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AlertDetailDrawer: FC<AlertDetailDrawerProps> = ({
  alert,
  isOpen,
  onClose,
}) => {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  const handleCopyText = async (text: string, fieldName: string) => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
      }
    } catch {
      // Do not show "Copied!" if clipboard writing fails
    }
  };

  useEffect(() => {
    if (isOpen && alert) {
      // 1. Save currently focused element
      if (document.activeElement && document.activeElement instanceof HTMLElement) {
        previousFocusRef.current = document.activeElement;
      }

      // 2. Move focus into modal
      const focusTimer = setTimeout(() => {
        if (closeButtonRef.current) {
          closeButtonRef.current.focus();
        } else if (drawerRef.current) {
          drawerRef.current.focus();
        }
      }, 10);

      // 3. Global keyboard listener for Escape & Focus Trapping
      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
          return;
        }

        if (e.key === 'Tab' && drawerRef.current) {
          const focusableSelectors =
            'button:not([disabled]), a[href]:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]):not([disabled])';

          const rawElements = Array.from(
            drawerRef.current.querySelectorAll<HTMLElement>(focusableSelectors)
          );

          // Filter visible elements
          const focusableElements = rawElements.filter((el) => {
            if (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0) return true;
            try {
              const style = window.getComputedStyle(el);
              return style.display !== 'none' && style.visibility !== 'hidden';
            } catch {
              return true;
            }
          });

          if (focusableElements.length === 0) {
            e.preventDefault();
            drawerRef.current.focus();
            return;
          }

          const firstElement = focusableElements[0];
          const lastElement = focusableElements[focusableElements.length - 1];

          if (e.shiftKey) {
            if (
              document.activeElement === firstElement ||
              !drawerRef.current.contains(document.activeElement)
            ) {
              e.preventDefault();
              lastElement.focus();
            }
          } else {
            if (
              document.activeElement === lastElement ||
              !drawerRef.current.contains(document.activeElement)
            ) {
              e.preventDefault();
              firstElement.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);

      return () => {
        clearTimeout(focusTimer);
        document.removeEventListener('keydown', handleGlobalKeyDown);
        if (previousFocusRef.current && previousFocusRef.current.isConnected) {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [isOpen, alert, onClose]);

  if (!isOpen || !alert) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs transition-opacity overflow-hidden"
      onClick={onClose}
      aria-hidden="true"
    >
      {/* Centered Modal Container */}
      <div
        ref={drawerRef}
        onClick={(e) => e.stopPropagation()}
        className={`relative w-full max-w-[840px] max-h-[88vh] flex flex-col rounded-xl border border-[#151d28] bg-[#080c11] text-slate-100 shadow-2xl overflow-hidden focus:outline-none ${
          prefersReducedMotion ? '' : 'transition-all duration-200 ease-out'
        }`}
        aria-labelledby="alert-drawer-title"
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
      >
        {/* Fixed Modal Header */}
        <div className="flex items-center justify-between border-b border-[#151d28] px-5 py-4 bg-[#0a0f14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950/80 text-rose-400 border border-rose-800/60 shadow-xs">
              <ShieldAlert className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 id="alert-drawer-title" className="text-sm sm:text-base font-extrabold text-slate-100 uppercase tracking-wide font-sans">
                Alert Detail Inspector
              </h2>
              <p className="text-[11px] font-mono text-slate-400">
                Flow: <span className="text-cyan-400 font-semibold">{alert.flow_id}</span>
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-[#0d131a] hover:text-slate-100 focus-ring transition-colors"
            aria-label="Close alert detail inspector"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Investigation Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Key Classification Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#151d28] bg-[#0a0f14] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <SeverityBadge severity={alert.severity} size="md" />
              <ThreatClassBadge threatClass={alert.threat_class} size="md" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Confidence:</span>
              <ConfidenceGauge confidence={alert.confidence} size="md" />
            </div>
          </div>

          {/* Network Flow Metadata Grid */}
          <div className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-[#121923] pb-2.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Network className="h-3.5 w-3.5 text-cyan-400" />
                Network Flow Metadata
              </h3>

              <button
                type="button"
                onClick={() => handleCopyText(alert.flow_id, 'flow_id')}
                className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-cyan-300 focus-ring"
                title="Copy Flow ID"
              >
                {copiedField === 'flow_id' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy Flow ID</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs font-mono">
              <div className="rounded border border-[#151d28] bg-[#0d131a] p-2.5">
                <span className="text-slate-400 block text-[10px] font-sans">Timestamp</span>
                <span className="text-slate-200 font-semibold">{alert.timestamp}</span>
              </div>
              <div className="rounded border border-[#151d28] bg-[#0d131a] p-2.5">
                <span className="text-slate-400 block text-[10px] font-sans">Flow ID</span>
                <span className="text-cyan-400 font-bold break-all">{alert.flow_id}</span>
              </div>
              <div className="rounded border border-[#151d28] bg-[#0d131a] p-2.5">
                <span className="text-slate-400 block text-[10px] font-sans">Protocol</span>
                <span className="text-slate-200 font-semibold">{alert.protocol || 'N/A'}</span>
              </div>
              <div className="rounded border border-[#151d28] bg-[#0d131a] p-2.5">
                <span className="text-slate-400 block text-[10px] font-sans">Source IP</span>
                <span className="text-slate-200 font-semibold">{alert.source_ip || 'N/A'}</span>
              </div>
              <div className="rounded border border-[#151d28] bg-[#0d131a] p-2.5">
                <span className="text-slate-400 block text-[10px] font-sans">Destination IP</span>
                <span className="text-slate-200 font-semibold">{alert.destination_ip || 'N/A'}</span>
              </div>
              <div className="rounded border border-[#151d28] bg-[#0d131a] p-2.5">
                <span className="text-slate-400 block text-[10px] font-sans">Model Version</span>
                <span className="text-cyan-300 flex items-center gap-1 font-semibold">
                  <Cpu className="h-3 w-3 text-cyan-400" />
                  {alert.model_version || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Backend Intelligence Explanation */}
          {alert.explanation && (
            <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-4 space-y-1">
              <h4 className="text-xs font-bold text-cyan-300 font-sans flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-cyan-400" />
                Backend Intelligence Explanation
              </h4>
              <p className="text-xs text-slate-300 font-sans leading-relaxed break-words">
                {alert.explanation}
              </p>
            </div>
          )}

          {/* Evidence Signals List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Evidence Signals ({alert.evidence.length})
            </h3>

            {alert.evidence.length === 0 ? (
              <div className="rounded-md border border-[#151d28] p-3.5 text-xs text-slate-400 font-sans bg-[#0a0f14]">
                No evidence signals attached to this alert.
              </div>
            ) : (
              alert.evidence.map((sig, idx) => (
                <div
                  key={`${sig.signal_name}-${idx}`}
                  className="rounded-lg border border-[#151d28] bg-[#0a0f14] p-3.5 text-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-200 break-all text-xs">
                      {sig.signal_name}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold border ${
                        sig.direction === 'supporting'
                          ? 'border-amber-800/60 bg-amber-950/40 text-amber-300'
                          : sig.direction === 'contradicting'
                          ? 'border-blue-800/60 bg-blue-950/40 text-blue-300'
                          : 'border-slate-700 bg-slate-800 text-slate-300'
                      }`}
                    >
                      {sig.direction === 'supporting' && <CheckCircle className="h-3 w-3" />}
                      {sig.direction === 'neutral' && <Info className="h-3 w-3" />}
                      {sig.direction}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 bg-[#0d131a] p-2 rounded border border-[#151d28]">
                    <div>
                      <span>Value: </span>
                      <strong className="text-cyan-300 break-all">{sig.value}</strong>
                    </div>
                    <div>
                      <span>Reliability: </span>
                      <strong className="text-emerald-400">
                        {Math.round(sig.reliability * 100)}%
                      </strong>
                    </div>
                  </div>

                  {Boolean(sig.supporting_features?.length) && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 font-sans">Supporting Features:</span>
                      {sig.supporting_features?.map((feat) => (
                        <span
                          key={feat}
                          className="rounded bg-[#0d131a] px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-[#151d28] break-all font-semibold"
                        >
                          {feat}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Fixed Modal Footer Navigation */}
        <div className="border-t border-[#151d28] bg-[#0a0f14] p-4 shrink-0">
          <Link
            to={`/alerts/flow/${alert.flow_id}`}
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/50 bg-[#0d131a] px-4 py-2.5 text-xs font-bold text-cyan-300 hover:bg-cyan-950/50 hover:border-cyan-400 hover:text-white focus-ring transition-colors shadow-xs font-mono"
          >
            <span>View Full Flow Investigation</span>
            <ExternalLink className="h-4 w-4 text-cyan-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
