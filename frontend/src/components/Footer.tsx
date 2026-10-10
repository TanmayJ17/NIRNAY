import React from 'react';

export default function Footer() {
  return (
    <footer className="h-8 bg-[#0F2B5C] text-white/90 border-t border-[#1E3A8A] flex items-center justify-between px-4 sm:px-6 shrink-0 text-[11px] select-none">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <span className="font-bold text-white tracking-wide uppercase whitespace-nowrap">
          MCD CONTROL ROOM:
        </span>
        <span className="text-white/80 truncate">
          Copernicus DEM 30m Elevations • IMD Automated Weather Stations • AWS Bedrock AI Integration
        </span>
      </div>
      <div className="hidden md:flex items-center gap-3 text-white/70 text-[10px] whitespace-nowrap">
        <span>Emergency Helpline: <strong className="text-white">155304 / 1800-11-0093</strong></span>
        <span>•</span>
        <span>Municipal Corporation of Delhi &copy; 2026</span>
      </div>
    </footer>
  );
}
