import React from 'react';
import type { SimulationResult } from '@/types';
import { ALERT_THRESHOLD_M, CLOSURE_THRESHOLD_M } from '@/config';

interface CrossSectionCardProps {
  depth: number;
  storageDepth: number;
  simResult: SimulationResult;
  culvertLabel?: string;
  closureDelta?: string | null;
}

export const CrossSectionCard: React.FC<CrossSectionCardProps> = ({
  depth,
  storageDepth,
  simResult,
  culvertLabel = 'Culvert #08 Dtp',
  closureDelta,
}) => {
  // Clamping to physical maximum storage depth
  const clampedDepth = Math.min(Math.max(0, depth), storageDepth);

  // Cross-section coordinate math
  // Canvas: 420 wide, 160 high
  // Roadbed base: y = 120, width 160 (x: 130 to 290)
  // Sloped walls: from (70, 45) down to (130, 120) on left, (350, 45) down to (290, 120) on right
  const baseY = 120;
  const topY = 45;
  const maxVisualHeight = baseY - topY; // 75px

  // Scaling factor: depth relative to storageDepth
  const fillRatio = storageDepth > 0 ? clampedDepth / storageDepth : 0;
  const waterHeightPx = Math.min(maxVisualHeight, fillRatio * maxVisualHeight);
  const waterSurfaceY = baseY - waterHeightPx;

  // Thresholds Y positions
  const alertRatio = storageDepth > 0 ? ALERT_THRESHOLD_M / storageDepth : 0.15;
  const closureRatio = storageDepth > 0 ? CLOSURE_THRESHOLD_M / storageDepth : 0.20;
  const alertY = baseY - Math.min(maxVisualHeight, alertRatio * maxVisualHeight);
  const closureY = baseY - Math.min(maxVisualHeight, closureRatio * maxVisualHeight);

  // Width of water surface at waterSurfaceY (accounting for sloped walls)
  const leftXAtWater = 130 - ((baseY - waterSurfaceY) * 60) / maxVisualHeight;
  const rightXAtWater = 290 + ((baseY - waterSurfaceY) * 60) / maxVisualHeight;

  // Closed status indicator
  const isClosed = clampedDepth >= CLOSURE_THRESHOLD_M;
  const isAlert = clampedDepth >= ALERT_THRESHOLD_M && !isClosed;

  // Format depth display per requirements
  const depthInches = clampedDepth * 39.3701;
  const displayDepthText = isClosed
    ? '>8 in (Closed)'
    : `${(clampedDepth * 100).toFixed(0)} cm (${depthInches.toFixed(1)} in)`;

  // Timings format
  const formatTime = (mins: number | null) => {
    if (mins == null || !isFinite(mins) || mins === Infinity) return '--';
    if (mins < 60) return `${mins} min`;
    return `${(mins / 60).toFixed(1)} hrs`;
  };

  const formatDuration = (mins: number) => {
    if (mins <= 0) return '0 min';
    if (mins < 60) return `${mins} min`;
    return `${(mins / 60).toFixed(1)} hrs`;
  };

  return (
    <div className="border border-border bg-surface rounded-sm p-3.5 mb-4 text-ink">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[12px] font-semibold tracking-wider text-muted uppercase">
          ELEVATION CROSS-SECTION
        </span>
        <span className="text-[12px] font-mono text-muted">
          {culvertLabel}
        </span>
      </div>

      {/* SVG Cross-Section Illustration */}
      <div className="w-full bg-[#F4F7FA] rounded-sm p-2 flex items-center justify-center border border-border overflow-hidden">
        <svg
          viewBox="0 0 420 155"
          className="w-full h-auto max-h-[155px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Bridge superstructure / Overpass deck */}
          <rect x="50" y="16" width="320" height="18" fill="#5B6B7C" rx="2" />
          <text
            x="210"
            y="29"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="10"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            letterSpacing="0.5"
          >
            OVERBRIDGE DECK
          </text>

          {/* Abutment side walls */}
          <path
            d="M 50 34 L 50 130 L 70 130 L 70 45 L 50 34 Z"
            fill="#CBD5E1"
          />
          <path
            d="M 370 34 L 370 130 L 350 130 L 350 45 L 370 34 Z"
            fill="#CBD5E1"
          />

          {/* Concrete Sloped Underpass Trench Base */}
          <polygon
            points="70,45 130,120 290,120 350,45 370,45 370,138 50,138 50,45"
            fill="#E2E8F0"
          />

          {/* Paved Roadway Surface */}
          <line
            x1="130"
            y1="120"
            x2="290"
            y2="120"
            stroke="#0F2A43"
            strokeWidth="3.5"
          />

          {/* Alert Threshold Guide Line (15 cm = 6 in) */}
          <line
            x1="70"
            y1={alertY}
            x2="350"
            y2={alertY}
            stroke="#D97706"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          {/* Alert Label placed on outer left margin to prevent water overlap */}
          <rect
            x="4"
            y={alertY - 9}
            width="62"
            height="16"
            fill="#FEF3C7"
            stroke="#D97706"
            strokeWidth="0.8"
            rx="2"
          />
          <text
            x="35"
            y={alertY + 2.5}
            textAnchor="middle"
            fill="#92400E"
            fontSize="8.5"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            Alert (6 in)
          </text>

          {/* Closure Threshold Guide Line (20 cm = 8 in) */}
          <line
            x1="70"
            y1={closureY}
            x2="350"
            y2={closureY}
            stroke="#DC2626"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          {/* Closure Label placed on outer right margin to prevent water overlap */}
          <rect
            x="354"
            y={closureY - 9}
            width="62"
            height="16"
            fill="#FEE2E2"
            stroke="#DC2626"
            strokeWidth="0.8"
            rx="2"
          />
          <text
            x="385"
            y={closureY + 2.5}
            textAnchor="middle"
            fill="#991B1B"
            fontSize="8.5"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            Closed (8 in)
          </text>

          {/* Water Inundation Polygon using exact #4F9BD9 token */}
          {waterHeightPx > 0.5 && (
            <polygon
              points={`${leftXAtWater},${waterSurfaceY} ${rightXAtWater},${waterSurfaceY} 290,120 130,120`}
              fill="#4F9BD9"
              fillOpacity="0.65"
              stroke="#1D6FB8"
              strokeWidth="1.5"
            />
          )}

          {/* Inundation Depth Indicator Line & Label */}
          {waterHeightPx > 0.5 ? (
            <g>
              <line
                x1="210"
                y1={waterSurfaceY}
                x2="210"
                y2="120"
                stroke="#0B2A4A"
                strokeWidth="1.5"
              />
              <circle cx="210" cy={waterSurfaceY} r="2.5" fill="#0B2A4A" />
              <circle cx="210" cy="120" r="2.5" fill="#0B2A4A" />
              <rect
                x="145"
                y={Math.max(48, waterSurfaceY - 18)}
                width="130"
                height="15"
                fill="#FFFFFF"
                stroke="#DDE5EE"
                rx="2"
              />
              <text
                x="210"
                y={Math.max(48, waterSurfaceY - 18) + 11}
                textAnchor="middle"
                fill="#0F2A43"
                fontSize="9"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                Depth: {displayDepthText}
              </text>
            </g>
          ) : (
            <text
              x="210"
              y="114"
              textAnchor="middle"
              fill="#5B6B7C"
              fontSize="10"
              fontFamily="Inter, sans-serif"
            >
              Roadway clear (0 cm)
            </text>
          )}

          {/* Sump marker */}
          <rect
            x="200"
            y="120"
            width="20"
            height="9"
            fill="#94A3B8"
            stroke="#475569"
            strokeWidth="1"
          />
          <text
            x="210"
            y="136"
            textAnchor="middle"
            fill="#5B6B7C"
            fontSize="8"
            fontFamily="Inter, sans-serif"
          >
            Sump Intake Grate
          </text>
        </svg>
      </div>

      {/* 3 Metrics Columns - All text at least 12px */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border">
        <div className="text-center">
          <div className="text-[12px] uppercase font-semibold text-muted mb-0.5">
            TIME TO ALERT
          </div>
          <div
            className={`font-mono text-[14px] font-bold ${
              isAlert || isClosed ? 'text-status-amber' : 'text-ink'
            }`}
          >
            {formatTime(simResult.minutesToAlert)}
          </div>
        </div>

        <div className="text-center border-x border-border">
          <div className="text-[12px] uppercase font-semibold text-muted mb-0.5">
            TIME TO CLOSURE
          </div>
          <div
            className={`font-mono text-[14px] font-bold flex items-center justify-center gap-1.5 ${
              isClosed ? 'text-status-red' : 'text-ink'
            }`}
          >
            <span>{formatTime(simResult.minutesToClosure)}</span>
            {closureDelta && (
              <span className="text-[12px] font-mono text-accent font-semibold transition-opacity duration-300">
                ({closureDelta})
              </span>
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="text-[12px] uppercase font-semibold text-muted mb-0.5">
            CLOSURE DURATION
          </div>
          <div className="font-mono text-[14px] font-bold text-ink">
            {formatDuration(simResult.closureMinutes)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossSectionCard;
