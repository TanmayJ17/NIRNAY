import { useStore } from '@/store/useStore';
import hotspotData from '@/data/hotspots.json';

export default function TopBar() {
  const compareMode = useStore((s) => s.compareMode);
  const toggleCompareMode = useStore((s) => s.toggleCompareMode);

  const isIllustrative = hotspotData.data_status?.startsWith('ILLUSTRATIVE') ?? false;

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

        {/* Illustrative data tag */}
        {isIllustrative && (
          <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-300/80 px-2 py-0.5 rounded-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Illustrative data</span>
          </span>
        )}
      </div>

      {/* Center: methodology note */}
      <p className="hidden md:block text-[11px] text-text-muted">
        Rational method + storage balance. Scenario simulation, not forecasting.
      </p>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <button
          className={`h-8 px-3 text-[12px] font-medium border rounded-sm transition-colors cursor-pointer ${
            !compareMode
              ? 'border-primary bg-primary text-white'
              : 'border-border text-text-secondary hover:bg-surface'
          }`}
          onClick={() => {
            if (compareMode) toggleCompareMode();
          }}
        >
          Single run
        </button>
        <button
          className={`h-8 px-3 text-[12px] font-medium border rounded-sm transition-colors cursor-pointer ${
            compareMode
              ? 'border-primary bg-primary text-white'
              : 'border-border text-text-secondary hover:bg-surface'
          }`}
          onClick={toggleCompareMode}
        >
          Compare A / B
        </button>
      </div>
    </header>
  );
}
