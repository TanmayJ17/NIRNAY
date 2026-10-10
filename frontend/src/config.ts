/**
 * NIRNAY Configuration & Hydrological Assumptions
 *
 * NOTE: Every parameter below representing an operational, empirical,
 * or policy parameter is labelled "ASSUMPTION" with rationale.
 * Nothing is hardcoded in the simulation engine — callers pass these params.
 */

// --- Physical Thresholds ---
// ASSUMPTION: 15 cm ponding is the PWD hazard-alert depth (wading / stalling risk)
export const ALERT_DEPTH_M = 0.15;

// ASSUMPTION: 20 cm ponding is the operational roadway-closure depth
export const CLOSURE_DEPTH_M = 0.20;

// Aliases for component backwards compatibility
export const ALERT_THRESHOLD_M = ALERT_DEPTH_M;
export const CLOSURE_THRESHOLD_M = CLOSURE_DEPTH_M;

// --- Hyetograph Design ---
// ASSUMPTION: Convective monsoon storms in Delhi exhibit a skewed triangular
// intensity hyetograph with the peak at 40% of storm duration
export const HYETOGRAPH_PEAK_FRACTION = 0.40;

// --- Numerical Solver Configuration ---
// ASSUMPTION: 60-second forward Euler time step balances UI performance with stability
export const EULER_STEP_SECONDS = 60;

// ASSUMPTION: Post-rainfall drainage simulation runs until ponding clears or 24 h elapses
export const MAX_SIMULATION_HOURS = 24;

// --- Intervention & Equipment Parameters ---
// ASSUMPTION: Standard PWD trailer-mounted diesel dewatering pump delivers 0.15 m³/s
export const TEMP_PUMP_CAPACITY_M3S = 0.15;

// ASSUMPTION: Clearing choked inlets restores additional gravity-drain capacity
// (Q_drain *= 1 + this factor when drainCleared is true)
export const DRAIN_CLEARED_RECOVERY_FACTOR = 0.50;

// ASSUMPTION: Upstream police diversion reduces vehicle exposure through the sag by 60%
export const PRE_DIVERT_EXPOSURE_FACTOR = 0.40;

// ASSUMPTION: Full barricading leaves a 5% residual non-compliance exposure
export const ROAD_CLOSED_EXPOSURE_FACTOR = 0.05;

// ASSUMPTION: Pre-diverted vehicles incur an average 15-minute network reroute
export const PRE_DIVERT_DETOUR_PENALTY_MINS = 15.0;

// ASSUMPTION: Mandatory closure around arterial underpasses imposes a 30-minute delay
export const ROAD_CLOSED_DETOUR_PENALTY_MINS = 30.0;

// --- Impact Index Weights & Scoring ---
// ASSUMPTION: Designated hospital emergency routes carry a 2.5x priority weight
export const HOSPITAL_ROUTE_WEIGHT = 2.5;

// ASSUMPTION: Converts detour-penalty minutes into a dimensionless impact multiplier
export const DETOUR_PENALTY_WEIGHT = 0.05;

// ASSUMPTION: Population within 300 m is weighted at 0.0001 per capita (relative index)
export const POPULATION_WEIGHT = 0.0001;

// --- Map & Tile Settings ---
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';

export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors &copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a>';

export const MAP_CENTER: [number, number] = [77.2180, 28.6250];
export const MAP_ZOOM = 11.8;

// --- Fleet & Resource Limits ---
// UNVERIFIED: PWD review July 2026, re-check source
export const FLEET = {
  cityWideMobilePumps: 306,
  maxCrews: 50,
} as const;

// ASSUMPTION: Maximum mobile dewatering pumps that can physically deploy at one underpass
export const MAX_PUMPS_PER_HOTSPOT = 4;

// --- Scenario Defaults ---
export const DEFAULT_RAIN_MM = 100;
export const DEFAULT_DURATION_H = 4;

export const DEFAULT_AVAILABLE_PUMPS = 10;
export const DEFAULT_AVAILABLE_CREWS = 3;

export const PIN_COLORS = {
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
} as const;

export const FOOTER_TEXT =
  'Decision support, not flood forecasting. Impact figures are a relative index, not counts of people or vehicles.';

export const PRESETS = [
  { label: 'July 2026 replay', rainMm: 180, durationH: 6 },
  { label: 'May 2025 replay', rainMm: 65, durationH: 3 },
] as const;
