# TEMPORARY STUB, replaced by teammate's engine
"""
Temporary hydrology physics stub for Member 2 development.
Will be replaced by teammate's (Member 1) canonical engine.
"""

from typing import Any, Dict, Optional


def simulate_site(
    site: Any,
    rain: float,
    n_pumps: int,
    crew_assigned: bool,
    overrides: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Temporary stub simulation for an individual underpass site.
    Signature: simulate_site(site, rain, n_pumps, crew_assigned, overrides=None)
    """
    site_id = getattr(site, "id", site if isinstance(site, str) else "unknown")
    site_name = getattr(site, "name", str(site_id))

    # Minimal stub calculation with parameter overrides
    runoff_mult = float(overrides.get("runoff_mult", 1.0)) if overrides else 1.0
    pump_eff_mult = float(overrides.get("pump_eff_mult", 1.0)) if overrides else 1.0
    clog_factor = float(overrides.get("clog_factor", 1.0)) if overrides else 1.0
    area_mult = float(overrides.get("area_mult", 1.0)) if overrides else 1.0

    eff_rain = float(rain) * (runoff_mult / max(0.001, area_mult))
    pump_relief = n_pumps * 0.05 * pump_eff_mult
    crew_relief = (0.04 if crew_assigned else 0.0) * clog_factor
    depth_estimate = max(0.0, eff_rain * 0.005 - pump_relief - crew_relief)
    closure_duration = int(max(0.0, depth_estimate - 0.20) * 120)
    traffic = float(getattr(site, "traffic_vph", 3000.0)) if hasattr(site, "traffic_vph") else 3000.0
    vehicle_hours = round((closure_duration / 60.0) * (traffic / 1000.0) * 1.5, 2)
    impact_score = vehicle_hours

    return {
        "id": site_id,
        "name": site_name,
        "max_depth_m": round(depth_estimate, 3),
        "closure_duration_mins": closure_duration,
        "vehicle_hours": vehicle_hours,
        "impact_score": impact_score,
        "status": "CLOSED" if depth_estimate >= 0.20 else ("ALERT" if depth_estimate >= 0.15 else "OPEN"),
        "assumptions_disclaimer": "Model estimates under stated engineering assumptions; not measured flood depth."
    }
