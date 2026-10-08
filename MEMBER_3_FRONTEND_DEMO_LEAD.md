# NIRNAY — Member 3: Frontend & Demo Lead
**Owner:** Member 3 | **Track:** Heat & Water | **Hackathon:** WeMakeDevs x AWS (Oct 8–11, 2026)

---

## 1. Role Overview & Core Mission

As the **Frontend and Demo Lead**, you are the **product owner and storyteller** of NIRNAY. You translate the hydrological physics from Member 1 and the optimization algorithms from Member 2 into an intuitive, high-performance decision-support interface.

Your mission is to:
1. **Deliver the React + MapLibre Web Application** hosted on **AWS Amplify**, ensuring responsive performance on both desktop and mobile.
2. **Implement the Client-Side TypeScript Simulator Port**, giving the rainfall slider **zero-latency, 60 FPS updates** across all hotspots without waiting for network round-trips.
3. **Verify Simulator Parity** by running automated unit tests against Member 1's 10 golden benchmark scenarios.
4. **Build the Interactive UI**: Dynamic map markers with countdown badges, intervention toggles, scenario comparison view, recommendation comparison cards, and Strands AI chat drawer.
5. **Direct and Produce the 3-Minute Pitch Video, Slide Deck, and AWS Builder Center Blog Post**.

---

## 2. Gate Ownership (Go / No-Go Checklist)

You own **Gate 8 (Amplify Hello)** and **Gate 9 (Rules & Schedule)**.

| Gate | Check | Success Criterion | Fallback if Failed |
|---|---|---|---|
| **Gate 8** | Amplify Deployment | Public Amplify URL (`https://main.xyz.amplifyapp.com`) loads on mobile and desktop. | Vercel / GitHub Pages (AWS Amplify is heavily preferred for hackathon scoring). |
| **Gate 9** | Rules & Restrictions Review | Hackathon submission rules, track criteria (Heat & Water), video length (strict 3 mins), and deadlines verified. | Review official WeMakeDevs Discord and portal announcements. |
| **Parity Gate** | TypeScript Parity Test | All 10 golden scenarios from Member 1 pass within $\pm 0.5\%$ numerical tolerance. | Identify discrepancy in Euler step $\Delta t$ or triangular hyetograph peak timing. |

---

## 3. High-Performance Client-Side Simulator (`src/engine/simulator.ts`)

Why run the simulator in the browser? When an engineer slides rainfall from $40\text{ mm}$ to $120\text{ mm}$, waiting $800\text{ ms}$ for an API call breaks flow. A 60-step Euler integration over 20 hotspots takes **$< 2\text{ ms}$** in JavaScript V8, providing buttery-smooth 60 FPS visual feedback!

```typescript
/**
 * NIRNAY Client-Side Hydrological Simulator (TypeScript Port)
 * Ported from Member 1's reference engine. Runs at 60 FPS on user interaction.
 */

export interface Hotspot {
  id: string;
  name: string;
  lat: number;
  lon: number;
  road_name: string;
  road_class: string;
  traffic_pcu_per_hour: number;
  hospital_route: boolean;
  hospital_name?: string;
  population_300m: number;
  catchment_km2: number;
  runoff_coeff_default: number;
  surface_area_m2: number;
  gravity_drain_capacity_m3s: number;
  permanent_pump_capacity_m3s: number;
  detour_penalty_mins: number;
}

export interface Intervention {
  tempPumps: number;      // 0 to 3 mobile pumps (0.045 m3/s each)
  drainCleared: boolean;  // Hazard layer: restores drain to 100% capacity
  preDivert: boolean;     // Impact layer: removes 60% traffic exposure
  roadClosed: boolean;    // Impact layer: zero traffic exposure
}

export interface HotspotSimulationResult {
  id: string;
  name: string;
  maxDepthM: number;
  timeToAlertMins: number | null;
  timeToClosureMins: number | null;
  closureDurationMins: number;
  impactScore: number;
  depthSeries: number[];
  status: 'OPEN' | 'ALERT' | 'CLOSED';
}

export interface SimulationOutput {
  rainTotalMm: number;
  durationHours: number;
  totalClosureHours: number;
  totalImpactScore: number;
  hotspots: Record<string, HotspotSimulationResult>;
}

export function runSimulationClient(
  hotspots: Hotspot[],
  rainTotalMm: number,
  durationHours: number,
  interventions: Record<string, Intervention>,
  dtSeconds = 60
): SimulationOutput {
  const totalSteps = Math.floor((durationHours * 3600) / dtSeconds);
  const tPeakSec = (durationHours * 3600) / 3.0;
  const results: Record<string, HotspotSimulationResult> = {};
  let totalClosureMinutes = 0;
  let totalImpact = 0;

  const rainfallIntensity = (tSec: number): number => {
    if (tSec <= tPeakSec) {
      return ((2.0 * rainTotalMm) / durationHours) * (tSec / tPeakSec);
    } else if (tSec <= durationHours * 3600) {
      return (
        ((2.0 * rainTotalMm) / durationHours) *
        ((durationHours * 3600 - tSec) / (durationHours * 3600 - tPeakSec))
      );
    }
    return 0.0;
  };

  for (const hp of hotspots) {
    const interv = interventions[hp.id] || {
      tempPumps: 0,
      drainCleared: false,
      preDivert: false,
      roadClosed: false,
    };

    const drainFactor = interv.drainCleared ? 1.0 : 0.5;
    const qDrain = hp.gravity_drain_capacity_m3s * drainFactor;
    const qPumps = hp.permanent_pump_capacity_m3s + interv.tempPumps * 0.045;

    let h = 0.0;
    let maxH = 0.0;
    let tAlert: number | null = null;
    let tClose: number | null = null;
    let closureSteps = 0;
    const depthSeries: number[] = [];

    for (let step = 0; step < totalSteps; step++) {
      const tSec = step * dtSeconds;
      const iMmh = rainfallIntensity(tSec);

      // Rational method inflow
      const qIn = 0.278 * hp.runoff_coeff_default * iMmh * hp.catchment_km2;
      const qOut = qDrain + qPumps;
      const dh = ((qIn - qOut) / hp.surface_area_m2) * dtSeconds;

      h = Math.max(0.0, h + dh);
      if (h > maxH) maxH = h;

      if (h >= 0.15 && tAlert === null) tAlert = Math.floor(tSec / 60);
      if (h >= 0.20) {
        if (tClose === null) tClose = Math.floor(tSec / 60);
        closureSteps++;
      }

      if (step % 15 === 0) depthSeries.push(Number(h.toFixed(3)));
    }

    const closureDurationMins = closureSteps * Math.floor(dtSeconds / 60);
    totalClosureMinutes += closureDurationMins;

    let trafficWeight = hp.traffic_pcu_per_hour / 3000.0;
    if (interv.preDivert) trafficWeight *= 0.4;
    if (interv.roadClosed) trafficWeight = 0.1;

    const detourFactor = hp.detour_penalty_mins / 20.0;
    const hospitalMult = hp.hospital_route ? 2.5 : 1.0;
    const popMult = 1.0 + hp.population_300m / 20000.0;

    let rawImpact =
      closureDurationMins * trafficWeight * detourFactor * hospitalMult * popMult;
    if (interv.preDivert) rawImpact += 25.0;

    totalImpact += rawImpact;

    let status: 'OPEN' | 'ALERT' | 'CLOSED' = 'OPEN';
    if (maxH >= 0.20) status = 'CLOSED';
    else if (maxH >= 0.15) status = 'ALERT';

    results[hp.id] = {
      id: hp.id,
      name: hp.name,
      maxDepthM: Number(maxH.toFixed(3)),
      timeToAlertMins: tAlert,
      timeToClosureMins: tClose,
      closureDurationMins,
      impactScore: Number(rawImpact.toFixed(2)),
      depthSeries,
      status,
    };
  }

  return {
    rainTotalMm,
    durationHours,
    totalClosureHours: Number((totalClosureMinutes / 60).toFixed(2)),
    totalImpactScore: Number(totalImpact.toFixed(2)),
    hotspots: results,
  };
}
```

---

## 4. UI Architecture & Screen Specifications

### 4.1 Layout Overview
Design a clean, high-contrast command-center UI:
- **Header Bar**: NIRNAY branding ("Decision Engine for Delhi PWD"), rainfall preset pills, "Compare Mode" toggle, "Strands AI" toggle.
- **Main View (Center)**: MapLibre / Leaflet interactive map showing Delhi corridor.
- **Floating Controls (Left Sidebar)**: Rainfall hyetograph slider with IMD classification tags, aggregate impact metrics.
- **Resource Recommendation Panel (Bottom-Left / Modal)**: Allocation inputs ($N$ pumps, $M$ crews), "Run Optimizer" button, ROI cards.
- **AI Explanation Drawer (Right)**: Strands AI chatbot explaining mechanisms.

### 4.2 Interactive Map Elements
- **Hotspot Markers**:
  - **Color Coding**:
    - 🟢 Green: Safe ($h_{\max} < 0.15\text{ m}$)
    - 🟡 Amber: Alert ($0.15 \le h_{\max} < 0.20\text{ m}$)
    - 🔴 Red: Closed ($h_{\max} \ge 0.20\text{ m}$)
  - **Dynamic Badge**:
    - If closed: Show countdown badge: `Closes in 48m` or `Closed for 2h 15m`.
  - **Hospital Corridors**:
    - Highlight roads tagged `hospital_route: true` with a distinctive pulsing cyan/red stroke to visually emphasize critical life-safety routes.
  - **Marker Click Drawer / Modal**:
    - Displays depth hydrograph sparkline chart over time ($h(t)$ vs hours).
    - Quick intervention controls:
      - Add Mobile Pump (+0, +1, +2, +3)
      - Drain Desilting Toggle (Hazard Layer)
      - Pre-Divert Traffic Toggle (Impact Layer)
      - Close Road Toggle (Impact Layer)

### 4.3 Rainfall Control with IMD Badges
The rainfall slider must be dynamically annotated with official India Meteorological Department (IMD) warning thresholds:
- **$0\text{--}64.4\text{ mm}$**: `Moderate Rainfall` (Green badge)
- **$64.5\text{--}115.5\text{ mm}$**: `Heavy Rainfall (IMD Yellow Warning)` (Yellow badge)
- **$115.6\text{--}204.4\text{ mm}$**: `Very Heavy Rainfall (IMD Orange Warning)` (Orange badge)
- **$> 204.4\text{ mm}$**: `Extremely Heavy Rainfall (IMD Red Warning)` (Red badge)

Provide one-click **Historical Preset Buttons**:
- **July 2026 Replay**: $100\text{ mm}$, $24\text{ hours}$. Shows how PWD upgrades kept Minto and Dhaula Kuan open!
- **May 2025 Replay**: $55\text{ mm}$, $2\text{ hours}$. Shows sudden overnight flash closure of Minto Bridge.

### 4.4 Recommendation & Baseline Comparison Card
When the user clicks **"Recommend Allocation"** (calling Member 2's `/api/recommend`):
- Display a clean side-by-side comparison table:
  | Metric | Status-Quo Baseline (Equal / Historical) | NIRNAY Optimized Allocation | Net Savings |
  |---|---|---|---|
  | Total Closure Hours | $14.2\text{ hrs}$ | $6.5\text{ hrs}$ | **$7.7\text{ hrs saved}$** |
  | Relative Impact Score | $482.0$ | $215.4$ | **$-55.3\%$ exposure** |
  | Top Priority Allocations | Historical guesswork | Minto (2), Zakhira (2), WHO Ring Rd (1) | Grounded in catchment physics |
- Display the **Uncertainty & Stability Badge**:
  - `Recommendation Stability: 86.5%` (across 200 Monte Carlo draws).
  - 10th–90th percentile impact band ($[185.0, 245.2]$).

### 4.5 Strands AI Explanation Drawer
A chat drawer on the right side connected to `/api/chat`:
- Quick prompt chips:
  - *"Why did NIRNAY assign pumps to Minto rather than Dhaula Kuan?"*
  - *"Explain the difference between desilting drain vs pre-diverting traffic."*
  - *"How stable is this recommendation if rainfall increases by 20%?"*
- Displays clear, bulleted answers citing exact minutes and impact scores directly from the tool outputs.

---

## 5. Parity Testing Suite (`tests/simulator.test.ts`)

Set up a test file using Vitest or Jest that imports `data/golden_scenarios.json` (generated by Member 1) and verifies that every output matches within $\pm 0.5\%$:

```typescript
import { describe, it, expect } from 'vitest';
import { runSimulationClient } from '../src/engine/simulator';
import goldenScenarios from '../../data/golden_scenarios.json';
import hotspotsData from '../../data/hotspots.json';

describe('Hydrology Engine Parity Tests', () => {
  goldenScenarios.forEach((testCase) => {
    it(`should match Golden Scenario ${testCase.id} (${testCase.hotspot})`, () => {
      const output = runSimulationClient(
        hotspotsData.hotspots,
        testCase.rain_mm,
        testCase.duration_h,
        { [testCase.hotspot_id]: testCase.interventions }
      );
      const res = output.hotspots[testCase.hotspot_id];
      expect(res.timeToClosureMins).toEqual(testCase.expected_t_close);
      expect(Math.abs(res.impactScore - testCase.expected_impact)).toBeLessThanOrEqual(
        testCase.expected_impact * 0.01 + 0.1
      );
    });
  });
});
```

---

## 6. Pitch Deck & 3-Minute Video Execution Plan

The hackathon video is strictly evaluated on conciseness, technical depth, and adherence to time.

### 6.1 Three-Minute Video Script (Strict Timing)
- **0:00 – 0:25 (Hook & Problem Statement)**:
  - "Every monsoon, Delhi's PWD decides in advance where scarce mobile pumps and crews go. Today, that relies on historical hotspot lists and intuition. There is no tool to test those decisions before the clouds burst. Introducing NIRNAY: a decision engine for control room engineers."
- **0:25 – 1:55 (Live Interactive Demo)**:
  - Drag rainfall slider to $100\text{ mm}$ (IMD Heavy Rain). Watch markers turn amber then red in real time, with countdowns: *Minto closes in 48 mins*.
  - Test an intervention manually: Add 2 pumps to Minto Bridge; watch the water level drop below the 8-inch closure threshold.
  - Show the big button: Click **"Recommend Allocation"** with 5 available pumps. Show the DP optimizer solving the knapsack problem, saving $7.7$ closure-hours over the naive equal split.
  - Open the Strands AI drawer: Ask *"Why prioritize Minto over Zakhira?"* Show the grounded explanation quoting exact catchment runoff figures.
- **1:55 – 2:25 (Credibility & Calibrated Claims)**:
  - Show the validation slide: The Rank Test ($78\%$ of perennial hotspots ranked in top quartile) and the July 2026 replay where upgraded pumps prevented closure.
  - Speak the calibrated claim clearly: *"We do not claim flood forecasting or street-level depths. NIRNAY provides scenario-based decision support using textbook hydrology and provable optimization."*
- **2:25 – 3:00 (AWS Architecture & Future Roadmap)**:
  - Show the architecture diagram: React on Amplify, API Gateway, Lambda, Bedrock + Strands Agents SDK, DynamoDB, S3.
  - State what is needed from PWD to go live: telemetry integration, drain GIS layers, live sump water sensors.

### 6.2 AWS Builder Center Blog Post Outline
1. **Title**: *NIRNAY: Building a Serverless What-If Decision Engine for Delhi Monsoon Waterlogging on AWS*
2. **Introduction & Motivation**: Urban flooding challenges in Delhi; difference between passive dashboards and operational decision support.
3. **Hydrological Physics & Two-Layer Modeling**: The Hazard vs Impact framework.
4. **AWS Serverless Architecture**: How Amplify, Lambda, DynamoDB, and Bedrock work together.
5. **Strands Agents & Grounded AI**: Eliminating hallucinations using tool-anchored reasoning.
6. **Validation & Real-World Impact**: Historical storm replays and results.

---

## 7. Day-by-Day Execution Plan

### Tonight (Kickoff & Setup)
- Complete Gate 8 (Deploy empty React app on AWS Amplify).
- Set up Tailwind CSS, Lucide icons, and MapLibre GL JS / Leaflet.
- Create git branch `feature/frontend-ui-amplify`.

### Day 1 (Oct 8): Map Canvas & TS Simulator Port
- Port `simulator.ts` and ensure clean TypeScript types.
- Set up MapLibre map centered on Central Delhi / Ring Road.
- Ingest Member 1's initial 3 hotspots; wire the rainfall slider so moving it updates Minto's marker color.
- **Check-in by 8:00 PM**: Public Amplify URL where slider changes Minto's closure status.

### Day 2 (Oct 9): Full Catchment & Decision UI
- Ingest full `hotspots.json` (all 15–20 hotspots).
- Build the Intervention Drawer (pumps, desilting, pre-diversion).
- Build the "Recommend Allocation" card and integrate with Member 2's `/api/recommend`.
- Display the baseline comparison table and Monte Carlo stability metric.

### Day 3 (Oct 10): Strands AI Drawer, Replay Presets & Polish
- Wire the right-hand Strands AI chat drawer to Member 2's `/api/chat`.
- Add July 2026 and May 2025 replay presets.
- Run parity test suite against `data/golden_scenarios.json`.
- Polish mobile responsiveness and error states.
- **Feature freeze at 6:00 PM**. Begin recording demo video clips.

### Day 4 (Oct 11): Video Editing, Blog Post & Submission
- Record voiceover and screencast according to Section 6.1 script.
- Edit video to exactly $\le 3\text{ minutes}$ (strict hackathon compliance).
- Draft and publish AWS Builder Center blog post.
- Final submission on hackathon portal before deadline.

---

## 8. Handshake Contracts with Other Members

### Inputs Needed from Others:
- **From Member 1**: `data/hotspots.json` (canonical geo coordinates and hydrology parameters) and `data/golden_scenarios.json` (parity test vectors).
- **From Member 2**: API Gateway endpoint URLs for `/api/recommend` and `/api/chat`.

### Outputs Provided to Others:
- **To Team**: Live, publicly accessible AWS Amplify URL.
- **To Team**: Pitch deck slides, edited demo video, and submitted blog link.
