/**
 * NIRNAY Client-Side Hydrological Simulator (TypeScript Port)
 * Ported from Member 1's reference engine. Runs at 60 FPS on user interaction.
 */

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  road_name: string;
  road_class: string;
  traffic_pcu_per_hour: number;
  hospital_route: boolean;
  hospital_name?: string;
  population_300m: number;
  catchment_km2: number;
  runoff_coeff_default: number;
  surface_area_m2: number;
  gravity_drain_capacity_m3s: number;
  permanent_pump_capacity_m3s: number;
  detour_penalty_mins: number;
  historical_closure_freq_annual?: number;
}

export interface Intervention {
  tempPumps: number;      // 0 to 3 mobile pumps (0.045 m3/s each)
  drainCleared: boolean;  // Hazard layer: restores drain to 100% capacity
  preDivert: boolean;     // Impact layer: removes 60% traffic exposure
  roadClosed: boolean;    // Impact layer: zero traffic exposure
}

export interface HotspotSimulationResult {
  id: string;
  name: string;
  maxDepthM: number;
  timeToAlertMins: number | null;
  timeToClosureMins: number | null;
  closureDurationMins: number;
  impactScore: number;
  depthSeries: number[];
  status: 'OPEN' | 'ALERT' | 'CLOSED';
}

export interface SimulationOutput {
  rainTotalMm: number;
  durationHours: number;
  totalClosureHours: number;
  totalImpactScore: number;
  hotspots: Record<string, HotspotSimulationResult>;
}

export function runSimulationClient(
  hotspots: Hotspot[],
  rainTotalMm: number,
  durationHours: number,
  interventions: Record<string, Intervention>,
  dtSeconds = 60
): SimulationOutput {
  const totalSteps = Math.max(1, Math.floor((durationHours * 3600) / dtSeconds));
  const tPeakSec = (durationHours * 3600) / 3.0;
  const results: Record<string, HotspotSimulationResult> = {};
  let totalClosureMinutes = 0;
  let totalImpact = 0;

  const rainfallIntensity = (tSec: number): number => {
    if (tSec <= tPeakSec) {
      return ((2.0 * rainTotalMm) / durationHours) * (tSec / Math.max(1, tPeakSec));
    } else if (tSec <= durationHours * 3600) {
      return (
        ((2.0 * rainTotalMm) / durationHours) *
        ((durationHours * 3600 - tSec) / Math.max(1, durationHours * 3600 - tPeakSec))
      );
    }
    return 0.0;
  };

  for (const hp of hotspots) {
    const interv = interventions[hp.id] || {
      tempPumps: 0,
      drainCleared: false,
      preDivert: false,
      roadClosed: false,
    };

    const drainFactor = interv.drainCleared ? 1.0 : 0.5;
    const qDrain = hp.gravity_drain_capacity_m3s * drainFactor;
    const qPumps = hp.permanent_pump_capacity_m3s + interv.tempPumps * 0.045;

    let h = 0.0;
    let maxH = 0.0;
    let tAlert: number | null = null;
    let tClose: number | null = null;
    let closureSteps = 0;
    const depthSeries: number[] = [];

    for (let step = 0; step < totalSteps; step++) {
      const tSec = step * dtSeconds;
      const iMmh = rainfallIntensity(tSec);

      // Rational method inflow: Q_in = 0.278 * C * i * A (m3/s)
      const qIn = 0.278 * hp.runoff_coeff_default * iMmh * hp.catchment_km2;
      const qOut = qDrain + qPumps;
      const dh = ((qIn - qOut) / hp.surface_area_m2) * dtSeconds;

      h = Math.max(0.0, h + dh);
      if (h > maxH) maxH = h;

      if (h >= 0.15 && tAlert === null) tAlert = Math.floor(tSec / 60);
      if (h >= 0.20) {
        if (tClose === null) tClose = Math.floor(tSec / 60);
        closureSteps++;
      }

      if (step % 5 === 0 || step === totalSteps - 1) {
        depthSeries.push(Number(h.toFixed(3)));
      }
    }

    const closureDurationMins = closureSteps * Math.floor(dtSeconds / 60);
    totalClosureMinutes += closureDurationMins;

    let trafficWeight = hp.traffic_pcu_per_hour / 3000.0;
    if (interv.preDivert) trafficWeight *= 0.4;
    if (interv.roadClosed) trafficWeight = 0.1;

    const detourFactor = hp.detour_penalty_mins / 20.0;
    const hospitalMult = hp.hospital_route ? 2.5 : 1.0;
    const popMult = 1.0 + hp.population_300m / 20000.0;

    let rawImpact =
      closureDurationMins * trafficWeight * detourFactor * hospitalMult * popMult;
    if (interv.preDivert) rawImpact += 25.0;

    totalImpact += rawImpact;

    let status: 'OPEN' | 'ALERT' | 'CLOSED' = 'OPEN';
    if (maxH >= 0.20) status = 'CLOSED';
    else if (maxH >= 0.15) status = 'ALERT';

    results[hp.id] = {
      id: hp.id,
      name: hp.name,
      maxDepthM: Number(maxH.toFixed(3)),
      timeToAlertMins: tAlert,
      timeToClosureMins: tClose,
      closureDurationMins,
      impactScore: Number(rawImpact.toFixed(2)),
      depthSeries,
      status,
    };
  }

  return {
    rainTotalMm,
    durationHours,
    totalClosureHours: Number((totalClosureMinutes / 60).toFixed(2)),
    totalImpactScore: Number(totalImpact.toFixed(2)),
    hotspots: results,
  };
}
