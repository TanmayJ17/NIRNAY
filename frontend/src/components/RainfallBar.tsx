import React from 'react';
import { useStore } from '@/store/useStore';
import { PRESETS } from '@/config';

export interface IMDClass {
  name: string;
  min: number;
  max: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  alertName: string;
}

export const IMD_CLASSES: IMDClass[] = [
  {
    name: 'Light',
    min: 0,
    max: 15,
    color: '#16A34A',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-900 border-emerald-300',
    alertName: '🟢 GREEN ALERT (No Warning)',
  },
  {
    name: 'Moderate',
    min: 15,
    max: 65,
    color: '#EAB308',
    badgeBg: 'bg-yellow-100',
    badgeText: 'text-yellow-900 border-yellow-300',
    alertName: '🟡 YELLOW WATCH (Be Updated)',
  },
  {
    name: 'Heavy',
    min: 65,
    max: 115,
    color: '#F97316',
    badgeBg: 'bg-orange-100',
    badgeText: 'text-orange-900 border-orange-300',
    alertName: '🟠 ORANGE ALERT (Be Prepared)',
  },
  {
    name: 'Very Heavy',
    min: 115,
    max: 204,
    color: '#DC2626',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-900 border-red-300',
    alertName: '🔴 RED WARNING (Take Action)',
  },
  {
    name: 'Extremely Heavy',
    min: 204,
    max: 300,
    color: '#7F1D1D',
    badgeBg: 'bg-rose-200',
    badgeText: 'text-rose-950 border-rose-400',
    alertName: '🚨 SEVERE DELUGE / CLOUDBURST',
  },
];

export function getActiveIMDClass(mm: number): IMDClass {
  for (const c of IMD_CLASSES) {
    if (mm >= c.min && mm < c.max) return c;
  }
  return IMD_CLASSES[IMD_CLASSES.length - 1];
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

export default function RainfallBar() {
  const rainMm = useStore((s) => s.rainMm);
  const durationH = useStore((s) => s.durationH);
  const setRainMm = useStore((s) => s.setRainMm);
  const setDurationH = useStore((s) => s.setDurationH);
  const applyPreset = useStore((s) => s.applyPreset);

  const activeClass = getActiveIMDClass(rainMm);

  // Vivid gradient reflecting IMD alert levels
  const sliderGradient = `linear-gradient(to right, #16A34A 0%, #16A34A 5%, #EAB308 5%, #EAB308 21.6%, #F97316 21.6%, #F97316 38.3%, #DC2626 38.3%, #DC2626 68%, #7F1D1D 68%, #7F1D1D 100%)`;

  return (
    <div className="h-16 bg-white border-t border-gray-300 flex items-center px-4 sm:px-6 gap-4 shrink-0 text-gray-900 shadow-lg select-none z-30">
      {/* Rainfall Amount Control */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
          <svg className="w-4 h-4 text-sky-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div>
          <div className="text-[10px] font-bold text-gray-500 tracking-wider uppercase">
            IMD SIMULATED DELUGE:
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[18px] font-extrabold text-[#0F2B5C]">
              {rainMm.toFixed(0)}
            </span>
            <span className="text-[11px] font-semibold text-gray-500">mm</span>
          </div>
        </div>
      </div>

      {/* High-visibility IMD Slider */}
      <div className="flex-1 max-w-sm">
        <input
          type="range"
          min={0}
          max={300}
          step={5}
          value={rainMm}
          onChange={(e) => setRainMm(Number(e.target.value))}
          style={{ background: sliderGradient }}
          className="w-full h-2.5 rounded-full appearance-none cursor-pointer accent-[#0F2B5C] border border-gray-300"
        />
        {/* IMD scale markers */}
        <div className="flex justify-between mt-1 px-0.5">
          {IMD_CLASSES.map((c) => (
            <span
              key={c.name}
              className={`text-[9px] font-semibold ${
                activeClass.name === c.name
                  ? 'text-[#0F2B5C] font-extrabold scale-105'
                  : 'text-gray-400'
              }`}
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* IMD Alert Level Badge */}
      <div
        className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-sm border text-[11px] font-bold tracking-tight whitespace-nowrap ${activeClass.badgeBg} ${activeClass.badgeText}`}
      >
        <span>{activeClass.alertName}</span>
        <span className="text-[10px] font-normal opacity-80">
          ({activeClass.min}–{activeClass.max >= 300 ? '300+' : activeClass.max} mm)
        </span>
      </div>

      <div className="h-8 w-px bg-gray-200 hidden sm:block" />

      {/* Storm Duration Selector */}
      <div className="flex items-center gap-2 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
            STORM DURATION
          </span>
          <select
            value={durationH}
            onChange={(e) => setDurationH(Number(e.target.value))}
            className="h-7 px-2 text-[12px] font-mono font-semibold bg-gray-50 border border-gray-300 rounded text-gray-800 focus:outline-none focus:border-[#0F2B5C]"
          >
            {DURATION_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}.0 hrs (Peak @ {(d * 0.4).toFixed(1)}h)
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-8 w-px bg-gray-200 hidden lg:block" />

      {/* Quick IMD Replay Presets */}
      <div className="hidden lg:flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          HISTORICAL REPLAY:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.rainMm, p.durationH)}
            className="h-7 px-2.5 text-[11px] font-semibold text-[#0F2B5C] bg-gray-50 border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
