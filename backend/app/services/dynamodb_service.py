"""
NIRNAY Amazon DynamoDB Scenario & Audit Store
Manages persistent scenario simulation archives, intervention history, and decision audit logs.
Table Name: NIRNAY-Scenarios
"""

import os
import time
import uuid
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

try:
    import boto3
except ImportError:
    boto3 = None

DYNAMODB_TABLE = os.getenv("DYNAMODB_TABLE_NAME", "NIRNAY-Scenarios")
AWS_REGION = os.getenv("AWS_DEFAULT_REGION", os.getenv("AWS_REGION", "us-east-1"))

# In-memory local replica for offline hackathon testing
_LOCAL_DYNAMODB_STORE: List[Dict[str, Any]] = []

class DynamoDBService:
    """Amazon DynamoDB Service with automatic local fallback."""

    def __init__(self):
        self.table_name = DYNAMODB_TABLE
        self.region = AWS_REGION
        self.table = None

        if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
            try:
                dynamodb = boto3.resource("dynamodb", region_name=self.region)
                self.table = dynamodb.Table(self.table_name)
            except Exception:
                self.table = None

    def save_scenario(
        self,
        rainfall_mm: float,
        duration_hours: float,
        total_pumps: int,
        hours_saved: float,
        allocation_map: Dict[str, int]
    ) -> Dict[str, Any]:
        """Saves scenario optimization run to Amazon DynamoDB."""
        scenario_id = f"SCENARIO-{int(time.time())}-{str(uuid.uuid4())[:8]}"
        record = {
            "scenario_id": scenario_id,
            "timestamp": int(time.time()),
            "rainfall_mm": str(rainfall_mm),
            "duration_hours": str(duration_hours),
            "total_pumps_allocated": total_pumps,
            "vehicle_hours_saved": str(hours_saved),
            "allocation_map": allocation_map,
            "aws_service": "Amazon DynamoDB"
        }

        if self.table:
            try:
                self.table.put_item(Item=record)
                return {"status": "persisted", "scenario_id": scenario_id, "storage": "Amazon DynamoDB (AWS Cloud)"}
            except Exception:
                pass

        _LOCAL_DYNAMODB_STORE.append(record)
        return {"status": "persisted", "scenario_id": scenario_id, "storage": "Amazon DynamoDB Local Mock"}

    def list_recent_scenarios(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Lists recent scenarios from Amazon DynamoDB."""
        if self.table:
            try:
                response = self.table.scan(Limit=limit)
                return response.get("Items", [])
            except Exception:
                pass

        return list(reversed(_LOCAL_DYNAMODB_STORE[-limit:]))

dynamodb_service = DynamoDBService()
