"""
NIRNAY End-to-End System Verification Script
Executes Python Hydrology Engine, Optimizer, and Agent tool integration to verify sanity.
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../backend"))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "../backend/.env"))

from app.services.hydrology import load_hotspots, simulate_all_hotspots
from app.services.optimizer import optimize_allocations
from app.services.agent import agent_instance

def main():
    print("=" * 60)
    print("🌊 NIRNAY END-TO-END SYSTEM VERIFICATION")
    print("=" * 60)

    # 1. Load Hotspots
    hotspots = load_hotspots()
    print(f"✅ Hotspots Loaded: {len(hotspots)} Delhi underpasses pre-calibrated.")
    assert len(hotspots) == 15, "Expected 15 hotspots!"

    # 2. Run Hydrology Simulation (90mm in 3h)
    print("\n🌧️ Running Hydrology Physics Simulation (90mm / 3h)...")
    sim_res = simulate_all_hotspots(rainfall_mm=90.0, duration_hours=3.0)
    print(f"   • Total Hotspots: {sim_res['total_hotspots']}")
    print(f"   • Closed Hotspots: {sim_res['closed_hotspots_count']}")
    print(f"   • Total Impact Index: {sim_res['total_impact_vehicle_hours']} vehicle-hours")
    assert sim_res['total_hotspots'] == 15

    # 3. Run Optimization Engine (10 Pumps, 5 Crews)
    print("\n⚡ Running Optimization & 200 Monte Carlo Iterations...")
    opt_res = optimize_allocations(rainfall_mm=90.0, duration_hours=3.0, total_pumps=10, total_crews=5)
    print(f"   • Hours Saved vs Equal Split: +{opt_res['baselines']['hours_saved_vs_equal']} vh")
    print(f"   • Monte Carlo P50 Median Impact: {opt_res['monte_carlo_uncertainty']['p50_median_impact']} vh")
    print(f"   • Recommendation Stability: {opt_res['monte_carlo_uncertainty']['recommendation_stability_percent']}%")
    assert opt_res['monte_carlo_uncertainty']['iterations'] == 200

    # 4. Test AWS Strands Agent SDK
    print("\n🤖 Testing AWS Strands Agent SDK Grounded Chat...")
    agent_res = agent_instance.chat("Why did NIRNAY allocate pumps to Zakhira instead of Minto?")
    print("   • Agent Grounded Response:")
    print("   --------------------------------------------------------")
    print("   " + agent_res['grounded_response'].replace("\n", "\n   "))
    print("   --------------------------------------------------------")

    print("\n✨ SYSTEM SANITY VERIFICATION PASSED PERFECTLY!")
    print("=" * 60)

if __name__ == "__main__":
    main()
