# NIRNAY Computation Engine — Work Completed

**Scope:** TypeScript hydrology engine only (no UI redesign).  
**Constraint:** Deterministic — no randomness, no ML, no network calls in the simulator.  
**Date:** 9 Oct 2026

---

## 1. What was built

The placeholder stub in `frontend/src/engine/simulator.ts` was replaced with a real catchment water-balance engine. Callers (map slider, store, tests, and later Monte Carlo) all use the same function:

```ts
simulate(hotspot, rainMm, durationH, interventions, params?)
→ { minutesToAlert, minutesToClosure, closureMinutes, maxDepthM, impactIndex }
```

`minutesToAlert` and `minutesToClosure` are `number | null` (first minute depth crosses the threshold, or `null` if it never does).

---

## 2. Files touched

| File | Role |
|---|---|
| `frontend/src/engine/simulator.ts` | Canonical Euler water-balance engine |
| `frontend/src/engine/simulator.test.ts` | Vitest: monotonicity, zero rain, determinism, param overrides |
| `frontend/src/engine/printDefaultScenario.ts` | Prints every hotspot at 100 mm / 4 h |
| `frontend/src/config.ts` | All physical thresholds, pump/drain factors, impact weights (each labelled ASSUMPTION) |
| `frontend/src/data/hotspots.json` | 15 illustrative Delhi underpasses |
| `frontend/src/data/loadHotspots.ts` | Loads JSON and logs the illustrative-data warning at startup |
| `frontend/src/types.ts` | `SimulationResult` timings are `number \| null`; dataset metadata fields |
| `frontend/src/store/useStore.ts` | Uses `loadHotspots`; pin status and closure-delta formatting handle `null` |
| `frontend/src/components/CrossSectionCard.tsx` | Timing formatter accepts `null` (compile-only, no visual redesign) |
| `frontend/vite.config.ts` | Vitest config + existing `@` alias |
| `frontend/package.json` | Scripts: `test`, `print:scenario` |

---

## 3. Physics (simulator)

### Hyetograph
- Triangular rainfall over `durationH`
- Peak intensity \( i_{\text{peak}} = 2 \cdot \text{rainMm} / \text{durationH} \) (mm/h)
- Peak position from config: **40%** of storm duration (`HYETOGRAPH_PEAK_FRACTION`)
- Intensity is 0 after the storm ends

### Inflow (Rational Method)
\[
Q_{\text{in}} = 0.278 \cdot C \cdot i \cdot A_{\text{km}^2} \quad (\text{m}^3/\text{s})
\]
`C` comes from `hotspot.runoff_coeff_default` unless `params.runoffCoeff` overrides it.  
`0.278` is the only numeric constant in the engine (unit conversion). Everything else is config or hotspot data.

### Outflow
\[
Q_{\text{out}} = Q_{\text{permanent}} + N_{\text{temp}} \cdot q_{\text{pump}} + Q_{\text{drain}} \cdot (1 + r \text{ if drainCleared})
\]
- \( q_{\text{pump}} \): `TEMP_PUMP_CAPACITY_M3S` (or `params.tempPumpCapacityM3s`)
- \( r \): `DRAIN_CLEARED_RECOVERY_FACTOR`
- Drain capacity: hotspot value or `params.gravityDrainCapacityM3s`

`preDivert` and `roadClosed` do **not** change hydrology. They only change the impact index (exposure + extra detour).

### Time stepping
- Forward Euler, **60 s** (`EULER_STEP_SECONDS`)
- \( h \leftarrow h + (Q_{\text{in}} - Q_{\text{out}}) \cdot 60 / A_s \)
- Floor at 0, clamp to `storage_depth_max_m`
- After rain ends, stepping continues until \( h = 0 \) or **24 h** (`MAX_SIMULATION_HOURS`)

### Outputs
- **minutesToAlert / minutesToClosure:** first elapsed minute with \( h \ge 0.15\,\text{m} \) / \( 0.20\,\text{m} \), else `null`
- **closureMinutes:** count of 1-minute steps with \( h \ge \) closure depth
- **maxDepthM:** peak ponding
- **impactIndex:** relative score, not a vehicle or people count:
  - closure hours × traffic PCU/h × exposure factors × `(1 + DETOUR_PENALTY_WEIGHT × detour minutes)` × hospital multiplier
  - plus `closure hours × population_300m × POPULATION_WEIGHT`
  - `preDivert` multiplies exposure by `PRE_DIVERT_EXPOSURE_FACTOR` and adds `PRE_DIVERT_DETOUR_PENALTY_MINS`
  - `roadClosed` multiplies exposure by `ROAD_CLOSED_EXPOSURE_FACTOR` and adds `ROAD_CLOSED_DETOUR_PENALTY_MINS`
  - hospital routes use `HOSPITAL_ROUTE_WEIGHT`; others use 1

### Monte Carlo hook
`params` may override:
- `runoffCoeff`
- `tempPumpCapacityM3s`
- `gravityDrainCapacityM3s`
- `permanentPumpCapacityM3s`

The engine itself stays deterministic (no RNG).

---

## 4. Config assumptions (`frontend/src/config.ts`)

Every operational number is labelled **ASSUMPTION** in comments.

| Constant | Value | Meaning |
|---|---|---|
| `ALERT_DEPTH_M` | 0.15 m | Hazard alert |
| `CLOSURE_DEPTH_M` | 0.20 m | Road closure |
| `HYETOGRAPH_PEAK_FRACTION` | 0.40 | Peak at 40% of duration |
| `EULER_STEP_SECONDS` | 60 | Time step |
| `MAX_SIMULATION_HOURS` | 24 | Drain-out cap |
| `TEMP_PUMP_CAPACITY_M3S` | 0.15 | Per mobile pump |
| `DRAIN_CLEARED_RECOVERY_FACTOR` | 0.50 | Extra drain when cleared |
| `PRE_DIVERT_EXPOSURE_FACTOR` | 0.40 | 60% traffic removed |
| `ROAD_CLOSED_EXPOSURE_FACTOR` | 0.05 | Residual exposure |
| `PRE_DIVERT_DETOUR_PENALTY_MINS` | 15 | Extra detour |
| `ROAD_CLOSED_DETOUR_PENALTY_MINS` | 30 | Extra detour |
| `HOSPITAL_ROUTE_WEIGHT` | 2.5 | Ambulance-route multiplier |
| `DETOUR_PENALTY_WEIGHT` | 0.05 | Minutes → dimensionless |
| `POPULATION_WEIGHT` | 0.0001 | Per capita in 300 m |
| `DEFAULT_RAIN_MM` / `DEFAULT_DURATION_H` | 100 / 4 | Demo scenario |

---

## 5. Hotspot data

Schema follows **TEAM_CONTRACT_AND_INTERFACES.md §2.1**.

Top of `hotspots.json`:
- `data_status`: `ILLUSTRATIVE - replace with verified hotspots.json from Member 1`
- `demo_note`: parameters were tuned so the default 100 mm / 4 h run shows a mix of clear / alert / closed

On app startup, `loadHotspots.ts` logs that `data_status` string as a `console.warn`.

Coordinates are approximate. Catchment, drain, pump, traffic, and population values are **illustrative**, not verified PWD/IMD data.

### 15 underpasses

1. Minto Bridge  
2. Zakhira  
3. Pul Prahladpur  
4. Dhaula Kuan  
5. ITO  
6. Tilak Bridge  
7. Moolchand  
8. WHO Ring Road  
9. Jahangirpuri  
10. Loni Road Golchakkar  
11. Karala-Kanjhawala  
12. South Extension  
13. Punjabi Bagh  
14. Kishanganj  
15. Dwarka Sector 21  

---

## 6. Default demo mix (100 mm over 4 h, no interventions)

Printed by `npm run print:scenario` from `frontend/`.

| Status | Count | Hotspots |
|---|---|---|
| **CLEAR** (\( h_{\max} < 0.15\,\text{m} \)) | 5 | Dhaula Kuan, Moolchand, WHO Ring Road, South Ext, Punjabi Bagh |
| **ALERT** (\( 0.15 \le h_{\max} < 0.20\,\text{m} \)) | 4 | ITO, Tilak Bridge, Loni Road, Kishanganj |
| **CLOSED** (\( h_{\max} \ge 0.20\,\text{m} \)) | 6 | Minto Bridge, Zakhira, Pul Prahladpur, Jahangirpuri, Karala-Kanjhawala, Dwarka Sec 21 |

---

## 7. How to run

From `frontend/`:

```bash
npm test                 # vitest (5 tests)
npm run print:scenario   # print all 15 states at 100 mm / 4 h
npm run dev              # existing Vite app (engine feeds the existing UI)
```

### Tests covered
1. **Determinism** — same inputs → identical output  
2. **Zero rain** — no alert, no closure, depth 0, impact 0  
3. **Monotonic rain** — more rain never reduces `maxDepthM`  
4. **Monotonic pumps** — more temp pumps never increases `closureMinutes`  
5. **Params overrides** — higher C raises depth; higher drain / pump capacity does not increase ponding/closure  

---

## 8. What was explicitly not done

- No UI layout, map styling, or new screens  
- No Monte Carlo sampling inside the simulator (overrides exist for Member 2 to call)  
- No FastAPI / optimizer / Strands agent  
- Hotspot JSON is **not** Member 1 verified data — replace when that file arrives  

---

## 9. Handoff notes

- Member 1: drop verified `hotspots.json` in place; keep the same schema. Re-run `print:scenario` — the demo mix will change.  
- Member 2: call `simulate(..., params)` per Monte Carlo draw; do not add `Math.random` to the engine.  
- Member 3: existing store already re-runs `simulate` on rain/intervention changes. Pin colour is still green / amber / red from depth and timings.
