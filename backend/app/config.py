"""
NIRNAY Backend Configuration.
Loads application settings from environment variables and .env file using pydantic-settings.
Secrets and account IDs are never hardcoded.
"""

from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime application settings for NIRNAY backend."""

    APP_NAME: str = "NIRNAY Pre-Storm Decision Engine"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS Configuration
    ALLOWED_ORIGINS: Union[List[str], str] = ["*"]

    # File Paths (relative to repository root or configurable via environment)
    HOTSPOTS_FILE: str = "data/hotspots/hotspots.json"
    REPLAYS_FILE: str = "data/rainfall/replays.json"

    # Cloud & External Service Configuration (placeholders; loaded from environment)
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"
    BEDROCK_REGION: str = "us-east-1"
    BEDROCK_MAX_TOKENS: int = 1024
    BEDROCK_TIMEOUT_SECONDS: float = 15.0
    DYNAMODB_TABLE_NAME: str = "nirnay-scenarios"
    # Open-Meteo Configuration
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"
    OPEN_METEO_CACHE_MINUTES: int = 30
    LAST_FORECAST_FILE: str = "data/rainfall/last_forecast.json"

    # Monte Carlo Engine Configuration
    MC_DRAWS: int = 200
    MC_SEED: int = 42
    MC_STABILITY_SUBSET_DRAWS: int = 50

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: Union[List[str], str]) -> List[str]:
        if isinstance(value, str):
            if value.startswith("[") and value.endswith("]"):
                import json
                try:
                    return json.loads(value)
                except Exception:
                    pass
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
