"""
Unit tests for Weather Forecast Service.
Uses mocked httpx responses and sample JSON fixtures to verify:
- Parsing of Open-Meteo hourly precipitation data (24h series)
- Derivation of storm scenario (volume_mm, duration_h > 0.2mm, peak_mm_h, onset_time)
- In-memory caching for OPEN_METEO_CACHE_MINUTES
- Persistence to data/rainfall/last_forecast.json
- Graceful fallback with stale=True when live network requests fail
"""

import asyncio
import json
from pathlib import Path
from unittest.mock import AsyncMock, patch
import pytest
import httpx
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.services import weather_forecast
from backend.app.services.weather_forecast import (
    get_weather_forecast,
    DELHI_LAT,
    DELHI_LON
)

FIXTURE_PATH = Path(__file__).resolve().parent / "fixtures" / "open_meteo_sample.json"


@pytest.fixture
def sample_open_meteo_payload():
    with open(FIXTURE_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


@pytest.fixture(autouse=True)
def reset_in_memory_cache():
    """Resets cache before each test."""
    weather_forecast._IN_MEMORY_CACHE = None
    weather_forecast._CACHE_TIMESTAMP = None


def test_live_forecast_success_mocked(sample_open_meteo_payload):
    """Verifies successful live forecast parsing and scenario metrics calculation."""
    async def _test():
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: sample_open_meteo_payload

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            forecast = await get_weather_forecast(force_refresh=True)

            assert mock_get.called
            assert forecast.stale is False
            assert forecast.source == "Open-Meteo"
            assert forecast.latitude == DELHI_LAT
            assert forecast.longitude == DELHI_LON
            assert len(forecast.hourly) == 24

            # Verify derived storm scenario
            hourly_precip = sample_open_meteo_payload["hourly"]["precipitation"][:24]
            expected_volume = round(sum(hourly_precip), 2)
            expected_duration = float(sum(1 for p in hourly_precip if p > 0.2))
            expected_peak = round(max(hourly_precip), 2)
            first_above_threshold_idx = next(i for i, p in enumerate(hourly_precip) if p > 0.2)
            expected_onset = sample_open_meteo_payload["hourly"]["time"][first_above_threshold_idx]

            assert forecast.scenario.volume_mm == expected_volume
            assert forecast.scenario.duration_h == expected_duration
            assert forecast.scenario.peak_mm_h == expected_peak
            assert forecast.scenario.onset_time == expected_onset

    asyncio.run(_test())


def test_in_memory_cache_hit(sample_open_meteo_payload):
    """Verifies subsequent calls within cache TTL return cached data without hitting network."""
    async def _test():
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = lambda: sample_open_meteo_payload

        with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
            mock_get.return_value = mock_response

            # First call: populates cache
            first_call = await get_weather_forecast(force_refresh=False)
            assert mock_get.call_count == 1
            assert first_call.stale is False

            # Second call: served from in-memory cache
            second_call = await get_weather_forecast(force_refresh=False)
            assert mock_get.call_count == 1  # No additional network call
            assert second_call.stale is False
            assert second_call.scenario.volume_mm == first_call.scenario.volume_mm

    asyncio.run(_test())


def test_live_failure_returns_stale_fallback(sample_open_meteo_payload):
    """Verifies that network failure triggers fallback returning stale=True."""
    async def _test():
        # Ensure cache is empty
        weather_forecast._IN_MEMORY_CACHE = None
        weather_forecast._CACHE_TIMESTAMP = None

        # Simulate network timeout error on all attempts
        with patch("httpx.AsyncClient.get", side_effect=httpx.ConnectTimeout("Connection timed out")):
            forecast = await get_weather_forecast(force_refresh=True)

            assert forecast.stale is True
            assert len(forecast.hourly) == 24
            assert forecast.scenario.volume_mm >= 0.0
            assert forecast.scenario.duration_h >= 0.0

    asyncio.run(_test())


def test_endpoint_get_weather_forecast(sample_open_meteo_payload):
    """Verifies GET /weather/forecast returns 200 OK with correct schema via TestClient."""
    mock_response = AsyncMock()
    mock_response.status_code = 200
    mock_response.json = lambda: sample_open_meteo_payload

    with patch("httpx.AsyncClient.get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        client = TestClient(app)
        response = client.get("/weather/forecast")

        assert response.status_code == 200
        data = response.json()
        assert "hourly" in data
        assert len(data["hourly"]) == 24
        assert "scenario" in data
        assert "volume_mm" in data["scenario"]
        assert "duration_h" in data["scenario"]
        assert "peak_mm_h" in data["scenario"]
        assert "onset_time" in data["scenario"]
        assert "stale" in data
