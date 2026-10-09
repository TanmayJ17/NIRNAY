/** Flood status thresholds (meters) — single source of truth */
export const ALERT_THRESHOLD_M = 0.15;
export const CLOSURE_THRESHOLD_M = 0.20;

/** Map tile URL (CARTO light — no API key required) */
export const MAP_TILE_URL =
  'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png';

/** Map attribution */
export const MAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

/** Default map center — Delhi */
export const MAP_CENTER: [number, number] = [77.2090, 28.6139];
export const MAP_ZOOM = 11;

/** Default scenario */
export const DEFAULT_RAIN_MM = 100;
export const DEFAULT_DURATION_H = 4;

/** Resource pool defaults */
export const DEFAULT_AVAILABLE_PUMPS = 12;
export const DEFAULT_AVAILABLE_CREWS = 8;

/** Pin color constants */
export const PIN_COLORS = {
  green: '#16A34A',
  amber: '#D97706',
  red: '#DC2626',
} as const;

/** Footer disclaimer text — exact copy */
export const FOOTER_TEXT =
  'Decision support, not flood forecasting. Impact figures are a relative index, not counts of people or vehicles.';

/** Historical preset labels */
export const PRESETS = [
  { label: 'July 2026 replay', rainMm: 180, durationH: 6 },
  { label: 'May 2025 replay', rainMm: 65, durationH: 3 },
] as const;
