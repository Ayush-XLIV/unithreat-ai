import type { FC } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export const HeroPage: FC = () => {
  return (
    <div
      className="min-h-screen w-full bg-white flex flex-col selection:bg-blue-500/20 selection:text-[#005dfd]"
      style={{
        backgroundImage: 'radial-gradient(#d4d4d8 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* Top Navbar */}
      <header className="w-full bg-white border-b border-[#f1f3f5]">
        <div className="w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 h-[52px] flex items-center justify-between">
          {/* Brand on Left */}
          <div className="flex items-center gap-3">
            {/* Shield Icon Box */}
            <div className="w-[34px] h-[34px] rounded-lg border border-[#e2e8f0] bg-white flex items-center justify-center">
              <svg
                className="w-[18px] h-[18px] text-[#005dfd]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <circle cx="12" cy="11" r="3.2" strokeWidth="1.6" />
                <circle cx="12" cy="11" r="1.2" fill="currentColor" stroke="none" />
              </svg>
            </div>
            {/* Brand Text */}
            <span className="font-mono font-bold text-base sm:text-[17px] tracking-wider text-[#0a0a0a] select-none">
              NETRA <span className="text-[#005dfd]">AI</span>
            </span>
          </div>

          {/* Right Button */}
          <Link
            to="/alerts"
            className="inline-flex items-center gap-2 bg-[#005dfd] hover:bg-[#0052e0] text-white text-[11px] font-mono font-bold tracking-wider uppercase px-4 h-9 rounded-lg transition-colors"
          >
            <span>ENTER SOC CONSOLE</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </Link>
        </div>
      </header>

      {/* Hero Body - Centered */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-2 sm:-mt-3">
        {/* Large Centered "NETRA AI" */}
        <h1 className="font-sans font-black text-6xl sm:text-7xl md:text-8xl lg:text-[104px] tracking-tight text-center leading-none select-none">
          <span className="text-[#0a0a0a]">NETRA</span>{' '}
          <span className="text-[#005dfd]">AI</span>
        </h1>

        {/* Subtitle - 2 Lines Centered */}
        <div className="mt-7 sm:mt-8 text-center font-sans font-extrabold tracking-tight select-none">
          <div className="text-[#0a0a0a] text-lg sm:text-xl md:text-2xl lg:text-[28px] leading-tight uppercase">
            AI-BASED DETECTION OF CYBER THREATS IN
          </div>
          <div className="text-[#005dfd] text-lg sm:text-xl md:text-2xl lg:text-[28px] leading-tight uppercase mt-1.5 sm:mt-2">
            UNIDIRECTIONAL IP TRAFFIC
          </div>
        </div>

        {/* Centered CTA Button */}
        <div className="mt-7 sm:mt-8">
          <Link
            to="/alerts"
            className="inline-flex items-center justify-center gap-2.5 w-[255px] h-[47px] rounded-lg bg-[#005dfd] hover:bg-[#0052e0] text-white text-xs sm:text-[13px] font-mono font-bold tracking-wider uppercase transition-colors"
          >
            <span>ENTER SOC CONSOLE</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </Link>
        </div>
      </main>
    </div>
  );
};
