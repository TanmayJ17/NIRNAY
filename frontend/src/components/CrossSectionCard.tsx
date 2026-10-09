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
  // Canvas: 380 wide, 140 high
  // Roadbed base: y = 110, width 140 (x: 120 to 260)
  // Sloped walls: from (70, 40) down to (120, 110) on left, (310, 40) down to (260, 110) on right
  const baseY = 108;
  const topY = 46;
  const maxVisualHeight = baseY - topY; // 62px

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
  // Left slope: x goes from 70 at y=46 to 120 at y=108. dx/dy = (120 - 70) / (108 - 46) = 50 / 62
  const leftXAtWater = 120 - ((baseY - waterSurfaceY) * 50) / maxVisualHeight;
  const rightXAtWater = 260 + ((baseY - waterSurfaceY) * 50) / maxVisualHeight;

  // Closed status indicator
  const isClosed = clampedDepth >= CLOSURE_THRESHOLD_M;
  const isAlert = clampedDepth >= ALERT_THRESHOLD_M && !isClosed;

  // Format depth display per requirements
  const depthInches = clampedDepth * 39.3701;
  const displayDepthText = isClosed
    ? '>8 in'
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
    <div className="border border-border bg-white rounded-sm p-3.5 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
          ELEVATION CROSS-SECTION
        </span>
        <span className="text-[11px] font-mono text-text-muted">
          {culvertLabel}
        </span>
      </div>

      {/* SVG Cross-Section Illustration */}
      <div className="w-full bg-[#F3F4F6] rounded-sm p-2 flex items-center justify-center border border-border/60 overflow-hidden">
        <svg
          viewBox="0 0 380 135"
          className="w-full h-auto max-h-[135px] select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Bridge superstructure / Overpass deck */}
          <rect x="50" y="20" width="280" height="16" fill="#9CA3AF" rx="1" />
          <text
            x="190"
            y="31"
            textAnchor="middle"
            fill="#FFFFFF"
            fontSize="8"
            fontWeight="600"
            letterSpacing="0.5"
          >
            RAILWAY / ROAD OVERBRIDGE DECK
          </text>

          {/* Abutment side walls */}
          <path
            d="M 50 36 L 50 115 L 70 115 L 70 42 L 50 36 Z"
            fill="#CBD5E1"
          />
          <path
            d="M 330 36 L 330 115 L 310 115 L 310 42 L 330 36 Z"
            fill="#CBD5E1"
          />

          {/* Concrete Sloped Underpass Trench Base */}
          <polygon
            points="70,42 120,108 260,108 310,42 330,42 330,122 50,122 50,42"
            fill="#E2E8F0"
          />

          {/* Paved Roadway Surface */}
          <line
            x1="120"
            y1="108"
            x2="260"
            y2="108"
            stroke="#64748B"
            strokeWidth="3"
          />

          {/* Alert Threshold Guide Line (15 cm) */}
          <line
            x1="90"
            y1={alertY}
            x2="290"
            y2={alertY}
            stroke="#D97706"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x="92"
            y={alertY - 3}
            fill="#D97706"
            fontSize="7"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            Alert (15 cm)
          </text>

          {/* Closure Threshold Guide Line (20 cm) */}
          <line
            x1="80"
            y1={closureY}
            x2="300"
            y2={closureY}
            stroke="#DC2626"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
          <text
            x="298"
            y={closureY - 3}
            textAnchor="end"
            fill="#DC2626"
            fontSize="7"
            fontFamily="Inter, sans-serif"
            fontWeight="500"
          >
            Closure (20 cm)
          </text>

          {/* Water Inundation Polygon */}
          {waterHeightPx > 0.5 && (
            <polygon
              points={`${leftXAtWater},${waterSurfaceY} ${rightXAtWater},${waterSurfaceY} 260,108 120,108`}
              fill="#60A5FA"
              fillOpacity="0.45"
              stroke="#2563EB"
              strokeWidth="1.2"
            />
          )}

          {/* Inundation Depth Indicator Line & Label */}
          {waterHeightPx > 0.5 ? (
            <g>
              <line
                x1="190"
                y1={waterSurfaceY}
                x2="190"
                y2="108"
                stroke="#1D4ED8"
                strokeWidth="1.5"
              />
              <circle cx="190" cy={waterSurfaceY} r="2" fill="#1D4ED8" />
              <circle cx="190" cy="108" r="2" fill="#1D4ED8" />
              <text
                x="196"
                y={Math.min(100, Math.max(waterSurfaceY + 10, 58))}
                fill="#1E40AF"
                fontSize="8"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {displayDepthText}
              </text>
            </g>
          ) : (
            <text
              x="190"
              y="102"
              textAnchor="middle"
              fill="#94A3B8"
              fontSize="8"
              fontFamily="Inter, sans-serif"
            >
              Roadway dry (0 cm)
            </text>
          )}

          {/* Submersible sump marker */}
          <rect
            x="180"
            y="108"
            width="20"
            height="8"
            fill="#94A3B8"
            stroke="#475569"
            strokeWidth="1"
          />
          <text
            x="190"
            y="122"
            textAnchor="middle"
            fill="#64748B"
            fontSize="6.5"
            fontFamily="Inter, sans-serif"
          >
            Sump Intake Grate
          </text>
        </svg>
      </div>

      {/* 3 Metrics Columns */}
      <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/80">
        <div className="text-center">
          <div className="text-[10px] uppercase font-semibold text-text-muted mb-0.5">
            TIME TO ALERT
          </div>
          <div
            className={`font-mono text-[14px] font-semibold ${
              isAlert || isClosed ? 'text-status-amber' : 'text-text-primary'
            }`}
          >
            {formatTime(simResult.minutesToAlert)}
          </div>
        </div>

        <div className="text-center border-x border-border/60">
          <div className="text-[10px] uppercase font-semibold text-text-muted mb-0.5">
            TIME TO CLOSURE
          </div>
          <div
            className={`font-mono text-[14px] font-semibold flex items-center justify-center gap-1.5 ${
              isClosed ? 'text-status-red' : 'text-text-primary'
            }`}
          >
            <span>{formatTime(simResult.minutesToClosure)}</span>
            {closureDelta && (
              <span className="text-[11px] font-mono text-primary font-medium transition-opacity duration-300">
                ({closureDelta})
              </span>
            )}
          </div>
        </div>

        <div className="text-center">
          <div className="text-[10px] uppercase font-semibold text-text-muted mb-0.5">
            CLOSURE DURATION
          </div>
          <div className="font-mono text-[14px] font-semibold text-text-primary">
            {formatDuration(simResult.closureMinutes)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrossSectionCard;
