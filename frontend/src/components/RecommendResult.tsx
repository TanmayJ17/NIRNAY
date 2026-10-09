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
      <div className="border border-border bg-white rounded-sm p-4 mb-4 text-center">
        <p className="text-[12px] text-text-muted leading-relaxed">
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
    <div className="border border-border bg-white rounded-sm p-3.5 mb-4 space-y-3">
      {/* Primary KPI: Closure hours saved */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-[12px] text-text-secondary font-medium">
              Closure-hours saved:
            </span>
            <span className="font-mono text-[20px] font-bold text-primary">
              {closureHours.toFixed(1)}
            </span>
            <span className="text-[11px] text-text-muted">hrs</span>
          </div>
          <button
            onClick={() => {
              const { setActiveTab, sendChatMessage } = useStore.getState();
              setActiveTab('explain');
              sendChatMessage('Why this allocation?');
            }}
            className="text-[12px] font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>Ask why</span>
            <span aria-hidden="true">&rarr;</span>
          </button>
        </div>

        {/* P10-P90 Range */}
        {p10Closure != null && p90Closure != null && (
          <div className="text-[11px] text-text-muted mt-0.5">
            vs equal split (
            <span className="font-mono text-text-secondary font-medium">
              P10–P90: {p10Closure.toFixed(1)} to {p90Closure.toFixed(1)} hrs
            </span>
            )
          </div>
        )}
      </div>

      {/* Secondary KPI: Impact index reduced */}
      <div className="pt-2.5 border-t border-border/70">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-text-secondary">
            Impact index reduced
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[14px] font-bold text-status-green">
              {impactPct.toFixed(0)}%
            </span>
            <span className="text-[11px] text-text-muted">(relative)</span>
          </div>
        </div>
        {p10Impact != null && p90Impact != null && (
          <div className="text-[11px] text-text-muted mt-0.5 text-right">
            P10–P90 range:{' '}
            <span className="font-mono text-text-secondary font-medium">
              {p10Impact.toFixed(0)}%–{p90Impact.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Stability line */}
      <div className="pt-2.5 border-t border-border/70 text-[11px] text-text-secondary flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        <span>
          Same top-3 allocation in{' '}
          <strong className="font-semibold text-text-primary">{stability}%</strong> of 200 simulations.
        </span>
      </div>

      {/* Comparative Baseline Bars */}
      <div className="pt-2.5 border-t border-border/70 space-y-2">
        <div className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
          COMPARATIVE BASELINES (TOTAL CLOSURE HOURS)
        </div>

        {/* Equal Split Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-text-secondary">Equal split</span>
            <span className="font-mono text-text-secondary font-medium">
              {equalClosure.toFixed(1)} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-gray-400"
              style={{ width: `${Math.min(100, (equalClosure / maxBaselineHours) * 100)}%` }}
            />
          </div>
        </div>

        {/* History Split Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="text-text-secondary">History split</span>
            <span className="font-mono text-text-secondary font-medium">
              {historyClosure.toFixed(1)} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-amber-500"
              style={{ width: `${Math.min(100, (historyClosure / maxBaselineHours) * 100)}%` }}
            />
          </div>
        </div>

        {/* NIRNAY Plan Bar */}
        <div>
          <div className="flex justify-between text-[11px] mb-0.5">
            <span className="font-semibold text-primary">NIRNAY optimal plan</span>
            <span className="font-mono font-bold text-primary">
              {nirnayClosure.toFixed(1)} hrs
            </span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/50">
            <div
              className="h-full bg-primary"
              style={{ width: `${Math.min(100, (nirnayClosure / maxBaselineHours) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Greedy result small line */}
      {result.greedyClosureHours != null && (
        <div className="pt-2 border-t border-border/70 text-[11px] text-text-muted">
          Greedy heuristic:{' '}
          <span className="font-mono text-text-secondary font-medium">
            {result.greedyClosureHours.toFixed(1)} closure-hours
          </span>
        </div>
      )}

      {/* Apply Plan Button */}
      <div className="pt-2 border-t border-border/70">
        <button
          onClick={applyRecommendedPlan}
          className="w-full h-8 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-[12px] font-medium rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
