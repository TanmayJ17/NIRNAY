'use client';

import React from 'react';
import { AllocationResult } from '../engine/optimizer';
import { Zap, CheckCircle2, TrendingDown, Clock, ShieldAlert } from 'lucide-react';

interface AllocationConsoleProps {
  availablePumps: number;
  availableCrews: number;
  onChangePumps: (n: number) => void;
  onChangeCrews: (m: number) => void;
  onRunOptimization: () => void;
  isOptimizing: boolean;
  result: AllocationResult | null;
}

export const AllocationConsole: React.FC<AllocationConsoleProps> = ({
  availablePumps,
  availableCrews,
  onChangePumps,
  onChangeCrews,
  onRunOptimization,
  isOptimizing,
  result,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header & Fleet Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            PWD Tactical Fleet Dispatch
          </h3>
          <p className="text-[11px] text-slate-400">Deploy scarce mobile pump and maintenance units</p>
        </div>

        {/* Counter Steppers */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">Pumps:</span>
            <button
              onClick={() => onChangePumps(Math.max(1, availablePumps - 1))}
              className="text-slate-400 hover:text-white px-1"
            >
              -
            </button>
            <span className="font-bold font-mono text-cyan-400">{availablePumps}</span>
            <button
              onClick={() => onChangePumps(Math.min(15, availablePumps + 1))}
              className="text-slate-400 hover:text-white px-1"
            >
              +
            </button>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-xs">
            <span className="text-slate-400 font-mono text-[10px]">Crews:</span>
            <button
              onClick={() => onChangeCrews(Math.max(1, availableCrews - 1))}
              className="text-slate-400 hover:text-white px-1"
            >
              -
            </button>
            <span className="font-bold font-mono text-blue-400">{availableCrews}</span>
            <button
              onClick={() => onChangeCrews(Math.min(10, availableCrews + 1))}
              className="text-slate-400 hover:text-white px-1"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onRunOptimization}
        disabled={isOptimizing}
        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-lg shadow-cyan-500/20 active:scale-[0.99]"
      >
        <Zap className="w-4 h-4 fill-current" />
        {isOptimizing ? 'Computing Dynamic Allocation...' : '⚡ Run Optimal Resource Allocation'}
      </button>

      {/* Results Comparison Matrix */}
      {result && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Dynamic Programming Allocation Proof
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-mono">
              Stability: {result.stabilityPercentage}% (200 MC Runs)
            </span>
          </div>

          {/* Comparison Cards Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-cyan-400" /> Closure Hours Saved
              </div>
              <div className="text-lg font-bold font-mono text-emerald-400">
                +{result.closureHoursSaved} hrs
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {result.baselineClosureHours}h baseline ➔ {result.optimalClosureHours}h optimal
              </div>
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-blue-400" /> Exposure Reduction
              </div>
              <div className="text-lg font-bold font-mono text-cyan-400">
                -{result.impactSavedPercent}%
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {result.baselineImpactScore} score ➔ {result.optimalImpactScore} optimal
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
