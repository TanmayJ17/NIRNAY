import { useStore } from '@/store/useStore';
import { PRESETS } from '@/config';

export interface IMDClass {
  name: string;
  min: number;
  max: number;
  color: string;
}

export const IMD_CLASSES: IMDClass[] = [
  { name: 'Light', min: 0, max: 15, color: '#DCEBF8' },
  { name: 'Moderate', min: 15, max: 65, color: '#B5D3EE' },
  { name: 'Heavy', min: 65, max: 115, color: '#7FB0DD' },
  { name: 'Very Heavy', min: 115, max: 204, color: '#3D82C4' },
  { name: 'Extremely Heavy', min: 204, max: 300, color: '#0B2A4A' },
];

export function getActiveIMDClass(mm: number): IMDClass {
  for (const c of IMD_CLASSES) {
    if (mm >= c.min && mm < c.max) return c;
  }
  return IMD_CLASSES[IMD_CLASSES.length - 1];
}

const DURATION_OPTIONS = [1, 2, 3, 4, 6, 8, 12];

export default function RainfallBar() {
  const rainMm = useStore((s) => s.rainMm);
  const durationH = useStore((s) => s.durationH);
  const setRainMm = useStore((s) => s.setRainMm);
  const setDurationH = useStore((s) => s.setDurationH);
  const applyPreset = useStore((s) => s.applyPreset);

  const activeClass = getActiveIMDClass(rainMm);

  // Five-step blue ramp gradient background for the slider track
  const sliderGradient = `linear-gradient(to right, #DCEBF8 0%, #DCEBF8 5%, #B5D3EE 5%, #B5D3EE 21.6%, #7FB0DD 21.6%, #7FB0DD 38.3%, #3D82C4 38.3%, #3D82C4 68%, #0B2A4A 68%, #0B2A4A 100%)`;

  return (
    <div className="h-14 bg-surface border-t border-border flex items-center px-4 gap-4 shrink-0 text-ink">
      {/* Total rainfall */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-accentSoft flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-accent" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.5 17a4.5 4.5 0 01-1.44-8.765 4.5 4.5 0 018.302-3.046 3.5 3.5 0 014.504 4.272A4 4 0 0115 17H5.5zm3.75-2.75a.75.75 0 001.5 0V9.66l1.95 2.1a.75.75 0 101.1-1.02l-3.25-3.5a.75.75 0 00-1.1 0l-3.25 3.5a.75.75 0 101.1 1.02l1.95-2.1v4.59z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span className="text-[12px] font-semibold text-muted tracking-wider uppercase whitespace-nowrap">
          TOTAL RAINFALL:
        </span>
        <span className="font-mono text-[16px] font-bold text-ink">
          {rainMm.toFixed(0)}
        </span>
        <span className="text-[12px] text-muted">mm</span>
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
          style={{ background: sliderGradient }}
          className="w-full h-2 rounded-full appearance-none cursor-pointer accent-accent"
        />
        {/* IMD scale markers */}
        <div className="flex justify-between mt-0.5">
          {IMD_CLASSES.map((c) => (
            <span
              key={c.name}
              className={`text-[9px] ${
                activeClass.name === c.name
                  ? 'text-accent font-bold'
                  : 'text-muted'
              }`}
            >
              {c.name}
            </span>
          ))}
        </div>
      </div>

      {/* IMD class badge - Full words, no abbreviations */}
      <span className="text-[11px] font-medium text-ink bg-accentSoft px-2.5 py-0.5 rounded-sm border border-accent/20 whitespace-nowrap">
        {activeClass.name} Rainfall ({activeClass.min}–{activeClass.max >= 300 ? '300+' : activeClass.max} mm)
      </span>

      <div className="h-6 w-px bg-border" />

      {/* Duration */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-semibold text-muted uppercase whitespace-nowrap">
          DURATION
        </span>
        <select
          value={durationH}
          onChange={(e) => setDurationH(Number(e.target.value))}
          className="h-7 px-2 text-[12px] font-mono bg-surface border border-border rounded-sm text-ink focus:outline-none focus:border-accent"
        >
          {DURATION_OPTIONS.map((d) => (
            <option key={d} value={d}>
              {d}.0 hrs (Peak at {(d * 0.4).toFixed(1)}h)
            </option>
          ))}
        </select>
      </div>

      <div className="h-6 w-px bg-border" />

      {/* Historical presets */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted whitespace-nowrap uppercase font-medium">
          PRESETS:
        </span>
        {PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p.rainMm, p.durationH)}
            className="h-7 px-2.5 text-[11px] font-medium text-accent border border-accent/30 rounded-sm hover:bg-accentSoft transition-colors whitespace-nowrap cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
