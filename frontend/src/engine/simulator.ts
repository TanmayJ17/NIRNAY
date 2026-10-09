/**
 * =========================================================================
 * TEMPORARY STUB — simulator.ts
 *
 * This is a placeholder hydrological simulation stub for NIRNAY.
 * Author: Frontend Team (Temporary)
 * Note: Member 1 / Team will replace this file with the real Python port.
 * =========================================================================
 */

import type { Hotspot, Interventions, SimulationResult } from '@/types';
import { ALERT_THRESHOLD_M, CLOSURE_THRESHOLD_M } from '@/config';

/**
 * Run hydrology simulation for a single hotspot over a rainfall event.
 *
 * @param hotspot Physical parameters of the underpass
 * @param rainMm Total storm rainfall in millimeters
 * @param durationH Duration of storm in hours
 * @param interventions Deployed operational mitigations
 * @returns SimulationResult with alert/closure timings, duration, depth, and relative impact index
 */
export function simulate(
  hotspot: Hotspot,
  rainMm: number,
  durationH: number,
  interventions: Interventions
): SimulationResult {
  const dtSeconds = 60; // 1-minute time steps
  const totalSteps = Math.max(1, Math.floor((durationH * 3600) / dtSeconds));
  const tPeakSec = (durationH * 3600) / 3.0; // Synthetic hyetograph peak at 1/3 duration

  // Triangular hyetograph intensity in mm/h
  const getRainIntensity = (tSec: number): number => {
    if (tSec <= tPeakSec) {
      return ((2.0 * rainMm) / durationH) * (tSec / tPeakSec);
    } else if (tSec <= durationH * 3600) {
      return (
        ((2.0 * rainMm) / durationH) *
        ((durationH * 3600 - tSec) / (durationH * 3600 - tPeakSec))
      );
    }
    return 0.0;
  };

  // Interventions impact
  // Drain clearance restores gravity drain efficiency from 50% to 100%
  const drainEfficiency = interventions.drainCleared ? 1.0 : 0.50;
  const qDrain = hotspot.gravity_drain_capacity_m3s * drainEfficiency;

  // Permanent pumps operate at standard standby (75%); each temp pump adds 0.15 m3/s
  const qPumps =
    hotspot.permanent_pump_capacity_m3s * 0.75 +
    interventions.tempPumps * 0.15;

  const qOut = qDrain + qPumps;

  // Pre-divert reduces localized inflow volume entering the sag point
  const divertMultiplier = interventions.preDivert ? 0.70 : 1.0;

  // Delhi sag catchment fraction: ~5% of upstream basin directly pools into sag bowl
  const SAG_CATCHMENT_FRACTION = 0.052;
  const effectiveCatchmentKm2 = hotspot.catchment_km2 * SAG_CATCHMENT_FRACTION;

  let currentDepth = 0.0;
  let maxDepth = 0.0;
  let tAlertSec: number | null = null;
  let tCloseSec: number | null = null;
  let closureMinutes = 0;

  for (let step = 0; step < totalSteps; step++) {
    const tSec = step * dtSeconds;
    const intensityMmh = getRainIntensity(tSec);

    // Rational method: Q = 0.278 * C * I * A (m3/s)
    const qIn =
      0.278 *
      hotspot.runoff_coeff_default *
      intensityMmh *
      effectiveCatchmentKm2 *
      divertMultiplier;

    // Rate of depth change
    const deltaHeight =
      ((qIn - qOut) / hotspot.surface_area_m2) * dtSeconds;

    currentDepth = Math.max(
      0.0,
      Math.min(hotspot.storage_depth_max_m, currentDepth + deltaHeight)
    );

    if (currentDepth > maxDepth) {
      maxDepth = currentDepth;
    }

    if (currentDepth >= ALERT_THRESHOLD_M && tAlertSec === null) {
      tAlertSec = tSec;
    }

    if (currentDepth >= CLOSURE_THRESHOLD_M) {
      if (tCloseSec === null) {
        tCloseSec = tSec;
      }
      closureMinutes += 1;
    }
  }

  // Timing in minutes
  const minutesToAlert =
    tAlertSec !== null ? Math.round(tAlertSec / 60) : Infinity;
  const minutesToClosure =
    tCloseSec !== null ? Math.round(tCloseSec / 60) : Infinity;

  // Impact Index calculation (relative score, not count of vehicles or people)
  let trafficWeight = hotspot.traffic_pcu_per_hour / 3000.0;
  if (interventions.preDivert) trafficWeight *= 0.4;
  if (interventions.roadClosed) trafficWeight = 0.08;

  const detourFactor = hotspot.detour_penalty_mins / 20.0;
  const hospitalMultiplier = hotspot.hospital_route ? 2.5 : 1.0;
  const popFactor = 1.0 + hotspot.population_300m / 20000.0;

  const rawImpact =
    closureMinutes *
    trafficWeight *
    detourFactor *
    hospitalMultiplier *
    popFactor;

  const impactIndex = Math.round(rawImpact);

  return {
    minutesToAlert,
    minutesToClosure,
    closureMinutes,
    maxDepthM: Number(Math.min(maxDepth, hotspot.storage_depth_max_m).toFixed(3)),
    impactIndex,
  };
}
