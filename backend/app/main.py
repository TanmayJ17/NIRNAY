"""
NIRNAY FastAPI Server Entrypoint
API endpoints for Hydrology Simulation, Resource Optimization, AWS Strands Agent Chat, and Historic Replays.
"""

import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from app.services.hydrology import load_hotspots, simulate_all_hotspots
from app.services.optimizer import optimize_allocations
from app.services.agent import agent_instance
from app.services.weather_forecast import fetch_all_hotspots_weather_forecast
from app.services.copernicus_dem import get_hotspot_elevation_profile
from app.services.dynamodb_service import dynamodb_service

app = FastAPI(
    title="NIRNAY — Urban Waterlogging Decision Engine",
    description="Pre-Storm What-If Decision & Resource Allocation API powered by AWS Strands Agents SDK.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request & Response Models ---
class SimulateRequest(BaseModel):
    rainfall_mm: float = Field(..., example=90.0, description="Total rainfall in mm")
    duration_hours: float = Field(..., example=3.0, description="Storm duration in hours")
    interventions: Optional[Dict[str, Dict[str, Any]]] = Field(default=None, description="Per-hotspot intervention overrides")


class OptimizeRequest(BaseModel):
    rainfall_mm: float = Field(..., example=90.0)
    duration_hours: float = Field(..., example=3.0)
    total_pumps: int = Field(default=10, example=10)
    total_crews: int = Field(default=5, example=5)


class AgentChatRequest(BaseModel):
    query: Optional[str] = Field(default=None, example="Why did you allocate 3 pumps to Zakhira instead of Minto Bridge?")
    message: Optional[str] = None
    session_id: Optional[str] = None
    scenario_context: Optional[Dict[str, Any]] = None
    current_scenario: Optional[Dict[str, Any]] = None


ChatRequest = AgentChatRequest


# --- API Routes ---

@app.get("/")
def read_root():
    return {
        "project": "NIRNAY",
        "description": "Pre-Storm What-If Decision & Resource Allocation Engine",
        "status": "ONLINE",
        "aws_strands_agent": "AWS Strands Agents SDK v0.1.0 Ready"
    }


@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "nirnay-backend"}


@app.get("/api/v1/hotspots")
def get_hotspots():
    """Returns list of 15 Delhi underpass hotspots with pre-calibrated hydrology parameters."""
    try:
        return load_hotspots()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/simulate")
def run_simulation(req: SimulateRequest):
    """Runs Rational Method & Water Balance Euler simulation across all 15 hotspots."""
    try:
        return simulate_all_hotspots(
            rainfall_mm=req.rainfall_mm,
            duration_hours=req.duration_hours,
            interventions_map=req.interventions
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/optimize")
def run_optimization(req: OptimizeRequest):
    """Solves optimal pump & crew allocation using Greedy/DP solver and 200-run Monte Carlo uncertainty."""
    try:
        return optimize_allocations(
            rainfall_mm=req.rainfall_mm,
            duration_hours=req.duration_hours,
            total_pumps=req.total_pumps,
            total_crews=req.total_crews
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/agent/chat")
def chat_with_agent(req: AgentChatRequest):
    """Interrogates the AWS Strands Agent for natural language decision explanations grounded in tool math."""
    try:
        return agent_instance.chat(query=req.query, scenario_context=req.scenario_context)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/replays")
def get_replays():
    """Returns list of historical Delhi monsoon rain event replays (July 2026 & May 2025)."""
    replay_file = os.path.join(os.path.dirname(__file__), "../../data/rainfall/replays.json")
    if os.path.exists(replay_file):
        with open(replay_file, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Replay dataset not found")


@app.get("/api/v1/replays/{replay_id}")
def run_replay_simulation(replay_id: str):
    """Runs simulation for a specific historical replay event."""
    replays = get_replays()
    target_replay = next((r for r in replays if r["id"] == replay_id), None)
    if not target_replay:
        raise HTTPException(status_code=404, detail=f"Replay ID '{replay_id}' not found")
        
    sim_result = simulate_all_hotspots(
        rainfall_mm=target_replay["rainfall_mm"],
        duration_hours=target_replay["duration_hours"]
    )
    
    return {
        "replay_metadata": target_replay,
        "simulation_result": sim_result
    }


@app.get("/api/v1/weather/forecast")
def get_weather_forecast():
    """Fetches individual micro-climate rainfall forecasts for ALL 15 Delhi hotspots using Open-Meteo API."""
    try:
        return fetch_all_hotspots_weather_forecast()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/hotspots")
def get_all_hotspots():
    """Lists all 15 pre-calibrated Delhi waterlogging hotspots."""
    return load_hotspots()


@app.post("/api/chat")
def chat_alias(req: ChatRequest):
    """Alias endpoint for frontend chat assistant."""
    query_text = req.message or req.query or "What is the recommended pump allocation?"
    ctx = req.current_scenario or req.scenario_context or {}
    res = agent_instance.chat(query=query_text, scenario_context=ctx)
    return {
        "session_id": req.session_id or "session-default",
        "reply": res["grounded_response"],
        "tools_invoked": [{"name": t, "rationale": "Physics-grounded simulation tool"} for t in res.get("tool_calls_executed", [])]
    }


@app.get("/api/v1/dem/{hotspot_id}")
def get_dem_elevation(hotspot_id: str):
    """Fetches terrain depression from AWS Open Data Copernicus DEM GLO-30."""
    return get_hotspot_elevation_profile(hotspot_id)


@app.get("/api/v1/scenarios/history")
def get_scenario_history():
    """Fetches scenario persistence history from Amazon DynamoDB."""
    return dynamodb_service.list_recent_scenarios()


@app.get("/api/v1/health")
def health_check():
    """Health check endpoint for AWS Lambda, App Runner, and Load Balancers."""
    return {
        "status": "healthy",
        "service": "NIRNAY Decision Engine API",
        "aws_integrations": ["Amazon Bedrock", "AWS Strands Agents SDK", "Amazon DynamoDB", "Amazon S3", "Copernicus DEM (AWS Open Data)"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

