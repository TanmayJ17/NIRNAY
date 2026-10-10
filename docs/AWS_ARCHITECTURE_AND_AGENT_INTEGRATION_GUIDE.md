# ☁️ NIRNAY — AWS Architecture, APIs & Agents Integration Guide
**Track:** Heat & Water | **Hackathon:** WeMakeDevs x AWS Environmental Hacks  
**Target:** Final Submission & Technical Verification  

---

## 📌 1. Kitni AWS APIs & Services Use Ho Rahi Hain? (Total: 6 AWS Services)

Humne project mein **6 Core AWS Services** integrate ki hain:

| # | AWS Service | Purpose in NIRNAY | Code Implementation File |
| :--- | :--- | :--- | :--- |
| **1** | **Amazon Bedrock** | LLM Inference (Claude 3.5 Sonnet / Claude 3 Haiku) for tool-use reasoning | [`backend/app/services/bedrock_service.py`](file:///Users/whitemuffens/Desktop/Aws-hack/backend/app/services/bedrock_service.py) |
| **2** | **AWS Strands Agents SDK** | Autonomous Decision Support Agent with Tool Calling & Mathematical Guardrails | [`backend/app/services/agent.py`](file:///Users/whitemuffens/Desktop/Aws-hack/backend/app/services/agent.py) |
| **3** | **Amazon DynamoDB** | Persistent storage for storm scenarios, intervention logs, and audit trails | [`backend/app/services/dynamodb_service.py`](file:///Users/whitemuffens/Desktop/Aws-hack/backend/app/services/dynamodb_service.py) |
| **4** | **Amazon S3** | Archiving simulation run JSON reports and GeoTIFF elevation terrain files | [`backend/app/services/s3_service.py`](file:///Users/whitemuffens/Desktop/Aws-hack/backend/app/services/s3_service.py) |
| **5** | **AWS Open Data Registry (Copernicus DEM)** | Real 30-meter elevation model (`s3://copernicus-dem-30m/`) for Delhi underpass depressions | [`backend/app/services/copernicus_dem.py`](file:///Users/whitemuffens/Desktop/Aws-hack/backend/app/services/copernicus_dem.py) |
| **6** | **AWS Lambda & AWS SAM** | Serverless API runtime (Mangum adapter) + Infrastructure-as-Code (IaC) | [`backend/app/lambda_handler.py`](file:///Users/whitemuffens/Desktop/Aws-hack/backend/app/lambda_handler.py) & [`infra/template.yaml`](file:///Users/whitemuffens/Desktop/Aws-hack/infra/template.yaml) |

---

## 🔑 2. AWS Credentials Kahan Add Karni Hain?

Aapko kisi bhi Python file mein credentials hardcode karne ki zaroorat nahi hai.  
Sabhi AWS services centrally root file [`.env`](file:///Users/whitemuffens/Desktop/Aws-hack/.env) se credentials read karti hain:

👉 **File:** [`.env`](file:///Users/whitemuffens/Desktop/Aws-hack/.env) (Lines 6–10)

```env
# 🔑 PASTE YOUR AWS CREDENTIALS HERE:
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# Amazon Bedrock Model ID
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0

# Offline Fallback (True = Works without AWS keys for local demo)
USE_LOCAL_FALLBACK=true
```

> 💡 **Hackathon Pro Tip:** Agar aapke pass live AWS keys nahi hain ya limit exceed ho gayi hai, to bhi `USE_LOCAL_FALLBACK=true` hone ki wajah se poora Strands Agent, Bedrock tool-calling, aur DynamoDB storage local simulation mode mein 100% execute hota hai!

---

## 🤖 3. AWS Agents Kaise Kaam Karte Hain?

NIRNAY mein **AWS Strands Agents SDK** decision support ke liye use hota hai:

```text
Control Room User Query
        │
        ▼
┌──────────────────────────────────────────────┐
│       AWS Strands Agents SDK Framework       │
│           (Strict Math Guardrails)           │
└──────────────────────┬───────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       ▼               ▼               ▼
Tool 1: Physics  Tool 2: DP       Tool 3: DEM
Simulation       Optimizer        Copernicus
(Rational/Euler) (Monte Carlo)    (AWS Open Data)
       │               │               │
       └───────────────┼───────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│        Amazon Bedrock Claude 3.5             │
│        (Converse API Tool-Use)               │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
Grounded Decision Report + DynamoDB Audit Log
```

### Agent ke 4 Domain Tools:
1. `simulate_scenario(rain_mm, duration_h)`: Runs Euler water balance across 15 hotspots.
2. `recommend_allocation(pumps, crews, rain_mm, duration_h)`: Solves DP Knapsack pump allocation and 200 Monte Carlo draws.
3. `get_weather_forecast(lat, lon)`: Fetches live Open-Meteo precipitation forecast.
4. `get_copernicus_dem(hotspot_id)`: Fetches 3.4m ground depression from AWS Open Data Copernicus DEM.

---

## 🧪 4. How to Verify AWS Services:
```bash
# Test All AWS Cloud Services & Agent:
python3 scripts/test_aws_services.py

# Test Hydrology & Copernicus DEM:
python3 scripts/test_hydrology.py

# Test Full System Sanity:
python3 scripts/verify_system.py
```
