# 🛡️ AerosolShield — Project Handbook & Team Blueprint
**Hackathon:** Environmental Hacks (WeMakeDevs x AWS) | **Dates:** Oct 8–11, 2026
**Track:** Air Quality & Stubble Burning | **Team Size:** 3 Members (DTU Delhi)

---

## 📌 1. Project Overview & Problem Statement

### The Problem
Every Oct–Nov, 15,000+ crop residue fires in Punjab and Haryana combined with winter wind patterns plunge Delhi-NCR into hazardous air quality (AQI 450+). 
The government’s current solution — **GRAP (Graded Response Action Plan)** — is **reactive** (triggers blanket shutdowns *after* children inhale toxic air) and **city-wide** (closes all schools regardless of local micro-climate variations).

### Our Solution: AerosolShield
AerosolShield is a **predictive, hyper-local early warning and automated action-planning system** for schools and District Education Officers (DEOs).

1. **Satellite & Wind Fusion:** Ingests **NASA FIRMS satellite thermal fire data** and couples it with **real-time wind trajectory vectors**.
2. **24-Hour Micro-Zone Prediction:** Forecasts smoke drift trajectory towards specific school coordinates 24 hours in advance.
3. **AWS Strands Agent SDK Action Planner:** An autonomous AI Agent generates customized daily operational schedules for school principals (e.g., rescheduling assemblies, adjusting air purifier pre-conditioning, altering outdoor sports windows).
4. **Historical Backtest Centerpiece:** Proven against actual peak pollution data from **November 2025**.

---

## 🎯 2. Competitive Edge: AerosolShield vs GRAP

| Feature | Existing Govt GRAP | **AerosolShield** |
| :--- | :--- | :--- |
| **Granularity** | Entire NCR city-wide blanket | **School-level micro-zones** |
| **Timing** | Reactive (Acts *after* AQI spikes) | **Predictive** (24-hour advance trajectory warning) |
| **Action Plan** | Panic school shutdowns | **Smart automated school activity schedule** |
| **Data Engine** | Ground monitoring stations only | Satellite thermal fires + Wind vector forecasting |

---

## 👥 3. 3-Member Role & Task Division

### 👤 Member 1: Data Engine & Trajectory Backend
**Role Title:** Geospatial Data & Backend Engineer  
**Core Responsibilities:**
*   **NASA FIRMS Ingestion:** Build API pipeline to fetch active fire hotspots (VIIRS 375m NRT data) across Punjab, Haryana, and NCR.
*   **Wind Trajectory Vector Engine:** Fetch NOAA / Open-Meteo wind speed & direction APIs. Implement a 24-hour vector advection model to project fire plume drift cones over Delhi-NCR.
*   **Nov 2025 Backtest Dataset:** Curate historical satellite fire and wind data from Nov 1–10, 2025 for the live demo scrubber.
*   **AWS Infrastructure:** Deploy backend endpoints using AWS Lambda, Amazon S3 (raw data storage), and Amazon OpenSearch Service for spatial querying.

### 👤 Member 2: AI Agent & LLM Intelligence
**Role Title:** AI Agent & Prompt Engineer  
**Core Responsibilities:**
*   **School Action-Plan Agent:** Build the autonomous agent using **AWS Strands Agents SDK**.
*   **Agent Tools & Logic:** Equip the agent with tools to parse school location, trajectory risk score, student capacity, and indoor air filtration capabilities.
*   **Schedule Generator:** Prompt and logic to output structured daily recommendations (e.g., morning assembly shift, HVAC pre-purification times, outdoor play windows).
*   **GRAP Comparison Engine:** Generate side-by-side comparison text ("What GRAP would do vs What AerosolShield recommends").
*   **Notification Payload:** Format WhatsApp/Email alert payloads for school principals and DEOs.

### 👤 Member 3: Full-Stack Map UI & Demo Lead
**Role Title:** Full-Stack Web & Presentation Lead  
**Core Responsibilities:**
*   **Interactive Geospatial Map (Mapbox GL / Leaflet):** Render fire hotspots, wind vector arrows, trajectory risk cones, and school markers (Green/Yellow/Red risk).
*   **Nov 2025 Backtest Scrubber:** Build the interactive time slider for the demo (Nov 1 to Nov 10, 2025).
*   **School Principal Dashboard:** UI for principals to view their custom daily action plan, risk score, and notification toggles.
*   **Pitch Deck & Demo Script:** Design the 3-minute pitch deck emphasizing the DTU local context, GRAP comparison, and live backtest demo.

---

## 🗓️ 4. 4-Day Implementation Roadmap

```
Oct 8 (Day 1) ──► Oct 9 (Day 2) ──► Oct 10 (Day 3) ──► Oct 11 (Day 4)
  Data & Stack      Agent & Map       Integration &       Polishing &
    Setup             UI Build          Backtest Demo       Pitch Video
```

### Day 1 (Oct 8): Foundation & Ingestion
*   **Member 1:** Set up NASA FIRMS API key, fetch Punjab/Haryana fire CSV/GeoJSON, setup Open-Meteo wind API.
*   **Member 2:** Install AWS Strands Agents SDK, define Agent system prompt and baseline tools.
*   **Member 3:** Scaffold Next.js / React application, integrate Mapbox GL container, define basic layout.

### Day 2 (Oct 9): Core Logic & UI
*   **Member 1:** Write 24h wind trajectory drift calculation; index school coordinates in Amazon OpenSearch / local GeoJSON.
*   **Member 2:** Build School Action-Plan Agent logic; test generating custom schedules from trajectory risk inputs.
*   **Member 3:** Build Interactive Map with fire layers, wind vectors, and school pins; create School Principal view.

### Day 3 (Oct 10): Integration & Nov 2025 Backtest
*   **Member 1 & 3:** Connect backend endpoints to frontend; implement Nov 1–10, 2025 historical data timeline scrubber.
*   **Member 2 & 3:** Wire Agent output to frontend dashboard; format GRAP vs AerosolShield comparison widget.
*   **All:** Test end-to-end flow: moving scrubber -> fire plume moves -> trajectory calculates -> Agent outputs daily action plan.

### Day 4 (Oct 11): Polishing & Pitch
*   **Member 1 & 2:** Final deployment on AWS (App Runner / Lambda / Amplify); verify API stability.
*   **Member 3:** Complete 3-minute pitch deck, record demo video, finalize submission documentation.

---

## ⚡ 5. Tech Stack & AWS Mapping

| Layer | Technology Used |
| :--- | :--- |
| **AI Agent Framework** | **AWS Strands Agents SDK** |
| **Cloud & Serverless** | AWS Lambda, Amazon S3, Amazon OpenSearch Service, AWS SAM CLI |
| **Frontend** | Next.js / React, Tailwind CSS, Mapbox GL JS / Leaflet |
| **Backend & Math** | Python, FastAPI, NumPy, Shapely (Geospatial math) |
| **Data Sources** | NASA FIRMS (VIIRS 375m), Open-Meteo / GFS Wind APIs, OpenAQ CPCB |

---

## 🎤 6. 3-Minute Hackathon Pitch Structure

1. **The Hook (0:00 - 0:45):** "Every November, 15,000 farm fires turn Delhi into a gas chamber. The government's GRAP plan reacts *after* kids inhale toxic air and shuts down all schools blanketly."
2. **The Solution & Live Demo (0:45 - 2:00):** Show the **Nov 2025 Backtest Scrubber**. Move slider to Nov 4, 2025. Show NASA satellite fires + wind vector pointing to Rohini/DTU zone. Show AerosolShield alerting 24h before ground stations hit severe AQI.
3. **The Differentiator — School Action Plan Agent (2:00 - 2:30):** Show the **AWS Strands Agent** generating a custom school schedule (shifting assembly indoors, tuning purifier schedules).
4. **AWS Tech Stack & Impact (2:30 - 3:00):** Highlight AWS Strands Agents SDK, OpenSearch spatial indexing, Lambda scalability, and potential for scaling across 5,000+ NCR schools.
