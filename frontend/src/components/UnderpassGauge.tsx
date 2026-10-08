'use client';

import React from 'react';
import { Hotspot, HotspotSimulationResult, Intervention } from '../engine/simulator';
import { AlertTriangle, ShieldCheck, Waves, Truck, Wrench, Navigation, Ban } from 'lucide-react';

interface UnderpassGaugeProps {
  hotspot: Hotspot;
  result: HotspotSimulationResult;
  intervention: Intervention;
  onUpdateIntervention: (interv: Intervention) => void;
}

export const UnderpassGauge: React.FC<UnderpassGaugeProps> = ({
  hotspot,
  result,
  intervention,
  onUpdateIntervention,
}) => {
  const maxDepthM = result.maxDepthM;
  const depthInches = (maxDepthM * 39.3701).toFixed(1);

  // Height percentage relative to 12 inches (0.30m) scale
  const depthPercent = Math.min(100, Math.max(10, (parseFloat(depthInches) / 12) * 100));

  const isClosed = result.status === 'CLOSED';
  const isAlert = result.status === 'ALERT';

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-100">{hotspot.name}</h3>
            {hotspot.hospital_route && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 font-mono">
                🚑 Trauma Route
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">{hotspot.road_name} ({hotspot.traffic_pcu_per_hour.toLocaleString()} PCU/hr)</p>
        </div>

        {isClosed ? (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> SUBMERGED (CLOSED)
          </span>
        ) : isAlert ? (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3.5 h-3.5" /> 6" ALERT THRESHOLD
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> OPEN & SAFE
          </span>
        )}
      </div>

      {/* 2D Cross Section SVG Underpass Elevation */}
      <div className="relative w-full h-44 bg-slate-950 rounded-lg overflow-hidden border border-slate-800 flex items-end justify-center p-2">
        {/* Bridge Girder Graphic */}
        <div className="absolute top-0 left-0 right-0 h-6 bg-slate-800 border-b-2 border-amber-500/60 flex items-center justify-between px-3 text-[10px] text-slate-400 font-mono">
          <span>RAILWAY OVERPASS GIRDERS</span>
          <span>CLEARANCE: 4.8m</span>
        </div>

        {/* 8 inch Closure Cutoff Line */}
        <div className="absolute w-full border-t border-dashed border-rose-500 text-[10px] text-rose-400 font-mono pl-3 z-10" style={{ bottom: '66%' }}>
          ▲ 8" (20cm) PWD TRAFFIC CUTOFF
        </div>

        {/* 6 inch Warning Line */}
        <div className="absolute w-full border-t border-dashed border-amber-500 text-[10px] text-amber-400 font-mono pl-3 z-10" style={{ bottom: '48%' }}>
          ▲ 6" (15cm) PUMP DEPLOYMENT ALERT
        </div>

        {/* Rising Water Animation Wave */}
        <div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-700/80 to-cyan-400/60 backdrop-blur-sm border-t border-cyan-300 transition-all duration-300"
          style={{ height: `${depthPercent}%` }}
        >
          <div className="text-[10px] font-mono text-cyan-100 text-right pr-3 pt-1">
            Current Depth: {depthInches} in ({maxDepthM}m)
          </div>
        </div>

        {/* DTC Bus Silhouette */}
        <div className="relative z-20 flex flex-col items-center mb-1 drop-shadow-lg">
          <svg className="w-16 h-10 text-amber-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
          <span className="text-[9px] text-slate-300 font-mono">DTC Bus Fleet Level</span>
        </div>
      </div>

      {/* Numerical Metrics Bar */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400">TIME TO ALERT</div>
          <div className="font-bold text-amber-300">
            {result.timeToAlertMins !== null ? `${result.timeToAlertMins} min` : 'None'}
          </div>
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400">TIME TO CLOSURE</div>
          <div className={`font-bold ${isClosed ? 'text-rose-400' : 'text-emerald-400'}`}>
            {result.timeToClosureMins !== null ? `${result.timeToClosureMins} min` : 'Safe (>4h)'}
          </div>
        </div>
        <div className="bg-slate-950 p-2 rounded border border-slate-800">
          <div className="text-[10px] text-slate-400">IMPACT INDEX</div>
          <div className="font-bold text-cyan-400">{result.impactScore}</div>
        </div>
      </div>

      {/* Manual Interventions Toggles */}
      <div className="border-t border-slate-800 pt-3 space-y-2">
        <div className="text-[11px] font-semibold text-slate-300 flex items-center justify-between">
          <span>Operational Interventions:</span>
          <span className="text-[10px] text-slate-400 font-mono">Hazard vs Impact Layers</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* Mobile Pumps */}
          <div className="flex items-center justify-between bg-slate-950 p-2 rounded border border-slate-800">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Truck className="w-3.5 h-3.5 text-cyan-400" /> Mobile Pumps:
            </span>
            <div className="flex items-center gap-1">
              {[0, 1, 2, 3].map((num) => (
                <button
                  key={num}
                  onClick={() => onUpdateIntervention({ ...intervention, tempPumps: num })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                    intervention.tempPumps === num
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  +{num}
                </button>
              ))}
            </div>
          </div>

          {/* Desilt Drain */}
          <button
            onClick={() => onUpdateIntervention({ ...intervention, drainCleared: !intervention.drainCleared })}
            className={`flex items-center justify-between p-2 rounded border transition text-left ${
              intervention.drainCleared
                ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" /> Drain Desilting
            </span>
            <span className="text-[10px] font-mono">{intervention.drainCleared ? '100%' : '50%'}</span>
          </button>

          {/* Pre-Divert Traffic */}
          <button
            onClick={() => onUpdateIntervention({ ...intervention, preDivert: !intervention.preDivert })}
            className={`flex items-center justify-between p-2 rounded border transition text-left ${
              intervention.preDivert
                ? 'bg-blue-950/40 border-blue-500 text-blue-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" /> Pre-Divert Traffic
            </span>
            <span className="text-[10px] font-mono">{intervention.preDivert ? '-60% Exp' : 'None'}</span>
          </button>

          {/* Road Close */}
          <button
            onClick={() => onUpdateIntervention({ ...intervention, roadClosed: !intervention.roadClosed })}
            className={`flex items-center justify-between p-2 rounded border transition text-left ${
              intervention.roadClosed
                ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Ban className="w-3.5 h-3.5" /> Emergency Cutoff
            </span>
            <span className="text-[10px] font-mono">{intervention.roadClosed ? 'Active' : 'Open'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
