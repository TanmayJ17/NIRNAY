/** A canonical Delhi PWD underpass / waterlogging hotspot */
export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  road_name: string;
  road_class: 'arterial' | 'sub-arterial' | 'collector';
  traffic_pcu_per_hour: number;
  hospital_route: boolean;
  hospital_name?: string;
  population_300m: number;
  catchment_km2: number;
  runoff_coeff_min: number;
  runoff_coeff_max: number;
  runoff_coeff_default: number;
  surface_area_m2: number;
  storage_depth_max_m: number;
  gravity_drain_capacity_m3s: number;
  permanent_pump_capacity_m3s: number;
  detour_penalty_mins: number;
  historical_closure_freq_annual: number;
}

/** Per-hotspot intervention toggles */
export interface Interventions {
  tempPumps: number;
  drainCleared: boolean;
  preDivert: boolean;
  roadClosed: boolean;
}

/** Result of running the simulation for one hotspot */
export interface SimulationResult {
  minutesToAlert: number;
  minutesToClosure: number;
  closureMinutes: number;
  maxDepthM: number;
  impactIndex: number;
}

/** Status color derived from simulation */
export type PinStatus = 'green' | 'amber' | 'red';

/** Allocation entry from the recommend endpoint */
export interface AllocationEntry {
  hotspotId: string;
  hotspotName: string;
  pumps: number;
  crews: number;
  drainCleared: boolean;
}

/** Result from POST /api/recommend */
export interface RecommendResult {
  closureHoursSaved: number;
  closureHoursSavedRange?: [number, number]; // P10-P90
  vehiclesAvoided: number;
  vehiclesAvoidedRange?: [number, number]; // P10-P90
  impactIndexReduced: number;
  impactIndexReducedRange?: [number, number]; // P10-P90
  allocations: AllocationEntry[];
  rationale?: string;
}

/** Hotspot data file shape */
export interface HotspotData {
  hotspots: Hotspot[];
}
