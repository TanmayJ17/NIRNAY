"""
NIRNAY Test Suite: Hydrology, Physics Engine & Copernicus DEM
Tests Euler water balance, Rational Method, and Copernicus DEM GLO-30 (AWS Open Data).
"""

import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../backend")))

from app.services.hydrology import simulate_all_hotspots, load_hotspots
from app.services.copernicus_dem import get_hotspot_elevation_profile
from app.services.weather_forecast import fetch_all_hotspots_weather_forecast

def main():
    print("=" * 65)
    print("🌊 NIRNAY: HYDROLOGY & GEODATA VERIFICATION SUITE")
    print("=" * 65)

    # 1. Hotspots
    hotspots = load_hotspots()
    print(f"✅ Loaded {len(hotspots)} Delhi Underpasses.")
    assert len(hotspots) == 15

    # 2. Physics Simulation
    print("\n🌧️ Running Hydrology Physics Test (90mm / 3h)...")
    res = simulate_all_hotspots(rainfall_mm=90.0, duration_hours=3.0)
    print(f"   • Total Hotspots: {res['total_hotspots']}")
    print(f"   • Closed Hotspots: {res['closed_hotspots_count']}")
    print(f"   • Total Impact Index: {res['total_impact_vehicle_hours']} vehicle-hours")
    assert res['closed_hotspots_count'] > 0

    # 3. AWS Open Data Copernicus DEM
    print("\n🛰️ Testing AWS Open Data Copernicus DEM GLO-30 Elevation...")
    dem = get_hotspot_elevation_profile("minto-bridge")
    print(f"   • Hotspot: Minto Bridge Underpass")
    print(f"   • Data Source: {dem['data_source']}")
    print(f"   • Depression Depth: {dem['elevation_profile']['depression_depth_m']}m")
    print(f"   • S3 URI: {dem['elevation_profile']['aws_s3_uri']}")
    assert dem['is_critical_depression'] is True

    print("\n🎉 HYDROLOGY & GEODATA TESTS PASSED PERFECTLY!")
    print("=" * 65)

if __name__ == "__main__":
    main()
