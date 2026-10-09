import { describe, it, expect } from 'vitest';
import { recommend } from './optimizer';
import { runMonteCarlo, createMulberry32 } from './monteCarlo';
import { hotspots } from '@/data/loadHotspots';

describe('NIRNAY Decision Layer — Optimizer & Monte Carlo Tests', () => {
  it('DP optimizer beats or matches Greedy and all Baselines across 20 scenarios', () => {
    const rng = createMulberry32(1337);

    for (let s = 1; s <= 20; s++) {
      const rainMm = Math.round(30 + rng() * 180); // 30 mm to 210 mm
      const durationH = Math.round(2 + rng() * 6); // 2 h to 8 h
      const totalPumps = Math.round(4 + rng() * 12); // 4 to 16 pumps
      const totalCrews = Math.round(2 + rng() * 8); // 2 to 10 crews

      const result = recommend(rainMm, durationH, totalPumps, totalCrews, undefined, hotspots);

      const dpImpact = result.optimal.totalImpact;
      const greedyImpact = result.greedy.totalImpact;
      const equalImpact = result.equalSplit.totalImpact;
      const historyImpact = result.historySplit.totalImpact;

      // Assert DP is globally optimal with float tolerance
      expect(dpImpact).toBeLessThanOrEqual(greedyImpact + 1e-4);
      expect(dpImpact).toBeLessThanOrEqual(equalImpact + 1e-4);
      expect(dpImpact).toBeLessThanOrEqual(historyImpact + 1e-4);
    }
  });

  it('Allocation plans strictly adhere to total pump and crew budget constraints', () => {
    const rng = createMulberry32(2026);

    for (let s = 1; s <= 20; s++) {
      const rainMm = Math.round(40 + rng() * 150);
      const durationH = Math.round(1 + rng() * 5);
      const totalPumps = Math.round(2 + rng() * 10);
      const totalCrews = Math.round(1 + rng() * 6);

      const result = recommend(rainMm, durationH, totalPumps, totalCrews, undefined, hotspots);

      for (const plan of [result.optimal, result.greedy, result.equalSplit, result.historySplit]) {
        expect(plan.pumpsUsed).toBeLessThanOrEqual(totalPumps);
        expect(plan.crewsUsed).toBeLessThanOrEqual(totalCrews);

        // Sum individual allocations
        const sumPumps = plan.allocations.reduce((acc, a) => acc + a.tempPumps, 0);
        const sumCrews = plan.allocations.reduce((acc, a) => acc + (a.drainCleared ? 1 : 0), 0);

        expect(sumPumps).toBe(plan.pumpsUsed);
        expect(sumCrews).toBe(plan.crewsUsed);
        expect(sumPumps).toBeLessThanOrEqual(totalPumps);
        expect(sumCrews).toBeLessThanOrEqual(totalCrews);
      }
    }
  });

  it('Monte Carlo engine is deterministic: identical seeds produce bitwise identical outputs', () => {
    const seed = 999;
    const rainMm = 100;
    const durationH = 4;
    const totalPumps = 12;
    const totalCrews = 8;
    const draws = 50;

    const run1 = runMonteCarlo(rainMm, durationH, totalPumps, totalCrews, draws, seed, undefined, hotspots);
    const run2 = runMonteCarlo(rainMm, durationH, totalPumps, totalCrews, draws, seed, undefined, hotspots);

    expect(run1.closureHoursSaved.p10).toBe(run2.closureHoursSaved.p10);
    expect(run1.closureHoursSaved.median).toBe(run2.closureHoursSaved.median);
    expect(run1.closureHoursSaved.p90).toBe(run2.closureHoursSaved.p90);

    expect(run1.impactReducedPercent.p10).toBe(run2.impactReducedPercent.p10);
    expect(run1.impactReducedPercent.median).toBe(run2.impactReducedPercent.median);
    expect(run1.impactReducedPercent.p90).toBe(run2.impactReducedPercent.p90);

    expect(run1.stabilityPercent).toBe(run2.stabilityPercent);
    expect(run1.nominalOptimal.totalImpact).toBe(run2.nominalOptimal.totalImpact);
  });

  it('Monte Carlo percentiles satisfy non-decreasing order P10 <= Median <= P90', () => {
    const result = runMonteCarlo(100, 4, 12, 8, 40, 42, undefined, hotspots);

    expect(result.closureHoursSaved.p10).toBeLessThanOrEqual(result.closureHoursSaved.median);
    expect(result.closureHoursSaved.median).toBeLessThanOrEqual(result.closureHoursSaved.p90);

    expect(result.impactReducedPercent.p10).toBeLessThanOrEqual(result.impactReducedPercent.median);
    expect(result.impactReducedPercent.median).toBeLessThanOrEqual(result.impactReducedPercent.p90);

    expect(result.stabilityPercent).toBeGreaterThanOrEqual(0);
    expect(result.stabilityPercent).toBeLessThanOrEqual(100);
  });
});
