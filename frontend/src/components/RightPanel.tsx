import React, { useState } from 'react';
import { useStore, getPinStatus } from '@/store/useStore';
import CrossSectionCard from './CrossSectionCard';
import DispatchControls from './DispatchControls';
import RecommendResult from './RecommendResult';
import AllocationTable from './AllocationTable';
import AskNirnayPanel from './AskNirnayPanel';
import CompareView from './CompareView';
import { recommend } from '@/engine/optimizer';
import { runMonteCarloAsync } from '@/engine/monteCarloAsync';
import { hotspots } from '@/data/loadHotspots';
import type { RecommendResult as RecommendResultType } from '@/types';

export const RightPanel: React.FC = () => {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const [isLoadingDispatch, setIsLoadingDispatch] = useState(false);
  const [dispatchProgress, setDispatchProgress] = useState(0);
  const [showFeatureGuide, setShowFeatureGuide] = useState(true);

  const selectedHotspotId = useStore((s) => s.selectedHotspotId);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const simResults = useStore((s) => s.simResults);
  const interventions = useStore((s) => s.interventions);
  const setIntervention = useStore((s) => s.setIntervention);
  const recommendResult = useStore((s) => s.recommendResult);
  const setRecommendResult = useStore((s) => s.setRecommendResult);
  const closureDeltas = useStore((s) => s.closureDeltas);
  const compareMode = useStore((s) => s.compareMode);

  // Active hotspot
  const hotspot =
    hotspots.find((h) => h.id === selectedHotspotId) ||
    hotspots[0];

  const simResult = hotspot
    ? simResults[hotspot.id] || {
        minutesToAlert: null,
        minutesToClosure: null,
        closureMinutes: 0,
        maxDepthM: 0,
        impactIndex: 0,
      }
    : {
        minutesToAlert: null,
        minutesToClosure: null,
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
  const isClosed = status === 'red';
  const isAlert = status === 'amber';

  const handleRunRecommend = async () => {
    setIsLoadingDispatch(true);
    setDispatchProgress(0);

    try {
      const { rainMm, durationH, availablePumps, availableCrews } = useStore.getState();

      const usablePumps = Math.min(availablePumps, hotspots.length * 4);
      const usableCrews = Math.min(availableCrews, hotspots.length);

      // 1. Run DP optimizer
      const optResult = recommend(rainMm, durationH, usablePumps, usableCrews);

      // 2. Run 200 Monte Carlo draws
      const mcResult = await runMonteCarloAsync(
        rainMm,
        durationH,
        usablePumps,
        usableCrews,
        200,
        42,
        (progress) => {
          setDispatchProgress(Math.round(progress * 100));
        }
      );

      const mappedAllocations = optResult.optimal.allocations.map((a) => {
        const h = hotspots.find((x) => x.id === a.hotspotId);
        return {
          hotspotId: a.hotspotId,
          hotspotName: h?.name ?? a.hotspotId,
          pumps: a.tempPumps,
          crews: a.drainCleared ? 1 : 0,
          drainCleared: a.drainCleared,
        };
      });

      const fullResult: RecommendResultType = {
        closureHoursSaved: optResult.closureHoursSavedVsEqual,
        closureHoursSavedRange: [mcResult.closureHoursSaved.p10, mcResult.closureHoursSaved.p90],
        impactIndexReduced: optResult.impactReducedPercentVsEqual,
        impactIndexReducedRange: [mcResult.impactReducedPercent.p10, mcResult.impactReducedPercent.p90],
        stabilityPercent: mcResult.stabilityPercent,
        greedyClosureHours: optResult.greedy.totalClosureHours,
        optimal: optResult.optimal,
        greedy: optResult.greedy,
        equalSplit: optResult.equalSplit,
        historySplit: optResult.historySplit,
        allocations: mappedAllocations,
      };

      setRecommendResult(fullResult);
    } catch (err) {
      console.error('Recommend optimization error:', err);
    } finally {
      setIsLoadingDispatch(false);
      setDispatchProgress(0);
    }
  };

  return (
    <aside className="w-full h-full bg-[#F8FAFC] flex flex-col overflow-y-auto panel-scroll border-l border-gray-300">
      {/* 1. CIVIC FEATURES EXPLANATION GUIDE CARD (Solves User's Problem) */}
      {showFeatureGuide && (
        <div className="bg-[#0F2B5C] text-white p-3.5 border-b border-[#1E3A8A] shrink-0 relative">
          <button
            onClick={() => setShowFeatureGuide(false)}
            className="absolute top-2.5 right-2.5 text-white/60 hover:text-white text-xs px-1.5 py-0.5 rounded bg-white/10"
            title="Dismiss Guide"
          >
            ✕
          </button>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-sky-500 text-white">
              CIVIC COMMAND GUIDE
            </span>
            <span className="text-[11px] font-semibold text-sky-200">
              3 Core Decision Engines:
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] leading-tight">
            <div
              onClick={() => setActiveTab('recommend')}
              className="bg-white/10 hover:bg-white/15 p-2 rounded cursor-pointer border border-white/10 transition-colors"
            >
              <div className="font-bold text-sky-300 mb-0.5 flex items-center gap-1">
                <span>⚡</span>
                <span>DP Optimizer</span>
              </div>
              <div className="text-white/80">
                Solves optimal mobile pump allocation (200 MC draws).
              </div>
            </div>

            <div
              onClick={() => setActiveTab('interventions')}
              className="bg-white/10 hover:bg-white/15 p-2 rounded cursor-pointer border border-white/10 transition-colors"
            >
              <div className="font-bold text-amber-300 mb-0.5 flex items-center gap-1">
                <span>🛠️</span>
                <span>Interventions</span>
              </div>
              <div className="text-white/80">
                Deploy pumps, clear drains, reroute traffic.
              </div>
            </div>

            <div
              onClick={() => setActiveTab('explain')}
              className="bg-white/10 hover:bg-white/15 p-2 rounded cursor-pointer border border-white/10 transition-colors"
            >
              <div className="font-bold text-emerald-300 mb-0.5 flex items-center gap-1">
                <span>🤖</span>
                <span>AWS Bedrock</span>
              </div>
              <div className="text-white/80">
                Claude 3.5 Sonnet explains flood logic & lifelines.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. ACTIVE HOTSPOT INSPECTION BANNER */}
      <div className="p-4 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full shrink-0 ${
                isClosed
                  ? 'bg-red-600 animate-ping'
                  : isAlert
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
            />
            <h2 className="text-[16px] font-bold text-[#0F2B5C] tracking-tight">
              {hotspot.name}
            </h2>
          </div>

          <span
            className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide uppercase ${
              isClosed
                ? 'bg-red-100 text-red-700 border border-red-300'
                : isAlert
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            }`}
          >
            {isClosed ? '🔴 ROAD CLOSED' : isAlert ? '🟡 ALERT LEVEL' : '🟢 CLEAR / NORMAL'}
          </span>
        </div>

        {/* Location & Lifeline Metadata */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-600">
          <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">
            CH: {hotspot.road_name}
          </span>

          {hotspot.hospital_route && (
            <span className="bg-red-50 text-red-700 border border-red-200 font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <span>🏥</span>
              <span>Hospital Lifeline ({hotspot.hospital_name || 'Emergency Access'})</span>
            </span>
          )}

          <span className="text-gray-500">
            • Depth: <strong className="text-gray-900 font-mono">{simResult.maxDepthM.toFixed(2)}m</strong>
          </span>
          {simResult.closureMinutes > 0 && (
            <span className="text-red-600 font-semibold">
              • {(simResult.closureMinutes / 60).toFixed(1)} hrs closure
            </span>
          )}
        </div>
      </div>

      {/* 3. MAIN WORKSPACE AREA */}
      <div className="p-4 flex-1">
        {/* Elevation Cross Section Card */}
        <CrossSectionCard
          depth={simResult.maxDepthM}
          storageDepth={hotspot.storage_depth_max_m}
          simResult={simResult}
          culvertLabel={`Culvert #${hotspot.id.slice(-2).toUpperCase() || '08'} Dtp`}
          closureDelta={closureDeltas[hotspot.id]}
        />

        {/* Compare A/B Section when Compare Mode is enabled */}
        {compareMode && <CompareView />}

        {/* 4. PROMINENT CIVIC TAB BAR */}
        <div className="flex border-b-2 border-gray-200 my-4 bg-white rounded-t-sm shadow-xs overflow-hidden">
          <button
            onClick={() => setActiveTab('recommend')}
            className={`flex-1 py-2.5 px-2 text-[12px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'recommend'
                ? 'border-b-2 border-[#0F2B5C] bg-[#0F2B5C] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#0F2B5C] hover:bg-gray-50'
            }`}
          >
            <span>⚡</span>
            <span>1. Pump Optimizer</span>
          </button>

          <button
            onClick={() => setActiveTab('interventions')}
            className={`flex-1 py-2.5 px-2 text-[12px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'interventions'
                ? 'border-b-2 border-[#0F2B5C] bg-[#0F2B5C] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#0F2B5C] hover:bg-gray-50'
            }`}
          >
            <span>🛠️</span>
            <span>2. Interventions</span>
          </button>

          <button
            onClick={() => setActiveTab('explain')}
            className={`flex-1 py-2.5 px-2 text-[12px] font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'explain'
                ? 'border-b-2 border-[#0F2B5C] bg-[#0F2B5C] text-white shadow-xs'
                : 'text-gray-600 hover:text-[#0F2B5C] hover:bg-gray-50'
            }`}
          >
            <span>🤖</span>
            <span>3. Ask AI</span>
          </button>
        </div>

        {/* TAB 1: RECOMMEND (DP Solver) */}
        {activeTab === 'recommend' && (
          <div>
            <div className="mb-3 bg-blue-50 border border-blue-200 rounded p-2.5 text-[11px] text-blue-900 leading-relaxed">
              <strong className="font-bold">Feature Explanation:</strong> The Dynamic Programming (DP) algorithm optimizes the city-wide distribution of mobile suction pumps and desilting crews to save maximum trapped vehicle-hours across all 15 underpasses.
            </div>

            <DispatchControls
              onFindAllocation={handleRunRecommend}
              isLoading={isLoadingDispatch}
              progress={dispatchProgress}
            />
            <RecommendResult result={recommendResult} />
            {recommendResult && recommendResult.allocations && (
              <AllocationTable
                allocations={recommendResult.allocations}
                onSelectHotspot={(id) => selectHotspot(id)}
              />
            )}
          </div>
        )}

        {/* TAB 2: INTERVENTIONS (What-If Scenarios) */}
        {activeTab === 'interventions' && (
          <div className="space-y-4 mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded p-2.5 text-[11px] text-amber-900 leading-relaxed">
              <strong className="font-bold">Feature Explanation:</strong> Test real-world emergency engineering actions on <span className="font-semibold">{hotspot.name}</span>. Watch how water depth and closure time immediately respond.
            </div>

            <div className="border border-gray-300 bg-white rounded-sm p-4 space-y-4 shadow-xs">
              {/* Deploy Mobile Suction Pumps */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-[13px] font-bold text-[#0F2B5C] flex items-center gap-1.5">
                    <span>🚜</span>
                    <span>Deploy Mobile Suction Pumps</span>
                  </div>
                  <span className="font-mono text-[11px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    +{(currentInterventions.tempPumps * 0.15).toFixed(2)} m³/s discharge
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 mb-2.5 leading-relaxed">
                  Adds high-volume trailer-mounted diesel suction pumps (0.15 m³/s per unit, max 4 units).
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-2 rounded border border-gray-200">
                  <button
                    onClick={() =>
                      setIntervention(hotspot.id, {
                        tempPumps: Math.max(0, currentInterventions.tempPumps - 1),
                      })
                    }
                    className="w-8 h-8 border border-gray-300 bg-white rounded hover:bg-gray-100 flex items-center justify-center font-mono font-bold text-gray-700 cursor-pointer shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-mono text-[16px] font-extrabold text-[#0F2B5C] min-w-8 text-center">
                    {currentInterventions.tempPumps}
                  </span>
                  <button
                    onClick={() =>
                      setIntervention(hotspot.id, {
                        tempPumps: Math.min(4, currentInterventions.tempPumps + 1),
                      })
                    }
                    className="w-8 h-8 border border-gray-300 bg-white rounded hover:bg-gray-100 flex items-center justify-center font-mono font-bold text-gray-700 cursor-pointer shadow-xs"
                  >
                    +
                  </button>
                  <span className="text-[11px] text-gray-600 font-medium">
                    {currentInterventions.tempPumps === 0 ? 'No mobile pump active' : `${currentInterventions.tempPumps} pumps active at underpass`}
                  </span>
                </div>
              </div>

              {/* Checkbox Interventions */}
              <div className="pt-3 border-t border-gray-200 space-y-3">
                {/* Desilt Grates */}
                <label className="flex items-start justify-between gap-3 p-2.5 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                  <div>
                    <div className="text-[12px] font-bold text-[#0F2B5C] flex items-center gap-1.5">
                      <span>🧹</span>
                      <span>Clear Grates & Sump Well (Desilting Crew)</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Restores gravity drainage culvert from 60% choked capacity to 100% full outflow.
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
                    className="w-4 h-4 mt-0.5 rounded text-[#0F2B5C] focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Upstream Traffic Divert */}
                <label className="flex items-start justify-between gap-3 p-2.5 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                  <div>
                    <div className="text-[12px] font-bold text-[#0F2B5C] flex items-center gap-1.5">
                      <span>🚦</span>
                      <span>Upstream Traffic Pre-Diversion (Police Reroute)</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Digital variable message signs & Traffic Police reroute 60% of PCU vehicles before underpass.
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
                    className="w-4 h-4 mt-0.5 rounded text-[#0F2B5C] focus:ring-0 cursor-pointer"
                  />
                </label>

                {/* Preemptive Road Closure */}
                <label className="flex items-start justify-between gap-3 p-2.5 rounded hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-200 transition-colors">
                  <div>
                    <div className="text-[12px] font-bold text-[#0F2B5C] flex items-center gap-1.5">
                      <span>🚧</span>
                      <span>Preemptive Road Closure (Barricading)</span>
                    </div>
                    <div className="text-[11px] text-gray-500 mt-0.5">
                      Barricade carriageway prior to inundation to prevent stranded DTC buses and passenger cars.
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
                    className="w-4 h-4 mt-0.5 rounded text-[#0F2B5C] focus:ring-0 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: EXPLAIN (Ask NIRNAY AI via AWS Bedrock) */}
        {activeTab === 'explain' && (
          <div>
            <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded p-2.5 text-[11px] text-emerald-900 leading-relaxed">
              <strong className="font-bold">Feature Explanation:</strong> Ask conversational questions about flood hydrology, pump priorities, and emergency hospital access. Powered by Amazon Bedrock Claude 3.5 Sonnet.
            </div>
            <AskNirnayPanel hotspot={hotspot} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default RightPanel;
