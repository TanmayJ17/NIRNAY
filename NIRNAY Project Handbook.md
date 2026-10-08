# NIRNAY: Project Handbook and Team Blueprint

**Hackathon:** Environmental Hacks (WeMakeDevs x AWS) | **Dates:** Oct 8-11, 2026 **Track:** Heat and Water | **Team:** 3 members (DTU Delhi)

---

## 1. Project Overview

### The problem

Every monsoon, Delhi's PWD decides in advance where scarce pumps and crews go, and in real time when an underpass must be closed. Today that rests on hotspot lists, nodal officers and experience. There is no tool to test those decisions before the rain.

What is on record (verify each before the pitch, see Section 12):

- PWD protocol: alert the control room at roughly 6-8 inches of underpass water, start mobile pumps, and divert traffic if the level keeps rising past 8 inches.
- Hundreds of waterlogging points are tracked, but counts differ by source and year (45, 169, 194, 335, 445-448). We never quote one number without its source and year.
- July 2026: PWD reported 754 permanent pumps at 167 locations and 305 temporary pumps at 273 locations.
- Seven perennial hotspots: Minto Bridge, Pul Prahladpur, Ring Road opposite WHO, Jahangirpuri Metro Station Road, under Zakhira flyover, Loni Road Golchakkar, Karala-Kanjhawala.

### Our solution: NIRNAY (Hindi for "decision")

A what-if decision engine for PWD control-room staff and zonal engineers. For one catchment it:

1. Simulates **time-to-closure** for each underpass and low point under a chosen rainfall scenario.
2. Lets the user test interventions: add temporary pumps, clear a drain, pre-divert traffic, close a road.
3. **Recommends** the allocation of N pumps and M crews that minimizes vehicle-hours lost.
4. Explains why, through a Strands agent that quotes only simulator outputs.

### Two-layer model

- **Hazard layer:** how fast water accumulates at each hotspot. Affected by rainfall, drain clearing, pumps.
- **Impact layer:** who is affected when a hotspot floods or closes (vehicles, people, critical routes). Affected by closures, diversions, pre-positioning.

Every intervention acts on exactly one layer with a stated mechanism. Closing a road does not shrink flooding; it reduces exposure.

---

## 2. What we claim and what we do not

| We claim | We do not claim |
| --- | --- |
| Scenario simulation and decision support | Flood forecasting |
| Relative impact index with uncertainty ranges | Exact people or vehicles affected |
| Textbook hydrology (rational method, storage balance) | A calibrated hydrodynamic model |
| Validated against known hotspots and two real events | Street-level flood depth from the DEM |
| Optimal allocation under stated assumptions | That hotspots never interact (we assume independence, and say so) |

Say the left column out loud in the video. Judges reward calibrated claims.

---

## 3. Competitive Edge

| Aspect | Today (hotspot lists + judgment) | NIRNAY |
| --- | --- | --- |
| Timing | Preparation, then reaction at thresholds | Pre-storm what-if for any rainfall level |
| Resource use | Pumps placed by history and experience | Allocation optimized per scenario, compared to a naive baseline |
| Explainability | Experience | Every recommendation shows its mechanism and numbers |
| Uncertainty | Implicit | Ranges and recommendation stability shown |

Why this is not a dashboard: users change decisions and see consequences.

---

## 4. Model Specification

**Setting:** one catchment of about 10 km2 (pick the corridor with the most named hotspots, for example Ring Road). About 12-20 hotspots.

**Inflow (rational method):** Q_in = 0.278 x C x i x A, in m3/s, with C the runoff coefficient (range 0.6-0.95), i the rainfall intensity in mm/h, A the catchment area in km2.

**Rainfall input:** total mm and duration, shaped as a triangular hyetograph. Label the slider with IMD classes (heavy 64.5-115.5, very heavy 115.6-204.4, extremely heavy above 204.4 mm in 24 h; verify).

**Underpass water balance:** dh/dt = (Q_in - Q_pumps - Q_drain) / A_s(h), integrated with Euler steps of 1 minute. A_s is the surface area of the dip.

**Triggers:** alert at h = 0.15 m (6 in), closure at h = 0.20 m (8 in). Output: minutes to alert, minutes to closure, closure duration.

**Impact index per hotspot:** closure minutes x traffic proxy (road class x hourly profile) x detour penalty, plus a critical-route flag (hospital access) and population within 300 m. Reported as a relative index, never as absolute counts.

**Interventions:**

| Action | Layer | Mechanism |
| --- | --- | --- |
| Add temporary pump | Hazard | Raises Q_pumps by pump capacity (slider with range) |
| Clear drain or bell-mouth | Hazard | Raises Q_drain by a blockage-recovery factor |
| Pre-divert traffic | Impact | Removes vehicles before closure, adds detour penalty |
| Close road | Impact | Removes exposure, adds detour penalty |

**Recommender:** choose pump counts k_i and crew flags c_i to minimize total impact subject to sum k_i \<= N and sum c_i \<= M. With independent hotspots, exact dynamic programming is cheap (n \<= 20, N \<= 15). Also run a greedy marginal-gain version and compare.

**Baselines:** equal split, and history-proportional split. Report closure-hours saved versus each.

**Uncertainty:** 200 Monte Carlo draws over C, pump capacity (+-30%) and drain capacity (+-30%). Show 10-90% bands and the percentage of draws in which the same top-3 allocation wins.

**Catchments:** D8 flow accumulation on the smoothed DEM, restricted by the road network. The Copernicus DEM is a surface model that includes buildings, so it cannot see underpass dips. Underpasses are seeded as explicit sink nodes from OSM tunnel and underpass tags plus the hotspot list. Fallback: hand-drawn polygons for up to 15 hotspots.

**Implementation:** Python reference implementation for validation, TypeScript port for the browser so the slider is instant. Cross-check both on 10 scenarios.

---

## 5. Validation Plan (the credibility slide)

1. **Rank test:** of the named hotspots inside our catchment, at least 70% should rank in the top quarter of modeled hotspots by time-to-closure.
2. **July 2026 replay:** Minto Bridge, Zakhira, Dhaula Kuan and Moolchand reportedly stayed open through more than 100 mm in about 24 h after pump and drain upgrades. The model, with upgrades, should show no closure; with the pre-upgrade settings it should show closure.
3. **May 2025 replay:** Minto Road underpass waterlogged after heavy overnight showers. The model with pre-upgrade settings should show closure.
4. **Report results honestly**, including misses. A partial pass shown transparently beats a perfect claim that cannot be checked.

Rainfall for replays: Open-Meteo archive (reanalysis, can understate local extremes) cross-checked against news-reported totals. If they disagree, use the reported totals and say so.

---

## 6. Data Inventory and Go/No-Go Gates (finish before coding)

| Gate | Check | Pass criterion |
| --- | --- | --- |
| 1 | Hotspots geocoded | 7 of 7 named, plus 10 or more underpasses or low junctions |
| 2 | Rainfall for both replays | Hourly series retrieved; totals sane versus news |
| 3 | DEM tile (Copernicus GLO-30, AWS Open Data) | Opens and samples |
| 4 | OSM underpasses, drains, hospitals, schools | 10 or more underpass ways, or covered by hotspot CSV |
| 5 | Population layer | Any usable raster for the corridor, else ward-level |
| 6 | Pump discharge figures | 2 sourced values, or slider calibrated by July 2026 replay |
| 7 | Strands hello | Agent calls one tool end to end |
| 8 | Amplify hello | Public URL loads |
| 9 | Rules and Schedule pages | Deadline, format, data and AI-tool restrictions noted |

GO if gates 1, 3, 7 and 8 pass. NO-GO if gate 1 fails or Bedrock access is blocked. Fallback project: SocietySolar (least data risk).

---

## 7. Team Roles

### Member 1: Hydrology and Geodata Engineer

- Own gates 1-6. Geocode hotspots, build `hotspots.json` (id, name, lat, lon, catchment_km2, C_range, surface_area_m2, drain_capacity_range, traffic_class, hospital_route, population_300m).
- Catchment delineation (D8 plus road constraint) with the hand-drawn fallback.
- Python reference simulator: rational method, water balance, closure triggers, impact index.
- Validation: rank test and both replays, with a one-page results table.

### Member 2: Optimization, Backend and Agent Engineer

- AWS setup: Bedrock access, billing alarm, API Gateway and Lambda, DynamoDB.
- Recommender: DP, greedy, baselines, Monte Carlo bands, stability percentage.
- Strands agent with tools `simulate(rain_mm, duration_h, interventions)`, `recommend(pumps, crews, rain)`, `compare(scenario_a, scenario_b)`. Guardrail: every number in an answer must come from a tool result; the agent says so when it lacks data.
- Scenario persistence in DynamoDB.

### Member 3: Frontend and Demo Lead

- React map: hotspot markers colored by time-to-closure, countdown labels, rainfall slider with IMD classes, intervention panel, compare view, Recommend button, explain panel, replay presets.
- TypeScript port of the simulator with parity tests against Member 1's Python outputs.
- Pitch deck, demo video, README, Builder Center blog.

---

## 8. Four-Day Roadmap

```
Tonight      Oct 8 (Day 1)     Oct 9 (Day 2)      Oct 10 (Day 3)       Oct 11 (Day 4)
Gates 1-9 -> Deployed slice -> Full catchment + -> Validation, agent, -> Bug bash, video,
                               recommender         polish, freeze       blog, submit early
```

**Tonight:** run Section 6 gates, verify student status on Builder Center, check in, create AWS account and budget alert, request Bedrock model access, create repo and README, decide the catchment.

**Day 1 (Oct 8): vertical slice, deployed.**

- M1: hotspots.json for 3 hotspots, Python simulator for Minto Bridge.
- M2: Lambda hello plus DynamoDB table plus Strands hello, deployed.
- M3: React app on Amplify with map, one hotspot, slider, TS simulator port.
- End-of-day check: a public URL where moving the slider changes Minto's time-to-closure.

**Day 2 (Oct 9): full catchment and decisions.**

- M1: all hotspots and catchments; impact index.
- M2: recommender with baselines and Monte Carlo; recommend endpoint.
- M3: intervention panel, compare view, recommendation display.
- End-of-day check: set 5 pumps manually, press Recommend, see optimal versus naive.

**Day 3 (Oct 10): credibility and polish. Feature freeze at 6 pm.**

- M1: validation results and replay presets (July 2026, May 2025).
- M2: agent explanations wired to the UI; scenario saving.
- M3: mobile-friendly layout, empty and error states, deck draft. Optional: attend the DTU build day for feedback.

**Day 4 (Oct 11): ship.**

- Morning: bug bash only, no features. Seed clean demo scenarios.
- Record and edit the video, publish the Builder Center blog, finalize README, submit well before the deadline.

---

## 9. Architecture and AWS Mapping

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript, MapLibre (or Leaflet), hosted on AWS Amplify |
| Instant simulation | TypeScript simulator running in the browser |
| API | Amazon API Gateway and AWS Lambda (recommender, Monte Carlo, agent) |
| Storage | Amazon S3 (preprocessed hotspots.json, rasters), DynamoDB (saved scenarios) |
| AI | Amazon Bedrock plus Strands Agents SDK (open source) |
| Open data | Copernicus DEM (AWS Open Data), OSM extracts |

Cost control: billing alarm, cached agent explanations for demo scenarios, cap Bedrock calls.

**DynamoDB `Scenarios`:** `scenarioId` (pk), `rain_mm`, `duration_h`, `interventions` (JSON), `results` (JSON), `createdAt`.

---

## 10. UI Spec

1. **Map:** hotspots as markers, color by time-to-closure (green/amber/red), countdown labels, hospital routes highlighted.
2. **Rainfall panel:** slider (mm and duration) labelled by IMD class; presets: July 2026 replay, May 2025 replay.
3. **Intervention panel:** pump count per hotspot, drain-clearing toggle, pre-divert toggle, road-close toggle.
4. **Compare view:** scenario A versus B, closure-hours and impact index with ranges.
5. **Recommend:** enter N pumps and M crews; shows optimal allocation versus naive baseline and stability percentage.
6. **Explain:** agent answers "why did clearing drain X beat closing road Y?" using tool outputs.

---

## 11. Three-Minute Pitch Structure

1. **Hook (0:00-0:25):** "Every monsoon, Delhi decides in advance where scarce pumps go. Today that rests on hotspot lists and experience. NIRNAY lets engineers test those decisions before the rain."
2. **Live demo (0:25-1:55):** Slider to 100 mm and countdown timers appear. Place pumps manually. Press Recommend. Show optimal versus naive allocation with closure-hours saved and the uncertainty band. Ask the agent why.
3. **Credibility (1:55-2:25):** Rank-test result and the July 2026 replay, shown honestly. State once: "This is decision support, not flood forecasting."
4. **AWS and impact (2:25-3:00):** One architecture slide naming each service and its job. Close with what we would need from PWD to go live: pump inventory, drain data, live level sensors.

---

## 12. Facts to Verify Before Pitching

| Fact | Where it came from |
| --- | --- |
| 6-8 inch alert, divert above 8 inches | Outlook India report on PWD monsoon plan |
| 754 permanent pumps at 167 locations, 305 temporary at 273 locations, July 2026 | ANI and Pioneer reports on PWD review |
| Seven perennial hotspots | Tribune report on PWD order |
| Minto Bridge waterlogging in May 2025 | PTI report |
| July 2026 underpasses stayed open above 100 mm | ANI and Pioneer reports |
| Hotspot counts vary (45 to 448) | Several outlets; definitions differ |
| IMD rainfall classes | IMD definitions |
| Copernicus DEM is a surface model | AWS Open Data registry entry |

Re-open each source and note date and wording before it appears on a slide.

---

## 13. Risks and Fallbacks

| Risk | Mitigation |
| --- | --- |
| Hotspot geocoding takes too long | Start with the 7 named plus 8 more; hand-curate |
| Pump capacity unknown | Slider with range; calibrate with the July 2026 replay |
| DEM cannot see underpasses | Seed sinks from OSM and the hotspot list |
| Catchments unreliable | Hand-drawn polygons for up to 15 hotspots |
| Independence assumption challenged | State it; mention coupling as a next step |
| Model disagrees with a replay | Show it, explain the cause, keep the claim modest |
| Agent invents numbers | Tool-only answers, refuse when data is missing |
| Scope creep | Feature freeze Day 3, 6 pm |
| Out-of-season data | Not an issue: simulator plus replays |

---

## 14. Submission Checklist

- [ ] Student status verified on AWS Builder Center
- [ ] Checked in on the hackathon page
- [ ] Deployed on AWS, public URL works on a phone
- [ ] Uses at least one AWS open-source tool (Strands Agents SDK) and runs on AWS
- [ ] README: problem, claims and non-claims, architecture, how to run, validation results
- [ ] 3-minute demo video
- [ ] Builder Center blog published and linked
- [ ] Submitted early; deadline and format re-checked on the Rules page