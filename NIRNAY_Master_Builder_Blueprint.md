# 🌊 MASTER BUILDER PROMPT & ARCHITECTURAL SPECIFICATION
## Project: NIRNAY — Pre-Storm "What-If" Decision & Resource Allocation Engine

**Hackathon:** Environmental Hacks (WeMakeDevs x AWS) | **Dates:** Oct 8–11, 2026  
**Track:** Heat and Water | **Team Size:** 3 Members (DTU Delhi)  
**Target User:** PWD Control Room Operators, Zonal Drainage Engineers, and Disaster Management Coordinators  

---

# 1. PRODUCT PRINCIPLE

The central architectural principle of NIRNAY is:

> **Catchment Water Balance & Scenario Simulation is the canonical representation of urban flooding risk.**

Everything downstream — Underpass Time-to-Closure, Resource Allocation Optimization, Monte Carlo Uncertainty Bands, and AWS Strands Agent Explainability — consumes the canonical Hydrology Water Balance Engine.

```text
RAINFALL SCENARIO (mm/h) ──┐
                          ├──> HYDROLOGY WATER BALANCE ENGINE
INTERVENTIONS (Pumps/Drains) ─┘        (Rational Method + Storage Balance)
                                                 │
                                                 ▼
                                     CANONICAL HOTSPOT RISK STATE
                                                 │
            ┌────────────────────────────────────┼────────────────────────────────────┐
            ▼                                    ▼                                    ▼
   TIME-TO-CLOSURE COUNTDOWN           OPTIMIZATION RECOMMENDER            AWS STRANDS AGENT
   (Green / Amber / Red Pins)          (DP / Greedy Pump Allocation)        (Natural Language Q&A)
            │                                    │                                    │
            └────────────────────────────────────┼────────────────────────────────────┘
                                                 ▼
                                     HISTORICAL EVENT REPLAY
                                     (July 2026 & May 2025)
                                                 │
                                                 ▼
                                     CONTROL ROOM DASHBOARD
```

---

# 2. REQUIRED TECH STACK

## Frontend & Control Room Map UI
- **Framework:** Next.js / React (TypeScript)
- **Styling:** Tailwind CSS, NativeWind
- **Geospatial Mapping:** Mapbox GL JS / MapLibre GL
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Hosting:** AWS Amplify

## Backend & API
- **Framework:** Python, FastAPI
- **Validation:** Pydantic v2
- **ORM & Migrations:** SQLAlchemy, Alembic

## Database & Storage
- **Primary Database:** PostgreSQL + PostGIS / pgvector (for spatial querying & route penalties)
- **Fast NoSQL Storage:** Amazon DynamoDB (`Scenarios` table)
- **Object Storage:** Amazon S3 (geoJSONs, raster tiles, historical rain logs)

## Async & Simulation Compute
- **Async Queue:** Amazon SQS (for 200-run Monte Carlo uncertainty calculations)
- **Compute:** AWS Lambda & AWS SAM CLI

## AI & Agent Engine
- **Framework:** AWS Strands Agents SDK (Open Source)
- **LLM Provider:** Amazon Bedrock (Claude 3.5 Sonnet / Haiku)

## Datasets & Open Data
- Copernicus DEM GLO-30 (AWS Open Data Registry)
- OpenStreetMap (OSM) underpasses & tunnel tags
- IMD Historical Gridded Rainfall & CPCB / PWD Delhi Hotspot Archives

---

# 3. MONOREPO STRUCTURE

```text
nirnay-water-control/
│
├── frontend/                    # Next.js Control Room Application
│   ├── app/                     # Pages & Routes (Dashboard, Replay, Analytics)
│   ├── components/              # UI Components (Map, RainSlider, PumpControls, AgentDrawer)
│   ├── hooks/                   # Custom Hooks (useSimulator, useScenario)
│   ├── services/                # API Client & TypeScript Simulator Port
│   ├── store/                   # Zustand Global Scenario State
│   ├── types/                   # TypeScript Types & Interfaces
│   └── package.json
│
├── backend/                     # FastAPI Python Engine
│   ├── app/
│   │   ├── main.py              # Application Entrypoint
│   │   ├── api/v1/              # API Endpoints (simulate, optimize, agent, replays)
│   │   ├── core/                # Configuration & AWS SDK Credentials
│   │   ├── db/                  # PostgreSQL Base & DynamoDB Sessions
│   │   ├── models/              # SQLAlchemy & Pydantic Data Models
│   │   ├── services/            # Hydrology, Optimization & Monte Carlo Engine
│   │   └── workers/             # Async SQS Workers
│   ├── tests/                   # Pytest Suite
│   └── requirements.txt
│
├── intelligence/                # Core Hydrology & AI Algorithms
│   ├── hydrology/               # Rational Method & Euler Integration Math
│   ├── optimization/            # Dynamic Programming & Greedy Allocator
│   ├── monte_carlo/             # 200-Run Uncertainty Band Generator
│   └── agent/                   # AWS Strands Agent SDK Tools & Prompts
│
├── data/                        # Geodata & Pre-Calibrated Hotspots
│   ├── hotspots/                # hotspots.json (15 Delhi Underpasses)
│   ├── rainfall/                # July 2026 & May 2025 Historic Hourly Rain Logs
│   └── dem/                     # DEM & Catchment Polygon Bounds
│
├── infra/                       # Infrastructure as Code
│   ├── docker/                  # Docker Compose (Postgres, DynamoDB Local)
│   ├── aws/                     # Lambda & SAM Templates
│   └── docker-compose.yml
│
├── docs/                        # Specifications & Blueprints
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── HYDROLOGY_SPEC.md
│
├── scripts/                     # Seed & Calibration Scripts
├── Makefile                     # Build & Run Shortcuts
└── README.md
```

---

# 4. TEAM TASK DIVISION (3 MEMBERS)

### 👤 Member 1: Hydrology Engine & Geodata Lead
*   **Ownership:** `data/`, `intelligence/hydrology/`, and TypeScript Dual Simulator.
*   **Tasks:**
    1. Build `hotspots.json` with pre-calibrated catchment parameters ($A$, $C$, $A_s(h)$, traffic density, hospital route priority) for 15 Delhi hotspots (Minto Bridge, Zakhira, Pul Prahladpur, Dhaula Kuan, etc.).
    2. Write **Python Reference Simulator** (Rational Method inflow + Euler water balance integration step).
    3. Port simulator logic to **TypeScript** for 0ms lag-free slider movement in the browser.
    4. Calibrate historical replay datasets for **July 2026** (100mm rain, no closure) and **May 2025** (overnight storm, Minto flooded).

### 👤 Member 2: Optimization Engine & AWS Strands Agent Lead
*   **Ownership:** `backend/`, `intelligence/optimization/`, and `intelligence/agent/`.
*   **Tasks:**
    1. Implement **Dynamic Programming / Greedy Pump Allocation Solver** to minimize total vehicle-hours lost subject to pump availability $N$.
    2. Implement **Monte Carlo 200-Run Uncertainty Generator** ($\pm 15\%$ runoff, $\pm 20\%$ pump efficiency) returning 10–90% confidence bands.
    3. Integrate **AWS Strands Agents SDK** with 3 custom tools:
       * `simulate(rain_mm, duration_h, interventions)`
       * `recommend(total_pumps, total_crews, rain_mm)`
       * `compare(scenario_a, scenario_b)`
    4. Set up **AWS Lambda**, **Amazon DynamoDB** (`Scenarios` table), and **Amazon API Gateway**.

### 👤 Member 3: Control Room Map UI & Pitch Lead
*   **Ownership:** `frontend/` directory, UI/UX, and Presentation.
*   **Tasks:**
    1. Build Mapbox GL / Leaflet map displaying 15 underpass markers colored by time-to-closure (🟢 Green > 60m, 🟡 Amber < 30m, 🔴 Red Flooded).
    2. Build **IMD Rain Intensity Slider** & **Intervention Drawer** (pump count sliders, drain clearing toggles, road closure toggles).
    3. Build **Recommender Output Component** showing optimal allocation vs naive baseline and vehicle-hours saved.
    4. Build **Strands Q&A Drawer** for natural language queries.
    5. Lead the 3-minute pitch deck creation, demo video recording, and submission.

---

# 5. STEP-BY-STEP GITHUB SETUP & PUSH GUIDE

### Step 5.1: Create & Initialize Local Repository

Run these exact terminal commands:

```bash
# 1. Create root folder
mkdir nirnay-water-control
cd nirnay-water-control

# 2. Initialize Git
git init

# 3. Create .gitignore
cat << 'EOF' > .gitignore
# Python
__pycache__/
*.py[cod]
.venv/
venv/
*.env

# Node / Next.js
node_modules/
.next/
out/
npm-debug.log*

# Data & IDE
temp/
.DS_Store
.vscode/
.idea/
EOF

# 4. Create directory structure
mkdir -p frontend/app frontend/components frontend/hooks frontend/services frontend/store frontend/types
mkdir -p backend/app/api/v1 backend/app/core backend/app/db backend/app/models backend/app/services backend/workers
mkdir -p intelligence/hydrology intelligence/optimization intelligence/monte_carlo intelligence/agent
mkdir -p data/hotspots data/rainfall data/dem
mkdir -p infra/docker infra/aws docs scripts

# 5. Touch placeholder files
find . -type d -empty -not -path './.git*' -exec touch {}/.gitkeep \;
```

### Step 5.2: Create GitHub Remote & Initial Push

```bash
# Add Remote Origin
git remote add origin https://github.com/your-username/nirnay-water-control.git

# Stage and Commit
git add .
git commit -m "feat: initial monorepo structure setup for NIRNAY"

# Push to Main Branch
git branch -M main
git push -u origin main
```

### Step 5.3: Feature Branch Setup

```bash
# Member 1 (Hydrology & Data):
git checkout -b feat/hydrology-data-engine

# Member 2 (Optimization & AWS Agent):
git checkout -b feat/optimizer-strands-agent

# Member 3 (Map UI & Dashboard):
git checkout -b feat/control-room-map-ui
```

---

# 6. END-TO-END SYSTEM CONNECTION FLOW

```text
[Control Room Operator / UI]
       │
       ├──> (1. Adjust Rain Slider to 100mm/3h)
       │         │
       │         ▼
       │  [Client-side TypeScript Simulator] ──► (Instant 0ms Map Pin Color Update: 🟢/🟡/🔴)
       │
       ├──> (2. Click "Optimize 10 Mobile Pumps & 5 Crews")
       │         │
       │         ▼
       │  [FastAPI Backend (/api/v1/scenarios/optimize)]
       │         │
       │         ├─► [DP / Greedy Allocator] ──► Calculates min vehicle-hours lost
       │         │
       │         ├─► [Monte Carlo Engine] ──► Runs 200 iterations for 10-90% confidence bands
       │         │
       │         └─► [Amazon DynamoDB] ──► Saves Scenario JSON record
       │
       └──> (3. Ask Agent: "Why did you assign 3 pumps to Zakhira instead of Minto?")
                 │
                 ▼
          [AWS Strands Agents SDK + Bedrock]
                 │
                 ├─► Calls tool: `compare_scenarios(scenario_a, scenario_b)`
                 │
                 ├─► Reads mathematical proof from DynamoDB / Postgres
                 │
                 ▼
          [Returns Grounded Fact Answer with Exact Citation to UI]
```

---

# 7. ACCEPTANCE CHECKLIST (FOR DEMO & JUDGES)

- [ ] **Instant Simulation:** Moving the IMD Rain Slider immediately updates time-to-closure countdowns on all 15 underpass map pins.
- [ ] **Optimal Recommender:** Clicking "Optimize Allocation" returns pump distribution that saves measurable vehicle-hours vs naive split.
- [ ] **Confidence Bands:** Displays 10–90% uncertainty range from 200 Monte Carlo iterations.
- [ ] **Historical Replays:** One-click presets for **July 2026** (no closure) and **May 2025** (Minto closure) match real news reports.
- [ ] **AWS Strands Agent Q&A:** Agent answers natural language questions by quoting simulator tool outputs only (no hallucinated numbers).
- [ ] **AWS Deployment:** Hosted live on AWS Amplify with backend serverless API on AWS Lambda.
