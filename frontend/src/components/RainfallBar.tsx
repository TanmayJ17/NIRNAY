import { useStore } from '@/store/useStore';
import { PRESETS, DEFAULT_RAIN_MM, DEFAULT_DURATION_H } from '@/config';

const IMD_CLASSES = [
  { label: 'Light', min: 0, max: 15 },
  { label: 'Moderate', min: 15, max: 65 },
  { label: 'Heavy', min: 65, max: 115 },
  { label: 'Very heavy', min: 115, max: 204 },
  { label: 'Extr. heavy', min: 204, max: 300 },
] as const;

function getIMDClass(mm: number): string {
  for (const c of IMD_CLASSES) {
    if (mm >= c.min && mm < c.max) return c.label;
  }
  return 'Extr. heavy';
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

export default function RainfallBar() {
  const rainMm = useStore((s) => s.rainMm);
  const durationH = useStore((s) => s.durationH);
  const setRainMm = useStore((s) => s.setRainMm);
  const setDurationH = useStore((s) => s.setDurationH);
  const applyPreset = useStore((s) => s.applyPreset);

  const imdLabel = getIMDClass(rainMm);

  return (
    <div className="h-14 bg-white border-t border-border flex items-center px-4 gap-4 shrink-0">
      {/* Total rainfall */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
          <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="text-[12px] font-medium text-text-secondary whitespace-nowrap">
          TOTAL RAINFALL:
        </span>
        <span className="font-mono text-[16px] font-semibold text-text-primary">
          {rainMm.toFixed(0)}
        </span>
        <span className="text-[12px] text-text-muted">mm</span>
      </div>

      {/* Slider */}
      <div className="flex-1 max-w-xs">
        <input
          type="range"
          min={0}
          max={300}
          step={5}
          value={rainMm}
          onChange={(e) => setRainMm(Number(e.target.value))}
          className="w-full h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
        />
        {/* IMD scale markers */}
        <div className="flex justify-between mt-0.5">
          {IMD_CLASSES.map((c) => (
            <span
              key={c.label}
              className={`text-[9px] ${
                imdLabel === c.label
                  ? 'text-primary font-semibold'
                  : 'text-text-muted'
              }`}
            >
              {c.label}
            </span>
          ))}
        </div>
      </div>

      {/* IMD class badge */}
      <span className="text-[11px] font-medium text-text-secondary bg-surface px-2 py-0.5 rounded-sm border border-border whitespace-nowrap">
        Hvy 116.0-204.4 (Actv)
      </span>

      {/* Extremely heavy threshold */}
      <span className="hidden lg:block text-[11px] text-text-muted whitespace-nowrap">
        Extremely heavy ≥ 204.4 mm
      </span>

      <div className="h-6 w-px bg-border" />

      {/* Duration */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-text-secondary whitespace-nowrap">
          DURATION
        </span>
        <select
          value={durationH}
          onChange={(e) => setDurationH(Number(e.target.value))}
          className="h-7 px-2 text-[12px] font-mono bg-white border border-border rounded-sm text-text-primary"
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}.0 hrs (Peak 60 MIn)
            </option>
          ))}
        </select>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Historical presets */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-text-muted whitespace-nowrap">
          HISTORICAL PRESETS
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.rainMm, p.durationH)}
            className="h-7 px-3 text-[11px] font-medium text-primary border border-primary/30 rounded-sm hover:bg-primary/5 transition-colors whitespace-nowrap"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
