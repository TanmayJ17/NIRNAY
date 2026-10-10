"""
Scenario Persistence Service for NIRNAY Backend.
Stores and retrieves what-if decision scenarios using Amazon DynamoDB.
Features automatic fallback to local memory cache when DynamoDB is unreachable
or AWS credentials are not configured, ensuring zero request failures.
"""

from __future__ import annotations
import datetime
import json
import logging
import uuid
from typing import Dict, Any, Optional
from decimal import Decimal

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError, BotoCoreError

from backend.app.config import settings
from backend.app.schemas import (
    ScenarioCreateResponse,
    ScenarioRecordResponse,
    InterventionSchema
)

logger = logging.getLogger("nirnay.store")

# In-memory fallback dictionary for offline/local development
_LOCAL_SCENARIOS_CACHE: Dict[str, Dict[str, Any]] = {}


def _get_dynamodb_resource():
    """Initializes boto3 DynamoDB resource using configured region and timeouts."""
    boto_config = Config(
        region_name=settings.AWS_REGION,
        connect_timeout=settings.DYNAMODB_TIMEOUT_SECONDS,
        read_timeout=settings.DYNAMODB_TIMEOUT_SECONDS,
        retries={"max_attempts": 2}
    )

    kwargs: Dict[str, Any] = {"config": boto_config}
    if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
        kwargs["aws_access_key_id"] = settings.AWS_ACCESS_KEY_ID
        kwargs["aws_secret_access_key"] = settings.AWS_SECRET_ACCESS_KEY
        if settings.AWS_SESSION_TOKEN:
            kwargs["aws_session_token"] = settings.AWS_SESSION_TOKEN

    return boto3.resource("dynamodb", **kwargs)


def _float_to_decimal(obj: Any) -> Any:
    """Helper to convert float values to Decimal for DynamoDB storage."""
    if isinstance(obj, float):
        return Decimal(str(obj))
    elif isinstance(obj, dict):
        return {k: _float_to_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_float_to_decimal(v) for v in obj]
    return obj


def _decimal_to_float(obj: Any) -> Any:
    """Helper to convert DynamoDB Decimal values back to float/int."""
    if isinstance(obj, Decimal):
        return float(obj) if obj % 1 else int(obj)
    elif isinstance(obj, dict):
        return {k: _decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [_decimal_to_float(v) for v in obj]
    return obj


def save_scenario(
    rain_mm: float,
    duration_h: float,
    interventions: Dict[str, Any],
    results_summary: Dict[str, Any]
) -> ScenarioCreateResponse:
    """
    Saves a what-if scenario record to DynamoDB with in-memory fallback.
    Returns typed ScenarioCreateResponse.
    """
    scenario_id = f"scen-{uuid.uuid4().hex[:8]}"
    created_at = datetime.datetime.now(datetime.timezone.utc).isoformat()
    ttl_epoch = int((datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=30)).timestamp())

    # Format interventions dictionary
    clean_interventions = {}
    for k, v in interventions.items():
        if isinstance(v, InterventionSchema):
            clean_interventions[k] = v.model_dump()
        elif isinstance(v, dict):
            clean_interventions[k] = v
        else:
            clean_interventions[k] = getattr(v, "__dict__", str(v))

    record = {
        "scenarioId": scenario_id,
        "rain_mm": rain_mm,
        "duration_h": duration_h,
        "interventions": clean_interventions,
        "results_summary": results_summary,
        "createdAt": created_at,
        "ttl": ttl_epoch
    }

    # Cache locally first
    _LOCAL_SCENARIOS_CACHE[scenario_id] = record

    persisted_to_dynamo = False
    try:
        dynamo = _get_dynamodb_resource()
        table = dynamo.Table(settings.DYNAMODB_TABLE_NAME)
        dynamo_item = _float_to_decimal(record)
        table.put_item(Item=dynamo_item)
        persisted_to_dynamo = True
        logger.info(f"Successfully persisted scenario {scenario_id} to DynamoDB table {settings.DYNAMODB_TABLE_NAME}")
    except (ClientError, BotoCoreError, Exception) as exc:
        logger.warning(
            f"DynamoDB put_item failed ({type(exc).__name__}: {exc}). "
            f"Saved scenario {scenario_id} to local in-memory fallback cache."
        )

    shareable_url = f"https://nirnay.delhi.gov.in/?scenario={scenario_id}"

    return ScenarioCreateResponse(
        scenario_id=scenario_id,
        created_at=created_at,
        shareable_url=shareable_url,
        persisted_to_dynamodb=persisted_to_dynamo
    )


def get_scenario(scenario_id: str) -> Optional[ScenarioRecordResponse]:
    """
    Retrieves a scenario record by ID from DynamoDB or local fallback cache.
    """
    # Check live DynamoDB
    try:
        dynamo = _get_dynamodb_resource()
        table = dynamo.Table(settings.DYNAMODB_TABLE_NAME)
        resp = table.get_item(Key={"scenarioId": scenario_id})
        item = resp.get("Item")
        if item:
            item_clean = _decimal_to_float(item)
            return ScenarioRecordResponse(
                scenario_id=item_clean.get("scenarioId", scenario_id),
                rain_mm=float(item_clean.get("rain_mm", 0.0)),
                duration_h=float(item_clean.get("duration_h", 0.0)),
                interventions=item_clean.get("interventions", {}),
                results_summary=item_clean.get("results_summary", {}),
                created_at=str(item_clean.get("createdAt", ""))
            )
    except (ClientError, BotoCoreError, Exception) as exc:
        logger.warning(f"DynamoDB get_item error for {scenario_id}: {exc}")

    # Check local in-memory fallback
    cached = _LOCAL_SCENARIOS_CACHE.get(scenario_id)
    if cached:
        return ScenarioRecordResponse(
            scenario_id=cached["scenarioId"],
            rain_mm=float(cached["rain_mm"]),
            duration_h=float(cached["duration_h"]),
            interventions=cached["interventions"],
            results_summary=cached["results_summary"],
            created_at=str(cached["createdAt"])
        )

    return None
