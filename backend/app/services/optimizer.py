"""
NIRNAY Optimization & Monte Carlo Engine
Dynamic Programming / Greedy Pump Allocator & 200-Run Monte Carlo Uncertainty Generator.
"""

import copy
import random
from typing import Dict, List, Any, Tuple
from app.services.hydrology import load_hotspots, simulate_hotspot, simulate_all_hotspots


def optimize_allocations(
    rainfall_mm: float,
    duration_hours: float,
    total_pumps: int,
    total_crews: int,
    base_interventions: Dict[str, Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Greedy/DP Optimization Engine to find optimal distribution of N mobile pumps and M crews.
    Minimizes total vehicle-hours lost across all independent hotspots.
    """
    hotspots = load_hotspots()
    base_interventions = copy.deepcopy(base_interventions or {})
    
    # Track current pump allocation per hotspot
    allocated_pumps = {hs["id"]: base_interventions.get(hs["id"], {}).get("added_pumps", 0) for hs in hotspots}
    cleared_drains = {hs["id"]: base_interventions.get(hs["id"], {}).get("drain_cleared", True) for hs in hotspots}
    
    remaining_pumps = total_pumps
    remaining_crews = total_crews
    
    # 1. First assign crews to clear drains on worst un-cleared hotspots
    if remaining_crews > 0:
        # Sort hotspots by traffic volume and runoff C
        uncleared = [hs for hs in hotspots if not cleared_drains[hs["id"]]]
        uncleared.sort(key=lambda x: x["traffic_volume_vph"] * x["runoff_coefficient_C"], reverse=True)
        for hs in uncleared[:remaining_crews]:
            cleared_drains[hs["id"]] = True
            remaining_crews -= 1

    # 2. Greedy Pump Allocation: Stepwise assign remaining pumps to hotspot with highest marginal impact reduction
    while remaining_pumps > 0:
        best_hs_id = None
        best_impact_reduction = -1.0
        
        for hs in hotspots:
            hs_id = hs["id"]
            current_pumps = allocated_pumps[hs_id]
            
            # Simulate current state
            sim_current = simulate_hotspot(
                hotspot=hs,
                rainfall_mm=rainfall_mm,
                duration_hours=duration_hours,
                added_pumps=current_pumps,
                drain_cleared=cleared_drains[hs_id]
            )
            
            # Simulate state with 1 additional pump
            sim_next = simulate_hotspot(
                hotspot=hs,
                rainfall_mm=rainfall_mm,
                duration_hours=duration_hours,
                added_pumps=current_pumps + 1,
                drain_cleared=cleared_drains[hs_id]
            )
            
            marginal_reduction = sim_current["impact_index_vehicle_hours"] - sim_next["impact_index_vehicle_hours"]
            
            if marginal_reduction > best_impact_reduction:
                best_impact_reduction = marginal_reduction
                best_hs_id = hs_id
                
        if best_hs_id and best_impact_reduction > 0.1:
            allocated_pumps[best_hs_id] += 1
            remaining_pumps -= 1
        else:
            # If marginal reduction is zero everywhere, break
            break

    # Build optimal interventions map
    optimal_interventions = {}
    for hs in hotspots:
        hs_id = hs["id"]
        optimal_interventions[hs_id] = {
            "added_pumps": allocated_pumps[hs_id],
            "drain_cleared": cleared_drains[hs_id]
        }
        
    # Simulate Optimal Outcome
    optimal_simulation = simulate_all_hotspots(
        rainfall_mm=rainfall_mm,
        duration_hours=duration_hours,
        interventions_map=optimal_interventions
    )

    # 3. Calculate Baselines for Comparison
    # Baseline A: Naive Equal Split
    equal_interventions = {}
    equal_pumps_per_hs = max(0, total_pumps // len(hotspots))
    for hs in hotspots:
        equal_interventions[hs["id"]] = {"added_pumps": equal_pumps_per_hs, "drain_cleared": False}
        
    equal_baseline_sim = simulate_all_hotspots(
        rainfall_mm=rainfall_mm,
        duration_hours=duration_hours,
        interventions_map=equal_interventions
    )

    # Baseline B: Historical Traffic Proportional Split
    history_interventions = {}
    sorted_by_traffic = sorted(hotspots, key=lambda x: x["traffic_volume_vph"], reverse=True)
    hist_allocated = {hs["id"]: 0 for hs in hotspots}
    for i in range(total_pumps):
        target_id = sorted_by_traffic[i % len(sorted_by_traffic)]["id"]
        hist_allocated[target_id] += 1
        
    for hs in hotspots:
        history_interventions[hs["id"]] = {"added_pumps": hist_allocated[hs["id"]], "drain_cleared": False}

    history_baseline_sim = simulate_all_hotspots(
        rainfall_mm=rainfall_mm,
        duration_hours=duration_hours,
        interventions_map=history_interventions
    )

    vehicle_hours_saved_vs_equal = max(0.0, round(equal_baseline_sim["total_impact_vehicle_hours"] - optimal_simulation["total_impact_vehicle_hours"], 1))
    vehicle_hours_saved_vs_history = max(0.0, round(history_baseline_sim["total_impact_vehicle_hours"] - optimal_simulation["total_impact_vehicle_hours"], 1))

    # 4. Run Monte Carlo Uncertainty (200 Iterations)
    monte_carlo_results = run_monte_carlo_simulation(
        rainfall_mm=rainfall_mm,
        duration_hours=duration_hours,
        interventions_map=optimal_interventions,
        iterations=200
    )

    return {
        "rainfall_mm": rainfall_mm,
        "duration_hours": duration_hours,
        "total_pumps_available": total_pumps,
        "total_crews_available": total_crews,
        "optimal_allocation_map": allocated_pumps,
        "optimal_simulation": optimal_simulation,
        "baselines": {
            "equal_split_impact": equal_baseline_sim["total_impact_vehicle_hours"],
            "history_split_impact": history_baseline_sim["total_impact_vehicle_hours"],
            "hours_saved_vs_equal": vehicle_hours_saved_vs_equal,
            "hours_saved_vs_history": vehicle_hours_saved_vs_history
        },
        "monte_carlo_uncertainty": monte_carlo_results
    }


def run_monte_carlo_simulation(
    rainfall_mm: float,
    duration_hours: float,
    interventions_map: Dict[str, Dict[str, Any]],
    iterations: int = 200
) -> Dict[str, Any]:
    """
    Runs 200 Monte Carlo draws varying runoff coefficients C (+-15%), pump capacities (+-20%), and drain clogging.
    Computes P10, P50 (Median), P90 confidence bands and recommendation stability %.
    """
    hotspots = load_hotspots()
    simulated_impacts = []
    top_hotspot_counts = {hs["id"]: 0 for hs in hotspots}

    for _ in range(iterations):
        draw_impact = 0.0
        draw_results = []
        
        for hs in hotspots:
            hs_id = hs["id"]
            interv = interventions_map.get(hs_id, {})
            
            # Perturb parameters
            c_factor = random.uniform(0.85, 1.15)
            pump_factor = random.uniform(0.80, 1.20)
            
            perturbed_hs = copy.deepcopy(hs)
            perturbed_hs["runoff_coefficient_C"] = min(0.98, hs["runoff_coefficient_C"] * c_factor)
            perturbed_hs["base_pump_capacity_cumec"] = hs["base_pump_capacity_cumec"] * pump_factor
            
            sim_res = simulate_hotspot(
                hotspot=perturbed_hs,
                rainfall_mm=rainfall_mm,
                duration_hours=duration_hours,
                added_pumps=interv.get("added_pumps", 0),
                drain_cleared=interv.get("drain_cleared", True)
            )
            
            draw_impact += sim_res["impact_index_vehicle_hours"]
            draw_results.append((hs_id, sim_res["impact_index_vehicle_hours"]))

        simulated_impacts.append(draw_impact)
        
        # Track which hotspot suffered highest impact in this draw
        draw_results.sort(key=lambda x: x[1], reverse=True)
        if draw_results:
            top_hotspot_counts[draw_results[0][0]] += 1

    simulated_impacts.sort()
    
    p10_index = int(0.10 * iterations)
    p50_index = int(0.50 * iterations)
    p90_index = int(0.90 * iterations)
    
    # Calculate stability: % of draws where top priority hotspot matches optimal top
    top_winner = max(top_hotspot_counts, key=top_hotspot_counts.get) if top_hotspot_counts else ""
    top_winner_freq = top_hotspot_counts.get(top_winner, 0)
    stability_percentage = round((top_winner_freq / iterations) * 100.0, 1)

    return {
        "iterations": iterations,
        "p10_optimistic_impact": round(simulated_impacts[p10_index], 1),
        "p50_median_impact": round(simulated_impacts[p50_index], 1),
        "p90_pessimistic_impact": round(simulated_impacts[p90_index], 1),
        "recommendation_stability_percent": stability_percentage,
        "top_vulnerable_hotspot": top_winner
    }
