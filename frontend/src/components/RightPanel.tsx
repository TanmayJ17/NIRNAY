import React, { useState } from 'react';
import { useStore, getPinStatus } from '@/store/useStore';
import CrossSectionCard from './CrossSectionCard';
import DispatchControls from './DispatchControls';
import RecommendResult from './RecommendResult';
import AllocationTable from './AllocationTable';
import { MOCK_RECOMMEND_RESULT } from '@/data/mockRecommend';
import hotspotData from '@/data/hotspots.json';
import type { Hotspot } from '@/types';

const hotspotsList: Hotspot[] = hotspotData.hotspots as Hotspot[];

export const RightPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'interventions' | 'recommend' | 'explain'>('recommend');
  const [isLoadingDispatch, setIsLoadingDispatch] = useState(false);

  const selectedHotspotId = useStore((s) => s.selectedHotspotId);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const simResults = useStore((s) => s.simResults);
  const interventions = useStore((s) => s.interventions);
  const setIntervention = useStore((s) => s.setIntervention);
  const recommendResult = useStore((s) => s.recommendResult) || MOCK_RECOMMEND_RESULT;
  const setRecommendResult = useStore((s) => s.setRecommendResult);

  // Active hotspot
  const hotspot =
    hotspotsList.find((h) => h.id === selectedHotspotId) ||
    hotspotsList[0];

  const simResult = hotspot
    ? simResults[hotspot.id] || {
        minutesToAlert: Infinity,
        minutesToClosure: Infinity,
        closureMinutes: 0,
        maxDepthM: 0,
        impactIndex: 0,
      }
    : {
        minutesToAlert: Infinity,
        minutesToClosure: Infinity,
        closureMinutes: 0,
        maxDepthM: 0,
        impactIndex: 0,
      };

  const currentInterventions = (hotspot && interventions[hotspot.id]) || {
    tempPumps: 0,
    drainCleared: false,
    preDivert: false,
    roadClosed: false,
  };

  const status = getPinStatus(simResult);
  const statusColorClass =
    status === 'red'
      ? 'bg-status-red'
      : status === 'amber'
      ? 'bg-status-amber'
      : 'bg-status-green';

  const handleRunRecommend = async () => {
    setIsLoadingDispatch(true);
    try {
      // Attempt real API call if available, fall back cleanly to mock data
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotspotId: hotspot.id,
          rainMm: useStore.getState().rainMm,
          durationH: useStore.getState().durationH,
          availablePumps: useStore.getState().availablePumps,
          availableCrews: useStore.getState().availableCrews,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecommendResult(data);
      } else {
        // Fallback fixture
        setRecommendResult(MOCK_RECOMMEND_RESULT);
      }
    } catch {
      // Network/offline fallback
      setRecommendResult(MOCK_RECOMMEND_RESULT);
    } finally {
      setIsLoadingDispatch(false);
    }
  };

  return (
    <aside className="w-full h-full bg-[#FDFDFD] flex flex-col overflow-y-auto panel-scroll border-l border-border">
      {/* Hotspot Header */}
      <div className="p-4 border-b border-border bg-white shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`w-2.5 h-2.5 rounded-full ${statusColorClass} shrink-0`} />
          <h2 className="text-[15px] font-semibold text-text-primary tracking-tight">
            {hotspot.name}
          </h2>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-text-secondary mt-1">
          {hotspot.hospital_route && (
            <span className="bg-blue-50 text-primary font-medium px-2 py-0.5 rounded-sm">
              Hospital route
            </span>
          )}
          <span className="text-text-muted font-mono">
            CH: {hotspot.road_name}
          </span>
          {hotspot.hospital_name && (
            <span className="text-text-muted truncate">
              • {hotspot.hospital_name}
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex-1">
        {/* Elevation Cross Section Card */}
        <CrossSectionCard
          depth={simResult.maxDepthM}
          storageDepth={hotspot.storage_depth_max_m}
          simResult={simResult}
          culvertLabel={`Culvert #${hotspot.id.slice(-2).toUpperCase() || '08'} Dtp`}
        />

        {/* Tab Selector */}
        <div className="flex border-b border-border mb-4">
          <button
            onClick={() => setActiveTab('interventions')}
            className={`flex-1 py-2 text-[12px] font-medium transition-colors border-b-2 text-center ${
              activeTab === 'interventions'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Interventions
          </button>
          <button
            onClick={() => setActiveTab('recommend')}
            className={`flex-1 py-2 text-[12px] font-medium transition-colors border-b-2 text-center ${
              activeTab === 'recommend'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Recommend
          </button>
          <button
            onClick={() => setActiveTab('explain')}
            className={`flex-1 py-2 text-[12px] font-medium transition-colors border-b-2 text-center ${
              activeTab === 'explain'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            Explain
          </button>
        </div>

        {/* TAB 1: RECOMMEND */}
        {activeTab === 'recommend' && (
          <div>
            <DispatchControls
              onFindAllocation={handleRunRecommend}
              isLoading={isLoadingDispatch}
            />
            <RecommendResult result={recommendResult} />
            <AllocationTable
              allocations={recommendResult.allocations}
              onSelectHotspot={(id) => selectHotspot(id)}
            />
          </div>
        )}

        {/* TAB 2: INTERVENTIONS */}
        {activeTab === 'interventions' && (
          <div className="border border-border bg-white rounded-sm p-4 space-y-4 mb-4">
            <div>
              <div className="text-[12px] font-medium text-text-primary mb-1">
                Deploy Mobile Pumps
              </div>
              <div className="text-[11px] text-text-muted mb-2">
                Adds high-capacity suction pumps (0.15 m³/s each)
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setIntervention(hotspot.id, {
                      tempPumps: Math.max(0, currentInterventions.tempPumps - 1),
                    })
                  }
                  className="w-7 h-7 border border-border rounded-sm hover:bg-surface flex items-center justify-center font-mono"
                >
                  -
                </button>
                <span className="font-mono text-[14px] font-semibold text-text-primary">
                  {currentInterventions.tempPumps}
                </span>
                <button
                  onClick={() =>
                    setIntervention(hotspot.id, {
                      tempPumps: Math.min(4, currentInterventions.tempPumps + 1),
                    })
                  }
                  className="w-7 h-7 border border-border rounded-sm hover:bg-surface flex items-center justify-center font-mono"
                >
                  +
                </button>
                <span className="text-[11px] text-text-muted">
                  +{(currentInterventions.tempPumps * 0.15).toFixed(2)} m³/s
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-border/70 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-[12px] font-medium text-text-primary">
                    Clear Grates & Sump
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Restores gravity drain to 100% capacity
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentInterventions.drainCleared}
                  onChange={(e) =>
                    setIntervention(hotspot.id, {
                      drainCleared: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded-sm border-border text-primary focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-[12px] font-medium text-text-primary">
                    Upstream Traffic Pre-Divert
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Signage & traffic police reroute 60% of PCU
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentInterventions.preDivert}
                  onChange={(e) =>
                    setIntervention(hotspot.id, {
                      preDivert: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded-sm border-border text-primary focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <div className="text-[12px] font-medium text-text-primary">
                    Preemptive Road Closure
                  </div>
                  <div className="text-[10px] text-text-muted">
                    Barricade before inundation to prevent stranded vehicles
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentInterventions.roadClosed}
                  onChange={(e) =>
                    setIntervention(hotspot.id, {
                      roadClosed: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded-sm border-border text-primary focus:ring-0"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 3: EXPLAIN */}
        {activeTab === 'explain' && (
          <div className="border border-border bg-white rounded-sm p-4 space-y-3 mb-4 text-[12px]">
            <div className="font-semibold text-text-primary">
              Hydrological Balance Model
            </div>
            <p className="text-text-secondary leading-relaxed">
              Inflow is modeled using the Rational Method:
            </p>
            <div className="bg-[#F8F9FA] p-2.5 font-mono text-[11px] rounded-sm text-text-primary border border-border/80">
              Q_in = 0.278 · C · I(t) · A_basin
            </div>
            <ul className="list-disc pl-4 text-text-secondary space-y-1 text-[11px]">
              <li>
                Runoff Coefficient (C):{' '}
                <span className="font-mono">{hotspot.runoff_coeff_default}</span>
              </li>
              <li>
                Sag Catchment Area:{' '}
                <span className="font-mono">{hotspot.catchment_km2} km²</span>
              </li>
              <li>
                Permanent Pump Capacity:{' '}
                <span className="font-mono">
                  {hotspot.permanent_pump_capacity_m3s} m³/s
                </span>
              </li>
              <li>
                Gravity Drain Capacity:{' '}
                <span className="font-mono">
                  {hotspot.gravity_drain_capacity_m3s} m³/s
                </span>
              </li>
            </ul>

            <div className="pt-2 border-t border-border/70 font-semibold text-text-primary">
              Threshold Rules
            </div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              • <strong className="text-status-amber">Alert (15 cm)</strong>: Water covers roadway crown; low-clearance vehicles begin stalling.
              <br />• <strong className="text-status-red">Closure (20 cm)</strong>: Full carriageway closure mandatory under Delhi Traffic Police SOP.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
