import React from 'react';
import { useStore } from '@/store/useStore';
import { FLEET, MAX_PUMPS_PER_HOTSPOT } from '@/config';
import { hotspots } from '@/data/loadHotspots';

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

  const maxDeployablePumps = hotspots.length * MAX_PUMPS_PER_HOTSPOT; // 15 * 4 = 60
  const maxDeployableCrews = hotspots.length; // 15

  const usablePumps = Math.min(availablePumps, maxDeployablePumps);
  const usableCrews = Math.min(availableCrews, maxDeployableCrews);

  const isPumpsClamped = availablePumps > maxDeployablePumps;
  const isCrewsClamped = availableCrews > maxDeployableCrews;

  const handlePumpsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setAvailablePumps(0);
    } else {
      setAvailablePumps(Math.max(0, Math.min(FLEET.cityWideMobilePumps, val)));
    }
  };

  const handleCrewsInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val)) {
      setAvailableCrews(0);
    } else {
      setAvailableCrews(Math.max(0, Math.min(FLEET.maxCrews, val)));
    }
  };

  return (
    <div className="border border-border bg-surface rounded-sm p-3.5 mb-4 text-ink">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] font-semibold tracking-wider text-muted uppercase">
          AVAILABLE FIELD DISPATCH
        </span>
        <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
          READY AT DEPOTS
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Mobile pumps control */}
        <div className="bg-[#F4F7FA] border border-border rounded-sm p-2.5">
          <div className="text-[12px] text-muted flex justify-between items-center mb-1.5">
            <span className="font-medium text-ink">Mobile pumps</span>
            <span className="font-mono text-[11px] text-muted">
              {usablePumps} usable / {availablePumps} entered
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => setAvailablePumps(Math.max(0, availablePumps - 1))}
              disabled={availablePumps <= 0 || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-surface rounded-sm text-ink hover:bg-canvas disabled:opacity-40 font-mono text-sm cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              max={FLEET.cityWideMobilePumps}
              value={availablePumps}
              onChange={handlePumpsInputChange}
              disabled={isLoading}
              className="w-16 h-7 text-center font-mono text-[14px] font-bold bg-surface border border-border rounded-sm text-ink focus:outline-none focus:border-accent"
            />
            <button
              onClick={() => setAvailablePumps(Math.min(FLEET.cityWideMobilePumps, availablePumps + 1))}
              disabled={availablePumps >= FLEET.cityWideMobilePumps || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-surface rounded-sm text-ink hover:bg-canvas disabled:opacity-40 font-mono text-sm cursor-pointer"
            >
              +
            </button>
          </div>
          {isPumpsClamped && (
            <div className="text-[10px] text-muted mt-1.5 leading-tight">
              Using {usablePumps} of {availablePumps} pumps: {hotspots.length} hotspots, max {MAX_PUMPS_PER_HOTSPOT} each.
            </div>
          )}
        </div>

        {/* Crews control */}
        <div className="bg-[#F4F7FA] border border-border rounded-sm p-2.5">
          <div className="text-[12px] text-muted flex justify-between items-center mb-1.5">
            <span className="font-medium text-ink">Crews</span>
            <span className="font-mono text-[11px] text-muted">
              {usableCrews} usable / {availableCrews} entered
            </span>
          </div>
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => setAvailableCrews(Math.max(0, availableCrews - 1))}
              disabled={availableCrews <= 0 || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-surface rounded-sm text-ink hover:bg-canvas disabled:opacity-40 font-mono text-sm cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={0}
              max={FLEET.maxCrews}
              value={availableCrews}
              onChange={handleCrewsInputChange}
              disabled={isLoading}
              className="w-16 h-7 text-center font-mono text-[14px] font-bold bg-surface border border-border rounded-sm text-ink focus:outline-none focus:border-accent"
            />
            <button
              onClick={() => setAvailableCrews(Math.min(FLEET.maxCrews, availableCrews + 1))}
              disabled={availableCrews >= FLEET.maxCrews || isLoading}
              className="w-7 h-7 flex items-center justify-center border border-border bg-surface rounded-sm text-ink hover:bg-canvas disabled:opacity-40 font-mono text-sm cursor-pointer"
            >
              +
            </button>
          </div>
          {isCrewsClamped && (
            <div className="text-[10px] text-muted mt-1.5 leading-tight">
              Using {usableCrews} of {availableCrews} crews: {hotspots.length} hotspots, max 1 each.
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={onFindAllocation}
        disabled={isLoading}
        className="w-full h-10 bg-[#0F2B5C] hover:bg-[#1E3A8A] disabled:bg-[#0F2B5C]/70 text-white text-[13px] font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span>Computing DP Optimal Plan... {progress > 0 ? `(${progress}%)` : ''}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 text-sky-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span>Compute Optimal Pump Allocation (DP Solver)</span>
          </>
        )}
      </button>
    </div>
  );
};

export default DispatchControls;
