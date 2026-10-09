import { describe, expect, it } from 'vitest';
import { simulate } from '@/engine/simulator';
import type { Hotspot, Interventions } from '@/types';

const FIXTURE: Hotspot = {
  id: 'test-sag',
  name: 'Test Sag',
  lat: 28.61,
  lon: 77.21,
  road_name: 'Test Road',
  road_class: 'arterial',
  traffic_pcu_per_hour: 3000,
  hospital_route: true,
  hospital_name: 'Test Hospital',
  population_300m: 10000,
  catchment_km2: 0.05,
  runoff_coeff_min: 0.7,
  runoff_coeff_max: 0.9,
  runoff_coeff_default: 0.8,
  surface_area_m2: 3000,
  storage_depth_max_m: 1.5,
  gravity_drain_capacity_m3s: 0.1,
  permanent_pump_capacity_m3s: 0.15,
  detour_penalty_mins: 20,
  historical_closure_freq_annual: 4,
};

const NONE: Interventions = {
  tempPumps: 0,
  drainCleared: false,
  preDivert: false,
  roadClosed: false,
};

describe('simulate', () => {
  it('is deterministic: same inputs yield identical output', () => {
    const a = simulate(FIXTURE, 100, 4, NONE);
    const b = simulate(FIXTURE, 100, 4, NONE);
    expect(a).toEqual(b);
  });

  it('gives no alert when rainfall is zero', () => {
    const result = simulate(FIXTURE, 0, 4, NONE);
    expect(result.minutesToAlert).toBeNull();
    expect(result.minutesToClosure).toBeNull();
    expect(result.closureMinutes).toBe(0);
    expect(result.maxDepthM).toBe(0);
    expect(result.impactIndex).toBe(0);
  });

  it('never reduces max depth when rainfall increases', () => {
    const r50 = simulate(FIXTURE, 50, 4, NONE);
    const r100 = simulate(FIXTURE, 100, 4, NONE);
    const r150 = simulate(FIXTURE, 150, 4, NONE);
    expect(r100.maxDepthM).toBeGreaterThanOrEqual(r50.maxDepthM);
    expect(r150.maxDepthM).toBeGreaterThanOrEqual(r100.maxDepthM);
  });

  it('never increases closureMinutes when more temp pumps are added', () => {
    const pumps0 = simulate(FIXTURE, 100, 4, { ...NONE, tempPumps: 0 });
    const pumps2 = simulate(FIXTURE, 100, 4, { ...NONE, tempPumps: 2 });
    const pumps5 = simulate(FIXTURE, 100, 4, { ...NONE, tempPumps: 5 });
    expect(pumps2.closureMinutes).toBeLessThanOrEqual(pumps0.closureMinutes);
    expect(pumps5.closureMinutes).toBeLessThanOrEqual(pumps2.closureMinutes);
  });

  it('honours params overrides for C, pump capacity, and drain capacity', () => {
    const baseline = simulate(FIXTURE, 100, 4, NONE);
    const higherDrain = simulate(FIXTURE, 100, 4, NONE, {
      gravityDrainCapacityM3s: 2.0,
    });
    const higherC = simulate(FIXTURE, 100, 4, NONE, { runoffCoeff: 0.99 });
    const biggerPumps = simulate(FIXTURE, 100, 4, { ...NONE, tempPumps: 2 }, {
      tempPumpCapacityM3s: 1.0,
    });
    const baselinePumps = simulate(FIXTURE, 100, 4, { ...NONE, tempPumps: 2 });

    expect(higherDrain.maxDepthM).toBeLessThanOrEqual(baseline.maxDepthM);
    expect(higherC.maxDepthM).toBeGreaterThanOrEqual(baseline.maxDepthM);
    expect(biggerPumps.closureMinutes).toBeLessThanOrEqual(
      baselinePumps.closureMinutes
    );
  });
});
