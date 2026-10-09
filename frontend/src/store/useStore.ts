import { create } from 'zustand';
import type { Interventions, SimulationResult, RecommendResult, Hotspot } from '@/types';
import { simulate } from '@/engine/simulator';
import { DEFAULT_RAIN_MM, DEFAULT_DURATION_H, DEFAULT_AVAILABLE_PUMPS, DEFAULT_AVAILABLE_CREWS, ALERT_THRESHOLD_M, CLOSURE_THRESHOLD_M } from '@/config';
import type { PinStatus } from '@/types';
import hotspotData from '@/data/hotspots.json';

const hotspots: Hotspot[] = hotspotData.hotspots as Hotspot[];

/** Default interventions (nothing deployed) */
const defaultInterventions = (): Interventions => ({
  tempPumps: 0,
  drainCleared: false,
  preDivert: false,
  roadClosed: false,
});

export interface StoreState {
  /* Scenario inputs */
  rainMm: number;
  durationH: number;
  selectedHotspotId: string | null;

  /* Interventions keyed by hotspot id */
  interventions: Record<string, Interventions>;

  /* Resources */
  availablePumps: number;
  availableCrews: number;

  /* Recommend result */
  recommendResult: RecommendResult | null;

  /* Compare mode */
  compareMode: boolean;

  /* Derived simulation cache */
  simResults: Record<string, SimulationResult>;

  /* Actions */
  setRainMm: (mm: number) => void;
  setDurationH: (h: number) => void;
  selectHotspot: (id: string | null) => void;
  setIntervention: (hotspotId: string, patch: Partial<Interventions>) => void;
  setAvailablePumps: (n: number) => void;
  setAvailableCrews: (n: number) => void;
  setRecommendResult: (r: RecommendResult | null) => void;
  toggleCompareMode: () => void;
  runAllSimulations: () => void;
  applyPreset: (rainMm: number, durationH: number) => void;
}

/** Compute pin status from a simulation result */
export function getPinStatus(result: SimulationResult): PinStatus {
  if (result.closureMinutes > 0) return 'red';
  if (result.minutesToAlert < Infinity && result.maxDepthM >= ALERT_THRESHOLD_M) return 'amber';
  return 'green';
}

function runSims(
  rainMm: number,
  durationH: number,
  interventions: Record<string, Interventions>
): Record<string, SimulationResult> {
  const results: Record<string, SimulationResult> = {};
  for (const h of hotspots) {
    const ints = interventions[h.id] || defaultInterventions();
    results[h.id] = simulate(h, rainMm, durationH, ints);
  }
  return results;
}

export const useStore = create<StoreState>((set, get) => {
  // Compute initial simulations
  const initInterventions: Record<string, Interventions> = {};
  for (const h of hotspots) {
    initInterventions[h.id] = defaultInterventions();
  }
  const initResults = runSims(DEFAULT_RAIN_MM, DEFAULT_DURATION_H, initInterventions);

  return {
    rainMm: DEFAULT_RAIN_MM,
    durationH: DEFAULT_DURATION_H,
    selectedHotspotId: hotspots[0]?.id ?? null,
    interventions: initInterventions,
    availablePumps: DEFAULT_AVAILABLE_PUMPS,
    availableCrews: DEFAULT_AVAILABLE_CREWS,
    recommendResult: null,
    compareMode: false,
    simResults: initResults,

    setRainMm: (mm) => {
      set({ rainMm: mm });
      get().runAllSimulations();
    },
    setDurationH: (h) => {
      set({ durationH: h });
      get().runAllSimulations();
    },
    selectHotspot: (id) => set({ selectedHotspotId: id }),
    setIntervention: (hotspotId, patch) => {
      const prev = get().interventions[hotspotId] || defaultInterventions();
      set({
        interventions: {
          ...get().interventions,
          [hotspotId]: { ...prev, ...patch },
        },
      });
      get().runAllSimulations();
    },
    setAvailablePumps: (n) => set({ availablePumps: n }),
    setAvailableCrews: (n) => set({ availableCrews: n }),
    setRecommendResult: (r) => set({ recommendResult: r }),
    toggleCompareMode: () => set({ compareMode: !get().compareMode }),
    runAllSimulations: () => {
      const { rainMm, durationH, interventions } = get();
      set({ simResults: runSims(rainMm, durationH, interventions) });
    },
    applyPreset: (rainMm, durationH) => {
      set({ rainMm, durationH });
      get().runAllSimulations();
    },
  };
});
