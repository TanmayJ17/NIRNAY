import React from 'react';
import { useStore } from '@/store/useStore';

interface DispatchControlsProps {
  onFindAllocation: () => void;
  isLoading?: boolean;
  progress?: number;
}

export const DispatchControls: React.FC<DispatchControlsProps> = ({
  onFindAllocation,
  isLoading = false,
  progress = 0,
}) => {
  const availablePumps = useStore((s) => s.availablePumps);
  const availableCrews = useStore((s) => s.availableCrews);
  const setAvailablePumps = useStore((s) => s.setAvailablePumps);
  const setAvailableCrews = useStore((s) => s.setAvailableCrews);

  const TOTAL_PUMPS = 12;
  const TOTAL_CREWS = 6;

  return (
    <div className="border border-border bg-white rounded-sm p-3.5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
          AVAILABLE FIELD DISPATCH
        </span>
        <span className="text-[10px] font-semibold tracking-wider text-text-muted uppercase">
          READY AT DEPOTS
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Mobile pumps control */}
        <div className="bg-surface border border-border/80 rounded-sm p-2">
          <div className="text-[11px] text-text-secondary flex justify-between items-center mb-1.5">
            <span>Mobile pumps</span>
            <span className="font-mono text-[11px] text-text-muted">
              {availablePumps} / {TOTAL_PUMPS} total
            </span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAvailablePumps(Math.max(0, availablePumps - 1))}
              disabled={availablePumps <= 0 || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-sm text-text-secondary hover:bg-surface disabled:opacity-40"
            >
              -
            </button>
            <span className="font-mono text-[15px] font-semibold text-text-primary px-3">
              {availablePumps}
            </span>
            <button
              onClick={() => setAvailablePumps(Math.min(TOTAL_PUMPS, availablePumps + 1))}
              disabled={availablePumps >= TOTAL_PUMPS || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-sm text-text-secondary hover:bg-surface disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>

        {/* Crews control */}
        <div className="bg-surface border border-border/80 rounded-sm p-2">
          <div className="text-[11px] text-text-secondary flex justify-between items-center mb-1.5">
            <span>Crews</span>
            <span className="font-mono text-[11px] text-text-muted">
              {availableCrews} / {TOTAL_CREWS} total
            </span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setAvailableCrews(Math.max(0, availableCrews - 1))}
              disabled={availableCrews <= 0 || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-sm text-text-secondary hover:bg-surface disabled:opacity-40"
            >
              -
            </button>
            <span className="font-mono text-[15px] font-semibold text-text-primary px-3">
              {availableCrews}
            </span>
            <button
              onClick={() => setAvailableCrews(Math.min(TOTAL_CREWS, availableCrews + 1))}
              disabled={availableCrews >= TOTAL_CREWS || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-white rounded-sm text-text-secondary hover:bg-surface disabled:opacity-40"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onFindAllocation}
        disabled={isLoading}
        className="w-full h-9 bg-primary hover:bg-primary-hover disabled:bg-primary/70 text-white text-[12px] font-medium rounded-sm flex items-center justify-center gap-2 transition-colors shadow-none cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Running 200 simulations... {progress > 0 ? `(${progress}%)` : ''}</span>
          </>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span>Find best allocation</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DispatchControls;
