import React from 'react';
import { useStore } from '@/store/useStore';
import { hotspots } from '@/data/loadHotspots';

export const CompareView: React.FC = () => {
  const scenarioA = useStore((s) => s.scenarioA);
  const scenarioB = useStore((s) => s.scenarioB);
  const saveAsScenarioA = useStore((s) => s.saveAsScenarioA);
  const saveAsScenarioB = useStore((s) => s.saveAsScenarioB);
  const loadScenarioA = useStore((s) => s.loadScenarioA);
  const loadScenarioB = useStore((s) => s.loadScenarioB);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const selectedHotspotId = useStore((s) => s.selectedHotspotId);

  const formatMins = (mins: number | null) => {
    if (mins == null || !isFinite(mins) || mins === Infinity) return 'No closure';
    if (mins < 60) return `${mins} min`;
    return `${(mins / 60).toFixed(1)} hrs`;
  };

  const diffHours = scenarioB.totalClosureHours - scenarioA.totalClosureHours;

  return (
    <div className="border border-border bg-white rounded-sm p-3.5 mb-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-text-secondary uppercase">
            SCENARIO COMPARISON (A / B)
          </span>
          <div className="text-[11px] text-text-muted mt-0.5">
            Compare waterlogging metrics across two rainfall & dispatch setups.
          </div>
        </div>
      </div>

      {/* Snapshot Summary Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* Scenario A Card */}
        <div className="bg-surface border border-border/80 rounded-sm p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-text-primary">Scenario A</span>
            <button
              onClick={saveAsScenarioA}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Capture current
            </button>
          </div>
          <div className="text-[11px] text-text-muted mb-2">
            {scenarioA.rainMm} mm / {scenarioA.durationH} h
          </div>
          <div className="flex items-baseline justify-between border-t border-border/60 pt-1.5">
            <span className="text-[11px] text-text-secondary">Total closure:</span>
            <span className="font-mono text-[14px] font-bold text-text-primary">
              {scenarioA.totalClosureHours.toFixed(1)} hrs
            </span>
          </div>
          <button
            onClick={loadScenarioA}
            className="w-full mt-2 h-6 text-[10px] font-medium border border-border rounded-sm bg-white hover:bg-surface text-text-secondary"
          >
            Load into simulator
          </button>
        </div>

        {/* Scenario B Card */}
        <div className="bg-surface border border-border/80 rounded-sm p-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] font-semibold text-text-primary">Scenario B</span>
            <button
              onClick={saveAsScenarioB}
              className="text-[10px] text-primary hover:underline font-medium"
            >
              Capture current
            </button>
          </div>
          <div className="text-[11px] text-text-muted mb-2">
            {scenarioB.rainMm} mm / {scenarioB.durationH} h
          </div>
          <div className="flex items-baseline justify-between border-t border-border/60 pt-1.5">
            <span className="text-[11px] text-text-secondary">Total closure:</span>
            <span className="font-mono text-[14px] font-bold text-text-primary">
              {scenarioB.totalClosureHours.toFixed(1)} hrs
            </span>
          </div>
          <button
            onClick={loadScenarioB}
            className="w-full mt-2 h-6 text-[10px] font-medium border border-border rounded-sm bg-white hover:bg-surface text-text-secondary"
          >
            Load into simulator
          </button>
        </div>
      </div>

      {/* Delta Callout */}
      <div className="p-2 bg-blue-50/60 border border-blue-200/80 rounded-sm flex items-center justify-between text-[11px]">
        <span className="text-text-secondary font-medium">Difference (B vs A):</span>
        <span className={`font-mono font-bold ${diffHours > 0 ? 'text-status-red' : diffHours < 0 ? 'text-status-green' : 'text-text-secondary'}`}>
          {diffHours > 0 ? `+${diffHours.toFixed(1)} hrs closure` : diffHours < 0 ? `${diffHours.toFixed(1)} hrs closure` : 'Identical'}
        </span>
      </div>

      {/* Hotspots Per-Hotspot Comparison Table */}
      <div className="border border-border rounded-sm overflow-hidden mt-2">
        <div className="bg-[#F9FAFB] p-2 border-b border-border text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          PER-HOTSPOT TIME TO CLOSURE
        </div>
        <div className="max-h-[220px] overflow-y-auto panel-scroll">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-surface text-text-muted border-b border-border text-[10px]">
              <tr>
                <th className="py-1.5 px-2 font-medium">HOTSPOT</th>
                <th className="py-1.5 px-2 font-medium">SCENARIO A</th>
                <th className="py-1.5 px-2 font-medium text-right">SCENARIO B</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {hotspots.map((h) => {
                const resA = scenarioA.simResults[h.id];
                const resB = scenarioB.simResults[h.id];
                const isSelected = h.id === selectedHotspotId;

                return (
                  <tr
                    key={h.id}
                    onClick={() => selectHotspot(h.id)}
                    className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/50' : 'hover:bg-surface/80'}`}
                  >
                    <td className="py-1.5 px-2 font-medium text-text-primary truncate max-w-[110px]">
                      {h.name.replace(' Underpass', '').replace(' Flyover', '')}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-text-secondary">
                      {formatMins(resA?.minutesToClosure ?? null)}
                    </td>
                    <td className="py-1.5 px-2 font-mono text-[10px] text-right text-text-secondary">
                      {formatMins(resB?.minutesToClosure ?? null)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CompareView;
