/**
 * NIRNAY Decision Layer — Monte Carlo Sensitivity & Uncertainty Engine
 *
 * Runs stochastic draws across hydrology parameters and infrastructure capacities
 * using a seeded PRNG (mulberry32) for deterministic, reproducible distributions.
 */

import type { Hotspot, Interventions } from '@/types';
import { simulate, type SimulateParams } from './simulator';
import { recommend, type AllocationPlan } from './optimizer';
import { hotspots as defaultHotspots } from '@/data/loadHotspots';

export interface PercentileStats {
  p10: number;
  median: number;
  p90: number;
}

export interface MonteCarloResult {
  draws: number;
  seed: number;
  nominalOptimal: AllocationPlan;
  nominalEqualSplit: AllocationPlan;
  closureHoursSaved: PercentileStats;
  impactReducedPercent: PercentileStats;
  stabilityPercent: number;
}

/**
 * Seeded 32-bit PRNG (mulberry32)
 * Generates uniform random numbers in [0, 1) deterministically from an integer seed.
 */
export function createMulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Extract the top-3 hotspot IDs with highest assigned pumps from an allocation plan.
 */
function getTop3PumpHotspots(plan: AllocationPlan): Set<string> {
  const sorted = [...plan.allocations].sort((a, b) => {
    if (b.tempPumps !== a.tempPumps) return b.tempPumps - a.tempPumps;
    return b.impactIndex - a.impactIndex;
  });
  return new Set(sorted.slice(0, 3).map((a) => a.hotspotId));
}

/**
 * Evaluate an existing fixed allocation plan under a specific draw's parameter state.
 */
function evaluatePlanUnderParams(
  plan: AllocationPlan,
  hotspotsList: Hotspot[],
  rainMm: number,
  durationH: number,
  paramsMap: Record<string, SimulateParams>
): { totalImpact: number; totalClosureHours: number } {
  let totalImpact = 0;
  let totalClosureMin = 0;

  for (const alloc of plan.allocations) {
    const hp = hotspotsList.find((h) => h.id === alloc.hotspotId);
    if (!hp) continue;

    const interv: Interventions = {
      tempPumps: alloc.tempPumps,
      drainCleared: alloc.drainCleared,
      preDivert: false,
      roadClosed: false,
    };

    const res = simulate(hp, rainMm, durationH, interv, paramsMap[hp.id]);
    totalImpact += res.impactIndex;
    totalClosureMin += res.closureMinutes;
  }

  return {
    totalImpact,
    totalClosureHours: Number((totalClosureMin / 60).toFixed(2)),
  };
}

function computePercentiles(values: number[]): PercentileStats {
  if (values.length === 0) {
    return { p10: 0, median: 0, p90: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const idxP10 = Math.min(n - 1, Math.max(0, Math.floor(0.10 * n)));
  const idxMedian = Math.min(n - 1, Math.max(0, Math.floor(0.50 * n)));
  const idxP90 = Math.min(n - 1, Math.max(0, Math.floor(0.90 * n)));

  return {
    p10: Number(sorted[idxP10].toFixed(2)),
    median: Number(sorted[idxMedian].toFixed(2)),
    p90: Number(sorted[idxP90].toFixed(2)),
  };
}

/**
 * Synchronous Monte Carlo Simulation Engine
 */
export function runMonteCarlo(
  rainMm: number,
  durationH: number,
  totalPumps: number,
  totalCrews: number,
  draws: number = 200,
  seed: number = 42,
  onProgress?: (progress: number) => void,
  hotspotsList: Hotspot[] = defaultHotspots
): MonteCarloResult {
  const rng = createMulberry32(seed);

  // 1. Compute nominal baseline solutions
  const nominalRec = recommend(
    rainMm,
    durationH,
    totalPumps,
    totalCrews,
    undefined,
    hotspotsList
  );

  const nominalOptimal = nominalRec.optimal;
  const nominalEqualSplit = nominalRec.equalSplit;
  const nominalTop3 = getTop3PumpHotspots(nominalOptimal);

  const closureHoursSavedArray: number[] = [];
  const impactReducedPercentArray: number[] = [];
  let stableDrawCount = 0;

  for (let d = 0; d < draws; d++) {
    // Generate perturbed parameters per hotspot
    const paramsMap: Record<string, SimulateParams> = {};

    for (const hp of hotspotsList) {
      // Vary runoff coefficient uniformly in [min, max]
      const minC = hp.runoff_coeff_min ?? hp.runoff_coeff_default * 0.85;
      const maxC = hp.runoff_coeff_max ?? hp.runoff_coeff_default * 1.15;
      const drawC = minC + rng() * (maxC - minC);

      // Vary pump capacity by +/-30% (uniform [0.70, 1.30])
      const pumpFactor = 0.70 + rng() * 0.60;
      const drawPermPump = hp.permanent_pump_capacity_m3s * pumpFactor;

      // Vary drain capacity by +/-30% (uniform [0.70, 1.30])
      const drainFactor = 0.70 + rng() * 0.60;
      const drawDrain = hp.gravity_drain_capacity_m3s * drainFactor;

      paramsMap[hp.id] = {
        runoffCoeff: drawC,
        permanentPumpCapacityM3s: drawPermPump,
        gravityDrainCapacityM3s: drawDrain,
      };
    }

    // Evaluate nominal optimal plan under perturbed state
    const evalNominal = evaluatePlanUnderParams(
      nominalOptimal,
      hotspotsList,
      rainMm,
      durationH,
      paramsMap
    );

    // Evaluate nominal equal split baseline under perturbed state
    const evalEqual = evaluatePlanUnderParams(
      nominalEqualSplit,
      hotspotsList,
      rainMm,
      durationH,
      paramsMap
    );

    const savedHours = Math.max(
      0,
      Number((evalEqual.totalClosureHours - evalNominal.totalClosureHours).toFixed(2))
    );
    closureHoursSavedArray.push(savedHours);

    const reducedPct =
      evalEqual.totalImpact > 0
        ? ((evalEqual.totalImpact - evalNominal.totalImpact) /
            evalEqual.totalImpact) *
          100
        : 0;
    impactReducedPercentArray.push(Number(reducedPct.toFixed(1)));

    // Re-solve optimal allocation for this specific draw to evaluate stability
    const drawOptimalRec = recommend(
      rainMm,
      durationH,
      totalPumps,
      totalCrews,
      paramsMap,
      hotspotsList
    );

    const drawTop3 = getTop3PumpHotspots(drawOptimalRec.optimal);
    let matchCount = 0;
    for (const id of drawTop3) {
      if (nominalTop3.has(id)) matchCount++;
    }
    // Stable if top-3 set matches nominal top-3
    if (matchCount >= 3) {
      stableDrawCount++;
    }

    if (onProgress && (d + 1) % 20 === 0) {
      onProgress((d + 1) / draws);
    }
  }

  if (onProgress) {
    onProgress(1.0);
  }

  const stabilityPercent = Number(
    ((stableDrawCount / draws) * 100).toFixed(1)
  );

  return {
    draws,
    seed,
    nominalOptimal,
    nominalEqualSplit,
    closureHoursSaved: computePercentiles(closureHoursSavedArray),
    impactReducedPercent: computePercentiles(impactReducedPercentArray),
    stabilityPercent,
  };
}
