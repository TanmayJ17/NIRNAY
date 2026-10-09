import React from 'react';
import type { RecommendResult as RecommendResultType } from '@/types';

interface RecommendResultProps {
  result: RecommendResultType;
}

export const RecommendResult: React.FC<RecommendResultProps> = ({ result }) => {
  return (
    <div className="border border-border bg-white rounded-sm p-3.5 mb-4">
      {/* Primary KPI: Closure hours saved */}
      <div className="mb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-[12px] text-text-secondary font-medium">
            Closure-hours saved:
          </span>
          <span className="font-mono text-[20px] font-bold text-primary">
            {result.closureHoursSaved.toFixed(1)}
          </span>
        </div>

        {/* P10-P90 Range display when provided */}
        {result.closureHoursSavedRange && (
          <div className="text-[11px] text-text-muted mt-0.5">
            vs equal split (
            <span className="font-mono text-text-secondary font-medium">
              P10–P90: {result.closureHoursSavedRange[0].toFixed(1)} to {result.closureHoursSavedRange[1].toFixed(1)} hrs
            </span>
            )
          </div>
        )}
      </div>

      {/* Secondary KPI: Impact index reduced */}
      <div className="flex items-center justify-between py-2 border-t border-border/70">
        <span className="text-[12px] text-text-secondary">
          Impact index reduced
        </span>
        <div className="flex items-baseline gap-1">
          <span className="font-mono text-[13px] font-semibold text-status-green">
            83%
          </span>
          <span className="text-[11px] text-text-muted">(relative)</span>
        </div>
      </div>

      {/* Rationale / Robustness note */}
      {result.rationale && (
        <div className="mt-2 pt-2 border-t border-border/70 text-[11px] text-text-muted">
          {result.rationale}
        </div>
      )}
    </div>
  );
};

export default RecommendResult;
