import { PRESETS } from '@/config';
import { useStore } from '@/store/useStore';

export default function TopBar() {
  const compareMode = useStore((s) => s.compareMode);
  const toggleCompareMode = useStore((s) => s.toggleCompareMode);

  return (
    <header className="h-12 bg-white border-b border-border flex items-center justify-between px-4 shrink-0">
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold text-text-primary tracking-tight">
          NIRNAY
        </span>
        <span className="text-[12px] text-text-muted">Delhi</span>
        <div className="h-5 w-px bg-border mx-1" />
        <span className="text-[12px] font-medium text-primary bg-blue-50 px-2 py-0.5 rounded-sm">
          Scenario Simulator
        </span>
      </div>

      {/* Center: methodology note */}
      <p className="hidden md:block text-[11px] text-text-muted">
        Rational method + storage balance. Scenario simulation, not forecasting.
      </p>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <button
          className="h-8 px-3 text-[12px] font-medium border border-border rounded-sm text-text-secondary hover:bg-surface transition-colors"
          onClick={() => {}}
        >
          Single run
        </button>
        <button
          className={`h-8 px-3 text-[12px] font-medium border rounded-sm transition-colors ${
            compareMode
              ? 'border-primary bg-primary text-white'
              : 'border-border text-text-secondary hover:bg-surface'
          }`}
          onClick={toggleCompareMode}
        >
          Compare A / B
        </button>
        <button className="h-8 px-3 text-[12px] font-medium border border-border rounded-sm text-text-secondary hover:bg-surface transition-colors flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Save scenario
        </button>
      </div>
    </header>
  );
}
