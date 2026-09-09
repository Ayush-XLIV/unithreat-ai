import { useState, useEffect, type FC, type ComponentType } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertTriangle,
  Network,
  ShieldAlert,
  BarChart3,
  Cpu,
  Server,
  X,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  groupLabel: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    groupLabel: 'OPERATIONS',
    items: [
      { label: 'Overview', path: '/overview', icon: LayoutDashboard },
      { label: 'Live Alerts', path: '/alerts', icon: AlertTriangle, badge: '10' },
      { label: 'Flow Explorer', path: '/flows', icon: Network, badge: '12' },
    ],
  },
  {
    groupLabel: 'ANALYSIS',
    items: [
      { label: 'Threat Analysis', path: '/threat-analysis', icon: ShieldAlert },
      { label: 'Detection Analytics', path: '/analytics', icon: BarChart3 },
      { label: 'ML Intelligence', path: '/ml-intelligence', icon: Cpu },
    ],
  },
  {
    groupLabel: 'SYSTEM',
    items: [
      { label: 'System Monitoring', path: '/system-health', icon: Server },
    ],
  },
];

export const Sidebar: FC<SidebarProps> = ({ isOpen = false, onClose }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape' && onClose) {
      e.preventDefault();
      onClose();
    }
  };

  const isExpandedDesktop = !isCollapsed || isHovered;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed top-14 bottom-0 left-0 z-40 border-r border-[#151d28] bg-[#080c11] flex flex-col ${
          prefersReducedMotion ? '' : 'transition-all duration-200 ease-in-out'
        } md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${isExpandedDesktop ? 'md:w-60' : 'md:w-16'}`}
        aria-label="Main Navigation"
        onKeyDown={handleKeyDown}
      >
        {/* Mobile Header inside Sidebar */}
        <div className="flex items-center justify-between p-3 border-b border-[#121923] md:hidden">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
            SOC Navigation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-[#0d131a] focus-ring"
            aria-label="Close navigation sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Desktop Header / Collapse Toggle */}
        <div className="hidden md:flex items-center justify-between p-3 border-b border-[#121923]">
          {isExpandedDesktop ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 shadow-xs">
                  <ShieldAlert className="h-4 w-4" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-extrabold tracking-wider text-slate-100 text-xs uppercase font-sans">
                    UniThreat<span className="text-cyan-400 ml-0.5">AI</span>
                  </span>
                  <span className="text-[9px] text-slate-400 tracking-wider font-mono font-semibold">
                    SOC CONSOLE
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-[#0d131a] focus-ring"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                <ChevronLeft className="h-4 w-4 text-cyan-400" />
              </button>
            </>
          ) : (
            <div className="w-full flex justify-center">
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex h-8 w-8 items-center justify-center rounded-md bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hover:bg-cyan-900/60 focus-ring"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Primary Grouped Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-2.5 py-4 space-y-5">
          {NAV_GROUPS.map((group) => (
            <div key={group.groupLabel} className="space-y-1">
              {isExpandedDesktop ? (
                <div className="px-2.5 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                  {group.groupLabel}
                </div>
              ) : (
                <div className="h-2" />
              )}

              {group.items.map((item) => {
                const IconComponent = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `group relative flex items-center ${
                        isExpandedDesktop ? 'justify-between px-3' : 'justify-center px-0'
                      } py-2 rounded-md text-xs font-semibold ${
                        prefersReducedMotion ? '' : 'transition-all duration-150'
                      } focus-ring ${
                        isActive
                          ? 'bg-cyan-950/40 text-cyan-300 border border-cyan-800/50 shadow-xs shadow-cyan-950/50'
                          : 'text-slate-300 hover:text-slate-100 hover:bg-[#0d131a]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconComponent
                            className={`h-4 w-4 shrink-0 transition-colors ${
                              isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                            }`}
                          />
                          {isExpandedDesktop && <span className="truncate">{item.label}</span>}
                        </div>

                        {isExpandedDesktop && item.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                              isActive
                                ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700/50'
                                : 'bg-[#0a0f14] text-slate-400 border border-[#151d28]'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}

                        {/* Collapsed Tooltip */}
                        {!isExpandedDesktop && (
                          <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#0d131a] text-slate-100 text-xs font-mono font-medium rounded border border-[#151d28] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                            {item.label}
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer — Architectural Security Badge */}
        <div className="p-3 border-t border-[#151d28] bg-[#05080b]">
          {isExpandedDesktop ? (
            <div className="rounded-md border border-[#151d28] bg-[#0a0f14] p-2.5 text-xs text-slate-400 font-mono space-y-1">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-sans flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-cyan-400" />
                <span>Tap Architecture</span>
              </div>
              <div className="text-cyan-400 font-semibold text-[11px] truncate">
                UNIDIRECTIONAL / READ ONLY
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div
                className="group relative flex h-8 w-8 items-center justify-center rounded-md border border-[#151d28] bg-[#0a0f14] text-cyan-400 cursor-help"
                title="Unidirectional / Read Only"
              >
                <Lock className="h-4 w-4" />
                <div className="absolute left-full ml-2.5 px-2.5 py-1 bg-[#0d131a] text-slate-100 text-xs font-mono font-medium rounded border border-[#151d28] shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
                  Unidirectional / Read Only
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
