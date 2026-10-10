"""
NIRNAY Hydrology Physics Engine
Implements Rational Method Inflow and Euler Integration Water Balance for Delhi Underpasses.
"""

import json
import math
import os
from typing import Dict, List, Any, Optional

HOTSPOTS_FILE = os.path.join(os.path.dirname(__file__), "../../../data/hotspots/hotspots.json")

def load_hotspots() -> List[Dict[str, Any]]:
    """Load pre-calibrated hotspot parameters from JSON dataset."""
    if os.path.exists(HOTSPOTS_FILE):
        with open(HOTSPOTS_FILE, "r") as f:
            return json.load(f)
    raise FileNotFoundError(f"Hotspots file not found at {HOTSPOTS_FILE}")


def calculate_triangular_intensity(time_mins: float, duration_hours: float, total_rain_mm: float) -> float:
    """
    Calculates rainfall intensity (mm/h) at a given minute using a triangular hyetograph storm shape.
    Peak intensity occurs at mid-storm duration.
    """
    total_mins = duration_hours * 60.0
    if total_mins <= 0 or time_mins < 0 or time_mins > total_mins:
        return 0.0
    
    # Peak intensity I_peak = 2 * Total_Rain / Duration_hours
    peak_intensity_mmh = (2.0 * total_rain_mm) / duration_hours
    mid_mins = total_mins / 2.0
    
    if time_mins <= mid_mins:
        return (time_mins / mid_mins) * peak_intensity_mmh
    else:
        return ((total_mins - time_mins) / (total_mins - mid_mins)) * peak_intensity_mmh


def simulate_hotspot(
    hotspot: Dict[str, Any],
    rainfall_mm: float,
    duration_hours: float,
    added_pumps: int = 0,
    drain_cleared: bool = True,
    traffic_diverted: bool = False,
    road_closed_early: bool = False
) -> Dict[str, Any]:
    """
    Simulates water level balance h(t) over time for a single underpass hotspot.
    Returns countdown minutes to alert/closure, max depth, and vehicle-hours impact index.
    """
    total_mins = int(duration_hours * 60.0) + 120  # Simulate storm + 2h drain tail
    dt_sec = 60.0  # 1-minute Euler integration step
    
    # Hotspot parameters
    area_sqkm = hotspot["catchment_area_sqkm"]
    runoff_C = hotspot["runoff_coefficient_C"]
    surface_area_sqm = hotspot["storage_surface_area_sqm"]
    base_drain_cumec = hotspot["drain_capacity_cumec"]
    base_pump_cumec = hotspot["base_pump_capacity_cumec"]
    
    # Interventions adjustments
    added_pump_capacity_cumec = added_pumps * 0.25  # Each temporary mobile pump adds 0.25 m^3/s
    total_pump_cumec = base_pump_cumec + added_pump_capacity_cumec
    
    # Drain clogging factor beta
    drain_beta = 1.0 if drain_cleared else 0.4
    effective_drain_cumec = base_drain_cumec * drain_beta
    
    # Traffic volume & detour penalty adjustments
    traffic_volume = hotspot["traffic_volume_vph"]
    if traffic_diverted:
        traffic_volume *= 0.3  # Pre-diversion reduces exposure traffic by 70%
    
    current_depth_m = 0.0
    max_depth_m = 0.0
    warning_mins: Optional[int] = None
    closure_mins: Optional[int] = None
    closure_duration_mins = 0
    depth_timeline: List[float] = []
    
    warning_threshold = hotspot.get("warning_depth_m", 0.15)
    closure_threshold = hotspot.get("closure_depth_m", 0.20)
    
    for t_min in range(total_mins):
        # 1. Rational Method Inflow Rate Q_in (m^3/s)
        intensity_mmh = calculate_triangular_intensity(t_min, duration_hours, rainfall_mm)
        q_in_cumec = 0.278 * runoff_C * intensity_mmh * area_sqkm
        
        # 2. Outflow Rates Q_out (Pumps + Drain)
        q_pump_actual = total_pump_cumec if current_depth_m > 0.02 else 0.0
        
        # Drain head factor sqrt(h / closure_threshold)
        head_factor = math.sqrt(min(current_depth_m / closure_threshold, 2.5)) if current_depth_m > 0.01 else 0.0
        q_drain_actual = effective_drain_cumec * head_factor
        
        q_out_cumec = q_pump_actual + q_drain_actual
        
        # 3. Storage Balance dh/dt
        net_flow_cumec = q_in_cumec - q_out_cumec
        dh = (net_flow_cumec * dt_sec) / surface_area_sqm
        
        current_depth_m = max(0.0, current_depth_m + dh)
        depth_timeline.append(round(current_depth_m, 3))
        
        if current_depth_m > max_depth_m:
            max_depth_m = current_depth_m
            
        # Check thresholds
        if current_depth_m >= warning_threshold and warning_mins is None:
            warning_mins = t_min
            
        if current_depth_m >= closure_threshold:
            if closure_mins is None:
                closure_mins = t_min
            closure_duration_mins += 1

    # Status classification
    if max_depth_m >= closure_threshold:
        status = "CRITICAL_CLOSED"
        status_color = "RED"
    elif max_depth_m >= warning_threshold:
        status = "WARNING_ELEVATED"
        status_color = "AMBER"
    else:
        status = "SAFE_OPERATIONAL"
        status_color = "GREEN"

    # Calculate Impact Index (Vehicle-hours lost)
    hospital_multiplier = 1.5 if hotspot.get("is_hospital_route", False) else 1.0
    closure_hours = closure_duration_mins / 60.0
    detour_hours = (hotspot["detour_penalty_mins"] / 60.0)
    
    if road_closed_early:
        # Pre-emptive closure adds controlled detour penalty but prevents trapped vehicles
        impact_index = round(closure_hours * (traffic_volume / 2.0) * detour_hours * hospital_multiplier, 1)
    else:
        impact_index = round(closure_hours * traffic_volume * (1.0 + detour_hours) * hospital_multiplier, 1)

    return {
        "hotspot_id": hotspot["id"],
        "hotspot_name": hotspot["name"],
        "zone": hotspot["zone"],
        "status": status,
        "status_color": status_color,
        "max_depth_m": round(max_depth_m, 2),
        "time_to_warning_mins": warning_mins,
        "time_to_closure_mins": closure_mins,
        "closure_duration_mins": closure_duration_mins,
        "impact_index_vehicle_hours": impact_index,
        "added_pumps": added_pumps,
        "drain_cleared": drain_cleared,
        "traffic_diverted": traffic_diverted,
        "is_hospital_route": hotspot["is_hospital_route"],
        "hospital_name": hotspot.get("hospital_name")
    }


def simulate_all_hotspots(
    rainfall_mm: float,
    duration_hours: float,
    interventions_map: Optional[Dict[str, Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Simulates entire catchment across all 15 hotspots.
    Returns individual hotspot risk states and cumulative catchment impact.
    """
    hotspots = load_hotspots()
    interventions_map = interventions_map or {}
    
    results = []
    total_impact_vh = 0.0
    total_closure_hours = 0.0
    closed_count = 0
    warning_count = 0
    
    for hs in hotspots:
        hs_id = hs["id"]
        interv = interventions_map.get(hs_id, {})
        
        sim_res = simulate_hotspot(
            hotspot=hs,
            rainfall_mm=rainfall_mm,
            duration_hours=duration_hours,
            added_pumps=interv.get("added_pumps", 0),
            drain_cleared=interv.get("drain_cleared", True),
            traffic_diverted=interv.get("traffic_diverted", False),
            road_closed_early=interv.get("road_closed_early", False)
        )
        
        results.append(sim_res)
        total_impact_vh += sim_res["impact_index_vehicle_hours"]
        total_closure_hours += (sim_res["closure_duration_mins"] / 60.0)
        
        if sim_res["status_color"] == "RED":
            closed_count += 1
        elif sim_res["status_color"] == "AMBER":
            warning_count += 1

    return {
        "rainfall_mm": rainfall_mm,
        "duration_hours": duration_hours,
        "total_hotspots": len(hotspots),
        "closed_hotspots_count": closed_count,
        "warning_hotspots_count": warning_count,
        "total_impact_vehicle_hours": round(total_impact_vh, 1),
        "total_closure_hours": round(total_closure_hours, 1),
        "hotspots_results": results
    }
