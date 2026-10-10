"""
Integration Tests for NIRNAY Backend Server.
Verifies all FastAPI REST endpoints, status codes, Pydantic response contracts,
startup geodata loading, 501 stubs, and operator decision flow.
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app, load_startup_data

client = TestClient(app)


@pytest.fixture(autouse=True)
def init_app():
    load_startup_data()


def test_health_endpoint():
    """Verifies /health endpoint returns healthy status and active hotspots & replays."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["hotspots_count"] >= 15
    assert data["replays_count"] >= 3
    assert "model_assumptions" in data


def test_replays_endpoint():
    """Verifies GET /replays returns historical storm events from replays.json."""
    response = client.get("/replays")
    assert response.status_code == 200
    data = response.json()
    assert "replays" in data
    assert len(data["replays"]) >= 3
    ids = [r["id"] for r in data["replays"]]
    assert "replay-july-2026" in ids


def test_simulate_stubbed_501():
    """Verifies POST /simulate returns 501 Not Implemented (pending Member 1)."""
    payload = {
        "scenario": {
            "volume_mm": 85.0,
            "duration_h": 3.0,
            "peak_mm_h": 40.0
        }
    }
    response = client.post("/simulate", json=payload)
    assert response.status_code == 501


def test_optimize_endpoint():
    """Verifies POST /optimize returns 200 OK with allocation and baselines."""
    payload = {
        "scenario": {
            "volume_mm": 110.0,
            "duration_h": 4.0,
            "peak_mm_h": 50.0
        },
        "resources": {
            "pumps": 5,
            "crews": 2
        },
        "monte_carlo_draws": 15
    }
    response = client.post("/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "allocation" in data
    assert len(data["allocation"]) >= 15
    assert "total_vehicle_hours" in data
    assert "baselines" in data
    assert "savings_vs_equal_split" in data
    assert "savings_vs_traffic_proportional" in data
    assert "monte_carlo" in data
    assert data["monte_carlo"]["stability_pct"] >= 0.0


def test_agent_chat_endpoint():
    """Verifies POST /agent/chat and /api/chat return 200 OK with grounded explanation and trace."""
    payload = {
        "prompt": "Why allocate 2 pumps to Minto Bridge instead of Dhaula Kuan?",
        "scenario": {
            "volume_mm": 110.0,
            "duration_h": 4.0,
            "peak_mm_h": 40.0
        },
        "resources": {
            "pumps": 5,
            "crews": 2
        }
    }
    response = client.post("/agent/chat", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "answer" in data
    assert len(data["answer"]) > 20
    assert "tool_trace" in data
    assert "fallback" in data
    assert "assumptions_disclaimer" in data

    # Verify alias /api/chat
    alias_res = client.post("/api/chat", json=payload)
    assert alias_res.status_code == 200



def test_weather_forecast_endpoint():
    """Verifies GET /weather/forecast returns 200 OK with 24h series and scenario."""
    response = client.get("/weather/forecast")
    assert response.status_code == 200
    data = response.json()
    assert "hourly" in data
    assert len(data["hourly"]) == 24
    assert "scenario" in data
    assert "volume_mm" in data["scenario"]
    assert "duration_h" in data["scenario"]


def test_operator_decisions_flow():
    """Verifies operator decision recording and retrieval."""
    action_payload = {
        "action": "approve",
        "operator_id": "PWD-OPERATOR-DELHI-01",
        "notes": "Approved 5 mobile pumps and 2 desilting crews for Central Delhi corridor."
    }
    create_res = client.post("/decisions", json=action_payload)
    assert create_res.status_code == 201
    created = create_res.json()
    assert created["id"].startswith("dec-")
    assert created["action"] == "approve"
    assert created["operator_id"] == "PWD-OPERATOR-DELHI-01"

    list_res = client.get("/decisions")
    assert list_res.status_code == 200
    decisions = list_res.json()
    assert len(decisions) >= 1
    assert any(d["id"] == created["id"] for d in decisions)


def test_sensitivity_endpoint():
    """Verifies POST /sensitivity returns 200 OK with tornado chart parameter deltas."""
    payload = {
        "rain_mm": 85.0,
        "pumps": 5,
        "crews": 2
    }
    response = client.post("/sensitivity", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "baseline_vehicle_hours" in data
    assert "nominal_top_5_sites" in data
    assert "parameters" in data
    assert len(data["parameters"]) == 5
    for p in data["parameters"]:
        assert "parameter" in p
        assert "delta_minus_20" in p
        assert "delta_plus_20" in p
        assert "top_5_changed_minus_20" in p
        assert "top_5_changed_plus_20" in p

