import { create } from 'zustand';
import type { Interventions, SimulationResult, RecommendResult, Hotspot, ChatMessage } from '@/types';
import { simulate } from '@/engine/simulator';
import { askNirnay } from '@/api/chat';
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

  /* Active right panel tab */
  activeTab: 'interventions' | 'recommend' | 'explain';

  /* Grounded session chat state (Ask NIRNAY) */
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  chatSessionId: string;

  /* Derived simulation cache */
  simResults: Record<string, SimulationResult>;

  /* Real-time inline feedback deltas keyed by hotspot id */
  closureDeltas: Record<string, string | null>;

  /* Actions */
  setActiveTab: (tab: 'interventions' | 'recommend' | 'explain') => void;
  sendChatMessage: (text: string, hotspotName?: string) => Promise<void>;
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
    activeTab: 'recommend',
    chatMessages: [
      {
        id: 'msg-welcome',
        sender: 'assistant',
        text: 'Ask NIRNAY explains hydrological balance curves, stage breach timings, and dispatch tradeoffs computed by the simulator.',
        toolsInvoked: [],
        timestamp: Date.now(),
      },
    ],
    isChatLoading: false,
    chatSessionId: `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    simResults: initResults,
    closureDeltas: {},

    setActiveTab: (tab) => set({ activeTab: tab }),

    sendChatMessage: async (text: string, hotspotName?: string) => {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text,
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, userMsg],
        isChatLoading: true,
      }));

      const { chatSessionId, rainMm, durationH, recommendResult } = get();

      const response = await askNirnay({
        sessionId: chatSessionId,
        message: text,
        currentScenario: {
          rain_mm: rainMm,
          duration_h: durationH,
          allocation: recommendResult?.allocations || [],
        },
        hotspotName,
      });

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.reply,
        toolsInvoked: response.tools_invoked,
        isCached: response.isCached,
        timestamp: Date.now(),
      };

      set((state) => ({
        chatMessages: [...state.chatMessages, assistantMsg],
        isChatLoading: false,
      }));
    },

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
      const prevInts = get().interventions[hotspotId] || defaultInterventions();
      const nextInts = { ...prevInts, ...patch };

      // Calculate before and after time-to-closure
      const targetHotspot = hotspots.find((h) => h.id === hotspotId);
      if (targetHotspot) {
        const { rainMm, durationH } = get();
        const prevSim = get().simResults[hotspotId] || simulate(targetHotspot, rainMm, durationH, prevInts);
        const nextSim = simulate(targetHotspot, rainMm, durationH, nextInts);

        const prevClose = prevSim.minutesToClosure;
        const nextClose = nextSim.minutesToClosure;

        if (prevClose !== nextClose) {
          const formatClose = (mins: number) => {
            if (!isFinite(mins) || mins === Infinity) return '--';
            return `${mins} min`;
          };
          const deltaStr = `${formatClose(prevClose)} -> ${formatClose(nextClose)}`;

          set((state) => ({
            closureDeltas: {
              ...state.closureDeltas,
              [hotspotId]: deltaStr,
            },
          }));

          // Clear delta after 3 seconds (fades out)
          setTimeout(() => {
            set((state) => {
              if (state.closureDeltas[hotspotId] === deltaStr) {
                return {
                  closureDeltas: {
                    ...state.closureDeltas,
                    [hotspotId]: null,
                  },
                };
              }
              return state;
            });
          }, 3000);
        }
      }

      set({
        interventions: {
          ...get().interventions,
          [hotspotId]: nextInts,
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
