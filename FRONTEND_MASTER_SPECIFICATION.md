# NIRNAY Frontend Master Architecture & Engineering Guide

**Project:** NIRNAY (निर्णय) — Pre-Storm What-If Decision Engine for Urban Underpasses  
**Hackathon:** WeMakeDevs × AWS "Environmental Hacks" (Oct 8–11, 2026) • Track: Heat & Water  
**Lead:** Vansh (Member 3: Frontend & Demo Lead)  
**Stack:** Vite + React 18 + TypeScript + Tailwind CSS + Zustand + MapLibre GL JS + Vitest  
**Hosting:** AWS Amplify CI/CD  
**Branch:** `vansh`  

---

## 1. Executive Overview & Visual Language

NIRNAY is a tactical pre-storm decision support console engineered for Delhi Public Works Department (PWD) control-room engineers. It allows operators to stress-test mobile dewatering pump deployments, manual grate clearance, and upstream traffic diversions against synthetic and historical monsoon downpours *before* runoff overwhelms vulnerable sag underpasses.

### Design System: "Civic Precision Control"
- **Color Mode:** Strict **Light Theme** (clean civic government utility, no dark-mode sci-fi aesthetics).
- **Surface Hierarchy:** Canvas `#F8F9FA`, Card Surfaces `#FFFFFF`, Borders `1px solid #E5E7EB` / `#D1D5DB`. Zero drop shadows; visual hierarchy is established via tonal shifts and 1px hairline borders.
- **Typography:**
  - **Interface & Prose:** `Inter` (`font-sans`), `-apple-system, sans-serif`.
  - **Numeric & Metric Readouts:** `JetBrains Mono` (`font-mono`) with `font-variant-numeric: tabular-nums` to prevent layout shift during slider scrubbing.
- **Semantic Status Signals:**
  - Status colors appear **only** on map pins and hazard indicators:
    - **Clear / Safe (Green):** `#16A34A` / `#DCFCE7` (Peak depth $< 0.15\,\text{m}$)
    - **Hazard Alert (Amber):** `#D97706` / `#FEF3C7` ($0.15\,\text{m} \le \text{Peak depth} < 0.20\,\text{m}$)
    - **Roadway Closed (Red):** `#DC2626` / `#FEE2E2` (Peak depth $\ge 0.20\,\text{m}$)
- **Copy Mandate:**
  - Universal disclaimer: *"Decision support, not flood forecasting. Impact figures are a relative index, not counts of people or vehicles."*
  - Omitted all unauthorized marketing terms (*"AI decision maker"*, *"AWS agent"*, *"real-time live telemetry"*).

---

## 2. Directory Structure

```text
frontend/
├── index.html                           # HTML5 entry with Google Fonts (Inter + JetBrains Mono)
├── package.json                         # Dependencies & npm scripts (dev, build, preview, test, print:scenario)
├── tsconfig.json                        # Bundler-mode TypeScript configuration with @/ alias
├── vite.config.ts                       # Vite 5 config + Vitest environment configuration
├── tailwind.config.js                   # Design tokens: surface, borders, status palettes, fonts
├── postcss.config.js                    # PostCSS ESM configuration with Tailwind & Autoprefixer
├── src/
│   ├── main.tsx                         # React 18 createRoot render + BrowserRouter wrapper
│   ├── App.tsx                          # Top-level Route switcher (/, /app, wildcard redirect)
│   ├── config.ts                        # Single source of truth for physics, thresholds, & assumptions
│   ├── types.ts                         # Complete TypeScript interfaces & contracts
│   ├── vite-env.d.ts                    # Vite client & import.meta.env types
│   ├── index.css                        # Tailwind base layer + custom scrollbar + font rules
│   ├── api/
│   │   └── chat.ts                      # Client layer for POST /api/chat with 15s timeout & offline fallback
│   ├── data/
│   │   ├── hotspots.json                # 15 canonical Delhi underpass entities (illustrative demo baseline)
│   │   ├── loadHotspots.ts              # Loader with startup warning for illustrative dataset status
│   │   ├── mockRecommend.ts             # Default mock fixture for /api/recommend
│   │   ├── seeds.json                   # 4 built-in preset scenarios for 1-click execution
│   │   └── cachedAnswers.json           # Grounded Q&A explanations for Ask NIRNAY fallback
│   ├── engine/
│   │   ├── simulator.ts                 # Pure deterministic Euler hydrology simulation engine
│   │   ├── simulator.test.ts            # Vitest suite (monotonicity, determinism, parameter overrides)
│   │   └── printDefaultScenario.ts      # Scenario reporting script (100 mm / 4 h breakdown)
│   ├── store/
│   │   └── useStore.ts                  # Zustand centralized reactive state store
│   ├── components/
│   │   ├── TopBar.tsx                   # Brand bar, single run, Compare A/B, Save Scenario
│   │   ├── MapView.tsx                  # MapLibre GL instance, CARTO Light raster tiles, status markers
│   │   ├── CrossSectionCard.tsx         # SVG elevation cross-section, dynamic water fill, 3 metric columns
│   │   ├── RightPanel.tsx               # Operations container, persistent Ask button, 3 tab views
│   │   ├── DispatchControls.tsx         # Steppers for mobile pumps/crews + "Find best allocation" action
│   │   ├── RecommendResult.tsx          # Closure-hours saved KPI, P10-P90 range, "Ask why" trigger
│   │   ├── AllocationTable.tsx          # Tabular pump assignments with m³/s capacity & grate clearance
│   │   ├── AskNirnayPanel.tsx           # Grounded Q&A chat, question chips, collapsible simulator sources
│   │   ├── RainfallBar.tsx              # Total rain slider (0-300mm), IMD classes, duration, preset buttons
│   │   └── Footer.tsx                   # Operational disclaimer + Guided First Run trigger
│   └── pages/
│       ├── Landing.tsx                  # Marketing/Context page with 6 sections + claims table + Arch SVG
│       └── Simulator.tsx                # Tactical Simulator page with query param deep-link resolver
```

---

## 3. Application Routing & Deep Linking

```
                                    ┌───────────────────────┐
                                    │    BrowserRouter      │
                                    └───────────┬───────────┘
                                                │
                 ┌──────────────────────────────┴──────────────────────────────┐
                 │                                                             │
                 ▼                                                             ▼
         Route: "/" (Landing)                                        Route: "/app" (Simulator)
   ┌─────────────────────────────┐                             ┌─────────────────────────────────────┐
   │ • Hero + Screenshot box     │                             │ • TopBar (Single / Compare / Save)  │
   │ • 3 Plain Problem Points    │                             │ • MapView (65% width on desktop)    │
   │ • 3 How-It-Works Steps      │                             │ • RightPanel (35% width on desktop) │
   │ • Claims vs Non-Claims Table│                             │ • RainfallBar (Scrubber + Presets)  │
   │ • AWS Architecture SVG      │                             │ • Advisory Footer                   │
   │ • Footer with GitHub / Blog │                             └──────────────────┬──────────────────┘
   └─────────────────────────────┘                                                │
                                                                                  │ (Deep-link query params)
                                                                                  ▼
                                                               ┌─────────────────────────────────────┐
                                                               │ ?preset=july2026 -> 180 mm / 6 h    │
                                                               │ ?preset=may2025  ->  65 mm / 3 h    │
                                                               │ ?scenario=<id>   -> Selects hotspot │
                                                               └─────────────────────────────────────┘
```

### AWS Amplify SPA Hosting Configuration
To support HTML5 pushState deep-linking without `404 Not Found` on browser reload, `amplify.yml` configures Vite's `dist` folder, paired with this redirect rule in AWS Amplify Console:

| Field | Setting / Value |
|---|---|
| **Source address** | `</^[^.]+$|\.(?!(css\|gif\|ico\|jpg\|js\|png\|txt\|svg\|woff\|woff2\|ttf\|map\|json)$)([^.]+$)/>` |
| **Target address** | `/index.html` |
| **Type** | `200 (Rewrite)` |

---

## 4. Hydrological Simulation Engine (`src/engine/simulator.ts`)

The simulation engine is a **pure, deterministic TypeScript function** with zero external network calls, zero machine learning models, and zero pseudo-random numbers.

### Core Signature
```typescript
export function simulate(
  hotspot: Hotspot,
  rainMm: number,
  durationH: number,
  interventions: Interventions,
  params?: SimulateParams
): SimulationResult;
```

### Mathematical Physics

#### 1. Synthetic Hyetograph (Rainfall Intensity)
Monsoon storms in Delhi follow a skewed triangular distribution peaking at 40% duration (`HYETOGRAPH_PEAK_FRACTION = 0.40`):
$$i_{\text{peak}} = \frac{2 \cdot \text{rainMm}}{\text{durationH}} \quad (\text{mm/h})$$

For time $t$ in seconds during the storm ($t \le D_{\text{sec}}$):
$$i(t) = \begin{cases} 
i_{\text{peak}} \cdot \left(\frac{t}{t_{\text{peak}}}\right) & 0 \le t \le t_{\text{peak}} \\
i_{\text{peak}} \cdot \left(\frac{D_{\text{sec}} - t}{D_{\text{sec}} - t_{\text{peak}}}\right) & t_{\text{peak}} < t \le D_{\text{sec}} \\
0 & t > D_{\text{sec}}
\end{cases}$$

#### 2. Surface Inflow (Rational Method)
$$Q_{\text{in}}(t) = 0.278 \cdot C \cdot i(t) \cdot A_{\text{km}^2} \quad (\text{m}^3/\text{s})$$
- $0.278 = \frac{10^{-3} \text{ m/mm} \cdot 10^6 \text{ m}^2/\text{km}^2}{3600 \text{ s/h}}$ (exact physical conversion factor).
- $C$: Runoff coefficient (`hotspot.runoff_coeff_default` or `params.runoffCoeff`).
- $A_{\text{km}^2}$: Sag basin catchment area in square kilometers.

#### 3. Outflow Capacity
$$Q_{\text{out}} = Q_{\text{perm}} + (N_{\text{temp}} \cdot q_{\text{temp}}) + Q_{\text{drain}} \cdot (1 + r_{\text{cleared}})$$
- $Q_{\text{perm}}$: Permanent pump station discharge ($m^3/s$).
- $N_{\text{temp}}$: Count of mobile trailer pumps deployed ($0 \dots 4$).
- $q_{\text{temp}}$: Per-pump capacity = $0.15\,\text{m}^3/\text{s}$ (`TEMP_PUMP_CAPACITY_M3S`).
- $Q_{\text{drain}}$: Gravity trunk drain capacity ($m^3/s$).
- $r_{\text{cleared}}$: $0.50$ when `drainCleared === true` (`DRAIN_CLEARED_RECOVERY_FACTOR`), otherwise $0$.

#### 4. Numerical Time Stepping (Forward Euler)
- Discrete time step: $\Delta t = 60\,\text{s}$ (`EULER_STEP_SECONDS`).
- Depth update:
  $$h_{k+1} = \min\left(h_{\text{max\_storage}}, \max\left(0, h_k + \frac{(Q_{\text{in}} - Q_{\text{out}}) \cdot \Delta t}{A_{\text{surface\_m}^2}}\right)\right)$$
- **Drainage Continuation:** After rain cessation ($t > D_{\text{sec}}$), the engine continues forward Euler stepping until $h = 0$ or 24 hours (`MAX_SIMULATION_HOURS`) elapse to compute the full drain-down duration.

#### 5. Relative Impact Index Formulation
The Impact Index is a **dimensionless relative priority score** (never a literal head count or vehicle census):
$$\text{Impact} = \left[ T_{\text{close\_hours}} \cdot \text{PCU}_{\text{eff}} \cdot (1 + W_{\text{detour}} \cdot D_{\text{mins}}) \cdot M_{\text{hospital}} \right] + \left[ T_{\text{close\_hours}} \cdot \text{Pop}_{300\text{m}} \cdot W_{\text{pop}} \right]$$
- $\text{PCU}_{\text{eff}} = \text{traffic\_pcu\_per\_hour} \times (\text{preDivert ? } 0.40 : 1.0) \times (\text{roadClosed ? } 0.05 : 1.0)$
- $D_{\text{mins}} = \text{detour\_penalty\_mins} + (\text{preDivert ? } 15 : 0) + (\text{roadClosed ? } 30 : 0)$
- $M_{\text{hospital}} = \text{hospital\_route ? } 2.5 : 1.0$
- $W_{\text{detour}} = 0.05$, $W_{\text{pop}} = 0.0001$.

---

## 5. Hotspots Dataset Calibration (`src/data/hotspots.json`)

The dataset covers **15 canonical Delhi PWD underpass and subway locations**:

| # | Underpass / Hotspot Name | Road Class | Catchment ($km^2$) | Surface ($m^2$) | Storage ($m$) | Drain ($m^3/s$) | Perm Pump ($m^3/s$) | Hospital Route |
|---|---|---|---|---|---|---|---|---|
| 1 | **Minto Bridge Underpass** | Arterial | 0.075 | 3,200 | 1.20 | 0.18 | 0.45 | Yes (LNJP) |
| 2 | **Zakhira Flyover Underpass** | Arterial | 0.090 | 4,500 | 1.40 | 0.22 | 0.40 | No |
| 3 | **Pul Prahladpur Railway Underpass** | Arterial | 0.110 | 5,200 | 1.60 | 0.20 | 0.35 | Yes (Batra) |
| 4 | **Dhaula Kuan Underpass** | Arterial | 0.080 | 6,000 | 1.50 | 0.35 | 0.80 | Yes (Army R&R) |
| 5 | **ITO Underpass** | Arterial | 0.055 | 3,500 | 1.10 | 0.22 | 0.42 | No |
| 6 | **Tilak Bridge Underpass** | Arterial | 0.052 | 2,900 | 1.00 | 0.18 | 0.35 | No |
| 7 | **Moolchand Underpass** | Arterial | 0.060 | 4,100 | 1.20 | 0.30 | 0.60 | Yes (Moolchand) |
| 8 | **Ring Road opp WHO Building** | Arterial | 0.065 | 3,800 | 1.10 | 0.28 | 0.50 | No |
| 9 | **Jahangirpuri Metro Road Dip** | Arterial | 0.095 | 4,900 | 1.20 | 0.25 | 0.38 | No |
| 10 | **Loni Road Golchakkar** | Sub-arterial | 0.060 | 3,400 | 1.00 | 0.16 | 0.30 | No |
| 11 | **Karala-Kanjhawala Road Dip** | Collector | 0.115 | 5,100 | 1.30 | 0.15 | 0.25 | No |
| 12 | **South Extension Underpass** | Arterial | 0.058 | 4,200 | 1.20 | 0.32 | 0.55 | Yes (AIIMS) |
| 13 | **Punjabi Bagh Club Dip** | Arterial | 0.062 | 4,000 | 1.10 | 0.26 | 0.48 | No |
| 14 | **Kishanganj Railway Underpass** | Sub-arterial | 0.056 | 3,100 | 1.10 | 0.17 | 0.32 | No |
| 15 | **Dwarka Sector 21 Underpass** | Arterial | 0.082 | 4,600 | 1.30 | 0.20 | 0.38 | No |

### Baseline Demo State (100 mm rain over 4 hours, 0 interventions)
Verified via `npm run print:scenario`:
- **CLEAR (5):** Dhaula Kuan ($h=0.00\,\text{m}$), Moolchand ($h=0.00\,\text{m}$), WHO Ring Road ($h=0.00\,\text{m}$), South Extension ($h=0.00\,\text{m}$), Punjabi Bagh ($h=0.00\,\text{m}$).
- **ALERT (4):** ITO ($h=0.160\,\text{m}$), Tilak Bridge ($h=0.162\,\text{m}$), Loni Road ($h=0.179\,\text{m}$), Kishanganj ($h=0.181\,\text{m}$).
- **CLOSED (6):** Minto Bridge ($h=0.531\,\text{m}$), Zakhira ($h=0.732\,\text{m}$), Pul Prahladpur ($h=0.869\,\text{m}$), Jahangirpuri ($h=0.725\,\text{m}$), Karala-Kanjhawala ($h=0.814\,\text{m}$), Dwarka Sec 21 ($h=0.537\,\text{m}$).

---

## 6. Real-Time State Management (`src/store/useStore.ts`)

Zustand manages the reactive computation loop:

```
                      ┌────────────────────────────────────────┐
                      │             Zustand Store              │
                      │  rainMm, durationH, interventions,     │
                      │  selectedHotspotId, availablePumps     │
                      └───────────────────┬────────────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   │ User alters slider, preset, or intervention │
                   ▼                                             ▼
       ┌────────────────────────┐                   ┌────────────────────────┐
       │   runAllSimulations()  │                   │ compute closureDelta   │
       │  Re-runs simulate() on │                   │ (e.g. 12 min -> 31 min)│
       │  all 15 hotspots @60fps│                   │ Auto-fades in 3000 ms  │
       └───────────┬────────────┘                   └───────────┬────────────┘
                   │                                             │
                   ▼                                             ▼
       ┌────────────────────────┐                   ┌────────────────────────┐
       │ MapView & Pins update  │                   │ CrossSectionCard & Map │
       │ Green / Amber / Red    │                   │ display live delta tag │
       └────────────────────────┘                   └────────────────────────┘
```

---

## 7. Interactive Feature Breakdown

### 1. Decision-Loop Feedback
- Changing pumps or toggling grate cleaning computes a real-time delta between previous and new time-to-closure.
- Renders an inline indicator: `(12 min -> 31 min)` or `(12 min -> --)`.
- Automatically clears after 3.0 seconds with zero decorative transition lag.

### 2. Guided First Run
- Tracks newcomer state in `localStorage` (`nirnay_guided_first_run`) with safe `try/catch`.
- Shows a 3-step checklist strip above the rainfall bar:
  1. *Drag the rainfall slider*
  2. *Add a pump at a red hotspot*
  3. *Press Find best allocation*
- Steps tick off live; includes a **"Dismiss"** button and a **"Show again"** link in the footer.

### 3. Demo Seeds
- **"Saved scenarios"** menu in the TopBar provides 4 pre-configured states from `src/data/seeds.json`:
  1. *July 2026 replay* ($180\,\text{mm}, 6\,\text{h}$)
  2. *May 2025 replay* ($65\,\text{mm}, 3\,\text{h}$)
  3. *Moderate rain* ($45\,\text{mm}, 2\,\text{h}$)
  4. *Extremely heavy rain* ($220\,\text{mm}, 6\,\text{h}$)

### 4. Grounded Q&A Assistant: "Ask NIRNAY" (`src/components/AskNirnayPanel.tsx`)
- Strictly explains simulator and optimizer outputs (never claims to "make decisions" or be an "AWS agent").
- **Entry points:**
  - `Explain` tab in RightPanel.
  - Persistent `"Ask"` button in the RightPanel header.
  - `"Ask why"` link beside the Recommend result saving closure-hours.
- **Contextual Chips:**
  - *"Why these pumps at {hotspot.name}?"*
  - *"What if I close {hotspot.name} instead?"*
  - *"How stable is this plan?"*
- **Auditability:** Collapsible `"Source: simulator output"` toggle shows a monospace table of executed tools and JSON arguments.
- **Resilience:** Fallback to `src/data/cachedAnswers.json` with a `"Cached answer"` badge if the backend is unreachable or times out after 15 seconds.

### 5. SVG Elevation Cross-Section (`src/components/CrossSectionCard.tsx`)
- Parametric SVG culvert rendering bridge overpass deck, concrete retaining walls, sump intake grate, and dynamic water polygon.
- Alert ($15\,\text{cm}$) and Closure ($20\,\text{cm}$) guide lines.
- Clamped depth: displays `>8 in` once closed (prevents unphysical depth explosions like $300\,\text{in}$).
- Three metric readouts: **Time to Alert**, **Time to Closure**, **Closure Duration**.

---

## 8. Verification & Test Suite (`src/engine/simulator.test.ts`)

Run all automated unit tests:
```bash
npm test
```

### Verified Test Assertions (5/5 Passing)
1. **Determinism:** Running `simulate()` multiple times with identical inputs produces bitwise identical numeric outputs.
2. **Zero Rain Baseline:** $0\,\text{mm}$ rainfall yields $h_{\max} = 0\,\text{m}$, `minutesToAlert = null`, `minutesToClosure = null`, and $\text{Impact} = 0$.
3. **Monotonicity (Rainfall):** For rainfall depths $R_1 < R_2$, peak depth $h_{\max}(R_1) \le h_{\max}(R_2)$ holds unconditionally across all hotspots.
4. **Monotonicity (Pumps):** For mobile pump counts $P_1 < P_2$, total closure minutes $\text{ClosureMins}(P_1) \ge \text{ClosureMins}(P_2)$ holds unconditionally.
5. **Parameter Overrides:** Raising runoff coefficient $C$ increases depth; raising pump or drain capacity decreases or maintains closure duration.

---

## 9. Team Interfaces & Handoff Checklist

| Team Member | Interface | Status / Action Item |
|---|---|---|
| **Member 1 (Hydrology / GIS)** | `data/hotspots.json` | Drop in the final GIS-calibrated `hotspots.json` matching schema §2.1. The app automatically absorbs it without code changes. |
| **Member 2 (Backend / Optimizer / Bedrock)** | `POST /api/recommend`<br>`POST /api/chat` | Wire FastAPI backend to port 8000. The frontend automatically sends requests with 15s timeout and falls back to cached fixtures if offline. |
| **Member 3 (Frontend / Demo Lead — Vansh)** | `NIRNAY App Console` | App fully built, tested, and ready for WeMakeDevs × AWS submission and live demo video recording. |

---

## 10. Available NPM Scripts

From the `frontend/` directory:

| Command | Action |
|---|---|
| `npm run dev` | Launch local Vite dev server at `http://localhost:3000` |
| `npm run build` | TypeScript typecheck (`tsc`) + Vite production bundle (`dist/`) |
| `npm run preview` | Run local production preview server |
| `npm test` | Execute Vitest unit test suite |
| `npm run print:scenario` | Run `printDefaultScenario.ts` to output the 15-hotspot demo state |
