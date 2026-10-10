#!/usr/bin/env python3
"""
NIRNAY Strands Agent Question Runner Script.
Runs the 15 test questions from backend/tests/fixtures/agent_questions.json,
executing each through the Strands Agent / fallback engine, and prints
the answers alongside the recorded tool execution traces.
"""

import asyncio
import json
from pathlib import Path
import sys

# Ensure repository root is on sys.path
repo_root = Path(__file__).resolve().parent.parent.parent
if str(repo_root) not in sys.path:
    sys.path.insert(0, str(repo_root))

from backend.app.main import load_startup_data
from backend.app.schemas import AgentRequest, RainScenario, Resources
from backend.app.services.agent import ask_agent


async def run_all_questions():
    # Load hotspots and replays
    load_startup_data()

    fixture_path = repo_root / "backend" / "tests" / "fixtures" / "agent_questions.json"
    if not fixture_path.exists():
        print(f"Error: Fixture file not found at {fixture_path}")
        sys.exit(1)

    with open(fixture_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    questions = data.get("questions", [])
    print(f"\n{'='*80}")
    print(f"  NIRNAY STRANDS AGENT — 15 BENCHMARK QUESTIONS EVALUATION")
    print(f"{'='*80}\n")

    for idx, item in enumerate(questions, start=1):
        q_id = item.get("id", f"q{idx}")
        cat = item.get("category", "general")
        q_text = item["question"]

        scen_raw = item.get("scenario")
        scenario = RainScenario(**scen_raw) if scen_raw else None

        res_raw = item.get("resources")
        resources = Resources(**res_raw) if res_raw else None

        req = AgentRequest(
            prompt=q_text,
            session_id=f"session-{q_id}",
            scenario=scenario,
            resources=resources
        )

        resp = await ask_agent(req)

        print(f"--------------------------------------------------------------------------------")
        print(f"[{idx}/15] [{cat.upper()}] ID: {q_id}")
        print(f"QUESTION: {q_text}")
        if scenario:
            print(f"SCENARIO: {scenario.volume_mm}mm, {scenario.duration_h}h")
        if resources:
            print(f"RESOURCES: {resources.pumps} mobile pumps, {resources.crews} desilting crews")
        print(f"FALLBACK ENGINE: {resp.fallback}")
        print(f"\nTOOL TRACE ({len(resp.tool_trace)} calls):")
        if resp.tool_trace:
            for t_idx, trace in enumerate(resp.tool_trace, start=1):
                print(f"  {t_idx}. Tool: '{trace.get('tool')}' | Args: {trace.get('args')}")
                print(f"     Result Summary: {trace.get('result')}")
        else:
            print("  (No external tools called)")

        print(f"\nANSWER:\n{resp.answer}")
        print(f"--------------------------------------------------------------------------------\n")


if __name__ == "__main__":
    asyncio.run(run_all_questions())
