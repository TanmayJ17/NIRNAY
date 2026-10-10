"""
Pydantic Schemas for NIRNAY Backend API.
Enforces strict type safety, field validation, and model assumption disclaimers.
All depth and closure metrics represent model estimates, not measured flood depths.
"""

from __future__ import annotations
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field, model_validator

MODEL_ASSUMPTIONS_DISCLAIMER: str = (
    "Model estimates under stated engineering assumptions (Rational Method runoff, "
    "1-minute Euler reservoir storage balance, independent catchment dips). "
    "Values represent scenario projections, not field-measured flood depths."
)


# ==========================================
# 1. Geodata & Hotspot Schema
# ==========================================

class SumpParams(BaseModel):
    """Sump and pump physical characteristics for a site."""
    surface_area_m2: float = Field(..., ge=0.0, description="Ponding / sump footprint surface area in m2")
    depth_m: float = Field(default=2.0, ge=0.0, description="Maximum storage depth in meters before overtopping")
    permanent_pump_capacity_m3s: float = Field(default=0.0, ge=0.0, description="Permanent installed pump discharge in m3/s")


class Hotspot(BaseModel):
    """Delhi underpass or low-lying road depression catchment parameters."""
    id: str = Field(..., description="Unique hotspot identifier (e.g. delhi-minto-bridge)")
    name: str = Field(..., description="Descriptive hotspot name")
    lat: float = Field(..., description="Latitude coordinate")
    lng: float = Field(..., description="Longitude coordinate")
    catchment_area_km2: float = Field(..., ge=0.0, description="Catchment contributing area in km2")
    runoff_c: float = Field(..., ge=0.0, le=1.0, description="Composite runoff coefficient C")
    drain_capacity_m3s: float = Field(..., ge=0.0, description="Connected storm drain discharge capacity in m3/s")
    traffic_vph: float = Field(..., ge=0.0, description="Peak traffic volume in vehicles/hour or PCU/hr")
    corridor_flag: bool = Field(default=False, description="True if direct access corridor to critical hospital or arterial link")
    sump_surface_area_m2: float = Field(..., ge=0.0, description="Sump/underpass ponding surface area in m2")
    sump_depth_m: float = Field(default=2.0, ge=0.0, description="Maximum underpass storage depth in meters")
    permanent_pump_capacity_m3s: float = Field(default=0.0, ge=0.0, description="Permanent pump discharge capacity in m3/s")

    @model_validator(mode="before")
    @classmethod
    def normalize_json_fields(cls, data: Any) -> Any:
        """Allows loading directly from teammate's data/hotspots/hotspots.json schema."""
        if isinstance(data, dict):
            # lat / lon mapping
            if "lng" not in data and "lon" in data:
                data["lng"] = data["lon"]
            # catchment_km2 -> catchment_area_km2
            if "catchment_area_km2" not in data and "catchment_km2" in data:
                data["catchment_area_km2"] = data["catchment_km2"]
            # runoff_c mapping
            if "runoff_c" not in data:
                data["runoff_c"] = data.get("runoff_coeff_default", data.get("runoff_coeff", 0.85))
            # drain_capacity_m3s mapping
            if "drain_capacity_m3s" not in data:
                data["drain_capacity_m3s"] = data.get("gravity_drain_capacity_m3s", 0.30)
            # traffic_vph mapping
            if "traffic_vph" not in data:
                data["traffic_vph"] = data.get("traffic_pcu_per_hour", 3000.0)
            # corridor_flag mapping
            if "corridor_flag" not in data:
                data["corridor_flag"] = data.get("hospital_route", False)
            # sump params
            if "sump_surface_area_m2" not in data:
                data["sump_surface_area_m2"] = data.get("surface_area_m2", 3000.0)
            if "sump_depth_m" not in data:
                data["sump_depth_m"] = data.get("storage_depth_max_m", 2.0)
        return data


# ==========================================
# 2. Rainfall & Resource Schemas
# ==========================================

class RainScenario(BaseModel):
    """Pre-storm rainfall scenario parameters."""
    volume_mm: float = Field(..., ge=0.0, description="Total rainfall volume in millimeters")
    duration_h: float = Field(..., gt=0.0, description="Storm duration in hours")
    peak_mm_h: Optional[float] = Field(default=None, ge=0.0, description="Peak rainfall intensity in mm/h")
    hyetograph: Optional[List[float]] = Field(default=None, description="Optional time-series of rainfall intensity")

    @model_validator(mode="before")
    @classmethod
    def default_peak_intensity(cls, data: Any) -> Any:
        if isinstance(data, dict):
            vol = data.get("volume_mm")
            dur = data.get("duration_h")
            if vol is not None and dur and ("peak_mm_h" not in data or data.get("peak_mm_h") is None):
                data["peak_mm_h"] = float(vol) / max(0.1, float(dur))
        return data



class Resources(BaseModel):
    """Available emergency response resource pool."""
    pumps: int = Field(..., ge=0, description="Available pool of deployable mobile pumps (0.045 m3/s each)")
    crews: int = Field(..., ge=0, description="Available pool of drain desilting / clearing crews")


# ==========================================
# 3. Hydrology Simulation Results
# ==========================================

class SiteResult(BaseModel):
    """Hydrological model estimate result for an individual underpass site."""
    warning_min: Optional[int] = Field(None, description="Model estimated elapsed minutes until depth reaches 0.15m (alert)")
    closure_min: Optional[int] = Field(None, description="Model estimated elapsed minutes until depth reaches 0.20m (closure)")
    max_depth_m: float = Field(..., ge=0.0, description="Model estimated peak ponding depth in meters (not measured depth)")
    vehicle_hours: float = Field(..., ge=0.0, description="Estimated vehicle-hours lost due to closure")
    status: Optional[str] = Field("OPEN", description="Operational status: OPEN, ALERT, or CLOSED")
    assumptions_note: str = Field(default=MODEL_ASSUMPTIONS_DISCLAIMER, description="Engineering disclaimer")


class SimulateRequest(BaseModel):
    """Request payload to simulate corridor underpass waterlogging."""
    scenario: RainScenario = Field(..., description="Rainfall scenario parameters")
    site_pumps: Optional[Dict[str, int]] = Field(default=None, description="Mapping of site_id to mobile pumps allocated")
    site_crews: Optional[Dict[str, bool]] = Field(default=None, description="Mapping of site_id to desilting crew assigned")


class SimulateResponse(BaseModel):
    """Catchment-wide simulation response."""
    scenario: RainScenario = Field(..., description="Rainfall scenario evaluated")
    results: Dict[str, SiteResult] = Field(..., description="Per-site simulation outputs")
    total_vehicle_hours: float = Field(..., ge=0.0, description="Catchment aggregate vehicle-hours lost")
    total_closure_hours: float = Field(..., ge=0.0, description="Catchment aggregate closure hours")
    assumptions_disclaimer: str = Field(default=MODEL_ASSUMPTIONS_DISCLAIMER, description="Engineering disclaimer")


# ==========================================
# 4. Optimization & Monte Carlo Schemas
# ==========================================

class Allocation(BaseModel):
    """Decision allocation per site."""
    site_id: str = Field(..., description="Unique hotspot identifier")
    pumps: int = Field(default=0, ge=0, description="Mobile pumps allocated")
    crew: bool = Field(default=False, description="Desilting crew assigned")
    vehicle_hours: float = Field(..., ge=0.0, description="Estimated vehicle-hours lost with this allocation")
    vehicle_hours_without_help: float = Field(..., ge=0.0, description="Estimated vehicle-hours lost without intervention")
    marginal_benefit_per_pump: Optional[float] = Field(default=0.0, description="Estimated vehicle-hours saved per pump")
    rank: Optional[int] = Field(default=None, description="Priority rank by marginal benefit")


class BaselineTotal(BaseModel):
    """Total metrics under a baseline allocation heuristic."""
    total_vehicle_hours: float = Field(..., description="Total vehicle-hours lost under baseline")
    total_closure_hours: float = Field(..., description="Total closure hours under baseline")


class BaselinesSummary(BaseModel):
    """Comparative baselines for status-quo benchmark."""
    equal_split: BaselineTotal = Field(..., description="Naive equal distribution across top sites")
    traffic_proportional: BaselineTotal = Field(..., description="Allocation proportional to historical traffic volume")


class MonteCarloSummary(BaseModel):
    """Confidence bounds, distribution of saved hours, and stability score from stochastic draws."""
    p10: float = Field(..., description="10th percentile model estimate impact under parameter perturbation")
    p50: float = Field(..., description="50th percentile (median) model estimate impact")
    p90: float = Field(..., description="90th percentile model estimate impact")
    p10_saved: Optional[float] = Field(default=None, description="10th percentile vehicle-hours saved vs baseline")
    p50_saved: Optional[float] = Field(default=None, description="50th percentile (median) vehicle-hours saved vs baseline")
    p90_saved: Optional[float] = Field(default=None, description="90th percentile vehicle-hours saved vs baseline")
    stability_pct: float = Field(..., ge=0.0, le=100.0, description="Stability percentage across perturbation draws")
    stability_definition: str = Field(
        default="Share of Monte Carlo draws in which re-optimizing under that draw's parameters gives the same set of top-5 sites by pumps allocated as the recommended plan.",
        description="Formal definition of stability metric for UI display"
    )
    stability_draws: int = Field(default=50, description="Number of draws evaluated for re-optimization stability")
    draws: int = Field(default=200, description="Total number of Monte Carlo perturbation draws executed")
    notes: Optional[str] = Field(default=None, description="Performance and sampling notes")


class OptimizeRequest(BaseModel):
    """Request payload for the Dynamic Programming resource optimizer."""
    scenario: RainScenario = Field(..., description="Rainfall scenario parameters")
    resources: Resources = Field(..., description="Available pumps and desilting crews")
    monte_carlo_draws: Optional[int] = Field(default=200, ge=10, le=500, description="Number of Monte Carlo perturbation draws")


class OptimizeResponse(BaseModel):
    """Optimal resource allocation response from Dynamic Programming solver."""
    allocation: List[Allocation] = Field(..., description="Per-site optimal intervention allocations")
    total_vehicle_hours: float = Field(..., description="Total vehicle-hours lost under optimal allocation")
    baselines: BaselinesSummary = Field(..., description="Baseline comparators for ROI verification")
    savings_vs_equal_split: float = Field(..., description="Vehicle-hours saved vs equal split baseline")
    savings_vs_traffic_proportional: float = Field(..., description="Vehicle-hours saved vs traffic proportional baseline")
    monte_carlo: MonteCarloSummary = Field(..., description="Monte Carlo confidence intervals and recommendation stability")
    assumptions_disclaimer: str = Field(default=MODEL_ASSUMPTIONS_DISCLAIMER, description="Engineering disclaimer")


class SensitivityRequest(BaseModel):
    """Request payload for sensitivity tornado analysis."""
    scenario: Optional[RainScenario] = Field(default=None, description="Rainfall scenario parameters")
    resources: Optional[Resources] = Field(default=None, description="Available resources")
    rain_mm: Optional[float] = Field(default=None, description="Rainfall volume in mm (convenience field)")
    duration_h: Optional[float] = Field(default=3.0, description="Storm duration in hours (convenience field)")
    pumps: Optional[int] = Field(default=None, description="Available mobile pumps (convenience field)")
    crews: Optional[int] = Field(default=None, description="Available desilting crews (convenience field)")


class TornadoParameterImpact(BaseModel):
    """Impact of varying an individual parameter +/- 20% for tornado charts."""
    parameter: str = Field(..., description="Parameter name (e.g. rain, runoff_mult, pump_eff_mult, clog_factor, area_mult)")
    baseline_value: float = Field(..., description="Nominal/baseline value")
    minus_20_vh: float = Field(..., description="Total vehicle hours at -20% parameter value")
    plus_20_vh: float = Field(..., description="Total vehicle hours at +20% parameter value")
    delta_minus_20: float = Field(..., description="Change in vehicle hours at -20% (minus_20_vh - baseline_vh)")
    delta_plus_20: float = Field(..., description="Change in vehicle hours at +20% (plus_20_vh - baseline_vh)")
    top_5_changed_minus_20: bool = Field(..., description="True if top-5 priority sites by pumps allocated changed at -20%")
    top_5_changed_plus_20: bool = Field(..., description="True if top-5 priority sites by pumps allocated changed at +20%")


class SensitivityResponse(BaseModel):
    """Response payload for tornado sensitivity analysis."""
    baseline_vehicle_hours: float = Field(..., description="Nominal total vehicle-hours under optimal plan")
    nominal_top_5_sites: List[str] = Field(..., description="Nominal top-5 priority site IDs by pumps allocated")
    parameters: List[TornadoParameterImpact] = Field(..., description="Tornado chart parameter sensitivities")
    assumptions_disclaimer: str = Field(default=MODEL_ASSUMPTIONS_DISCLAIMER, description="Engineering disclaimer")


# ==========================================
# 5. Strands AI Agent Schemas
# ==========================================

class AgentRequest(BaseModel):
    """Prompt query to the Strands operational assistant."""
    prompt: str = Field(..., description="User query or decision support request")
    session_id: Optional[str] = Field(default="default-session", description="Conversation session ID")
    scenario: Optional[RainScenario] = Field(default=None, description="Active rainfall scenario context")
    resources: Optional[Resources] = Field(default=None, description="Active resource pool context")


class AgentResponse(BaseModel):
    """AI explanation response strictly grounded in tool math."""
    answer: str = Field(..., description="Grounded operational explanation")
    tool_trace: List[Dict[str, Any]] = Field(default_factory=list, description="Trace of tools executed to derive answer")
    fallback: bool = Field(default=False, description="True if generated by deterministic template fallback")
    assumptions_disclaimer: str = Field(default=MODEL_ASSUMPTIONS_DISCLAIMER, description="Engineering disclaimer")



# ==========================================
# 6. Operator Decisions Schemas
# ==========================================

class DecisionAction(BaseModel):
    """Operator approval or rejection decision record."""
    action: str = Field(..., pattern="^(approve|reject)$", description="Operator decision: 'approve' or 'reject'")
    operator_id: str = Field(..., description="Identifier or badge of the PWD control room operator")
    notes: Optional[str] = Field(None, description="Operational notes or rationale")
    allocation: Optional[List[Allocation]] = Field(default=None, description="Allocation package approved or rejected")
    scenario: Optional[RainScenario] = Field(default=None, description="Rainfall scenario associated with the decision")


class DecisionRecord(BaseModel):
    """Stored decision log entry."""
    id: str = Field(..., description="Unique decision ID")
    action: str = Field(..., description="Action taken ('approve' or 'reject')")
    operator_id: str = Field(..., description="Operator identifier")
    timestamp: str = Field(..., description="ISO 8601 timestamp")
    notes: Optional[str] = Field(None, description="Operator notes")
    allocation: Optional[List[Allocation]] = Field(default=None, description="Associated allocations")
    scenario: Optional[RainScenario] = Field(default=None, description="Associated scenario")


class WeatherHourlyItem(BaseModel):
    """Hourly precipitation and probability point."""
    time: str = Field(..., description="Timestamp for the forecast hour")
    precipitation_mm: float = Field(..., ge=0.0, description="Precipitation in mm")
    precipitation_probability: Optional[float] = Field(None, ge=0.0, le=100.0, description="Precipitation probability in %")


class DerivedScenario(BaseModel):
    """Derived storm scenario for simulation."""
    volume_mm: float = Field(..., ge=0.0, description="Total precipitation volume over the next 24h in mm")
    duration_h: float = Field(..., ge=0.0, description="Hours with precipitation above 0.2 mm")
    peak_mm_h: float = Field(..., ge=0.0, description="Maximum hourly rainfall intensity in mm/h")
    onset_time: Optional[str] = Field(None, description="Timestamp of the first hour with precipitation > 0.2 mm")


class WeatherForecastResponse(BaseModel):
    """24-Hour live or cached/fallback weather forecast from Open-Meteo."""
    source: str = Field(default="Open-Meteo", description="Forecast data provider")
    latitude: float = Field(default=28.6139, description="Latitude")
    longitude: float = Field(default=77.2090, description="Longitude")
    timezone: str = Field(default="Asia/Kolkata", description="Timezone")
    timestamp: str = Field(..., description="Timestamp of forecast generation or retrieval")
    stale: bool = Field(default=False, description="True if served from stale cache or file fallback")
    hourly: List[WeatherHourlyItem] = Field(..., description="Hourly series for the next 24h")
    scenario: DerivedScenario = Field(..., description="Derived storm scenario")


class ReplayItem(BaseModel):
    """Historical storm event dataset item."""
    id: str = Field(..., description="Replay ID")
    name: str = Field(..., description="Storm title")
    date: Optional[str] = Field(None, description="Date of storm")
    rain_total_mm: float = Field(..., description="Rainfall volume")
    duration_hours: float = Field(..., description="Duration in hours")
    peak_intensity_mmh: Optional[float] = Field(None, description="Peak intensity")
    description: Optional[str] = Field(None, description="Event summary")
    historical_context: Optional[str] = Field(None, description="Field context and news reports")


class ReplaysResponse(BaseModel):
    """List of historical storm presets."""
    replays: List[ReplayItem] = Field(..., description="Pre-calibrated historical replay storms")


class HealthResponse(BaseModel):
    """Application health and runtime status."""
    status: str = Field(default="healthy", description="Application status")
    hotspots_count: int = Field(..., description="Number of hotspots loaded in memory")
    replays_count: int = Field(..., description="Number of historical replays loaded")
    version: str = Field(..., description="Backend version")
    model_assumptions: str = Field(default=MODEL_ASSUMPTIONS_DISCLAIMER, description="Engineering disclaimer")
