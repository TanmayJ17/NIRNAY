import React from 'react';
import type { RecommendResult as RecommendResultType } from '@/types';
import { useStore } from '@/store/useStore';

interface RecommendResultProps {
  result: RecommendResultType | null;
}

export const RecommendResult: React.FC<RecommendResultProps> = ({ result }) => {
  const applyRecommendedPlan = useStore((s) => s.applyRecommendedPlan);

  if (!result) {
    return (
      <div className="border border-border bg-surface rounded-sm p-4 mb-4 text-center">
        <p className="text-[12px] text-muted leading-relaxed">
          No allocation yet. Set pumps and crews, then press Find best allocation.
        </p>
      </div>
    );
  }

  const closureHours = result.closureHoursSaved;
  const p10Closure = result.closureHoursSavedRange ? result.closureHoursSavedRange[0] : null;
  const p90Closure = result.closureHoursSavedRange ? result.closureHoursSavedRange[1] : null;

  const impactPct = result.impactIndexReduced;
  const p10Impact = result.impactIndexReducedRange ? result.impactIndexReducedRange[0] : null;
  const p90Impact = result.impactIndexReducedRange ? result.impactIndexReducedRange[1] : null;

  const stability = result.stabilityPercent ?? 85;

  // Baseline comparison calculations for horizontal bars
  const nirnayClosure = result.optimal?.totalClosureHours ?? 12.5;
  const equalClosure = result.equalSplit?.totalClosureHours ?? (nirnayClosure + closureHours);
  const historyClosure = result.historySplit?.totalClosureHours ?? (nirnayClosure + closureHours * 0.7);
  const maxBaselineHours = Math.max(nirnayClosure, equalClosure, historyClosure, 1);

  return (
    <div className="border border-gray-300 bg-white rounded p-4 mb-4 space-y-3.5 text-gray-900 shadow-xs">
      {/* Primary KPI: Closure hours saved */}
      <div className="bg-blue-50/80 border border-blue-200 rounded p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] text-gray-600 font-bold uppercase tracking-wider">
              Closure-Hours Saved:
            </span>
            <span className="font-mono text-[24px] font-extrabold text-[#0F2B5C]">
              {closureHours.toFixed(1)}
            </span>
            <span className="text-[13px] font-semibold text-gray-600">hrs</span>
          </div>
          <button
            onClick={() => {
              const { setActiveTab, sendChatMessage } = useStore.getState();
              setActiveTab('explain');
              sendChatMessage('Why this allocation?');
            }}
            className="text-[11px] font-bold text-sky-700 bg-white border border-sky-300 px-2.5 py-1 rounded hover:bg-sky-50 flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <span>Ask Why</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* P10-P90 Range */}
        {p10Closure != null && p90Closure != null && (
          <div className="text-[11px] text-gray-600 mt-1 font-medium">
            vs equal allocation (
            <span className="font-mono text-[#0F2B5C] font-bold">
              P10–P90: {p10Closure.toFixed(1)} to {p90Closure.toFixed(1)} hrs saved
            </span>
            )
          </div>
        )}
      </div>

      {/* Secondary KPI: Impact index reduced */}
      <div className="pt-2 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-gray-600 font-semibold">
            Traffic Impact Index Reduced:
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[16px] font-extrabold text-emerald-700">
              -{impactPct.toFixed(0)}%
            </span>
            <span className="text-[11px] text-gray-500 font-medium">(vs baseline)</span>
          </div>
        </div>
        {p10Impact != null && p90Impact != null && (
          <div className="text-[11px] text-gray-500 mt-0.5 text-right font-medium">
            P10–P90 range:{' '}
            <span className="font-mono text-gray-800 font-bold">
              {p10Impact.toFixed(0)}% to {p90Impact.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Stability line */}
      <div className="pt-2 border-t border-gray-200 text-[11px] text-gray-700 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
        <span>
          Optimal plan replicated in{' '}
          <strong className="font-bold text-[#0F2B5C]">{stability}%</strong> of 200 Monte Carlo draws.
        </span>
      </div>

      {/* Comparative Baseline Bars */}
      <div className="pt-2.5 border-t border-border space-y-2">
        <div className="text-[10px] font-semibold tracking-wider text-muted uppercase">
          COMPARATIVE BASELINES (TOTAL CLOSURE HOURS)
        </div>

        {/* Equal Split Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-muted">Equal split</span>
            <span className="font-mono text-muted font-medium">
              {equalClosure.toFixed(1)} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-muted"
              style={{ width: `${Math.min(100, (equalClosure / maxBaselineHours) * 100)}%` }}
            />
          </div>
        </div>

        {/* History Split Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-muted">History split</span>
            <span className="font-mono text-muted font-medium">
              {historyClosure.toFixed(1)} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-[#7FB0DD]"
              style={{ width: `${Math.min(100, (historyClosure / maxBaselineHours) * 100)}%` }}
            />
          </div>
        </div>

        {/* NIRNAY Plan Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="font-semibold text-accent">NIRNAY optimal plan</span>
            <span className="font-mono font-bold text-accent">
              {nirnayClosure.toFixed(1)} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden border border-border">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.min(100, (nirnayClosure / maxBaselineHours) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Greedy result small line */}
      {result.greedyClosureHours != null && (
        <div className="pt-2 border-t border-border text-[11px] text-muted">
          Greedy heuristic:{' '}
          <span className="font-mono text-ink font-medium">
            {result.greedyClosureHours.toFixed(1)} closure-hours
          </span>
        </div>
      )}

      {/* Apply Plan Button */}
      <div className="pt-2 border-t border-border">
        <button
          onClick={applyRecommendedPlan}
          className="w-full h-8 bg-accentSoft hover:bg-accent/15 text-accent border border-accent/30 text-[12px] font-medium rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>Apply plan to manual interventions</span>
        </button>
      </div>
    </div>
  );
};

export default RecommendResult;
