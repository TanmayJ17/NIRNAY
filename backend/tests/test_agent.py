"""
Unit tests for NIRNAY Strands Agent service (backend/app/services/agent.py).
Tests tools, trace recording, refusal of exact flood depth in cm,
site comparison, pump reduction scenarios, and deterministic fallback.
"""

import json
from pathlib import Path
import pytest

from backend.app.schemas import AgentRequest, RainScenario, Resources
from backend.app.services.agent import (
    simulate_scenario,
    recommend_allocation,
    compare_scenarios,
    ask_agent,
    tool_trace_var
)


def test_tool_simulate_scenario():
    """Verifies simulate_scenario tool returns valid compact JSON with exact figures."""
    t = []
    token = tool_trace_var.set(t)
    try:
        raw = simulate_scenario(volume_mm=85.0, duration_h=3.0)
        data = json.loads(raw)
        assert data["volume_mm"] == 85.0
        assert data["duration_h"] == 3.0
        assert "sites" in data
        assert len(data["sites"]) == 15
        assert "total_closure_hours" in data
        assert "total_vehicle_hours" in data
        # Trace should be recorded
        assert len(t) == 1
        assert t[0]["tool"] == "simulate_scenario"
    finally:
        tool_trace_var.reset(token)


def test_tool_recommend_allocation():
    """Verifies recommend_allocation tool returns exact figures and optimal allocations."""
    t = []
    token = tool_trace_var.set(t)
    try:
        raw = recommend_allocation(volume_mm=100.0, duration_h=4.0, pumps=6, crews=2)
        data = json.loads(raw)
        assert data["volume_mm"] == 100.0
        assert data["total_pumps_allocated"] <= 6
        assert data["total_crews_allocated"] <= 2
        assert "optimal_total_vehicle_hours" in data
        assert "savings_vs_equal_split" in data
        assert "allocations" in data
        assert len(t) == 1
        assert t[0]["tool"] == "recommend_allocation"
    finally:
        tool_trace_var.reset(token)


def test_tool_compare_scenarios():
    """Verifies compare_scenarios tool returns differential vehicle-hours analysis."""
    t = []
    token = tool_trace_var.set(t)
    try:
        raw = compare_scenarios(
            scenario_a='{"volume_mm": 85.0, "pumps": 0, "crews": 0}',
            scenario_b='{"volume_mm": 85.0, "pumps": 5, "crews": 2}'
        )
        data = json.loads(raw)
        assert "scenario_a" in data
        assert "scenario_b" in data
        assert "vehicle_hours_saved_b_vs_a" in data
        assert data["vehicle_hours_saved_b_vs_a"] >= 0.0
        assert len(t) == 1
        assert t[0]["tool"] == "compare_scenarios"
    finally:
        tool_trace_var.reset(token)


@pytest.mark.anyio
async def test_agent_why_site_a_over_site_b():
    """Verifies agent answers why site A over site B with engineering rationale and assumptions."""
    req = AgentRequest(
        prompt="Why allocate 2 pumps to Minto Bridge instead of Dhaula Kuan?",
        scenario=RainScenario(volume_mm=110.0, duration_h=4.0),
        resources=Resources(pumps=5, crews=2)
    )
    resp = await ask_agent(req)
    assert resp.fallback is True  # Offline environment activates deterministic fallback
    assert len(resp.tool_trace) >= 1
    # Check answer addresses both underpasses
    assert "Minto Bridge" in resp.answer
    assert "Dhaula Kuan" in resp.answer
    # Check key engineering assumptions mentioned
    assert "assumptions" in resp.answer.lower() or "rational method" in resp.answer.lower()


@pytest.mark.anyio
async def test_agent_what_if_pumps_drop():
    """Verifies agent computes net lost vehicle-hours when pumps drop to 5."""
    req = AgentRequest(
        prompt="What happens if total deployable mobile pumps drop to 5?",
        scenario=RainScenario(volume_mm=85.0, duration_h=3.0),
        resources=Resources(pumps=8, crews=2)
    )
    resp = await ask_agent(req)
    assert resp.fallback is True
    assert len(resp.tool_trace) >= 1
    # Should mention disruption increase or net loss
    assert "vehicle-hours" in resp.answer.lower()
    assert "5" in resp.answer


@pytest.mark.anyio
async def test_agent_refuses_exact_depth_in_centimetres():
    """Verifies agent refuses or qualifies exact flood depth in cm as model estimate only."""
    req = AgentRequest(
        prompt="What is the exact flood depth in centimetres at Minto Bridge right now?",
        scenario=RainScenario(volume_mm=85.0, duration_h=3.0),
        resources=Resources(pumps=5, crews=2)
    )
    resp = await ask_agent(req)
    assert resp.fallback is True
    # Must explicitly qualify that depth is a model estimate, NOT measured depth
    ans_lower = resp.answer.lower()
    assert "not measured" in ans_lower or "not field-measured" in ans_lower or "model estimate" in ans_lower
    assert "centimetre" in ans_lower or "cm" in ans_lower


@pytest.mark.anyio
async def test_agent_fixtures_questions_file_exists():
    """Verifies the 15 test questions fixture exists and contains all required categories."""
    fixture_path = Path(__file__).resolve().parent / "fixtures" / "agent_questions.json"
    assert fixture_path.exists()
    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    questions = data.get("questions", [])
    assert len(questions) == 15

    categories = {q.get("category") for q in questions}
    assert "site_comparison" in categories
    assert "resource_drop" in categories
    assert "exact_depth_refusal" in categories
