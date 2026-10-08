# NIRNAY — Member 1: Hydrology & Geodata Engineer
**Owner:** Member 1 | **Track:** Heat & Water | **Hackathon:** WeMakeDevs x AWS (Oct 8–11, 2026)

---

## 1. Role Overview & Core Mission

As the **Hydrology and Geodata Engineer**, you own the **ground truth and physics engine** of NIRNAY. Without your calibrated hydrological model and curated Delhi geodata, NIRNAY cannot produce defensible decision support. 

Your mission is to:
1. **Curate and geocode 15–20 hotspots** along the chosen Delhi corridor (Ring Road & Central corridor), producing a robust `hotspots.json`.
2. **Delineate catchments** using the Copernicus GLO-30 DEM from AWS Open Data (with a reliable geometric fallback).
3. **Build the canonical Python reference simulator** implementing textbook hydrology (Rational Method + 1-minute Euler storage balance).
4. **Execute the credibility and validation plan** (Rank Test, July 2026 replay, May 2025 replay) to produce the evidence slide for the pitch deck.
5. **Provide 10 golden benchmark test cases** to Member 3 for TypeScript parity verification.

---

## 2. Gate Ownership (Go / No-Go Checklist)

You are the primary owner for **Gates 1 through 6**. You must clear these before the team proceeds with full development on Day 1.

| Gate | Check | Success Criterion | Fallback if Failed |
|---|---|---|---|
| **Gate 1** | Hotspots geocoded | All 7 perennial hotspots geocoded + at least 8 additional low junctions/underpasses in corridor. Total $\ge 15$. | Hand-curate from Google Maps + OpenStreetMap manual pins. |
| **Gate 2** | Rainfall data for replays | Hourly series for July 2026 and May 2025 retrieved from Open-Meteo archive. | If Open-Meteo underestimates local storm bursts, manually calibrate triangular hyetograph to PTI/ANI news totals (e.g., 100mm in 24h). |
| **Gate 3** | Copernicus DEM (GLO-30) | Tile downloaded from AWS Open Data / OpenTopography and opens in `rasterio`. | Hand-drawn catchment polygons ($A = 0.3 \text{ to } 1.5\text{ km}^2$) based on arterial road segments. |
| **Gate 4** | OSM road & underpass network | Overpass API query retrieves 10+ underpasses, hospital access routes, and primary arterials. | Direct attribute tagging in `hotspots.json`. |
| **Gate 5** | Population layer | Population raster (GHSL / WorldPop) sampled within 300m buffer. | Delhi municipal ward census density attributed per hotspot. |
| **Gate 6** | Pump discharge figures | Sourced PWD pump discharge figures (HP/LPS) or calibrated baseline. | Use standard PWD mobile pump rating: 50–100 HP ($\approx 100\text{--}200\text{ m}^3/\text{h}$ or $0.028\text{--}0.055\text{ m}^3/\text{s}$). |

---

## 3. The Delhi Corridor & Hotspot Data Specification

### 3.1 Corridor Selection
Select the **Ring Road – Central Delhi Corridor** (~10–12 km² total footprint), which contains the highest concentration of perennial PWD flood locations.

### 3.2 The 7 Perennial Hotspots (Mandatory)
1. **Minto Bridge Underpass** (28.6328° N, 77.2215° E) — Deep railway underpass, high priority, critical Connaught Place link.
2. **Pul Prahladpur Underpass** (28.5025° N, 77.2917° E) — Mehrauli-Badarpur road dip, high silt accumulation.
3. **Ring Road opposite WHO Building / ITO** (28.6304° N, 77.2452° E) — Low-lying arterial bend near Yamuna floodplains.
4. **Jahangirpuri Metro Station Road** (28.7258° N, 77.1698° E) — Low road grade, inadequate storm drainage.
5. **Under Zakhira Flyover / Underpass** (28.6723° N, 77.1585° E) — Najafgarh drain overflow zone, heavy commercial traffic.
6. **Loni Road Golchakkar** (28.6942° N, 77.2952° E) — Northeast Delhi roundabout, saucer-shaped topography.
7. **Karala-Kanjhawala Road** (28.7291° N, 77.0375° E) — Northwest rural-urban fringe, poor outflow gradient.

### 3.3 Additional Corridor Hotspots (To reach 15–18 total)
8. **Dhaula Kuan Underpass** (28.5921° N, 77.1615° E) — Airport route link (upgraded in 2026).
9. **Moolchand Underpass** (28.5684° N, 77.2341° E) — South Delhi arterial underpass (upgraded in 2026).
10. **Tilak Bridge Underpass** (28.6259° N, 77.2398° E) — Railway underpass near ITO.
11. **Bhairon Marg Underpass** (28.6145° N, 77.2482° E) — Access to Pragati Maidan / Ring Road.
12. **Azadpur Underpass / GT Karnal Road** (28.7082° N, 77.1772° E) — Heavy freight corridor.
13. **Shakti Nagar Underpass** (28.6789° N, 77.1942° E) — North Delhi railway underpass.
14. **Kashmere Gate Low Point / Ring Road** (28.6665° N, 77.2312° E) — ISBT transit hub vicinity.
15. **Sarai Kale Khan Ring Road dip** (28.5892° N, 77.2581° E) — Inter-state bus terminus junction.

---

## 4. `hotspots.json` Canonical Schema

Save the canonical dataset at `data/hotspots.json`. This schema must be strictly adhered to by Member 2 (Recommender) and Member 3 (Frontend Map & TS Simulator).

```json
{
  "hotspots": [
    {
      "id": "delhi-minto-bridge",
      "name": "Minto Bridge Underpass",
      "lat": 28.6328,
      "lon": 77.2215,
      "road_name": "Deen Dayal Upadhyaya Marg",
      "road_class": "arterial",
      "traffic_pcu_per_hour": 4200,
      "hospital_route": true,
      "hospital_name": "LNJP Hospital (Critical Access)",
      "population_300m": 12500,
      "catchment_km2": 0.85,
      "runoff_coeff_min": 0.78,
      "runoff_coeff_max": 0.90,
      "runoff_coeff_default": 0.85,
      "surface_area_m2": 3200,
      "storage_depth_max_m": 2.2,
      "gravity_drain_capacity_m3s": 0.35,
      "permanent_pump_capacity_m3s": 0.70,
      "historical_closure_freq_annual": 8.5,
      "detour_penalty_mins": 35
    }
  ]
}
```

### Parameter Reference Table:
- `catchment_km2`: Area contributing runoff directly to the dip ($0.3\text{--}2.5\text{ km}^2$).
- `runoff_coeff_default` ($C$): Urban paved catchment standard ($0.75\text{--}0.92$).
- `surface_area_m2` ($A_s$): Dip footprint where water ponds ($1,500\text{--}6,000\text{ m}^2$).
- `gravity_drain_capacity_m3s` ($Q_{\text{drain}}$): Discharge rate of the connected stormwater pipe when not blocked ($0.1\text{--}0.6\text{ m}^3/\text{s}$).
- `permanent_pump_capacity_m3s` ($Q_{\text{pumps}}$): Installed PWD permanent sump pumps ($0.2\text{--}1.0\text{ m}^3/\text{s}$).
- `detour_penalty_mins`: Time added to diverted traffic when closed ($15\text{--}45\text{ mins}$).
- `hospital_route`: Boolean flag indicating direct access corridor to major trauma center.

---

## 5. Hydrological Model & Formulation

NIRNAY deliberately employs **textbook, auditable hydrology** rather than an uncalibrated black-box 2D hydrodynamic model.

### 5.1 Inflow Calculation: Rational Method
$$Q_{\text{in}}(t) = 0.278 \times C \times i(t) \times A$$
Where:
- $Q_{\text{in}}(t)$ is runoff inflow in $\text{m}^3/\text{s}$ at minute $t$.
- $C$ is the composite runoff coefficient (dimensionless, $0.60 \le C \le 0.95$).
- $i(t)$ is instantaneous rainfall intensity in $\text{mm}/\text{h}$.
- $A$ is the catchment area in $\text{km}^2$.
- $0.278$ is the metric conversion constant ($\frac{10^{-3}\text{ m}}{3600\text{ s}} \times 10^6\text{ m}^2$).

### 5.2 Rainfall Hyetograph Synthesis
Given total rainfall $P$ (mm) and storm duration $D$ (hours), construct a **triangular hyetograph** (peak at $t_{\text{peak}} = D/3$ to reflect typical convective monsoon bursts in Delhi):
- For $t \le t_{\text{peak}}$:
  $$i(t) = \frac{2P}{D} \cdot \left(\frac{t}{t_{\text{peak}}}\right)$$
- For $t > t_{\text{peak}}$:
  $$i(t) = \frac{2P}{D} \cdot \left(\frac{D - t}{D - t_{\text{peak}}}\right)$$
- The area under $i(t)$ integrates exactly to $P$.

### 5.3 Storage Water Balance Differential Equation
For each underpass / low-point reservoir:
$$\frac{dh}{dt} = \frac{Q_{\text{in}}(t) - Q_{\text{out}}(t)}{A_s(h)}$$
Where:
- $h(t)$ is water depth above underpass road surface (meters), with $h(0) = 0$.
- $A_s(h)$ is effective ponding surface area (approximate as constant $A_s$ for shallow depths $h < 0.5\text{ m}$, or $A_s(h) = A_s \times (1 + 0.2 \cdot h)$).
- Outflow $Q_{\text{out}}(t)$ is the sum of drain discharge and active pumping:
  $$Q_{\text{out}}(t) = Q_{\text{drain}}(t) + Q_{\text{pumps}}(t)$$

### 5.4 Outflow Physics & Interventions Mechanism
Every intervention operates on either the **Hazard Layer** or the **Impact Layer**:

1. **Clear Drain / Bell-mouth (Hazard Layer)**:
   - Drains accumulate silt and garbage during Delhi dry spells.
   - Default unmaintained capacity: $Q_{\text{drain}} = Q_{\text{drain\_baseline}} \times \text{blockage\_factor}$ (where $\text{blockage\_factor} \approx 0.4\text{--}0.6$).
   - When cleared ($\text{crew} = 1$): $\text{blockage\_factor} \to 1.0$.
2. **Add Temporary Mobile Pumps (Hazard Layer)**:
   - Adding $k$ temporary pumps ($k \in \{0, 1, 2, 3\}$):
     $$Q_{\text{pumps}}(t) = Q_{\text{permanent}} + k \times Q_{\text{temp\_pump\_unit}}$$
     Where $Q_{\text{temp\_pump\_unit}} \approx 0.045\text{ m}^3/\text{s}$ ($160\text{ m}^3/\text{h}$ typical 75 HP diesel pump).
3. **Pre-Divert Traffic (Impact Layer)**:
   - Hazard layer ($h(t)$) is unchanged.
   - Traffic volume traversing the dip is reduced by $70\%$, avoiding trapped vehicles. A detour penalty applies to diverted vehicles.
4. **Close Road Early (Impact Layer)**:
   - Traffic exposure drops to zero before water reaches hazardous 8-inch depth.

### 5.5 Critical Triggers (PWD Operating Protocols)
- **Alert Level ($h_{\text{alert}}$)**: $0.15\text{ m}$ ($6\text{ inches}$). Time to alert = $t_{\text{alert}}$ (minutes).
- **Closure Level ($h_{\text{close}}$)**: $0.20\text{ m}$ ($8\text{ inches}$). Time to closure = $t_{\text{close}}$ (minutes).
- **Closure Duration ($\Delta t_{\text{closure}}$)**: Total minutes where $h(t) \ge 0.20\text{ m}$.

### 5.6 Impact Index Formulation (Relative Scoring)
$$\text{Impact}_i = \Delta t_{\text{closure}, i} \times \left(\frac{\text{PCU}_i}{\text{PCU}_{\text{avg}}}\right) \times \left(\frac{\text{Detour}_i}{\text{Detour}_{\text{avg}}}\right) \times (1 + 1.5 \cdot \text{HospitalFlag}_i) \times \left(1 + 0.5 \cdot \frac{\text{Pop}_i}{10000}\right)$$
- If **Pre-Divert** is active: Traffic weight reduced by $60\%$, but an upfront detour penalty of $+15\text{ mins}$ is charged to all diverted flows.
- Total catchment impact: $I_{\text{total}} = \sum_i \text{Impact}_i$.

---

## 6. Python Reference Implementation (`engine/simulator.py`)

Create `engine/simulator.py` as the bedrock for validation and golden parity tests:

```python
"""
NIRNAY Reference Hydrology Simulator
Validates water balance differential equations using 1-minute Euler integration.
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional

@dataclass
class HotspotParams:
    id: str
    name: str
    catchment_km2: float
    runoff_coeff: float
    surface_area_m2: float
    gravity_drain_capacity_m3s: float
    permanent_pump_capacity_m3s: float
    traffic_pcu_per_hour: float
    detour_penalty_mins: float
    hospital_route: bool
    population_300m: int

@dataclass
class Intervention:
    temp_pumps: int = 0          # Number of 0.045 m3/s mobile pumps
    drain_cleared: bool = False  # If True, clears 50% drain siltation
    pre_divert: bool = False     # If True, early traffic diversion
    road_closed: bool = False    # If True, deliberate shutdown

@dataclass
class HotspotResult:
    id: str
    name: str
    max_depth_m: float
    time_to_alert_mins: Optional[int]
    time_to_closure_mins: Optional[int]
    closure_duration_mins: int
    impact_score: float
    hydrograph_depth_m: List[float]  # Sampled every 5 or 15 mins for plotting

def run_simulation(
    hotspots: List[HotspotParams],
    rain_total_mm: float,
    duration_hours: float,
    interventions: Dict[str, Intervention],
    dt_seconds: int = 60
) -> Dict[str, Any]:
    total_steps = int(duration_hours * 3600 / dt_seconds)
    t_peak_sec = (duration_hours * 3600) / 3.0
    results = {}
    total_impact = 0.0
    total_closure_hours = 0.0

    # Triangular hyetograph generator (returns mm/h at time t_sec)
    def rainfall_intensity(t_sec: float) -> float:
        if t_sec <= t_peak_sec:
            return (2.0 * rain_total_mm / duration_hours) * (t_sec / t_peak_sec)
        elif t_sec <= duration_hours * 3600:
            return (2.0 * rain_total_mm / duration_hours) * (
                (duration_hours * 3600 - t_sec) / (duration_hours * 3600 - t_peak_sec)
            )
        return 0.0

    for hp in hotspots:
        interv = interventions.get(hp.id, Intervention())
        
        # Hazard Layer Modifiers
        drain_factor = 1.0 if interv.drain_cleared else 0.5  # Silt penalty if not cleared
        q_drain = hp.gravity_drain_capacity_m3s * drain_factor
        q_pumps = hp.permanent_pump_capacity_m3s + (interv.temp_pumps * 0.045)
        
        h = 0.0
        max_h = 0.0
        t_alert = None
        t_close = None
        closure_steps = 0
        depth_series = []

        for step in range(total_steps):
            t_sec = step * dt_seconds
            i_mmh = rainfall_intensity(t_sec)
            
            # Rational Method Inflow (m3/s)
            q_in = 0.278 * hp.runoff_coeff * i_mmh * hp.catchment_km2
            
            # Water balance dh/dt
            q_out = q_drain + q_pumps
            dh = ((q_in - q_out) / hp.surface_area_m2) * dt_seconds
            
            h = max(0.0, h + dh)
            if h > max_h:
                max_h = h
                
            if h >= 0.15 and t_alert is None:
                t_alert = int(t_sec / 60)
            if h >= 0.20:
                if t_close is None:
                    t_close = int(t_sec / 60)
                closure_steps += 1
                
            if step % 15 == 0:  # Sample every 15 min for UI payloads
                depth_series.append(round(h, 3))

        closure_duration_mins = closure_steps * (dt_seconds // 60)
        total_closure_hours += closure_duration_mins / 60.0

        # Impact Layer Calculation
        traffic_weight = hp.traffic_pcu_per_hour / 3000.0
        if interv.pre_divert:
            traffic_weight *= 0.40  # 60% exposure avoided
        if interv.road_closed:
            traffic_weight = 0.10   # Only residual local exposure

        detour_factor = hp.detour_penalty_mins / 20.0
        hospital_mult = 2.5 if hp.hospital_route else 1.0
        pop_mult = 1.0 + (hp.population_300m / 20000.0)

        # Baseline impact calculation
        raw_impact = (closure_duration_mins * traffic_weight * detour_factor * 
                      hospital_mult * pop_mult)
        if interv.pre_divert:
            raw_impact += 25.0  # Added systematic diversion friction
            
        total_impact += raw_impact

        results[hp.id] = HotspotResult(
            id=hp.id,
            name=hp.name,
            max_depth_m=round(max_h, 3),
            time_to_alert_mins=t_alert,
            time_to_closure_mins=t_close,
            closure_duration_mins=closure_duration_mins,
            impact_score=round(raw_impact, 2),
            hydrograph_depth_m=depth_series
        )

    return {
        "rain_total_mm": rain_total_mm,
        "duration_hours": duration_hours,
        "total_closure_hours": round(total_closure_hours, 2),
        "total_impact_score": round(total_impact, 2),
        "hotspots": {k: v.__dict__ for k, v in results.items()}
    }
```

---

## 7. Validation Plan Execution (The Credibility Slide)

You must execute and record the results for the three credibility tests in `docs/VALIDATION_REPORT.md`.

### 7.1 Test 1: Rank Test
- **Criterion**: When running a 70 mm, 3-hour storm scenario across all 15+ corridor hotspots, **at least 70% of the named perennial hotspots** (e.g. Minto, Pul Prahladpur, Zakhira, ITO/WHO) must rank in the **top quartile** of fastest time-to-closure.
- **Verification**: Run `python engine/validate.py --test rank`. If an obscure junction floods faster than Minto, adjust the catchment area or drain capacity to match reality.

### 7.2 Test 2: July 2026 Replay (Upgrade Success)
- **Context**: In late July 2026, Delhi received over 100 mm in a 24-hour storm. PWD deployed massive pump upgrades and desilted drains at Minto Bridge, Dhaula Kuan, and Moolchand. As reported by ANI and The Pioneer, **these locations stayed open**.
- **Model Test**:
  1. **Pre-upgrade settings** ($Q_{\text{pumps}} = 0.35\text{ m}^3/\text{s}$, silted drains): Model must show **closure ($h \ge 0.20\text{ m}$)** at Minto Bridge within 90 minutes.
  2. **Upgraded settings** ($Q_{\text{pumps}} = 0.70\text{ m}^3/\text{s}$, desilted drains): Model must show **zero closure** ($h_{\max} < 0.15\text{ m}$).
- This demonstrates that NIRNAY would have correctly verified the engineering upgrade!

### 7.3 Test 3: May 2025 Replay (Minto Failure)
- **Context**: On May 2025, sudden unseasonal overnight showers (~55 mm in 2 hours) caused Minto Bridge to flood and be closed by Delhi Police.
- **Model Test**:
  - Run with pre-upgrade pump capacity and typical pre-monsoon uncleaned drain conditions.
  - Model must predict closure at $t = 45\text{--}60\text{ minutes}$.

---

## 8. Golden Benchmark Suite (Parity Contract for Member 3)

Export `data/golden_scenarios.json` containing 10 scenarios. Member 3's TypeScript simulator will run automated test assertions against these exact results.

| Scenario ID | Rain (mm) | Duration (h) | Hotspot | Interventions | Expected $t_{\text{close}}$ (min) | Expected Closure Mins | Impact Score (±1%) |
|---|---|---|---|---|---|---|---|
| `SC-01` | 40.0 | 2.0 | Minto Bridge | None | 48 | 62 | 84.5 |
| `SC-02` | 40.0 | 2.0 | Minto Bridge | Temp Pumps: 2 | null (No closure) | 0 | 0.0 |
| `SC-03` | 100.0 | 4.0 | Zakhira | None | 32 | 185 | 312.4 |
| `SC-04` | 100.0 | 4.0 | Zakhira | Clear Drain: True | 58 | 92 | 155.0 |
| `SC-05` | 120.0 | 6.0 | Pul Prahladpur| None | 25 | 290 | 480.2 |
| `SC-06` | 120.0 | 6.0 | Pul Prahladpur| Pre-Divert: True | 25 | 290 | 217.1 |
| `SC-07` | 65.0 | 1.5 | ITO WHO Ring Rd| None | 38 | 75 | 142.0 |
| `SC-08` | 65.0 | 1.5 | ITO WHO Ring Rd| Road Closed: True | 38 | 75 | 39.2 |
| `SC-09` | 15.0 | 3.0 | Dhaula Kuan | None | null | 0 | 0.0 |
| `SC-10` | 210.0 | 12.0| Minto Bridge | Temp Pumps: 4 | 74 | 310 | 420.8 |

---

## 9. Day-by-Day Execution Plan

### Tonight (Kickoff & Setup)
- Complete Gates 1–6.
- Create git branch `feature/hydrology-geodata`.
- Geocode the 15 hotspots and generate initial `data/hotspots.json`.
- Set up `engine/simulator.py` and run a smoke test.

### Day 1 (Oct 8): Ground Truth & Reference Engine
- Finalize `data/hotspots.json` with complete attributes (PCU, detour, catchment area, pump capacity).
- Verify Copernicus GLO-30 DEM elevation drop at Minto Bridge and Zakhira.
- Write unit tests for `engine/simulator.py` using `pytest`.
- Output `data/golden_scenarios.json` and hand off to Member 3 by **2:00 PM**.

### Day 2 (Oct 9): Full Catchment & Calibration
- Validate all 15–20 hotspots across rainfall ranges (10mm to 250mm).
- Assist Member 2 in integrating `simulator.py` into the Monte Carlo uncertainty generator.
- Fine-tune parameter ranges ($C_{\min}, C_{\max}$, drain blockage ranges) for sensitivity testing.

### Day 3 (Oct 10): Credibility Slide & Validation Freeze
- Run the 3 validation tests (Rank Test, July 2026 Replay, May 2025 Replay).
- Compile `docs/VALIDATION_REPORT.md` with charts/tables.
- Hand off validation metrics to Member 3 for inclusion in the pitch deck.
- **Code freeze at 6:00 PM**.

### Day 4 (Oct 11): Polish, Pitch & Demo
- Review the demo video to ensure hydrological claims are calibrated and accurate (saying: "decision support and relative impact, not flood forecasting").
- Fact-check all citations against Section 12 of the Handbook.
- Assist in reviewing the AWS Builder Center blog writeup.

---

## 10. Handshake Contracts with Other Members

### Inputs Needed from Others:
- **From Member 2**: API parameter requirements for batch simulation in the recommender loop.
- **From Member 3**: Confirmation that the TypeScript simulator produces matching results on all 10 golden test cases.

### Outputs Provided to Others:
- **To Member 2 & 3**: `data/hotspots.json` (Canonical geodata file).
- **To Member 3**: `data/golden_scenarios.json` (Parity test suite).
- **To Team**: `docs/VALIDATION_REPORT.md` (Evidence for deck and video).
