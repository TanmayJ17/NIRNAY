'use client';

import React from 'react';
import { CloudRain, History, Sparkles } from 'lucide-react';

interface RainfallScrubberProps {
  rainMm: number;
  durationHours: number;
  onUpdateRain: (mm: number, duration: number) => void;
  activePreset: string | null;
  onSelectPreset: (preset: 'JULY_2026' | 'MAY_2025' | null) => void;
}

export const RainfallScrubber: React.FC<RainfallScrubberProps> = ({
  rainMm,
  durationHours,
  onUpdateRain,
  activePreset,
  onSelectPreset,
}) => {
  // IMD Rainfall Warning Classification
  const getImdBadge = (mm: number) => {
    if (mm < 64.5) {
      return {
        label: 'Moderate Rain',
        className: 'bg-emerald-950/60 text-emerald-400 border-emerald-800',
      };
    } else if (mm <= 115.5) {
      return {
        label: 'Heavy Rain (IMD Yellow Alert)',
        className: 'bg-yellow-950/60 text-yellow-300 border-yellow-800',
      };
    } else if (mm <= 204.4) {
      return {
        label: 'Very Heavy (IMD Orange Alert)',
        className: 'bg-orange-950/60 text-orange-400 border-orange-800',
      };
    } else {
      return {
        label: 'Cloudburst (IMD Red Alert)',
        className: 'bg-rose-950/60 text-rose-300 border-rose-800 font-bold animate-pulse',
      };
    }
  };

  const imd = getImdBadge(rainMm);

  const handleJuly2026 = () => {
    onSelectPreset('JULY_2026');
    onUpdateRain(85, 4.0);
  };

  const handleMay2025 = () => {
    onSelectPreset('MAY_2025');
    onUpdateRain(55, 2.0);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSelectPreset(null);
    onUpdateRain(parseFloat(e.target.value), durationHours);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
      {/* Top Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CloudRain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Pre-Storm Scenario Hyetograph:
          </span>
          <span className="text-sm font-mono font-bold text-cyan-400">
            {rainMm} mm in {durationHours}h
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${imd.className}`}>
            {imd.label}
          </span>
        </div>

        {/* 1-Click Historical Replay Presets */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
            <History className="w-3 h-3" /> Historical Replays:
          </span>
          <button
            onClick={handleJuly2026}
            className={`px-2.5 py-1 text-xs rounded border transition flex items-center gap-1 font-mono ${
              activePreset === 'JULY_2026'
                ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-500/30'
                : 'bg-slate-800 text-blue-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3" /> July 2026 Replay (85mm)
          </button>
          <button
            onClick={handleMay2025}
            className={`px-2.5 py-1 text-xs rounded border transition flex items-center gap-1 font-mono ${
              activePreset === 'MAY_2025'
                ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-500/30'
                : 'bg-slate-800 text-rose-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            May 2025 Replay (55mm Flash)
          </button>
        </div>
      </div>

      {/* Reactive Slider */}
      <div className="space-y-1">
        <input
          type="range"
          min="10"
          max="140"
          step="1"
          value={rainMm}
          onChange={handleSliderChange}
          className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>10 mm (Light)</span>
          <span>40 mm (Moderate)</span>
          <span>85 mm (Severe Storm)</span>
          <span>120 mm (Cloudburst)</span>
          <span>140 mm (Catastrophic)</span>
        </div>
      </div>
    </div>
  );
};
