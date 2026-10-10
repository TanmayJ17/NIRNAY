/**
 * NIRNAY client-side hydrology engine.
 *
 * Deterministic water-balance simulator. All physical thresholds, pump
 * capacities, and impact weights are read from config — nothing is hardcoded
 * here except the Rational Method coefficient 0.278 (unit conversion).
 */

import type { Hotspot, Interventions, SimulationResult } from '@/types';
import {
  ALERT_DEPTH_M,
  CLOSURE_DEPTH_M,
  DETOUR_PENALTY_WEIGHT,
  DRAIN_CLEARED_RECOVERY_FACTOR,
  EULER_STEP_SECONDS,
  HOSPITAL_ROUTE_WEIGHT,
  HYETOGRAPH_PEAK_FRACTION,
  MAX_SIMULATION_HOURS,
  POPULATION_WEIGHT,
  PRE_DIVERT_DETOUR_PENALTY_MINS,
  PRE_DIVERT_EXPOSURE_FACTOR,
  ROAD_CLOSED_DETOUR_PENALTY_MINS,
  ROAD_CLOSED_EXPOSURE_FACTOR,
  TEMP_PUMP_CAPACITY_M3S,
} from '@/config';

/** Unit conversion for the Rational Method: Q (m³/s) = 0.278 · C · i (mm/h) · A (km²) */
const RATIONAL_METHOD_COEFF = 0.278;

export interface SimulateParams {
  /** Override runoff coefficient C (Monte Carlo) */
  runoffCoeff?: number;
  /** Override temporary pump capacity per pump, m³/s (Monte Carlo) */
  tempPumpCapacityM3s?: number;
  /** Override gravity drain capacity, m³/s (Monte Carlo) */
  gravityDrainCapacityM3s?: number;
  /** Override permanent pump capacity, m³/s (Monte Carlo) */
  permanentPumpCapacityM3s?: number;
}

function triangularIntensityMmh(
  tSec: number,
  rainMm: number,
  durationH: number,
  peakFraction: number
): number {
  if (rainMm <= 0 || durationH <= 0) return 0;

  const durationSec = durationH * 3600;
  if (tSec < 0 || tSec > durationSec) return 0;

  const iPeak = (2 * rainMm) / durationH;
  const tPeakSec = peakFraction * durationSec;

  if (tSec <= tPeakSec) {
    if (tPeakSec <= 0) return iPeak;
    return iPeak * (tSec / tPeakSec);
  }

  const falling = durationSec - tPeakSec;
  if (falling <= 0) return 0;
  return iPeak * ((durationSec - tSec) / falling);
}

function impactIndex(
  hotspot: Hotspot,
  interventions: Interventions,
  closureMinutes: number
): number {
  const closureHours = closureMinutes / 60;
  if (closureHours <= 0) return 0;

  let exposurePcu = hotspot.traffic_pcu_per_hour;
  if (interventions.preDivert) exposurePcu *= PRE_DIVERT_EXPOSURE_FACTOR;
  if (interventions.roadClosed) exposurePcu *= ROAD_CLOSED_EXPOSURE_FACTOR;

  let detourMins = hotspot.detour_penalty_mins;
  if (interventions.preDivert) detourMins += PRE_DIVERT_DETOUR_PENALTY_MINS;
  if (interventions.roadClosed) detourMins += ROAD_CLOSED_DETOUR_PENALTY_MINS;

  const hospitalMult = hotspot.hospital_route ? HOSPITAL_ROUTE_WEIGHT : 1;

  const trafficTerm =
    closureHours *
    exposurePcu *
    (1 + DETOUR_PENALTY_WEIGHT * detourMins) *
    hospitalMult;

  const populationTerm = closureHours * hotspot.population_300m * POPULATION_WEIGHT;

  return trafficTerm + populationTerm;
}

/**
 * Simulate ponding at a single underpass for a rainfall event.
 */
export function simulate(
  hotspot: Hotspot,
  rainMm: number,
  durationH: number,
  interventions: Interventions,
  params?: SimulateParams
): SimulationResult {
  const dt = EULER_STEP_SECONDS;
  const maxSteps = Math.floor((MAX_SIMULATION_HOURS * 3600) / dt);
  const rainSteps = durationH > 0 ? Math.floor((durationH * 3600) / dt) : 0;

  const C = params?.runoffCoeff ?? hotspot.runoff_coeff_default;
  const tempPumpCap = params?.tempPumpCapacityM3s ?? TEMP_PUMP_CAPACITY_M3S;
  const drainCap =
    params?.gravityDrainCapacityM3s ?? hotspot.gravity_drain_capacity_m3s;
  const permPumpCap =
    params?.permanentPumpCapacityM3s ?? hotspot.permanent_pump_capacity_m3s;

  const drainMultiplier = interventions.drainCleared
    ? 1 + DRAIN_CLEARED_RECOVERY_FACTOR
    : 1;
  const qOut =
    permPumpCap +
    interventions.tempPumps * tempPumpCap +
    drainCap * drainMultiplier;

  const areaM2 = Math.max(hotspot.surface_area_m2, 1e-9);
  const hMaxStorage = hotspot.storage_depth_max_m;

  let h = 0;
  let maxDepthM = 0;
  let minutesToAlert: number | null = null;
  let minutesToClosure: number | null = null;
  let closureMinutes = 0;

  for (let step = 0; step < maxSteps; step++) {
    const tSec = step * dt;
    const intensity = triangularIntensityMmh(
      tSec,
      rainMm,
      durationH,
      HYETOGRAPH_PEAK_FRACTION
    );
    const qIn = RATIONAL_METHOD_COEFF * C * intensity * hotspot.catchment_km2;
    h += ((qIn - qOut) * dt) / areaM2;
    if (h < 0) h = 0;
    if (h > hMaxStorage) h = hMaxStorage;

    if (h > maxDepthM) maxDepthM = h;

    const elapsedMin = step + 1;
    if (minutesToAlert === null && h >= ALERT_DEPTH_M) {
      minutesToAlert = elapsedMin;
    }
    if (h >= CLOSURE_DEPTH_M) {
      if (minutesToClosure === null) minutesToClosure = elapsedMin;
      closureMinutes += 1;
    }

    const rainOver = step + 1 >= rainSteps;
    if (rainOver && h <= 0) break;
  }

  return {
    minutesToAlert,
    minutesToClosure,
    closureMinutes,
    maxDepthM,
    impactIndex: impactIndex(hotspot, interventions, closureMinutes),
  };
}
