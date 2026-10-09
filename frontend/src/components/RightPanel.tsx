import React, { useState } from 'react';
import { useStore, getPinStatus } from '@/store/useStore';
import CrossSectionCard from './CrossSectionCard';
import DispatchControls from './DispatchControls';
import RecommendResult from './RecommendResult';
import AllocationTable from './AllocationTable';
import AskNirnayPanel from './AskNirnayPanel';
import { MOCK_RECOMMEND_RESULT } from '@/data/mockRecommend';
import hotspotData from '@/data/hotspots.json';
import type { Hotspot } from '@/types';

const hotspotsList: Hotspot[] = hotspotData.hotspots as Hotspot[];

export const RightPanel: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const [isLoadingDispatch, setIsLoadingDispatch] = useState(false);

  const selectedHotspotId = useStore((s) => s.selectedHotspotId);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const simResults = useStore((s) => s.simResults);
  const interventions = useStore((s) => s.interventions);
  const setIntervention = useStore((s) => s.setIntervention);
  const recommendResult = useStore((s) => s.recommendResult) || MOCK_RECOMMEND_RESULT;
  const setRecommendResult = useStore((s) => s.setRecommendResult);
  const closureDeltas = useStore((s) => s.closureDeltas);

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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusColorClass} shrink-0`} />
            <h2 className="text-[15px] font-semibold text-text-primary tracking-tight">
              {hotspot.name}
            </h2>
          </div>
          <button
            onClick={() => setActiveTab('explain')}
            className="h-6 px-2 bg-blue-50 hover:bg-blue-100 text-primary border border-blue-200 text-[11px] font-medium rounded-sm flex items-center gap-1 transition-colors"
            title="Ask NIRNAY"
          >
            <span>Ask</span>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </button>
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
          closureDelta={closureDeltas[hotspot.id]}
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

        {/* TAB 3: EXPLAIN (Ask NIRNAY Q&A Panel) */}
        {activeTab === 'explain' && (
          <AskNirnayPanel hotspot={hotspot} />
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
