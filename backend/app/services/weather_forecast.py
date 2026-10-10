"""
Weather Forecast Service for NIRNAY Backend.
Queries Open-Meteo Forecast API for Delhi coordinates (lat: 28.6139, lon: 77.2090).
Implements in-memory TTL caching, disk persistence (last_forecast.json),
and automatic fallback with stale=True when live network calls fail.
"""

from __future__ import annotations
import asyncio
import datetime
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
import httpx

from backend.app.config import settings
from backend.app.schemas import (
    WeatherForecastResponse,
    WeatherHourlyItem,
    DerivedScenario
)

logger = logging.getLogger("nirnay.weather")

# Coordinates & Query Constants
DELHI_LAT: float = 28.6139
DELHI_LON: float = 77.2090
TIMEZONE: str = "Asia/Kolkata"
HTTP_TIMEOUT_SECONDS: float = 5.0
MAX_RETRIES: int = 2

# In-memory Cache State
_IN_MEMORY_CACHE: Optional[Dict[str, Any]] = None
_CACHE_TIMESTAMP: Optional[datetime.datetime] = None


def _resolve_file_path(path_str: str) -> Path:
    """Resolves file path relative to repo or current working directory."""
    p = Path(path_str)
    if p.is_absolute():
        return p
    candidates = [
        Path.cwd() / path_str,
        Path(__file__).resolve().parent.parent.parent.parent / path_str
    ]
    for c in candidates:
        if c.exists():
            return c
    return Path.cwd() / path_str


def _parse_forecast_data(data: Dict[str, Any], stale: bool) -> WeatherForecastResponse:
    """
    Parses Open-Meteo raw payload into WeatherForecastResponse with 24h series
    and derived storm scenario metrics.
    """
    hourly_raw = data.get("hourly", {})
    times = hourly_raw.get("time", [])
    precipitations = hourly_raw.get("precipitation", [])
    probabilities = hourly_raw.get("precipitation_probability", [])

    hourly_items: List[WeatherHourlyItem] = []
    count = min(24, len(times))

    onset_time: Optional[str] = None
    volume_mm: float = 0.0
    peak_mm_h: float = 0.0
    duration_hours_count: int = 0

    for i in range(count):
        t_str = str(times[i])
        p_val = float(precipitations[i]) if i < len(precipitations) and precipitations[i] is not None else 0.0
        prob_val = float(probabilities[i]) if i < len(probabilities) and probabilities[i] is not None else None

        hourly_items.append(
            WeatherHourlyItem(
                time=t_str,
                precipitation_mm=round(p_val, 2),
                precipitation_probability=round(prob_val, 1) if prob_val is not None else None
            )
        )

        volume_mm += p_val
        if p_val > peak_mm_h:
            peak_mm_h = p_val
        if p_val > 0.2:
            duration_hours_count += 1
            if onset_time is None:
                onset_time = t_str

    scenario = DerivedScenario(
        volume_mm=round(volume_mm, 2),
        duration_h=float(duration_hours_count),
        peak_mm_h=round(peak_mm_h, 2),
        onset_time=onset_time
    )

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    recorded_time = data.get("saved_at", now_iso)

    return WeatherForecastResponse(
        source="Open-Meteo",
        latitude=float(data.get("latitude", DELHI_LAT)),
        longitude=float(data.get("longitude", DELHI_LON)),
        timezone=str(data.get("timezone", TIMEZONE)),
        timestamp=recorded_time if stale else now_iso,
        stale=stale,
        hourly=hourly_items,
        scenario=scenario
    )


def _load_persisted_file() -> Optional[Dict[str, Any]]:
    """Loads backup forecast JSON from disk if present."""
    path = _resolve_file_path(settings.LAST_FORECAST_FILE)
    if path.exists() and path.is_file():
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as exc:
            logger.warning(f"Failed to read persisted forecast file {path}: {exc}")
    return None


def _write_persisted_file(data: Dict[str, Any]):
    """Writes successful forecast JSON to disk."""
    path = _resolve_file_path(settings.LAST_FORECAST_FILE)
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        data_to_write = dict(data)
        data_to_write["saved_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data_to_write, f, indent=2)
        logger.info(f"Persisted latest weather forecast to {path}")
    except Exception as exc:
        logger.warning(f"Failed to write persisted forecast file {path}: {exc}")


async def get_weather_forecast(force_refresh: bool = False) -> WeatherForecastResponse:
    """
    Fetches 24-hour weather forecast for Delhi coordinates from Open-Meteo.
    - Returns in-memory cache if younger than OPEN_METEO_CACHE_MINUTES.
    - Uses httpx with 5s timeout and 2 retries.
    - Updates in-memory cache and writes to data/rainfall/last_forecast.json on success.
    - If live call fails, returns cached in-memory or file copy with stale=True.
    """
    global _IN_MEMORY_CACHE, _CACHE_TIMESTAMP

    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. Check in-memory cache
    if not force_refresh and _IN_MEMORY_CACHE is not None and _CACHE_TIMESTAMP is not None:
        elapsed_seconds = (now - _CACHE_TIMESTAMP).total_seconds()
        cache_limit_seconds = settings.OPEN_METEO_CACHE_MINUTES * 60
        if elapsed_seconds < cache_limit_seconds:
            logger.debug(f"Serving weather forecast from in-memory cache ({int(elapsed_seconds)}s old)")
            return _parse_forecast_data(_IN_MEMORY_CACHE, stale=False)

    # 2. Live Open-Meteo API Call with 5s timeout and 2 retries
    params = {
        "latitude": DELHI_LAT,
        "longitude": DELHI_LON,
        "hourly": "precipitation,precipitation_probability",
        "forecast_days": 2,
        "timezone": TIMEZONE
    }

    live_success = False
    raw_data: Optional[Dict[str, Any]] = None

    for attempt in range(1 + MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT_SECONDS) as client:
                response = await client.get(settings.OPEN_METEO_API_URL, params=params)
                if response.status_code == 200:
                    raw_data = response.json()
                    live_success = True
                    break
                else:
                    logger.warning(f"Open-Meteo call attempt {attempt + 1} returned status {response.status_code}")
        except (httpx.RequestError, httpx.TimeoutException, Exception) as exc:
            logger.warning(f"Open-Meteo call attempt {attempt + 1} failed: {type(exc).__name__} - {exc}")

        if attempt < MAX_RETRIES:
            await asyncio.sleep(0.3 * (attempt + 1))

    # 3. Handle live success
    if live_success and raw_data is not None:
        _IN_MEMORY_CACHE = raw_data
        _CACHE_TIMESTAMP = now
        _write_persisted_file(raw_data)
        return _parse_forecast_data(raw_data, stale=False)

    # 4. Handle live failure: fallback to in-memory cache or persisted file with stale=True
    logger.warning("Live Open-Meteo call failed after retries. Falling back to cached copy with stale=True.")

    if _IN_MEMORY_CACHE is not None:
        return _parse_forecast_data(_IN_MEMORY_CACHE, stale=True)

    file_data = _load_persisted_file()
    if file_data is not None:
        return _parse_forecast_data(file_data, stale=True)

    # Extreme fallback: create a zero/minimal profile if neither cache nor file is available
    logger.error("No cached or persisted weather data available. Generating fallback zero-precipitation record.")
    fallback_raw = {
        "latitude": DELHI_LAT,
        "longitude": DELHI_LON,
        "timezone": TIMEZONE,
        "saved_at": now.isoformat(),
        "hourly": {
            "time": [(now + datetime.timedelta(hours=i)).strftime("%Y-%m-%dT%H:00") for i in range(24)],
            "precipitation": [0.0] * 24,
            "precipitation_probability": [0.0] * 24
        }
    }
    return _parse_forecast_data(fallback_raw, stale=True)
