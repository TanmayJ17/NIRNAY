# 🌊 NIRNAY — Pre-Storm "What-If" Decision & Resource Allocation Engine

**Hackathon:** Environmental Hacks (WeMakeDevs x AWS) | **Dates:** Oct 8–11, 2026  
**Track:** Heat and Water | **Team:** 3 Members (DTU Delhi)  
**Target User:** PWD Control Room Operators, Zonal Drainage Engineers, and Disaster Management Coordinators  

---

## 📌 Executive Summary

**NIRNAY** (*Hindi for "Decision"*) is a pre-storm scenario simulation and resource allocation engine for Delhi's Public Works Department (PWD) and Municipal Authorities. 

Instead of reactively dispatching mobile pumps *after* underpasses flood, NIRNAY allows control-room engineers to:
1. **Simulate Time-to-Closure:** Test any rainfall scenario (e.g. 90mm in 3h) and predict exact minutes-to-closure for 15 critical Delhi underpass hotspots in 0ms.
2. **Optimize Resource Allocation:** Dynamically calculate the optimal allocation of $N$ mobile pumps and $M$ maintenance crews to minimize total vehicle-hours lost across Delhi.
3. **Quantify Uncertainty:** Run 200 Monte Carlo simulation iterations ($\pm 15\%$ runoff, $\pm 20\%$ pump efficiency) to generate P10, P50 (median), and P90 confidence bands and recommendation stability percentages.
4. **AWS Strands Agent Explainability:** Interrogate the system in plain natural language (*"Why did NIRNAY assign 3 pumps to Zakhira instead of Minto Bridge?"*) and receive exact mathematical rationale grounded in tool outputs.

---

## 🏛️ Claims vs Non-Claims

| What We Claim | What We Do NOT Claim |
| :--- | :--- |
| Pre-storm scenario simulation & resource optimization | Real-time sensor flood forecasting |
| Relative vehicle-hour impact index with 10–90% confidence bands | Exact micro-liter water volume or exact car counts |
| Simplified textbook hydrology (Rational Method + Storage Balance) | Full 3D hydrodynamic fluid physics |
| Validated against historical Delhi events (July 2026 & May 2025) | Street-level flooding from raw surface DEM |
| Optimal resource allocation under stated assumptions | Hotspot interaction coupling (we assume independence) |

---

## ⚡ Tech Stack & AWS Mapping

| Layer | Technology |
| :--- | :--- |
| **AI Agent Framework** | **AWS Strands Agents SDK** (Open Source) |
| **LLM Provider** | Amazon Bedrock (Claude 3.5 Sonnet / Haiku) / Fallback Engine |
| **Serverless & Compute** | AWS Lambda, AWS SAM CLI |
| **Database & Storage** | Amazon DynamoDB (`Scenarios`), Amazon S3, SQLite |
| **Frontend & Web UI** | Next.js / React, Tailwind CSS, Leaflet / Mapbox GL, Zustand |
| **Open Data** | Copernicus DEM GLO-30 (AWS Open Data), IMD Archives, OSM |

---

## 🚀 Quick Start Guide

### 1. Run Verification Script
To test the Python hydrology engine, optimizer, and AWS Strands agent integration:

```bash
python3 scripts/verify_system.py
```

### 2. Run Backend FastAPI Server
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

### 3. Run Frontend Next.js Dashboard
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🐙 Push to GitHub Guide

To push this complete project to your GitHub repository:

```bash
git add .
git commit -m "feat: complete end-to-end NIRNAY implementation"
git branch -M main
git push -u origin main
```
