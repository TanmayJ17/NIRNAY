"""
Unit tests for NIRNAY Dynamic Programming Resource Optimizer.
Verifies:
1. Total allocated pumps never exceeds N, and crews never exceeds C.
2. Optimal total vehicle_hours <= each baseline total (equal_split and traffic_proportional).
3. A hand-built 3-site example with a known global optimum.
4. resources=0 returns the exact no-help total.
5. Reusable VH tables and Monte Carlo stability quantification.
"""

from dataclasses import dataclass
from typing import List
import pytest

from backend.app.schemas import (
    Hotspot,
    RainScenario,
    Resources,
    OptimizeRequest,
    OptimizeResponse,
    MonteCarloSummary,
    SensitivityResponse
)
from backend.app.services.optimizer import (
    build_site_vh_table,
    build_all_vh_tables,
    solve_dp,
    evaluate_equal_split,
    evaluate_traffic_proportional,
    optimize_resources,
    run_monte_carlo,
    sensitivity
)


@dataclass
class SimpleSite:
    id: str
    name: str
    traffic_vph: float = 3000.0


@pytest.fixture
def sample_corridor_sites() -> List[Hotspot]:
    return [
        Hotspot(
            id="delhi-minto-bridge",
            name="Minto Bridge Underpass",
            lat=28.6328,
            lng=77.2215,
            catchment_area_km2=0.85,
            runoff_c=0.85,
            drain_capacity_m3s=0.35,
            traffic_vph=4200.0,
            corridor_flag=True,
            sump_surface_area_m2=3200.0,
            sump_depth_m=2.2,
            permanent_pump_capacity_m3s=0.70
        ),
        Hotspot(
            id="delhi-zakhira",
            name="Zakhira Underpass",
            lat=28.6723,
            lng=77.1585,
            catchment_area_km2=1.40,
            runoff_c=0.86,
            drain_capacity_m3s=0.30,
            traffic_vph=4600.0,
            corridor_flag=True,
            sump_surface_area_m2=4000.0,
            sump_depth_m=2.3,
            permanent_pump_capacity_m3s=0.65
        ),
        Hotspot(
            id="delhi-pul-prahladpur",
            name="Pul Prahladpur Underpass",
            lat=28.5025,
            lng=77.2917,
            catchment_area_km2=1.10,
            runoff_c=0.82,
            drain_capacity_m3s=0.28,
            traffic_vph=3800.0,
            corridor_flag=False,
            sump_surface_area_m2=3500.0,
            sump_depth_m=2.5,
            permanent_pump_capacity_m3s=0.55
        ),
        Hotspot(
            id="delhi-dhaula-kuan",
            name="Dhaula Kuan Underpass",
            lat=28.5921,
            lng=77.1615,
            catchment_area_km2=0.70,
            runoff_c=0.82,
            drain_capacity_m3s=0.45,
            traffic_vph=5800.0,
            corridor_flag=True,
            sump_surface_area_m2=3800.0,
            sump_depth_m=2.1,
            permanent_pump_capacity_m3s=0.85
        )
    ]


@pytest.fixture
def sample_rain() -> RainScenario:
    return RainScenario(volume_mm=85.0, duration_h=3.0, peak_mm_h=45.0)


# =========================================================================
# Test 1: Total allocated pumps never exceeds N (and crews never exceeds C)
# =========================================================================

def test_total_pumps_never_exceeds_n(sample_corridor_sites, sample_rain):
    """Verifies allocated pumps never exceed available budget N, and crews never exceed C."""
    n_pumps = 5
    n_crews = 2
    res: OptimizeResponse = optimize_resources(
        sites=sample_corridor_sites,
        scenario=sample_rain,
        resources=Resources(pumps=n_pumps, crews=n_crews),
        monte_carlo_draws=20
    )

    allocated_pumps = sum(a.pumps for a in res.allocation)
    allocated_crews = sum(1 for a in res.allocation if a.crew)

    assert allocated_pumps <= n_pumps, f"Allocated pumps ({allocated_pumps}) must not exceed {n_pumps}"
    assert allocated_crews <= n_crews, f"Allocated crews ({allocated_crews}) must not exceed {n_crews}"
    assert all(a.pumps >= 0 for a in res.allocation)


# =========================================================================
# Test 2: Optimal total <= each baseline total
# =========================================================================

def test_optimal_total_less_than_or_equal_to_baselines(sample_corridor_sites, sample_rain):
    """Verifies exact DP optimal solution achieves <= vehicle hours than both heuristic baselines."""
    res: OptimizeResponse = optimize_resources(
        sites=sample_corridor_sites,
        scenario=sample_rain,
        resources=Resources(pumps=6, crews=2),
        monte_carlo_draws=20
    )

    opt_vh = res.total_vehicle_hours
    equal_vh = res.baselines.equal_split.total_vehicle_hours
    traffic_vh = res.baselines.traffic_proportional.total_vehicle_hours

    assert opt_vh <= equal_vh, f"Optimal ({opt_vh}) must be <= equal split baseline ({equal_vh})"
    assert opt_vh <= traffic_vh, f"Optimal ({opt_vh}) must be <= traffic proportional baseline ({traffic_vh})"
    assert res.savings_vs_equal_split >= 0.0
    assert res.savings_vs_traffic_proportional >= 0.0
    assert round(res.savings_vs_equal_split, 1) == round(equal_vh - opt_vh, 1)
    assert round(res.savings_vs_traffic_proportional, 1) == round(traffic_vh - opt_vh, 1)


# =========================================================================
# Test 3: A hand-built 3-site example with a known global optimum
# =========================================================================

def test_hand_built_3_site_example_known_optimum():
    """
    Hand-built 3-site problem with pre-defined response table:
    Site 0: [0 pumps: 100, 1 pump: 40 (saves 60), 2 pumps: 25 (saves 75)]
    Site 1: [0 pumps: 80,  1 pump: 50 (saves 30), 2 pumps: 40 (saves 40)]
    Site 2: [0 pumps: 50,  1 pump: 48 (saves 2),  2 pumps: 45 (saves 5)]
    Total pumps N = 2, crews = 0.
    
    Candidates:
    - (2, 0, 0) -> 25 + 80 + 50 = 155
    - (1, 1, 0) -> 40 + 50 + 50 = 140  <-- GLOBAL OPTIMUM (saves 90)
    - (0, 2, 0) -> 100 + 40 + 50 = 190
    - (1, 0, 1) -> 40 + 80 + 48 = 168
    - (0, 1, 1) -> 100 + 50 + 48 = 198
    - (0, 0, 2) -> 100 + 80 + 45 = 225
    """
    # 3D table format: VH[site_i][pump_k][crew_j]
    vh_tables = [
        # Site 0: pumps 0..2, crew 0
        [[100.0], [40.0], [25.0]],
        # Site 1: pumps 0..2, crew 0
        [[80.0], [50.0], [40.0]],
        # Site 2: pumps 0..2, crew 0
        [[50.0], [48.0], [45.0]],
    ]

    allocations, total_vh = solve_dp(vh_tables=vh_tables, total_pumps=2, total_crews=0)

    # Must choose exactly 1 pump for Site 0, 1 pump for Site 1, 0 for Site 2
    assert allocations == [(1, False), (1, False), (0, False)]
    assert total_vh == 140.0


# =========================================================================
# Test 4: resources=0 returns the no-help total
# =========================================================================

def test_resources_zero_returns_no_help_total(sample_corridor_sites, sample_rain):
    """Verifies that with 0 pumps and 0 crews, optimal total equals sum of unmitigated vehicle hours."""
    res: OptimizeResponse = optimize_resources(
        sites=sample_corridor_sites,
        scenario=sample_rain,
        resources=Resources(pumps=0, crews=0),
        monte_carlo_draws=10
    )

    no_help_sum = sum(a.vehicle_hours_without_help for a in res.allocation)
    assert res.total_vehicle_hours == round(no_help_sum, 2)
    assert all(a.pumps == 0 for a in res.allocation)
    assert all(a.crew is False for a in res.allocation)
    assert all(a.vehicle_hours == a.vehicle_hours_without_help for a in res.allocation)
    assert res.savings_vs_equal_split == 0.0
    assert res.savings_vs_traffic_proportional == 0.0


# =========================================================================
# Test 5: Reusability of VH tables & Marginal Ranking
# =========================================================================

def test_reusable_vh_tables_and_ranking(sample_corridor_sites):
    """Verifies build_all_vh_tables produces reusable tables and ranking is sorted properly."""
    tables = build_all_vh_tables(
        sites=sample_corridor_sites,
        rain=70.0,
        total_pumps=3,
        total_crews=1
    )

    # 4 sites, each has 4 pump rows (0..3), and 2 crew columns (0..1)
    assert len(tables) == 4
    for t in tables:
        assert len(t) == 4
        assert len(t[0]) == 2
        # Monotonicity check: adding pumps should not increase vehicle hours
        assert t[1][0] <= t[0][0]

    # Verify ranking metadata
    res = optimize_resources(
        sites=sample_corridor_sites,
        scenario=RainScenario(volume_mm=70.0, duration_h=3.0, peak_mm_h=35.0),
        resources=Resources(pumps=3, crews=1),
        monte_carlo_draws=20
    )
    ranks = [a.rank for a in res.allocation]
    assert sorted(ranks) == [1, 2, 3, 4]


# =========================================================================
# Test 6: Monte Carlo Seed Reproducibility
# =========================================================================

def test_monte_carlo_same_seed_identical_output(sample_corridor_sites):
    """Verifies that calling run_monte_carlo with identical seed produces identical results."""
    plan = [(2, True), (1, False), (1, False), (0, False)]
    res1 = run_monte_carlo(
        rain=85.0,
        resources=Resources(pumps=4, crews=1),
        plan=plan,
        draws=50,
        seed=123,
        sites=sample_corridor_sites
    )
    res2 = run_monte_carlo(
        rain=85.0,
        resources=Resources(pumps=4, crews=1),
        plan=plan,
        draws=50,
        seed=123,
        sites=sample_corridor_sites
    )

    assert res1.p10 == res2.p10
    assert res1.p50 == res2.p50
    assert res1.p90 == res2.p90
    assert res1.p10_saved == res2.p10_saved
    assert res1.p50_saved == res2.p50_saved
    assert res1.p90_saved == res2.p90_saved
    assert res1.stability_pct == res2.stability_pct


# =========================================================================
# Test 7: P10 <= P50 <= P90 Ordering
# =========================================================================

def test_monte_carlo_percentiles_ordering(sample_corridor_sites):
    """Verifies that stochastic perturbation bounds satisfy P10 <= P50 <= P90."""
    plan = [(2, True), (1, False), (1, False), (0, False)]
    res = run_monte_carlo(
        rain=90.0,
        resources=Resources(pumps=4, crews=1),
        plan=plan,
        draws=100,
        seed=42,
        sites=sample_corridor_sites
    )

    # Vehicle-hours distribution ordering
    assert res.p10 <= res.p50 <= res.p90, f"Expected p10 ({res.p10}) <= p50 ({res.p50}) <= p90 ({res.p90})"

    # Saved hours distribution ordering
    if res.p10_saved is not None and res.p50_saved is not None and res.p90_saved is not None:
        assert res.p10_saved <= res.p50_saved <= res.p90_saved, (
            f"Expected p10_saved ({res.p10_saved}) <= p50_saved ({res.p50_saved}) <= p90_saved ({res.p90_saved})"
        )


# =========================================================================
# Test 8: Stability Metric Definition & Explanation String
# =========================================================================

def test_monte_carlo_stability_definition(sample_corridor_sites):
    """Verifies stability definition string is returned in the response for UI display."""
    plan = [(2, True), (1, False), (1, False), (0, False)]
    res = run_monte_carlo(
        rain=80.0,
        resources=Resources(pumps=4, crews=1),
        plan=plan,
        draws=40,
        seed=99,
        sites=sample_corridor_sites
    )
    assert res.stability_definition is not None
    assert "top-5" in res.stability_definition or "top" in res.stability_definition
    assert res.stability_pct >= 0.0
    assert res.stability_pct <= 100.0


# =========================================================================
# Test 9: Sensitivity Tornado Analysis (+/- 20% Parameters)
# =========================================================================

def test_sensitivity_tornado_analysis(sample_corridor_sites):
    """Verifies sensitivity returns delta vehicle-hours and top-5 changes for all 5 parameters."""
    res = sensitivity(
        rain=85.0,
        resources=Resources(pumps=5, crews=2),
        sites=sample_corridor_sites
    )

    assert isinstance(res, SensitivityResponse)
    assert res.baseline_vehicle_hours >= 0.0
    assert len(res.nominal_top_5_sites) <= 5

    param_names = [p.parameter for p in res.parameters]
    expected_params = ["rain", "runoff_mult", "pump_eff_mult", "clog_factor", "area_mult"]
    for expected in expected_params:
        assert expected in param_names, f"Expected parameter {expected} in sensitivity response"

    for p in res.parameters:
        assert hasattr(p, "delta_minus_20")
        assert hasattr(p, "delta_plus_20")
        assert hasattr(p, "top_5_changed_minus_20")
        assert hasattr(p, "top_5_changed_plus_20")
        assert isinstance(p.top_5_changed_minus_20, bool)
        assert isinstance(p.top_5_changed_plus_20, bool)


# =========================================================================
# Test 10: Performance Target (/optimize with 200 draws under 3 seconds)
# =========================================================================

def test_optimize_200_draws_under_3_seconds(sample_corridor_sites):
    """Verifies /optimize with full 200 Monte Carlo draws completes well within 3 seconds."""
    import time
    t0 = time.time()
    res = optimize_resources(
        sites=sample_corridor_sites,
        scenario=RainScenario(volume_mm=100.0, duration_h=3.0, peak_mm_h=45.0),
        resources=Resources(pumps=5, crews=2),
        monte_carlo_draws=200
    )
    elapsed = time.time() - t0
    assert elapsed < 3.0, f"Expected execution time under 3.0s, got {elapsed:.2f}s"
    assert res.monte_carlo.draws == 200
    assert res.monte_carlo.stability_draws <= 50

