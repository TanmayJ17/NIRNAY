"""
NIRNAY Backend Server
Pre-Storm Waterlogging Decision Engine for Delhi Underpasses
WeMakeDevs x AWS Environmental Hacks Hackathon (Oct 8-11, 2026)

FastAPI application providing:
- Geodata loading (hotspots.json and replays.json)
- Health check and historical storm replays
- Operator decision ledger (POST/GET /decisions)
- Stubs (501 Not Implemented) for downstream endpoints under construction
"""

from __future__ import annotations
import datetime
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional
import uuid

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

from backend.app.config import settings
from backend.app.schemas import (
    Hotspot,
    RainScenario,
    Resources,
    SimulateRequest,
    SimulateResponse,
    OptimizeRequest,
    OptimizeResponse,
    AgentRequest,
    AgentResponse,
    WeatherForecastResponse,
    DecisionAction,
    DecisionRecord,
    ReplaysResponse,
    ReplayItem,
    HealthResponse,
    SensitivityRequest,
    SensitivityResponse,
    MODEL_ASSUMPTIONS_DISCLAIMER
)

# Logger setup
logging.basicConfig(level=logging.INFO if not settings.DEBUG else logging.DEBUG)
logger = logging.getLogger("nirnay.main")

from contextlib import asynccontextmanager

# In-memory storage for loaded geodata & operator decisions
HOTSPOTS_CACHE: List[Hotspot] = []
REPLAYS_CACHE: List[ReplayItem] = []
DECISIONS_STORE: List[DecisionRecord] = []


def _find_file(rel_path: str) -> Optional[Path]:
    """Finds a file path relative to cwd or repository root."""
    candidates = [
        Path(rel_path),
        Path.cwd() / rel_path,
        Path(__file__).resolve().parent.parent.parent / rel_path,
    ]
    for p in candidates:
        if p.exists() and p.is_file():
            return p
    return None


def load_startup_data():
    """Loads hotspots from data/hotspots/hotspots.json and replays from data/rainfall/replays.json at startup."""
    global HOTSPOTS_CACHE, REPLAYS_CACHE

    # Load hotspots
    hotspot_path = _find_file(settings.HOTSPOTS_FILE)
    if hotspot_path:
        try:
            with open(hotspot_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            raw_hotspots = data.get("hotspots", [])
            HOTSPOTS_CACHE = [Hotspot.model_validate(h) for h in raw_hotspots]
            logger.info(f"Successfully loaded {len(HOTSPOTS_CACHE)} hotspots from {hotspot_path}")
        except Exception as exc:
            logger.error(f"Error parsing hotspots from {hotspot_path}: {exc}")
    else:
        logger.warning(f"Hotspots file not found at {settings.HOTSPOTS_FILE}")

    # Load replays
    replays_path = _find_file(settings.REPLAYS_FILE)
    if replays_path:
        try:
            with open(replays_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            raw_replays = data.get("replays", [])
            REPLAYS_CACHE = [ReplayItem.model_validate(r) for r in raw_replays]
            logger.info(f"Successfully loaded {len(REPLAYS_CACHE)} replays from {replays_path}")
        except Exception as exc:
            logger.error(f"Error parsing replays from {replays_path}: {exc}")
    else:
        logger.warning(f"Replays file not found at {settings.REPLAYS_FILE}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager that loads geodata at application startup."""
    load_startup_data()
    yield


# Instantiate FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Pre-storm what-if waterlogging decision engine for Delhi underpasses. "
        "Provides scenario simulation, dynamic resource optimization, and tool-grounded AI explainability. "
        "All flood depth values are model estimates under stated engineering assumptions."
    ),
    lifespan=lifespan
)

# Add CORS Middleware using ALLOWED_ORIGINS from config
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else [settings.ALLOWED_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# 1. Health Endpoint
# ==========================================

@app.get("/health", response_model=HealthResponse, tags=["Health"])
def get_health() -> HealthResponse:
    """Returns application health, loaded hotspots count, replays count, and model assumptions disclaimer."""
    return HealthResponse(
        status="healthy",
        hotspots_count=len(HOTSPOTS_CACHE),
        replays_count=len(REPLAYS_CACHE),
        version=settings.APP_VERSION,
        model_assumptions=MODEL_ASSUMPTIONS_DISCLAIMER
    )


# ==========================================
# 2. Historical Replays Endpoint
# ==========================================

@app.get("/replays", response_model=ReplaysResponse, tags=["Replays"])
def get_replays() -> ReplaysResponse:
    """Returns pre-calibrated historical Delhi storm event replay presets."""
    return ReplaysResponse(replays=REPLAYS_CACHE)


# ==========================================
# 3. Decision Ledger Endpoints (Approve / Reject)
# ==========================================

@app.post("/decisions", response_model=DecisionRecord, status_code=status.HTTP_201_CREATED, tags=["Decisions"])
def record_decision(payload: DecisionAction) -> DecisionRecord:
    """Records an operator action (approve or reject) for an allocation package."""
    record = DecisionRecord(
        id=f"dec-{uuid.uuid4().hex[:8]}",
        action=payload.action,
        operator_id=payload.operator_id,
        timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
        notes=payload.notes,
        allocation=payload.allocation,
        scenario=payload.scenario
    )
    DECISIONS_STORE.append(record)
    logger.info(f"Recorded decision {record.id}: {record.action} by operator {record.operator_id}")
    return record


@app.get("/decisions", response_model=List[DecisionRecord], tags=["Decisions"])
def list_decisions() -> List[DecisionRecord]:
    """Retrieves all logged operator decisions."""
    return DECISIONS_STORE


# ==========================================
# 4. Downstream Endpoints (Stubbed with 501)
# ==========================================

@app.post("/simulate", response_model=SimulateResponse, tags=["Simulation"])
def simulate_corridor(payload: SimulateRequest) -> SimulateResponse:
    """
    Simulates water accumulation and closure metrics across corridor underpasses.
    (Stubbed: to be integrated with teammate's canonical hydrology engine).
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="POST /simulate is under construction (hydrology physics engine owned by teammate)."
    )


from backend.app.services.optimizer import (
    optimize_resources as run_optimizer,
    sensitivity as run_sensitivity
)


@app.post("/optimize", response_model=OptimizeResponse, tags=["Optimization"])
def optimize_resources(payload: OptimizeRequest) -> OptimizeResponse:
    """
    Solves 2D Knapsack DP for optimal pump and desilting crew allocation with Monte Carlo uncertainty.
    Evaluates equal_split and traffic_proportional baselines and ranks sites by marginal benefit per pump.
    """
    return run_optimizer(
        sites=HOTSPOTS_CACHE,
        scenario=payload.scenario,
        resources=payload.resources,
        monte_carlo_draws=payload.monte_carlo_draws or 200
    )


@app.post("/sensitivity", response_model=SensitivityResponse, tags=["Optimization"])
def get_sensitivity(payload: SensitivityRequest) -> SensitivityResponse:
    """
    Varies each parameter +/- 20% one at a time and returns the change in total vehicle_hours
    and whether the top-5 priority sites change (for a tornado chart).
    """
    rain = payload.rain_mm if payload.rain_mm is not None else (payload.scenario.volume_mm if payload.scenario else 85.0)
    pumps = payload.pumps if payload.pumps is not None else (payload.resources.pumps if payload.resources else 5)
    crews = payload.crews if payload.crews is not None else (payload.resources.crews if payload.resources else 2)
    return run_sensitivity(
        rain=rain,
        resources=Resources(pumps=pumps, crews=crews),
        sites=HOTSPOTS_CACHE
    )



from backend.app.services.agent import ask_agent


@app.post("/agent/chat", response_model=AgentResponse, tags=["Agent"])
async def chat_with_agent(payload: AgentRequest) -> AgentResponse:
    """
    Strands AI Agent operational assistant powered by Amazon Bedrock with strict tool grounding.
    Uses BedrockModel with tools, falling back to deterministic template engine on timeout/error.
    """
    return await ask_agent(payload)


@app.post("/api/chat", response_model=AgentResponse, tags=["Agent"])
async def api_chat_alias(payload: AgentRequest) -> AgentResponse:
    """Alias for /agent/chat matching frontend contract."""
    return await ask_agent(payload)



from backend.app.services.weather_forecast import get_weather_forecast as fetch_forecast


@app.get("/weather/forecast", response_model=WeatherForecastResponse, tags=["Weather"])
async def get_weather_forecast() -> WeatherForecastResponse:
    """
    Fetches 24-hour weather forecast for Delhi coordinates from Open-Meteo.
    Returns 24h hourly series and derived scenario (volume_mm, duration_h, peak_mm_h, onset_time).
    Falls back to cached copy with stale=true on network failure.
    """
    return await fetch_forecast()
