import { useState, useEffect, type FC } from 'react';
import { Menu, X, ShieldAlert, Clock, Activity, PlayCircle } from 'lucide-react';

export interface TopHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const TopHeader: FC<TopHeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toUTCString().replace('GMT', 'UTC'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#151d28] bg-[#080c11] px-4 text-slate-200 select-none">
      {/* Left section: Mobile Toggle & Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-[#0d131a] focus-ring md:hidden"
          aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-xs shadow-cyan-950/60">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-wider text-slate-100 text-sm uppercase font-sans">
              UniThreat<span className="text-cyan-400 ml-0.5">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wider font-mono font-semibold">
              SOC CONSOLE
            </span>
          </div>
        </div>
      </div>

      {/* Center section: Architectural Indicators */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Passive Ingest Indicator */}
        <div className="inline-flex items-center gap-1.5 rounded-md border border-cyan-800/50 bg-cyan-950/30 px-2.5 py-1 text-xs font-mono text-cyan-300">
          <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[11px] tracking-wide">PASSIVE UNIDIRECTIONAL INGEST — READ ONLY</span>
        </div>

        {/* Mock Environment Banner */}
        <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-800/50 bg-amber-950/30 px-2.5 py-1 text-xs font-mono text-amber-300">
          <PlayCircle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
          <span className="text-[11px] font-semibold tracking-wide">DEMO / REPLAY DATA — SIMULATED ENVIRONMENT</span>
        </div>
      </div>

      {/* Right section: Stream Indicator & UTC Clock */}
      <div className="flex items-center gap-3">
        {/* Authoritative / Unavailable Telemetry Indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#151d28] bg-[#0a0f14] px-2.5 py-1 text-xs text-slate-400 font-mono">
          <Activity className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-semibold">PIPELINE STATUS — UNAVAILABLE</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 text-xs text-slate-200 font-mono bg-[#0a0f14] border border-[#151d28] px-2.5 py-1 rounded-md shadow-xs">
          <Clock className="h-3.5 w-3.5 text-cyan-400" />
          <span className="font-semibold text-[11px]">{timeString || 'UTC CLOCK'}</span>
        </div>
      </div>
    </header>
  );
};


