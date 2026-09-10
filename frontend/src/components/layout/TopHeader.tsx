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
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-[#E5E5E5] bg-[#FFFFFF] px-4 text-[#0A0A0A] select-none shadow-2xs">
      {/* Left section: Mobile Toggle & Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 rounded-md text-slate-500 hover:text-[#0A0A0A] hover:bg-[#F5F5F5] focus-ring md:hidden"
          aria-label={isSidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#EFF6FF] text-[#2563EB] border border-blue-200 shadow-2xs">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold tracking-wider text-[#0A0A0A] text-sm uppercase font-sans">
              UniThreat<span className="text-[#2563EB] ml-0.5">AI</span>
            </span>
            <span className="text-[10px] text-slate-500 tracking-wider font-mono font-semibold">
              SOC CONSOLE
            </span>
          </div>
        </div>
      </div>

      {/* Center section: Architectural Indicators */}
      <div className="hidden lg:flex items-center gap-2.5">
        {/* Passive Ingest Indicator */}
        <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-[#EFF6FF] px-2.5 py-1 text-xs font-mono text-[#2563EB]">
          <span className="h-2 w-2 rounded-full bg-[#2563EB] shrink-0" aria-hidden="true" />
          <span className="font-semibold text-[11px] tracking-wide">PASSIVE UNIDIRECTIONAL INGEST — READ ONLY</span>
        </div>

        {/* Mock Environment Banner */}
        <div className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-mono text-amber-700">
          <PlayCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
          <span className="text-[11px] font-semibold tracking-wide">DEMO / REPLAY DATA — SIMULATED ENVIRONMENT</span>
        </div>
      </div>

      {/* Right section: Stream Indicator & UTC Clock */}
      <div className="flex items-center gap-3">
        {/* Authoritative / Unavailable Telemetry Indicator */}
        <div className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#E5E5E5] bg-[#F8FAFC] px-2.5 py-1 text-xs text-slate-600 font-mono">
          <Activity className="h-3.5 w-3.5 text-slate-500 shrink-0" />
          <span className="text-[11px] font-semibold">PIPELINE STATUS — UNAVAILABLE</span>
        </div>

        {/* Live Clock */}
        <div className="flex items-center gap-1.5 text-xs text-[#0A0A0A] font-mono bg-[#F8FAFC] border border-[#E5E5E5] px-2.5 py-1 rounded-md shadow-2xs">
          <Clock className="h-3.5 w-3.5 text-[#2563EB]" />
          <span className="font-semibold text-[11px]">{timeString || 'UTC CLOCK'}</span>
        </div>
      </div>
    </header>
  );
};
