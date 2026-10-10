/**
 * NIRNAY Decision Layer — Exact DP Optimizer & Baselines
 *
 * Deterministic allocation of mobile pumps and maintenance crews across
 * underpass hotspots to minimize regional waterlogging impact.
 */

import type { Hotspot, Interventions } from '@/types';
import { simulate, type SimulateParams } from './simulator';
import { hotspots as defaultHotspots } from '@/data/loadHotspots';

export interface HotspotAllocation {
  hotspotId: string;
  hotspotName: string;
  tempPumps: number;
  drainCleared: boolean;
  closureMinutes: number;
  maxDepthM: number;
  impactIndex: number;
}

export interface AllocationPlan {
  name: string;
  allocations: HotspotAllocation[];
  totalImpact: number;
  totalClosureHours: number;
  pumpsUsed: number;
  crewsUsed: number;
}

export interface RecommendOutput {
  optimal: AllocationPlan;
  greedy: AllocationPlan;
  equalSplit: AllocationPlan;
  historySplit: AllocationPlan;
  closureHoursSavedVsEqual: number;
  impactReducedPercentVsEqual: number;
}

interface PrecomputedCost {
  impact: number;
  closureMinutes: number;
  maxDepthM: number;
}

/**
 * Precompute impact and closure metrics for each hotspot under all discrete
 * pump (0..totalPumps) and crew (0..1) intervention choices.
 */
function precomputeCostTable(
  hotspotsList: Hotspot[],
  rainMm: number,
  durationH: number,
  totalPumps: number,
  paramsMap?: Record<string, SimulateParams>
): PrecomputedCost[][][] {
  const n = hotspotsList.length;
  const table: PrecomputedCost[][][] = [];

  for (let i = 0; i < n; i++) {
    const hp = hotspotsList[i];
    const params = paramsMap?.[hp.id];
    table[i] = [];

    for (let k = 0; k <= totalPumps; k++) {
      table[i][k] = [];
      for (let c = 0; c <= 1; c++) {
        const interv: Interventions = {
          tempPumps: k,
          drainCleared: c === 1,
          preDivert: false,
          roadClosed: false,
        };
        const res = simulate(hp, rainMm, durationH, interv, params);
        table[i][k][c] = {
          impact: res.impactIndex,
          closureMinutes: res.closureMinutes,
          maxDepthM: res.maxDepthM,
        };
      }
    }
  }

  return table;
}

/**
 * 1. Exact Dynamic Programming Optimizer (2D-Knapsack)
 * Minimizes total impactIndex subject to sum(pumps) <= totalPumps and sum(crews) <= totalCrews.
 */
function solveDynamicProgramming(
  hotspotsList: Hotspot[],
  costTable: PrecomputedCost[][][],
  totalPumps: number,
  totalCrews: number
): AllocationPlan {
  const n = hotspotsList.length;

  // dp[i][p][c]: minimum impact considering first i hotspots with budget (p pumps, c crews)
  // choice[i][p][c]: optimal [pumps, crew] chosen for hotspot i
  const dp: number[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: totalPumps + 1 }, () =>
      new Array(totalCrews + 1).fill(Infinity)
    )
  );

  const choicePumps: number[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: totalPumps + 1 }, () =>
      new Array(totalCrews + 1).fill(0)
    )
  );

  const choiceCrews: number[][][] = Array.from({ length: n + 1 }, () =>
    Array.from({ length: totalPumps + 1 }, () =>
      new Array(totalCrews + 1).fill(0)
    )
  );

  // Base case: 0 hotspots has 0 impact
  for (let p = 0; p <= totalPumps; p++) {
    for (let c = 0; c <= totalCrews; c++) {
      dp[0][p][c] = 0;
    }
  }

  // Transitions
  for (let i = 1; i <= n; i++) {
    const hpCost = costTable[i - 1];

    for (let p = 0; p <= totalPumps; p++) {
      for (let c = 0; c <= totalCrews; c++) {
        let minImpact = Infinity;
        let bestK = 0;
        let bestJ = 0;

        // Try allocating k pumps (0..p) and j crews (0..min(1, c))
        for (let k = 0; k <= p; k++) {
          const maxJ = Math.min(1, c);
          for (let j = 0; j <= maxJ; j++) {
            const cost = hpCost[k][j].impact;
            const prev = dp[i - 1][p - k][c - j];
            const candidate = prev + cost;

            if (candidate < minImpact) {
              minImpact = candidate;
              bestK = k;
              bestJ = j;
            }
          }
        }

        dp[i][p][c] = minImpact;
        choicePumps[i][p][c] = bestK;
        choiceCrews[i][p][c] = bestJ;
      }
    }
  }

  // Find best (p, c) that yields minimum impact
  let bestP = totalPumps;
  let bestC = totalCrews;
  let optimalImpact = dp[n][totalPumps][totalCrews];

  for (let p = 0; p <= totalPumps; p++) {
    for (let c = 0; c <= totalCrews; c++) {
      if (dp[n][p][c] < optimalImpact) {
        optimalImpact = dp[n][p][c];
        bestP = p;
        bestC = c;
      }
    }
  }

  // Backtrack to reconstruct allocation
  const allocations: HotspotAllocation[] = new Array(n);
  let currP = bestP;
  let currC = bestC;
  let usedPumps = 0;
  let usedCrews = 0;
  let totalClosureMin = 0;

  for (let i = n; i >= 1; i--) {
    const k = choicePumps[i][currP][currC];
    const j = choiceCrews[i][currP][currC];
    const hp = hotspotsList[i - 1];
    const cost = costTable[i - 1][k][j];

    allocations[i - 1] = {
      hotspotId: hp.id,
      hotspotName: hp.name,
      tempPumps: k,
      drainCleared: j === 1,
      closureMinutes: cost.closureMinutes,
      maxDepthM: cost.maxDepthM,
      impactIndex: cost.impact,
    };

    usedPumps += k;
    usedCrews += j;
    totalClosureMin += cost.closureMinutes;

    currP -= k;
    currC -= j;
  }

  return {
    name: 'Optimal (Dynamic Program)',
    allocations,
    totalImpact: optimalImpact,
    totalClosureHours: Number((totalClosureMin / 60).toFixed(2)),
    pumpsUsed: usedPumps,
    crewsUsed: usedCrews,
  };
}

/**
 * 2. Greedy Marginal-Gain Optimizer
 * Iteratively allocates 1 pump or 1 crew to the hotspot that yields the largest impact decrease.
 */
function solveGreedy(
  hotspotsList: Hotspot[],
  costTable: PrecomputedCost[][][],
  totalPumps: number,
  totalCrews: number
): AllocationPlan {
  const n = hotspotsList.length;
  const assignedPumps = new Array(n).fill(0);
  const assignedCrews = new Array(n).fill(0);

  let remainingPumps = totalPumps;
  let remainingCrews = totalCrews;

  while (remainingPumps > 0 || remainingCrews > 0) {
    let bestDelta = 0;
    let bestAction: { type: 'pump' | 'crew'; index: number } | null = null;

    for (let i = 0; i < n; i++) {
      const currP = assignedPumps[i];
      const currC = assignedCrews[i];
      const currImpact = costTable[i][currP][currC].impact;

      // Test adding 1 pump
      if (remainingPumps > 0 && currP + 1 <= totalPumps) {
        const newImpact = costTable[i][currP + 1][currC].impact;
        const delta = currImpact - newImpact;
        if (delta > bestDelta) {
          bestDelta = delta;
          bestAction = { type: 'pump', index: i };
        }
      }

      // Test adding 1 crew (clearing drain)
      if (remainingCrews > 0 && currC === 0) {
        const newImpact = costTable[i][currP][1].impact;
        const delta = currImpact - newImpact;
        if (delta > bestDelta) {
          bestDelta = delta;
          bestAction = { type: 'crew', index: i };
        }
      }
    }

    if (!bestAction || bestDelta <= 0) {
      break; // No further marginal improvements
    }

    if (bestAction.type === 'pump') {
      assignedPumps[bestAction.index]++;
      remainingPumps--;
    } else {
      assignedCrews[bestAction.index] = 1;
      remainingCrews--;
    }
  }

  let totalImpact = 0;
  let totalClosureMin = 0;
  let usedPumps = 0;
  let usedCrews = 0;

  const allocations: HotspotAllocation[] = hotspotsList.map((hp, i) => {
    const k = assignedPumps[i];
    const j = assignedCrews[i];
    const cost = costTable[i][k][j];

    totalImpact += cost.impact;
    totalClosureMin += cost.closureMinutes;
    usedPumps += k;
    usedCrews += j;

    return {
      hotspotId: hp.id,
      hotspotName: hp.name,
      tempPumps: k,
      drainCleared: j === 1,
      closureMinutes: cost.closureMinutes,
      maxDepthM: cost.maxDepthM,
      impactIndex: cost.impact,
    };
  });

  return {
    name: 'Greedy Marginal-Gain',
    allocations,
    totalImpact,
    totalClosureHours: Number((totalClosureMin / 60).toFixed(2)),
    pumpsUsed: usedPumps,
    crewsUsed: usedCrews,
  };
}

/**
 * 3. Equal-Split Baseline
 * Distributes available pumps and crews as uniformly as possible across vulnerable hotspots.
 */
function solveEqualSplit(
  hotspotsList: Hotspot[],
  costTable: PrecomputedCost[][][],
  totalPumps: number,
  totalCrews: number
): AllocationPlan {
  const n = hotspotsList.length;
  if (n === 0) {
    return {
      name: 'Equal Split',
      allocations: [],
      totalImpact: 0,
      totalClosureHours: 0,
      pumpsUsed: 0,
      crewsUsed: 0,
    };
  }

  // Rank hotspots by untreated baseline impact to prioritize remainder distribution
  const indices = hotspotsList.map((_, i) => i);
  indices.sort((a, b) => costTable[b][0][0].impact - costTable[a][0][0].impact);

  const basePumps = Math.floor(totalPumps / n);
  let remPumps = totalPumps % n;
  const assignedPumps = new Array(n).fill(basePumps);
  for (const idx of indices) {
    if (remPumps > 0) {
      assignedPumps[idx]++;
      remPumps--;
    }
  }

  const assignedCrews = new Array(n).fill(0);
  let remCrews = Math.min(totalCrews, n);
  for (const idx of indices) {
    if (remCrews > 0) {
      assignedCrews[idx] = 1;
      remCrews--;
    }
  }

  let totalImpact = 0;
  let totalClosureMin = 0;
  let usedPumps = 0;
  let usedCrews = 0;

  const allocations: HotspotAllocation[] = hotspotsList.map((hp, i) => {
    const k = assignedPumps[i];
    const j = assignedCrews[i];
    const cost = costTable[i][k][j];

    totalImpact += cost.impact;
    totalClosureMin += cost.closureMinutes;
    usedPumps += k;
    usedCrews += j;

    return {
      hotspotId: hp.id,
      hotspotName: hp.name,
      tempPumps: k,
      drainCleared: j === 1,
      closureMinutes: cost.closureMinutes,
      maxDepthM: cost.maxDepthM,
      impactIndex: cost.impact,
    };
  });

  return {
    name: 'Equal Split',
    allocations,
    totalImpact,
    totalClosureHours: Number((totalClosureMin / 60).toFixed(2)),
    pumpsUsed: usedPumps,
    crewsUsed: usedCrews,
  };
}

/**
 * 4. History-Proportional Baseline
 * Allocates pumps proportionally to historical closure frequency using Largest Remainder method.
 */
function solveHistorySplit(
  hotspotsList: Hotspot[],
  costTable: PrecomputedCost[][][],
  totalPumps: number,
  totalCrews: number
): AllocationPlan {
  const n = hotspotsList.length;
  const totalFreq = hotspotsList.reduce(
    (sum, hp) => sum + (hp.historical_closure_freq_annual || 1),
    0
  );

  const assignedPumps = new Array(n).fill(0);
  if (totalFreq > 0 && totalPumps > 0) {
    const exactShares = hotspotsList.map(
      (hp) => ((hp.historical_closure_freq_annual || 1) / totalFreq) * totalPumps
    );
    const floorShares = exactShares.map(Math.floor);
    let assignedCount = floorShares.reduce((a, b) => a + b, 0);
    const remainders = exactShares.map((val, i) => ({
      idx: i,
      rem: val - floorShares[i],
    }));
    remainders.sort((a, b) => b.rem - a.rem);

    for (let i = 0; i < n; i++) {
      assignedPumps[i] = floorShares[i];
    }
    for (let i = 0; i < remainders.length && assignedCount < totalPumps; i++) {
      assignedPumps[remainders[i].idx]++;
      assignedCount++;
    }
  }

  // Allocate crews to top historically frequent hotspots
  const rankedByFreq = hotspotsList
    .map((hp, i) => ({ idx: i, freq: hp.historical_closure_freq_annual || 0 }))
    .sort((a, b) => b.freq - a.freq);

  const assignedCrews = new Array(n).fill(0);
  let remCrews = Math.min(totalCrews, n);
  for (const item of rankedByFreq) {
    if (remCrews > 0) {
      assignedCrews[item.idx] = 1;
      remCrews--;
    }
  }

  let totalImpact = 0;
  let totalClosureMin = 0;
  let usedPumps = 0;
  let usedCrews = 0;

  const allocations: HotspotAllocation[] = hotspotsList.map((hp, i) => {
    const k = assignedPumps[i];
    const j = assignedCrews[i];
    const cost = costTable[i][k][j];

    totalImpact += cost.impact;
    totalClosureMin += cost.closureMinutes;
    usedPumps += k;
    usedCrews += j;

    return {
      hotspotId: hp.id,
      hotspotName: hp.name,
      tempPumps: k,
      drainCleared: j === 1,
      closureMinutes: cost.closureMinutes,
      maxDepthM: cost.maxDepthM,
      impactIndex: cost.impact,
    };
  });

  return {
    name: 'History-Proportional Split',
    allocations,
    totalImpact,
    totalClosureHours: Number((totalClosureMin / 60).toFixed(2)),
    pumpsUsed: usedPumps,
    crewsUsed: usedCrews,
  };
}

/**
 * Main Optimizer Entry Point:
 * Computes optimal dynamic program and 3 comparative baselines for a scenario.
 */
export function recommend(
  rainMm: number,
  durationH: number,
  totalPumps: number,
  totalCrews: number,
  paramsMap?: Record<string, SimulateParams>,
  hotspotsList: Hotspot[] = defaultHotspots
): RecommendOutput {
  const costTable = precomputeCostTable(
    hotspotsList,
    rainMm,
    durationH,
    totalPumps,
    paramsMap
  );

  const optimal = solveDynamicProgramming(
    hotspotsList,
    costTable,
    totalPumps,
    totalCrews
  );

  const greedy = solveGreedy(
    hotspotsList,
    costTable,
    totalPumps,
    totalCrews
  );

  const equalSplit = solveEqualSplit(
    hotspotsList,
    costTable,
    totalPumps,
    totalCrews
  );

  const historySplit = solveHistorySplit(
    hotspotsList,
    costTable,
    totalPumps,
    totalCrews
  );

  const closureHoursSavedVsEqual = Math.max(
    0,
    Number((equalSplit.totalClosureHours - optimal.totalClosureHours).toFixed(2))
  );

  const impactReducedPercentVsEqual =
    equalSplit.totalImpact > 0
      ? Number(
          (
            ((equalSplit.totalImpact - optimal.totalImpact) /
              equalSplit.totalImpact) *
            100
          ).toFixed(1)
        )
      : 0;

  return {
    optimal,
    greedy,
    equalSplit,
    historySplit,
    closureHoursSavedVsEqual,
    impactReducedPercentVsEqual,
  };
}
