import { useStore } from '@/store/useStore';
import hotspotData from '@/data/hotspots.json';

export default function TopBar() {
  const compareMode = useStore((s) => s.compareMode);
  const toggleCompareMode = useStore((s) => s.toggleCompareMode);

  const isIllustrative = hotspotData.data_status?.startsWith('ILLUSTRATIVE') ?? false;

  return (
    <header className="h-12 bg-navy border-b border-navy text-white flex items-center justify-between px-4 shrink-0">
      {/* Left: brand with inline SVG logo mark */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Logo mark (28px, white on navy) */}
          <svg
            viewBox="0 0 32 32"
            className="w-7 h-7 text-white shrink-0"
            aria-hidden="true"
          >
            <path
              d="M16 3C16 3 6 14 6 20a10 10 0 0 0 20 0C26 14 16 3 16 3Z"
              fill="currentColor"
            />
            <path
              d="M9 21q3.5-2.5 7 0t7 0"
              stroke="#0B2A4A"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <span className="text-[16px] font-bold text-white tracking-tight">
            NIRNAY
          </span>
        </div>
        <span className="text-[12px] text-white/70">Delhi</span>
        <div className="h-4 w-px bg-white/20 mx-1" />
        <span className="text-[11px] font-medium text-white bg-accent/30 border border-accent/40 px-2 py-0.5 rounded-sm">
          Scenario Simulator
        </span>

        {/* Illustrative data tag */}
        {isIllustrative && (
          <span className="text-[11px] font-medium text-amber-200 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded-sm flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Illustrative data</span>
          </span>
        )}
      </div>

      {/* Center: methodology note */}
      <p className="hidden md:block text-[11px] text-white/70">
        Rational method + storage balance. Scenario simulation, not forecasting.
      </p>

      {/* Right: controls */}
      <div className="flex items-center gap-2">
        <button
          className={`h-8 px-3 text-[12px] font-medium border rounded-sm transition-colors cursor-pointer ${
            !compareMode
              ? 'border-accent bg-accent text-white'
              : 'border-white/20 text-white/80 hover:bg-white/10'
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
              ? 'border-accent bg-accent text-white'
              : 'border-white/20 text-white/80 hover:bg-white/10'
          }`}
          onClick={toggleCompareMode}
        >
          Compare A / B
        </button>
      </div>
    </header>
  );
}
