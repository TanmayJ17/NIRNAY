# 🌊 NIRNAY — Member-by-Member Master Execution Blueprint
**Hackathon:** Environmental Hacks (WeMakeDevs x AWS) | **Dates:** Oct 8–11, 2026  
**Track:** Heat and Water | **Team:** 3 Members (DTU Delhi)  
**Target User:** PWD Control Room Operators, Zonal Drainage Engineers, and Disaster Management Coordinators  

---

## 📌 1. Project Snapshot & Architectural Mandate

**NIRNAY** (*Hindi for "Decision"*) is a **Pre-Storm What-If Decision & Resource Allocation Engine** for urban waterlogging management in Delhi-NCR.

> **Canonical Principle:** Catchment Water Balance & Rainfall Simulation is the single source of truth. All downstream features — Geographic Map status, DP Pump Allocations, Monte Carlo Confidence Bands, and AWS Strands Agent Q&A — consume this canonical engine.

```text
LIVE WEATHER FORECAST (Open-Meteo) ──┐
                                     ├──> CANONICAL HYDROLOGY ENGINE
IMD RAIN SLIDER / REPLAY PRESETS ────┘      (Rational Method + Water Balance)
                                                   │
                                                   ▼
                                       15 DELHI UNDERPASS STATES
                                                   │
             ┌─────────────────────────────────────┼─────────────────────────────────────┐
             ▼                                     ▼                                     ▼
   GEOGRAPHIC MAP & GRID UI              RESOURCE OPTIMIZER SOLVER             AWS STRANDS AGENT SDK
   (Leaflet + Pulsing Radar Rings)       (DP Allocator + 200 Monte Carlo)      (Tool-Calling Q&A Assistant)
```

---

## 👥 2. Member-by-Member Ownership & Action Plan

---

### 👤 MEMBER 1: Hydrology, Physics Engine & Geodata Specialist
**Role:** Senior Data & Hydrology Engineer  
**Primary Codebase Ownership:**
*   `data/hotspots/hotspots.json`
*   `data/rainfall/replays.json`
*   `backend/app/services/hydrology.py`
*   `frontend/src/services/hydrologySimulator.ts`

#### 🎯 Key Technical Deliverables:
1.  **Delhi Hotspot Taxonomy (`hotspots.json`):** Maintain pre-calibrated parameters for 15 Delhi underpasses (Minto Bridge, Pul Prahladpur, Zakhira, Dhaula Kuan, Moolchand, WHO Ring Road, Jahangirpuri, Loni Road, Karala-Kanjhawala, Tilak Bridge, Azadpur, Kishanganj, South Ext, Punjabi Bagh, Dwarka Sec 21).
2.  **Physics Hydrology Engine (`hydrology.py`):**
    *   *Rational Method Inflow:* $Q_{\text{in}}(t) = 0.278 \cdot C \cdot I(t) \cdot A$ ($\text{m}^3/\text{s}$).
    *   *Euler Water Balance:* $dh/dt = (Q_{\text{in}} - Q_{\text{pumps}} - Q_{\text{drain}})/A_s(h)$.
    *   Calculate warning time ($h \ge 0.15\text{m}$), closure time ($h \ge 0.20\text{m}$), max depth, and vehicle-hours impact index.
3.  **Client-side Simulator Port (`hydrologySimulator.ts`):** Maintain pure TypeScript port so browser map sliders react in **0 milliseconds**.
4.  **Historical Event Presets (`replays.json`):** Maintain **July 2026 Monsoon** (104mm / 24h) and **May 2025 Cloudburst** (85mm / 3h) datasets.

#### 📅 Daily Task Schedule:
*   **Day 1 (Oct 8):** Verify all 15 underpass lat/lng coordinates and runoff coefficients $C$. Test Python hydrology simulation script.
*   **Day 2 (Oct 9):** Synchronize TypeScript `hydrologySimulator.ts` logic with Python engine. Validate 0ms latency.
*   **Day 3 (Oct 10):** Calibrate July 2026 & May 2025 historic replay presets against news reports.
*   **Day 4 (Oct 11):** Run `python3 scripts/verify_system.py` to confirm zero physics calculation errors.

---

### 👤 MEMBER 2: Optimization Solver, AWS Strands Agent & Cloud Infra Specialist
**Role:** AI & Cloud Backend Architect  
**Primary Codebase Ownership:**
*   `backend/app/services/optimizer.py`
*   `backend/app/services/agent.py`
*   `backend/app/services/weather_forecast.py`
*   `backend/app/main.py`
*   `.env`

#### 🎯 Key Technical Deliverables:
1.  **Resource Optimization Solver (`optimizer.py`):**
    *   *Greedy/DP Allocator:* Allocates $N$ mobile pumps and $M$ maintenance crews to minimize total vehicle-hours lost across independent hotspots.
    *   *Baselines:* Compares optimal allocation against Naive Equal Split and Historical Traffic Split.
2.  **Monte Carlo Uncertainty Engine (`optimizer.py`):** Run 200 simulation iterations ($\pm 15\%$ runoff, $\pm 20\%$ pump efficiency, $0.4 - 1.0$ drain clogging) to output $P_{10}, P_{50}, P_{90}$ confidence bands and recommendation stability %.
3.  **AWS Strands Agents SDK Integration (`agent.py`):**
    *   Integrate open-source **AWS Strands Agents SDK**.
    *   Equip agent with 3 tools: `simulate_scenario`, `recommend_allocation`, `compare_scenarios`.
    *   Guardrail system prompt: Answers control room queries using exact math tool outputs only.
4.  **Weather Forecast Engine (`weather_forecast.py`):** Integrate Open-Meteo & IMD Live Weather API for Delhi coordinates (`28.6139°N, 77.2090°E`).
5.  **FastAPI REST Server (`main.py`):** Maintain REST endpoints (`/simulate`, `/optimize`, `/agent/chat`, `/weather/forecast`, `/replays`).

#### 📅 Daily Task Schedule:
*   **Day 1 (Oct 8):** Build FastAPI server, Pydantic schemas, and setup `.env` configuration file.
*   **Day 2 (Oct 9):** Build DP optimizer solver and 200 Monte Carlo uncertainty simulation module.
*   **Day 3 (Oct 10):** Build AWS Strands Agent SDK integration and Open-Meteo weather forecasting service.
*   **Day 4 (Oct 11):** Test backend server endpoints and verify zero server error logs.

---

### 👤 MEMBER 3: Control Room UI, Leaflet Mapping & Pitch Lead
**Role:** Full-Stack Frontend & Presentation Lead  
**Primary Codebase Ownership:**
*   `frontend/src/app/page.tsx`
*   `frontend/src/components/MapControlRoom.tsx`
*   `frontend/src/components/DelhiLeafletMap.tsx`
*   `frontend/src/components/RainSlider.tsx`
*   `frontend/src/components/RecommenderModal.tsx`
*   `frontend/src/components/AgentDrawer.tsx`
*   `frontend/src/components/WeatherForecastModal.tsx`

#### 🎯 Key Technical Deliverables:
1.  **Geographic Leaflet Map Component (`DelhiLeafletMap.tsx`):** Render CartoDB Dark Theme Map centered on Delhi with 15 underpass markers, status popups, and pulsing red radar rings for critical closed underpasses.
2.  **Map Control Room Dashboard (`MapControlRoom.tsx`):** Dual-view tab toggle between **Geographic Map View** and **Analytics Grid View** + Hotspot Inspector Sidebar.
3.  **Rain Hydrograph Console (`RainSlider.tsx`):** IMD Rainfall volume & duration sliders, peak intensity calculator ($\text{mm/h}$), and historical event replay badges.
4.  **Resource Recommender Modal (`RecommenderModal.tsx`):** Optimization solver UI displaying vehicle-hours saved cards and Monte Carlo $P_{10}/P_{50}/P_{90}$ confidence distribution curves.
5.  **AWS Strands Agent Widget (`AgentDrawer.tsx`):** Floating AI Agent launcher button, quick preset prompt chips, and tool execution breadcrumbs.
6.  **Live Weather Forecast Modal (`WeatherForecastModal.tsx`):** 24-Hour precipitation forecast chart with 1-click **"Load into Simulator"** button.
7.  **3-Minute Pitch Deck & Video:** Design slides, record screen demo, and write AWS Builder Center blog post.

#### 📅 Daily Task Schedule:
*   **Day 1 (Oct 8):** Setup Next.js, Tailwind CSS, Leaflet, and build Control Room layout.
*   **Day 2 (Oct 9):** Connect Leaflet Map and Analytics Grid with client-side simulator.
*   **Day 3 (Oct 10):** Build Recommender Modal, Agent Drawer, and Weather Forecast Modal. Feature freeze at 6 PM.
*   **Day 4 (Oct 11):** Record 3-minute screen demo video, finalize pitch deck, publish AWS Builder Center blog, and submit project!

---

## 🗓️ 3. 4-Day Team Synchronization Matrix

```text
┌───────────────┬───────────────────────────────────────────────────────────────────────────┐
│ Timeline      │ Synchronized Milestone & Team Deliverables                                │
├───────────────┼───────────────────────────────────────────────────────────────────────────┤
│ Oct 8 (Day 1) │ • M1: hotspots.json & Python hydrology simulation engine verified.        │
│               │ • M2: FastAPI backend server endpoints live on localhost:8000.            │
│               │ • M3: Control room Next.js layout & Leaflet map scaffolded.              │
├───────────────┼───────────────────────────────────────────────────────────────────────────┤
│ Oct 9 (Day 2) │ • M1: TypeScript client-side simulator matching Python physics (0ms).     │
│               │ • M2: DP Optimizer & 200 Monte Carlo uncertainty generator complete.      │
│               │ • M3: MapControlRoom with tab toggle (Map vs Grid) & Hotspot Inspector.   │
├───────────────┼───────────────────────────────────────────────────────────────────────────┤
│ Oct 10 (Day 3)│ • M1: July 2026 & May 2025 historical replay presets calibrated.          │
│               │ • M2: AWS Strands Agent SDK tool-calling & Open-Meteo Weather API live.   │
│               │ • M3: Recommender Modal, Agent Drawer, Weather Modal polished.            │
│               │ • ALL: FEATURE FREEZE AT 6:00 PM.                                         │
├───────────────┼───────────────────────────────────────────────────────────────────────────┤
│ Oct 11 (Day 4)│ • M1 & M2: Final system verification (python3 scripts/verify_system.py).  │
│               │ • M3: Record 3-min video, publish AWS Builder Center blog, submit!        │
└───────────────┴───────────────────────────────────────────────────────────────────────────┘
```

---

## 🎤 4. Official 3-Minute Pitch Script Outline

### ⏱️ 0:00 – 0:45 | The Hook & Problem Statement
> *"Every monsoon, Delhi's PWD decides where to send mobile pumps based on old lists and guesswork. When torrential rain hits, underpasses flood reactively, paralyzing transit. NIRNAY is a pre-storm what-if decision engine that lets control room engineers test decisions BEFORE the rain hits."*

### ⏱️ 0:45 – 1:30 | Live Demo: Weather Forecast & 0ms Map Simulation
> *"Click 'Live Forecast' — Open-Meteo predicts 75 mm rain over 4 hours in Delhi-NCR. Click 'Load into Simulator'. In 0 milliseconds, the map updates: Minto Bridge shows closure in 34 mins, Zakhira in 19 mins. Red pulsing radar rings highlight critical bottlenecks."*

### ⏱️ 1:30 – 2:15 | Live Demo: Resource Optimizer & Monte Carlo Uncertainty
> *"PWD has 10 mobile pumps available. Click 'Optimize Resources'. NIRNAY's Dynamic Programming solver allocates pumps to minimize vehicle-hours lost. It saves 105,372 vehicle-hours compared to naive equal split. 200 Monte Carlo simulation draws prove a 91.5% recommendation stability!"*

### 2:15 – 2:45 | Live Demo: AWS Strands Agent SDK Explainability
> *"We open our AWS Strands Agent Drawer and ask: 'Why Zakhira over Minto Bridge?' Powered by the AWS Strands Agents SDK and Amazon Bedrock, the agent quotes exact tool math: Zakhira has 2x higher traffic density and lies on a critical Hospital Access Corridor."*

### ⏱️ 2:45 – 3:00 | AWS Stack & Closing Impact
> *"NIRNAY uses AWS Strands Agents SDK, Amazon Bedrock, AWS Lambda, DynamoDB, and Copernicus DEM from AWS Open Data. NIRNAY turns reactive flood panic into proactive decision intelligence."*

---

## ✅ 5. Final Hackathon Submission Checklist

- [ ] Student verification completed on **AWS Builder Center** (`builder.aws.com`).
- [ ] Code pushed to public GitHub repository (`git push origin main`).
- [ ] Uses official AWS Open Source tool (**AWS Strands Agents SDK**).
- [ ] `README.md` updated with architecture diagram and run instructions.
- [ ] 3-Minute demo video recorded and uploaded to YouTube / Drive.
- [ ] Short project blog published on **AWS Builder Center**.
- [ ] Final submission submitted on hackathon portal before deadline!
