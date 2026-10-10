import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import hotspotData from '@/data/hotspots.json';

export default function TopBar() {
  const compareMode = useStore((s) => s.compareMode);
  const toggleCompareMode = useStore((s) => s.toggleCompareMode);
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const rainMm = useStore((s) => s.rainMm);
  const applyPreset = useStore((s) => s.applyPreset);

  const isIllustrative = hotspotData.data_status?.startsWith('ILLUSTRATIVE') ?? false;

  return (
    <header className="w-full select-none shrink-0 shadow-md z-40 bg-white">
      {/* 1. TOP NATIONAL / CIVIC GOVT HEADER (Authentic MCD Style) */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-6 py-1.5 flex items-center justify-between">
        {/* Left: Ashok Stambh Emblem + MCD Bilingual Titles */}
        <div className="flex items-center gap-3">
          {/* Emblem of India / Ashok Stambh SVG */}
          <div className="flex items-center gap-2">
            <svg
              className="w-8 h-10 text-gray-800 shrink-0"
              viewBox="0 0 100 120"
              fill="currentColor"
              aria-label="National Emblem of India"
            >
              {/* Lion Capital Silhouette */}
              <circle cx="50" cy="22" r="14" fill="#8B5CF6" opacity="0.1" />
              <path
                d="M50 8 C42 8 36 14 36 22 C36 28 40 33 46 35 L46 45 C40 46 32 50 28 58 L28 68 L72 68 L72 58 C68 50 60 46 54 45 L54 35 C60 33 64 28 64 22 C64 14 58 8 50 8 Z"
                fill="#1E293B"
              />
              {/* Crown / Lions left & right */}
              <path d="M26 24 C22 24 18 28 18 34 C18 42 24 46 30 48 L34 38 C30 36 28 32 28 28 Z" fill="#334155" />
              <path d="M74 24 C78 24 82 28 82 34 C82 42 76 46 70 48 L66 38 C70 36 72 32 72 28 Z" fill="#334155" />
              {/* Ashoka Chakra Base */}
              <rect x="20" y="70" width="60" height="12" rx="2" fill="#0F2B5C" />
              <circle cx="50" cy="76" r="5" fill="#FFFFFF" />
              <circle cx="50" cy="76" r="3" fill="#0F2B5C" />
              {/* Stele Pedestal */}
              <path d="M24 84 L76 84 L80 96 L20 96 Z" fill="#475569" />
              {/* Satyameva Jayate (stylized banner) */}
              <rect x="26" y="100" width="48" height="6" rx="1" fill="#94A3B8" />
            </svg>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[13px] sm:text-[14px] font-bold text-[#0F2B5C] tracking-tight leading-none">
                  दिल्ली नगर निगम
                </span>
                <span className="text-gray-400 text-xs">|</span>
                <span className="text-[12px] sm:text-[13px] font-bold text-[#0F2B5C] tracking-tight leading-none">
                  Municipal Corporation of Delhi
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] text-gray-600 font-medium tracking-wide mt-0.5">
                Government of NCT of Delhi • Central Monsoon & Flood Control Command
              </span>
            </div>
          </div>
        </div>

        {/* Center: Swachh Bharat & G20 / Tricolor Badges (Hidden on mobile) */}
        <div className="hidden lg:flex items-center gap-4">
          {/* Swachh Bharat Spectacles Logo */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F8FAFC] border border-gray-200">
            <svg className="w-12 h-6" viewBox="0 0 100 45" fill="none">
              {/* Spectacles Frames */}
              <circle cx="28" cy="22" r="16" stroke="#1E293B" strokeWidth="3" fill="#FFFFFF" />
              <circle cx="72" cy="22" r="16" stroke="#1E293B" strokeWidth="3" fill="#FFFFFF" />
              <path d="M44 22 C48 18 52 18 56 22" stroke="#1E293B" strokeWidth="3" fill="none" />
              {/* Text inside lenses: Swachh / Bharat */}
              <text x="18" y="26" fontSize="10" fontWeight="bold" fill="#0F2B5C" fontFamily="sans-serif">स्वच्छ</text>
              <text x="63" y="26" fontSize="10" fontWeight="bold" fill="#0F2B5C" fontFamily="sans-serif">भारत</text>
            </svg>
            <div className="text-[9px] font-semibold text-gray-700 leading-tight">
              <div>एक कदम स्वच्छता की ओर</div>
              <div className="text-gray-500 font-normal">Clean Delhi Initiative</div>
            </div>
          </div>

          {/* Indian National Tricolor Ribbon */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-2 rounded-sm overflow-hidden flex shadow-xs border border-gray-300">
              <div className="flex-1 bg-[#FF9933]" />
              <div className="flex-1 bg-white relative flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full border border-[#000080]" />
              </div>
              <div className="flex-1 bg-[#138808]" />
            </div>
            <span className="text-[8px] text-gray-500 font-semibold tracking-wider uppercase mt-0.5">
              Govt. of India
            </span>
          </div>
        </div>

        {/* Right: Emergency 24x7 Flood Helpline */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-gray-500 font-semibold tracking-wider uppercase">
              24×7 Flood Control Helpline
            </div>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <a
                href="tel:155304"
                className="text-[13px] sm:text-[14px] font-mono font-bold text-[#DC2626] hover:underline"
              >
                155304
              </a>
              <span className="text-gray-300 text-xs">/</span>
              <a
                href="tel:1800110093"
                className="text-[12px] sm:text-[13px] font-mono font-bold text-[#0F2B5C] hover:underline hidden sm:inline"
              >
                1800-11-0093
              </a>
            </div>
          </div>

          <Link
            to="/"
            className="text-[11px] font-medium text-gray-600 hover:text-[#0F2B5C] px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 transition-colors border border-gray-200"
          >
            Portal Info
          </Link>
        </div>
      </div>

      {/* 2. MCD ROYAL NAVY BLUE COMMAND BAR (`#0F2B5C`) */}
      <div className="h-12 bg-[#0F2B5C] text-white flex items-center justify-between px-3 sm:px-6 shadow-inner">
        {/* Left: NIRNAY Portal Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Water Drop & Ashoka Crest Icon */}
            <div className="w-7 h-7 rounded bg-white/10 border border-white/20 flex items-center justify-center">
              <svg viewBox="0 0 32 32" className="w-5 h-5 text-sky-400" aria-hidden="true">
                <path d="M16 3C16 3 6 14 6 20a10 10 0 0 0 20 0C26 14 16 3 16 3Z" fill="currentColor" />
                <path d="M9 21q3.5-2.5 7 0t7 0" stroke="#0F2B5C" strokeWidth="2.5" fill="none" />
              </svg>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[16px] sm:text-[17px] font-extrabold tracking-tight text-white">
                NIRNAY
              </span>
              <span className="text-[12px] font-medium text-sky-300">
                (निर्णय)
              </span>
            </div>
          </div>

          <span className="hidden xl:inline text-[11px] text-white/80 font-normal border-l border-white/20 pl-2.5">
            Delhi Waterlogging Decision & Mobile Pump Allocation Command System
          </span>

          {isIllustrative && (
            <span className="text-[10px] font-semibold text-amber-200 bg-amber-900/60 border border-amber-400/40 px-2 py-0.5 rounded flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Simulated Hydrology</span>
            </span>
          )}
        </div>

        {/* Center: Command Feature Quick Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-black/20 p-1 rounded border border-white/10">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'recommend'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>⚡</span>
            <span>Pump Optimizer</span>
          </button>

          <button
            onClick={() => setActiveTab('interventions')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'interventions'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🛠️</span>
            <span>Interventions</span>
          </button>

          <button
            onClick={() => setActiveTab('explain')}
            className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'explain'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span>🤖</span>
            <span>Ask AI Agent</span>
          </button>
        </div>

        {/* Right: Mode & Storm Presets */}
        <div className="flex items-center gap-2">
          {/* Quick Storm Presets Button */}
          <div className="hidden sm:flex items-center gap-1 text-[11px]">
            <span className="text-white/60 font-medium">Replay:</span>
            <button
              onClick={() => applyPreset(180, 6)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] border border-white/15"
              title="July 2026 Deluge: 180mm over 6 hours"
            >
              July '26 (180mm)
            </button>
            <button
              onClick={() => applyPreset(65, 3)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] border border-white/15"
              title="May 2025 Storm: 65mm over 3 hours"
            >
              May '25 (65mm)
            </button>
          </div>

          <div className="h-4 w-px bg-white/20 mx-1 hidden sm:block" />

          {/* Single Run vs Compare A/B */}
          <div className="flex items-center gap-1">
            <button
              className={`h-7 px-2.5 text-[11px] font-medium border rounded transition-colors cursor-pointer ${
                !compareMode
                  ? 'border-sky-400 bg-sky-500 text-white'
                  : 'border-white/20 text-white/80 hover:bg-white/10'
              }`}
              onClick={() => {
                if (compareMode) toggleCompareMode();
              }}
            >
              Single Run
            </button>
            <button
              className={`h-7 px-2.5 text-[11px] font-medium border rounded transition-colors cursor-pointer ${
                compareMode
                  ? 'border-sky-400 bg-sky-500 text-white'
                  : 'border-white/20 text-white/80 hover:bg-white/10'
              }`}
              onClick={toggleCompareMode}
            >
              Compare A / B
            </button>
          </div>
        </div>
      </div>

      {/* 3. MCD FLOOD ADVISORY SCROLLING NEWS TICKER */}
      <div className="h-7 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center px-3 sm:px-6 overflow-hidden">
        <div className="flex items-center gap-1.5 shrink-0 pr-3 z-10 bg-[#FFFBEB]">
          <span className="inline-block w-2 h-2 rounded-full bg-red-600 animate-ping" />
          <span className="text-[11px] font-bold text-[#DC2626] uppercase tracking-wider whitespace-nowrap">
            MCD FLOOD ADVISORY:
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="animate-ticker text-[11px] font-medium text-gray-800 space-x-8">
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">Minto Bridge:</strong> Sump pumps operational. Max depth {rainMm > 100 ? '0.42m' : '0.12m'}. Mobile suction pump staged.
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">Pul Prahladpur:</strong> Railway culvert clear. Traffic diversion plan active if rainfall exceeds 75mm.
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">Hospital Lifelines:</strong> AIIMS & Safdarjung emergency corridors prioritized for zero-stagnation dispatch.
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">Zakhira Underpass:</strong> Drainage pumps P1 & P2 ready. Heavy commercial vehicles advised outer ring road.
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">IMD Alert:</strong> Delhi NCR under alert. Pre-storm pump allocation dynamic programming active.
            </span>
            <span className="text-gray-300">•</span>
            {/* Duplicated for seamless infinite loop */}
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">Minto Bridge:</strong> Sump pumps operational. Max depth {rainMm > 100 ? '0.42m' : '0.12m'}. Mobile suction pump staged.
            </span>
            <span className="text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <strong className="text-[#0F2B5C]">Pul Prahladpur:</strong> Railway culvert clear. Traffic diversion plan active if rainfall exceeds 75mm.
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
