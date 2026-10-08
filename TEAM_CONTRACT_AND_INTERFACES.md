# NIRNAY — Team Contract, Data Schemas & Interface Specifications

**Project:** NIRNAY (What-If Decision Engine for Delhi Monsoon Waterlogging)  
**Track:** Heat & Water | **Hackathon:** WeMakeDevs x AWS (Oct 8–11, 2026)  
**Team:** 3 Members (DTU Delhi)

---

## 1. System Architecture & Inter-Member Data Flow

The three members interact across well-defined boundaries:
- **Member 1 (Hydrology & Geodata)** $\xrightarrow{\text{hotspots.json, golden\_scenarios.json}}$ **Member 2 (Optimizer)** and **Member 3 (Frontend)**
- **Member 2 (Optimization & AWS Backend)** $\xrightarrow{\text{REST APIs (/api/recommend, /api/chat)}}$ **Member 3 (Frontend)**
- **Member 3 (Frontend & Demo)** $\xrightarrow{\text{UI, Parity Feedback, Video, Blog}}$ **Complete Team & Judges**

```
+---------------------------------------------------------------------------------+
|                               Member 1: Hydrology & Geodata                     |
|  - Curates data/hotspots.json (15-20 locations)                                 |
|  - Writes engine/simulator.py (Canonical Python Water Balance Reference)        |
|  - Delivers data/golden_scenarios.json (10 test vectors for parity)             |
|  - Executes Validation Suite (Rank Test, July 2026 Replay, May 2025 Replay)      |
+-----------------------+----------------------------------+----------------------+
                        |                                  |
         data/hotspots.json                       data/hotspots.json &
                        |                         golden_scenarios.json
                        v                                  v
+--------------------------------------+  +---------------------------------------+
|  Member 2: Backend, Optimizer & AI   |  |     Member 3: Frontend & Demo Lead    |
|  - backend/optimizer.py (2D DP & MC) |  |  - src/engine/simulator.ts (60 FPS TS)|
|  - backend/agent.py (Bedrock Strands)|  |  - React + MapLibre Map on Amplify   |
|  - AWS Lambda & API Gateway          |  |  - Parity tests vs golden scenarios   |
|  - DynamoDB Scenarios Table          |  |  - Pitch Deck, 3-min Video, Blog Post |
+------------------+-------------------+  +-------------------+-------------------+
                   |                                          ^
                   +----------- REST API Endpoints -----------+
                                /api/recommend
                                /api/chat
                                /api/scenarios
```

---

## 2. Shared Canonical Data Schemas

### 2.1 Hotspot Entity Schema (`data/hotspots.json`)
Produced by Member 1; consumed by Member 2 and Member 3.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "HotspotsDataset",
  "type": "object",
  "required": ["hotspots"],
  "properties": {
    "hotspots": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id", "name", "lat", "lon", "road_name", "road_class",
          "traffic_pcu_per_hour", "hospital_route", "population_300m",
          "catchment_km2", "runoff_coeff_default", "surface_area_m2",
          "gravity_drain_capacity_m3s", "permanent_pump_capacity_m3s",
          "detour_penalty_mins", "historical_closure_freq_annual"
        ],
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "lat": { "type": "number" },
          "lon": { "type": "number" },
          "road_name": { "type": "string" },
          "road_class": { "type": "string", "enum": ["arterial", "sub-arterial", "collector"] },
          "traffic_pcu_per_hour": { "type": "number" },
          "hospital_route": { "type": "boolean" },
          "hospital_name": { "type": "string" },
          "population_300m": { "type": "integer" },
          "catchment_km2": { "type": "number" },
          "runoff_coeff_min": { "type": "number" },
          "runoff_coeff_max": { "type": "number" },
          "runoff_coeff_default": { "type": "number" },
          "surface_area_m2": { "type": "number" },
          "storage_depth_max_m": { "type": "number" },
          "gravity_drain_capacity_m3s": { "type": "number" },
          "permanent_pump_capacity_m3s": { "type": "number" },
          "detour_penalty_mins": { "type": "number" },
          "historical_closure_freq_annual": { "type": "number" }
        }
      }
    }
  }
}
```

---

## 3. REST API Contracts (Member 2 $\to$ Member 3)

### 3.1 Optimization Request & Response (`POST /api/recommend`)
- **Request Body**:
```json
{
  "rain_mm": 110.0,
  "duration_h": 4.0,
  "available_pumps": 5,
  "available_crews": 2
}
```

- **Response Body (200 OK)**:
```json
{
  "rain_mm": 110.0,
  "duration_h": 4.0,
  "optimal_allocation": {
    "delhi-minto-bridge": { "temp_pumps": 2, "drain_cleared": true },
    "delhi-zakhira": { "temp_pumps": 2, "drain_cleared": false },
    "delhi-pul-prahladpur": { "temp_pumps": 1, "drain_cleared": true },
    "delhi-who-ring-road": { "temp_pumps": 0, "drain_cleared": false }
  },
  "metrics": {
    "optimal_closure_hours": 4.8,
    "optimal_impact_score": 142.5,
    "baseline_equal_closure_hours": 11.2,
    "baseline_equal_impact_score": 389.0,
    "closure_hours_saved": 6.4,
    "impact_saved_percent": 63.4
  },
  "uncertainty": {
    "p10_impact": 125.0,
    "median_impact": 142.5,
    "p90_impact": 178.2,
    "stability_percentage": 86.5
  }
}
```

---

### 3.2 Strands AI Explanation Request & Response (`POST /api/chat`)
- **Request Body**:
```json
{
  "session_id": "session-uuid-1234",
  "message": "Why did NIRNAY recommend 2 pumps for Minto Bridge instead of Dhaula Kuan?",
  "current_scenario": {
    "rain_mm": 110.0,
    "duration_h": 4.0,
    "allocation": {
      "delhi-minto-bridge": { "temp_pumps": 2, "drain_cleared": true },
      "delhi-dhaula-kuan": { "temp_pumps": 0, "drain_cleared": false }
    }
  }
}
```

- **Response Body (200 OK)**:
```json
{
  "session_id": "session-uuid-1234",
  "reply": "Based on the simulation outputs:\n\n1. **Hazard Exposure:** Under 110.0 mm rainfall, Minto Bridge's catchment (0.85 km²) generates a peak inflow of 4.2 m³/s, far exceeding its gravity drain. Without intervention, water depth reaches 0.42 m (closure in 42 mins).\n2. **Impact Multipliers:** Minto Bridge carries 4,200 PCU/hr and serves as a critical trauma route for LNJP Hospital. Adding 2 pumps (0.09 m³/s) and desilting clears the water balance, preventing 2.8 closure hours.\n3. **Dhaula Kuan Comparison:** In contrast, Dhaula Kuan's upgraded permanent pumps (0.80 m³/s) already keep its maximum depth at 0.12 m (well below the 0.20 m closure threshold). Allocating a pump to Dhaula Kuan yields 0.0 marginal closure-hours saved.",
  "tools_invoked": [
    {
      "tool": "simulate",
      "args": { "rain_mm": 110.0, "duration_h": 4.0 }
    }
  ]
}
```

---

### 3.3 Scenario Persistence in DynamoDB (`POST /api/scenarios`)
- **Request Body**:
```json
{
  "rain_mm": 85.0,
  "duration_h": 3.0,
  "interventions": {
    "delhi-minto-bridge": { "temp_pumps": 1, "drain_cleared": true, "pre_divert": false, "road_closed": false }
  },
  "results_summary": {
    "total_closure_hours": 3.2,
    "total_impact_score": 118.0
  }
}
```

- **Response Body (201 Created)**:
```json
{
  "scenario_id": "scen-88a2-9f3b",
  "created_at": "2026-10-09T14:32:00Z",
  "shareable_url": "https://nirnay.amplifyapp.com/?scenario=scen-88a2-9f3b"
}
```

---

## 4. Milestone Check-Ins & Sync Schedule

To avoid merge conflicts and blocked paths, the team adheres to 3 daily sync checkpoints:

| Checkpoint | Time | Agenda |
|---|---|---|
| **Morning Sync** | 10:00 AM | Review previous night's commits, unblock dependencies, confirm daily goals. |
| **Afternoon Handoff**| 3:00 PM | Data schema and API contract validation between members. |
| **Nightly Integration**| 9:00 PM | Deploy merged code to AWS Amplify and test end-to-end integration. |
| **CRITICAL FREEZE** | **Oct 10, 6:00 PM** | **Strict Feature Freeze.** No new code commits. Dedicated to bug bash, video recording, and blog writing. |

---

## 5. Git & Collaboration Protocol

1. **Repository Structure**:
   - `main`: Production-ready code; auto-deploys to AWS Amplify.
   - `feature/hydrology-geodata` (Member 1)
   - `feature/backend-optimizer-agent` (Member 2)
   - `feature/frontend-ui-amplify` (Member 3)
2. **Commit Policy**:
   - Never commit API keys or AWS credentials. Use AWS IAM environment variables.
   - Do not commit large binary GIS rasters (>10MB). Keep them in Amazon S3 or Git LFS.
3. **Emergency Fallback Protocols**:
   - **If Bedrock API is delayed or throttled**: Member 2 activates pre-cached tool explanation JSON responses for the 5 standard demo scenarios.
   - **If DEM Catchment delineation fails**: Member 1 defaults to circular 800m buffer zones ($A = 0.8\text{ km}^2$) without blocking progress.
   - **If AWS Amplify build fails**: Member 3 deploys to Vercel as a backup while debugging the Amplify build script.
