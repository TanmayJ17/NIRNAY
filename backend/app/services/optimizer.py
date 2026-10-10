"""
NIRNAY Dynamic Programming Resource Optimizer.
Solves the PWD mobile pump and desilting crew allocation problem to global optimality.

MANDATE & ALGORITHM:
1. For each site, builds table VH[i][k][j] for pumps k in 0..N and crew j in {0,1}
   using simulate_site(site, rain, n_pumps, crew_assigned, overrides) from hydrology.py.
2. Runs 2D Knapsack Dynamic Programming over sites with state (pumps used, crews used)
   to minimize total vehicle_hours, with exact backtracking to recover per-site allocation.
3. Evaluates baselines with the same simulator:
   - equal_split: distributes pumps and crews evenly across sites in fixed order.
   - traffic_proportional: allocates pumps and crews proportional to traffic_vph using
     largest remainder rounding.
4. Returns typed OptimizeResponse: per-site allocation (vehicle_hours with/without help,
   marginal benefit per pump, rank), totals, savings vs each baseline, and Monte Carlo stability.
5. Reusable VH tables for Monte Carlo uncertainty analysis.
"""

from __future__ import annotations
import math
import random
from typing import Dict, List, Tuple, Any, Optional

import numpy as np

from backend.app.config import settings
from backend.app.schemas import (
    Hotspot,
    RainScenario,
    Resources,
    Allocation,
    BaselineTotal,
    BaselinesSummary,
    MonteCarloSummary,
    OptimizeResponse,
    TornadoParameterImpact,
    SensitivityResponse,
    MODEL_ASSUMPTIONS_DISCLAIMER
)
from backend.app.services.hydrology import simulate_site


# ==========================================
# 1. Reusable VH Table Construction
# ==========================================

def build_site_vh_table(
    site: Any,
    rain: float,
    max_pumps: int,
    max_crews: int = 1,
    overrides: Optional[Dict[str, Any]] = None
) -> List[List[float]]:
    """
    Builds vehicle-hours table VH[k][j] for a single site where:
    - k in 0..max_pumps
    - j in 0..min(1, max_crews) (crew assigned boolean)
    Calls canonical simulate_site from hydrology.py.
    """
    crews_limit = min(1, max(0, max_crews))
    table: List[List[float]] = []

    for k in range(max_pumps + 1):
        crew_row: List[float] = []
        for j in range(crews_limit + 1):
            crew_bool = bool(j == 1)
            res = simulate_site(
                site=site,
                rain=rain,
                n_pumps=k,
                crew_assigned=crew_bool,
                overrides=overrides
            )
            # Extract vehicle_hours (handles both dict and object return shapes)
            if isinstance(res, dict):
                vh = float(res.get("vehicle_hours", res.get("impact_score", 0.0)))
            else:
                vh = float(getattr(res, "vehicle_hours", getattr(res, "impact_score", 0.0)))
            crew_row.append(round(max(0.0, vh), 2))
        table.append(crew_row)

    return table


def build_all_vh_tables(
    sites: List[Any],
    rain: float,
    total_pumps: int,
    total_crews: int,
    overrides: Optional[Dict[str, Any]] = None
) -> List[List[List[float]]]:
    """
    Constructs 3D array VH[i][k][j] across all sites i in 0..M-1.
    Kept reusable so Monte Carlo perturbation runs can re-evaluate perturbed states.
    """
    return [
        build_site_vh_table(
            site=site,
            rain=rain,
            max_pumps=total_pumps,
            max_crews=min(1, total_crews),
            overrides=overrides
        )
        for site in sites
    ]


# ==========================================
# 2. Exact Dynamic Programming Solver
# ==========================================

def solve_dp(
    vh_tables: List[List[List[float]]],
    total_pumps: int,
    total_crews: int
) -> Tuple[List[Tuple[int, bool]], float]:
    """
    Solves 2D Knapsack Dynamic Programming over sites to minimize total vehicle_hours.
    State: dp[i][p][c] = minimum vehicle_hours for subset of first i sites using
           at most p pumps and c crews.
    Returns:
    - per-site allocation list of (pumps_allocated, crew_assigned)
    - total minimum vehicle_hours
    """
    m = len(vh_tables)
    if m == 0:
        return [], 0.0

    p_max = max(0, total_pumps)
    c_max = max(0, total_crews)

    # dp[i][p][c] initialized to infinity
    # choice[i][p][c] stores (k, j) taken at site i
    dp = np.full((m + 1, p_max + 1, c_max + 1), fill_value=float("inf"), dtype=float)
    choice_k = np.zeros((m + 1, p_max + 1, c_max + 1), dtype=int)
    choice_j = np.zeros((m + 1, p_max + 1, c_max + 1), dtype=int)

    # Base case: 0 sites have 0 vehicle hours lost
    dp[0, :, :] = 0.0

    for i in range(1, m + 1):
        site_vh = vh_tables[i - 1]
        site_max_k = len(site_vh) - 1
        site_max_j = len(site_vh[0]) - 1

        for p in range(p_max + 1):
            for c in range(c_max + 1):
                best_val = float("inf")
                best_k = 0
                best_j = 0

                # Candidates for site i-1
                k_limit = min(p, site_max_k)
                for k in range(k_limit + 1):
                    j_limit = min(c, site_max_j)
                    for j in range(j_limit + 1):
                        cand = dp[i - 1, p - k, c - j] + site_vh[k][j]
                        if cand < best_val:
                            best_val = cand
                            best_k = k
                            best_j = j

                dp[i, p, c] = best_val
                choice_k[i, p, c] = best_k
                choice_j[i, p, c] = best_j

    # Find optimal ending state (minimum total vehicle hours with available resources)
    min_total = dp[m, p_max, c_max]
    curr_p = p_max
    curr_c = c_max

    # Exact Backtracking to recover per-site allocations
    allocations_reversed: List[Tuple[int, bool]] = []
    for i in range(m, 0, -1):
        k = int(choice_k[i, curr_p, curr_c])
        j = int(choice_j[i, curr_p, curr_c])
        allocations_reversed.append((k, bool(j == 1)))
        curr_p -= k
        curr_c -= j

    allocations = list(reversed(allocations_reversed))
    return allocations, round(float(min_total), 2)


# ==========================================
# 3. Baseline Allocator Heuristics
# ==========================================

def evaluate_equal_split(
    vh_tables: List[List[List[float]]],
    total_pumps: int,
    total_crews: int
) -> Tuple[List[Tuple[int, bool]], float]:
    """
    Distributes pumps and crews evenly across sites in fixed order.
    """
    m = len(vh_tables)
    if m == 0:
        return [], 0.0

    base_p = total_pumps // m
    rem_p = total_pumps % m

    allocations: List[Tuple[int, bool]] = []
    total_vh = 0.0

    for i in range(m):
        k = base_p + (1 if i < rem_p else 0)
        # Cap pumps to table size
        k_capped = min(k, len(vh_tables[i]) - 1)
        j = 1 if i < total_crews else 0
        j_capped = min(j, len(vh_tables[i][0]) - 1)
        vh = vh_tables[i][k_capped][j_capped]
        total_vh += vh
        allocations.append((k, bool(j == 1)))

    return allocations, round(total_vh, 2)


def evaluate_traffic_proportional(
    sites: List[Any],
    vh_tables: List[List[List[float]]],
    total_pumps: int,
    total_crews: int
) -> Tuple[List[Tuple[int, bool]], float]:
    """
    Allocates pumps and crews proportional to traffic_vph using largest remainder rounding.
    """
    m = len(sites)
    if m == 0:
        return [], 0.0

    traffics = [float(getattr(s, "traffic_vph", 3000.0)) for s in sites]
    total_traffic = sum(traffics)

    if total_traffic <= 0.0:
        return evaluate_equal_split(vh_tables, total_pumps, total_crews)

    # 1. Pumps allocation using largest remainder rounding
    exact_quotas = [total_pumps * (t / total_traffic) for t in traffics]
    pumps_alloc = [math.floor(q) for q in exact_quotas]
    pumps_remainders = [(exact_quotas[i] - pumps_alloc[i], i) for i in range(m)]
    # Sort remainders descending, breaking ties by index
    pumps_remainders.sort(key=lambda item: (-item[0], item[1]))

    leftover_pumps = total_pumps - sum(pumps_alloc)
    for idx in range(leftover_pumps):
        site_idx = pumps_remainders[idx][1]
        pumps_alloc[site_idx] += 1

    # 2. Crews allocation using largest remainder rounding (capped at 1 per site)
    crews_alloc = [0] * m
    if total_crews > 0:
        crew_quotas = [total_crews * (t / total_traffic) for t in traffics]
        crew_remainders = [(crew_quotas[i], i) for i in range(m)]
        crew_remainders.sort(key=lambda item: (-item[0], item[1]))
        crews_to_give = min(total_crews, m)
        for idx in range(crews_to_give):
            site_idx = crew_remainders[idx][1]
            crews_alloc[site_idx] = 1

    # 3. Evaluate total vehicle-hours
    allocations: List[Tuple[int, bool]] = []
    total_vh = 0.0
    for i in range(m):
        k = pumps_alloc[i]
        j = crews_alloc[i]
        k_capped = min(k, len(vh_tables[i]) - 1)
        j_capped = min(j, len(vh_tables[i][0]) - 1)
        vh = vh_tables[i][k_capped][j_capped]
        total_vh += vh
        allocations.append((k, bool(j == 1)))

    return allocations, round(total_vh, 2)


# ==========================================
# 4. Monte Carlo Uncertainty Evaluation
# ==========================================

def _normalize_plan(plan: Any, sites: List[Any]) -> List[Tuple[int, bool]]:
    """Converts plan of various formats (List[Allocation], List[Tuple[int, bool]], Dict[str, Any]) into [(pumps, crew)]."""
    m = len(sites)
    if m == 0:
        return []
    result: List[Tuple[int, bool]] = [(0, False)] * m

    if isinstance(plan, list):
        for i, item in enumerate(plan):
            if i >= m:
                break
            if isinstance(item, tuple):
                result[i] = (int(item[0]), bool(item[1]))
            elif isinstance(item, Allocation):
                for idx, s in enumerate(sites):
                    s_id = getattr(s, "id", f"site-{idx}")
                    if s_id == item.site_id:
                        result[idx] = (int(item.pumps), bool(item.crew))
                        break
                else:
                    result[i] = (int(item.pumps), bool(item.crew))
            elif isinstance(item, dict):
                p_val = int(item.get("pumps", item.get("temp_pumps", 0)))
                c_val = bool(item.get("crew", item.get("drain_cleared", False)))
                result[i] = (p_val, c_val)
    elif isinstance(plan, dict):
        for idx, s in enumerate(sites):
            s_id = getattr(s, "id", f"site-{idx}")
            if s_id in plan:
                val = plan[s_id]
                if isinstance(val, dict):
                    result[idx] = (
                        int(val.get("pumps", val.get("temp_pumps", 0))),
                        bool(val.get("crew", val.get("drain_cleared", False)))
                    )
                elif isinstance(val, tuple):
                    result[idx] = (int(val[0]), bool(val[1]))
    return result


def _resolve_sites(sites: Optional[List[Any]]) -> List[Any]:
    """Resolves sites list, falling back to loaded global hotspots if none provided."""
    if sites is not None and len(sites) > 0:
        return sites
    try:
        from backend.app.main import HOTSPOTS_CACHE
        if HOTSPOTS_CACHE:
            return HOTSPOTS_CACHE
    except Exception:
        pass
    import json
    from pathlib import Path
    for cand in [Path(settings.HOTSPOTS_FILE), Path.cwd() / settings.HOTSPOTS_FILE]:
        if cand.exists() and cand.is_file():
            try:
                with open(cand, "r", encoding="utf-8") as f:
                    data = json.load(f)
                return [Hotspot.model_validate(h) for h in data.get("hotspots", [])]
            except Exception:
                pass
    return []


def run_monte_carlo(
    rain: Any,
    resources: Any,
    plan: Any,
    draws: int = settings.MC_DRAWS,
    seed: int = settings.MC_SEED,
    sites: Optional[List[Any]] = None
) -> MonteCarloSummary:
    """
    Executes Monte Carlo uncertainty analysis across parameter perturbation draws.
    Each draw samples:
    - runoff_mult uniform 0.85-1.15
    - pump_eff_mult uniform 0.8-1.2
    - clog_factor uniform 0.4-1.0
    - area_mult uniform 0.7-1.3
    Uses numpy with a fixed seed.
    Evaluates the recommended plan and baselines under sampled parameters,
    producing distribution of vehicle_hours and vehicle_hours saved (P10/P50/P90).
    Stability: share of draws in which re-optimizing yields the identical set of top-5 sites by pumps allocated.
    """
    resolved_sites = _resolve_sites(sites)
    m = len(resolved_sites)
    if m == 0 or draws <= 0:
        return MonteCarloSummary(
            p10=0.0,
            p50=0.0,
            p90=0.0,
            p10_saved=0.0,
            p50_saved=0.0,
            p90_saved=0.0,
            stability_pct=100.0,
            draws=draws,
            notes="No sites available for Monte Carlo simulation."
        )

    # 1. Parse scalar inputs
    rain_val = float(getattr(rain, "volume_mm", rain))
    if isinstance(resources, Resources):
        total_pumps = int(resources.pumps)
        total_crews = int(resources.crews)
    elif isinstance(resources, dict):
        total_pumps = int(resources.get("pumps", 0))
        total_crews = int(resources.get("crews", 0))
    else:
        total_pumps = int(getattr(resources, "pumps", 0))
        total_crews = int(getattr(resources, "crews", 0))

    norm_plan = _normalize_plan(plan, resolved_sites)

    # 2. Identify top-5 priority sites in recommended plan by pumps allocated
    top_5_rec_indices = sorted(
        range(m),
        key=lambda i: (
            norm_plan[i][0] * 10 + (1 if norm_plan[i][1] else 0),
            float(getattr(resolved_sites[i], "traffic_vph", 3000.0))
        ),
        reverse=True
    )[:min(5, m)]
    top_5_rec_set = set(top_5_rec_indices)

    # 3. Vectorized sampling with fixed seed numpy generator
    rng = np.random.default_rng(seed)
    runoff_mults = rng.uniform(0.85, 1.15, size=draws)
    pump_eff_mults = rng.uniform(0.80, 1.20, size=draws)
    clog_factors = rng.uniform(0.40, 1.00, size=draws)
    area_mults = rng.uniform(0.70, 1.30, size=draws)

    # Equal split baseline allocation for comparison
    base_p = total_pumps // m
    rem_p = total_pumps % m
    equal_alloc = [
        (base_p + (1 if i < rem_p else 0), bool(i < total_crews))
        for i in range(m)
    ]

    # 4. Evaluate recommended plan and equal split baseline across all draws
    plan_vhs = np.zeros(draws, dtype=float)
    saved_vhs = np.zeros(draws, dtype=float)

    for s in range(draws):
        ov = {
            "runoff_mult": float(runoff_mults[s]),
            "pump_eff_mult": float(pump_eff_mults[s]),
            "clog_factor": float(clog_factors[s]),
            "area_mult": float(area_mults[s])
        }

        draw_plan_vh = 0.0
        draw_equal_vh = 0.0

        for i in range(m):
            k, c = norm_plan[i]
            res_p = simulate_site(resolved_sites[i], rain_val, k, c, overrides=ov)
            draw_plan_vh += float(res_p.get("vehicle_hours", res_p.get("impact_score", 0.0)))

            k_eq, c_eq = equal_alloc[i]
            res_eq = simulate_site(resolved_sites[i], rain_val, k_eq, c_eq, overrides=ov)
            draw_equal_vh += float(res_eq.get("vehicle_hours", res_eq.get("impact_score", 0.0)))

        plan_vhs[s] = draw_plan_vh
        saved_vhs[s] = max(0.0, draw_equal_vh - draw_plan_vh)

    # 5. Recommendation stability: re-optimize under parameter draws
    # Target < 3s: re-optimize on a representative subset (up to 50 draws)
    stability_draws = min(settings.MC_STABILITY_SUBSET_DRAWS, draws)
    matching_draws = 0

    for s in range(stability_draws):
        ov_s = {
            "runoff_mult": float(runoff_mults[s]),
            "pump_eff_mult": float(pump_eff_mults[s]),
            "clog_factor": float(clog_factors[s]),
            "area_mult": float(area_mults[s])
        }
        sub_tables = build_all_vh_tables(
            sites=resolved_sites,
            rain=rain_val,
            total_pumps=total_pumps,
            total_crews=total_crews,
            overrides=ov_s
        )
        sub_alloc, _ = solve_dp(sub_tables, total_pumps, total_crews)
        sub_top_5 = set(
            sorted(
                range(m),
                key=lambda i: (
                    sub_alloc[i][0] * 10 + (1 if sub_alloc[i][1] else 0),
                    float(getattr(resolved_sites[i], "traffic_vph", 3000.0))
                ),
                reverse=True
            )[:min(5, m)]
        )

        if sub_top_5 == top_5_rec_set:
            matching_draws += 1

    stability_pct = round((matching_draws / max(1, stability_draws)) * 100.0, 1)

    p10_vh = round(float(np.percentile(plan_vhs, 10)), 2)
    p50_vh = round(float(np.percentile(plan_vhs, 50)), 2)
    p90_vh = round(float(np.percentile(plan_vhs, 90)), 2)

    p10_saved = round(float(np.percentile(saved_vhs, 10)), 2)
    p50_saved = round(float(np.percentile(saved_vhs, 50)), 2)
    p90_saved = round(float(np.percentile(saved_vhs, 90)), 2)

    definition_text = (
        "Share of draws in which re-optimizing under that draw's parameters "
        "gives the same set of top-5 sites by pumps allocated as the recommended plan."
    )
    notes_text = (
        f"Evaluated plan across {draws} draws. Stability verified on a representative "
        f"subset of {stability_draws} re-optimization draws for sub-3s response."
    )

    return MonteCarloSummary(
        p10=p10_vh,
        p50=p50_vh,
        p90=p90_vh,
        p10_saved=p10_saved,
        p50_saved=p50_saved,
        p90_saved=p90_saved,
        stability_pct=stability_pct,
        stability_definition=definition_text,
        stability_draws=stability_draws,
        draws=draws,
        notes=notes_text
    )


def run_monte_carlo_draws(
    sites: List[Any],
    rain: float,
    total_pumps: int,
    total_crews: int,
    nominal_allocations: List[Tuple[int, bool]],
    n_samples: int = 200
) -> MonteCarloSummary:
    """Backwards-compatible alias for run_monte_carlo."""
    return run_monte_carlo(
        rain=rain,
        resources=Resources(pumps=total_pumps, crews=total_crews),
        plan=nominal_allocations,
        draws=n_samples,
        seed=settings.MC_SEED,
        sites=sites
    )


# ==========================================
# 5. Sensitivity Tornado Analysis
# ==========================================

def sensitivity(
    rain: Any,
    resources: Any,
    sites: Optional[List[Any]] = None
) -> SensitivityResponse:
    """
    One-at-a-time parameter sensitivity analysis (+/- 20%) for tornado chart display.
    Varies:
    - rain volume (+/- 20%)
    - runoff_mult (+/- 20%)
    - pump_eff_mult (+/- 20%)
    - clog_factor (+/- 20%)
    - area_mult (+/- 20%)
    Returns delta in total vehicle_hours and whether the top-5 priority sites change.
    """
    resolved_sites = _resolve_sites(sites)
    m = len(resolved_sites)
    rain_val = float(getattr(rain, "volume_mm", rain))

    if isinstance(resources, Resources):
        total_pumps = int(resources.pumps)
        total_crews = int(resources.crews)
    elif isinstance(resources, dict):
        total_pumps = int(resources.get("pumps", 0))
        total_crews = int(resources.get("crews", 0))
    else:
        total_pumps = int(getattr(resources, "pumps", 0))
        total_crews = int(getattr(resources, "crews", 0))

    if m == 0:
        return SensitivityResponse(
            baseline_vehicle_hours=0.0,
            nominal_top_5_sites=[],
            parameters=[]
        )

    # 1. Baseline nominal run
    base_tables = build_all_vh_tables(
        sites=resolved_sites,
        rain=rain_val,
        total_pumps=total_pumps,
        total_crews=total_crews,
        overrides=None
    )
    base_alloc, base_vh = solve_dp(base_tables, total_pumps, total_crews)

    def _get_top_5_ids(allocations: List[Tuple[int, bool]]) -> List[str]:
        ranked_indices = sorted(
            range(m),
            key=lambda i: (
                allocations[i][0] * 10 + (1 if allocations[i][1] else 0),
                float(getattr(resolved_sites[i], "traffic_vph", 3000.0))
            ),
            reverse=True
        )[:min(5, m)]
        return [getattr(resolved_sites[i], "id", f"site-{i}") for i in ranked_indices]

    base_top_5_ids = _get_top_5_ids(base_alloc)
    base_top_5_set = set(base_top_5_ids)

    # 2. Parameters to perturb +/- 20%
    params_to_test = [
        ("rain", rain_val),
        ("runoff_mult", 1.0),
        ("pump_eff_mult", 1.0),
        ("clog_factor", 1.0),
        ("area_mult", 1.0)
    ]

    tornado_results: List[TornadoParameterImpact] = []

    for param, nominal_val in params_to_test:
        # Minus 20%
        val_minus = nominal_val * 0.80
        if param == "rain":
            r_m = val_minus
            ov_m = None
        else:
            r_m = rain_val
            ov_m = {param: 0.80}

        tables_m = build_all_vh_tables(
            sites=resolved_sites,
            rain=r_m,
            total_pumps=total_pumps,
            total_crews=total_crews,
            overrides=ov_m
        )
        alloc_m, vh_m = solve_dp(tables_m, total_pumps, total_crews)
        top_5_m_set = set(_get_top_5_ids(alloc_m))
        top_5_changed_m = (top_5_m_set != base_top_5_set)
        delta_m = round(vh_m - base_vh, 2)

        # Plus 20%
        val_plus = nominal_val * 1.20
        if param == "rain":
            r_p = val_plus
            ov_p = None
        else:
            r_p = rain_val
            ov_p = {param: 1.20}

        tables_p = build_all_vh_tables(
            sites=resolved_sites,
            rain=r_p,
            total_pumps=total_pumps,
            total_crews=total_crews,
            overrides=ov_p
        )
        alloc_p, vh_p = solve_dp(tables_p, total_pumps, total_crews)
        top_5_p_set = set(_get_top_5_ids(alloc_p))
        top_5_changed_p = (top_5_p_set != base_top_5_set)
        delta_p = round(vh_p - base_vh, 2)

        tornado_results.append(
            TornadoParameterImpact(
                parameter=param,
                baseline_value=round(nominal_val, 2),
                minus_20_vh=round(vh_m, 2),
                plus_20_vh=round(vh_p, 2),
                delta_minus_20=delta_m,
                delta_plus_20=delta_p,
                top_5_changed_minus_20=top_5_changed_m,
                top_5_changed_plus_20=top_5_changed_p
            )
        )

    return SensitivityResponse(
        baseline_vehicle_hours=round(base_vh, 2),
        nominal_top_5_sites=base_top_5_ids,
        parameters=tornado_results,
        assumptions_disclaimer=MODEL_ASSUMPTIONS_DISCLAIMER
    )


# ==========================================
# 6. Core Optimizer Entrypoint
# ==========================================

def optimize_resources(
    sites: List[Any],
    scenario: RainScenario,
    resources: Resources,
    monte_carlo_draws: int = 200
) -> OptimizeResponse:
    """
    Main optimizer pipeline:
    1. Builds VH tables for all sites.
    2. Runs 2D Knapsack DP for exact optimal allocation.
    3. Evaluates equal_split and traffic_proportional baselines.
    4. Computes savings, marginal benefit per pump, and priority ranking.
    5. Runs Monte Carlo draws for P10/P50/P90 confidence bounds, saved hours, and stability.
    """
    total_pumps = max(0, resources.pumps)
    total_crews = max(0, resources.crews)
    rain_volume = max(0.0, scenario.volume_mm)

    # 1. Build reusable VH tables
    vh_tables = build_all_vh_tables(
        sites=sites,
        rain=rain_volume,
        total_pumps=total_pumps,
        total_crews=total_crews
    )

    # 2. Exact DP Knapsack solver
    optimal_allocs, total_optimal_vh = solve_dp(vh_tables, total_pumps, total_crews)

    # 3. Baseline Evaluations
    _, equal_vh = evaluate_equal_split(vh_tables, total_pumps, total_crews)
    _, traffic_vh = evaluate_traffic_proportional(sites, vh_tables, total_pumps, total_crews)

    # Approximate baseline closure hours as VH / traffic factor
    equal_baseline = BaselineTotal(
        total_vehicle_hours=equal_vh,
        total_closure_hours=round(equal_vh / 3.0, 2)
    )
    traffic_baseline = BaselineTotal(
        total_vehicle_hours=traffic_vh,
        total_closure_hours=round(traffic_vh / 3.0, 2)
    )
    baselines = BaselinesSummary(
        equal_split=equal_baseline,
        traffic_proportional=traffic_baseline
    )

    savings_equal = max(0.0, round(equal_vh - total_optimal_vh, 2))
    savings_traffic = max(0.0, round(traffic_vh - total_optimal_vh, 2))

    # 4. Compute per-site allocations, marginal benefit per pump, and rank
    site_allocations_raw: List[Dict[str, Any]] = []

    for idx, site in enumerate(sites):
        site_id = getattr(site, "id", f"site-{idx}")
        pumps, crew = optimal_allocs[idx] if idx < len(optimal_allocs) else (0, False)

        vh_no_help = vh_tables[idx][0][0]
        vh_with_help = vh_tables[idx][min(pumps, len(vh_tables[idx]) - 1)][min(int(crew), len(vh_tables[idx][0]) - 1)]
        vh_saved = max(0.0, vh_no_help - vh_with_help)

        # Marginal benefit per pump
        if pumps > 0:
            mb_per_pump = round(vh_saved / pumps, 2)
        else:
            # Marginal benefit of first pump if none assigned
            first_pump_vh = vh_tables[idx][min(1, len(vh_tables[idx]) - 1)][0]
            mb_per_pump = round(max(0.0, vh_no_help - first_pump_vh), 2)

        site_allocations_raw.append({
            "site_id": site_id,
            "pumps": pumps,
            "crew": crew,
            "vehicle_hours": round(vh_with_help, 2),
            "vehicle_hours_without_help": round(vh_no_help, 2),
            "marginal_benefit_per_pump": mb_per_pump,
            "vh_saved": vh_saved
        })

    # Sort to determine priority rank by marginal benefit per pump descending
    sorted_by_rank = sorted(
        range(len(site_allocations_raw)),
        key=lambda i: (-site_allocations_raw[i]["marginal_benefit_per_pump"], -site_allocations_raw[i]["vh_saved"])
    )

    ranked_allocations: List[Allocation] = [None] * len(site_allocations_raw)  # type: ignore
    for rank_pos, site_idx in enumerate(sorted_by_rank, start=1):
        raw_item = site_allocations_raw[site_idx]
        ranked_allocations[site_idx] = Allocation(
            site_id=raw_item["site_id"],
            pumps=raw_item["pumps"],
            crew=raw_item["crew"],
            vehicle_hours=raw_item["vehicle_hours"],
            vehicle_hours_without_help=raw_item["vehicle_hours_without_help"],
            marginal_benefit_per_pump=raw_item["marginal_benefit_per_pump"],
            rank=rank_pos
        )

    # 5. Monte Carlo Confidence Intervals, Distribution of Savings & Recommendation Stability
    mc_summary = run_monte_carlo(
        rain=rain_volume,
        resources=resources,
        plan=optimal_allocs,
        draws=monte_carlo_draws,
        seed=settings.MC_SEED,
        sites=sites
    )

    return OptimizeResponse(
        allocation=ranked_allocations,
        total_vehicle_hours=total_optimal_vh,
        baselines=baselines,
        savings_vs_equal_split=savings_equal,
        savings_vs_traffic_proportional=savings_traffic,
        monte_carlo=mc_summary,
        assumptions_disclaimer=MODEL_ASSUMPTIONS_DISCLAIMER
    )

