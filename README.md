# NIRNAY (निर्णय) — Delhi Monsoon Waterlogging Decision Engine

> **Hackathon:** Environmental Hacks (WeMakeDevs x AWS)  
> **Dates:** Oct 8–11, 2026 | **Track:** Heat and Water  
> **Team:** 3 Members (DTU Delhi)  
> **Core Concept:** A what-if decision support engine for Delhi PWD control-room staff and zonal engineers to simulate underpass closures, optimize pump/crew allocation, and explain decisions using tool-grounded AI.

---

## 📁 Team Member Detailed Blueprints

This project has been divided with rigorous, unambiguous boundaries among the 3 members. Each member has a dedicated, production-grade markdown blueprint containing their mathematical formulations, code implementations, day-by-day deliverables, and validation criteria:

1. 🌊 **[MEMBER 1: Hydrology & Geodata Engineer](./MEMBER_1_HYDROLOGY_GEODATA.md)**
   - **Focus:** Ground truth, terrain, hydrology physics, and historical validation.
   - **Key Deliverables:** `data/hotspots.json` (15–20 geocoded hotspots), `engine/simulator.py` (canonical Python reference simulator), validation suite (Rank Test, July 2026 replay, May 2025 replay), and 10 golden scenarios for parity testing.
   - **Gates Owned:** Gates 1 through 6.

2. 🧠 **[MEMBER 2: Optimization, Backend & Agent Engineer](./MEMBER_2_BACKEND_OPTIMIZATION_AGENT.md)**
   - **Focus:** Algorithmic optimization, AWS cloud backend, and grounded AI explainability.
   - **Key Deliverables:** Dynamic Programming 2D Knapsack resource allocator, 200-sample Monte Carlo uncertainty & stability engine, Bedrock + Strands Agents SDK integration with strict anti-hallucination guardrails, AWS Lambda, API Gateway, and DynamoDB.
   - **Gates Owned:** Gate 7, Cost Governance (\$10 alarm), and co-owner of Gate 8.

3. 🖥️ **[MEMBER 3: Frontend & Demo Lead](./MEMBER_3_FRONTEND_DEMO_LEAD.md)**
   - **Focus:** User interface, client-side real-time engine, visual storytelling, and submission media.
   - **Key Deliverables:** React + MapLibre web app deployed on AWS Amplify, zero-latency TypeScript simulator port (`src/engine/simulator.ts`), simulator parity test suite, 3-minute video production, slide deck, and AWS Builder Center blog post.
   - **Gates Owned:** Gate 8 and Gate 9.

4. 🤝 **[TEAM CONTRACT & INTERFACES](./TEAM_CONTRACT_AND_INTERFACES.md)**
   - Shared data schemas, REST API request/response specifications, daily sync schedule, and git workflow protocols.

---

## 🗓️ 4-Day Execution Master Schedule

```
Tonight (Oct 8)           Day 1 (Oct 8)             Day 2 (Oct 9)             Day 3 (Oct 10)           Day 4 (Oct 11)
Gates 1-9 Passed   ->   Deployed Slice     ->   Full Corridor &     ->   Credibility & Polish  ->   Ship & Submit
- Geocode 7 spots       - Python Minto test      Allocations              - Validation table       - 3-min video
- AWS Budget alarm      - Lambda hello           - 15-20 hotspots         - Strands Agent chat     - Blog post
- Amplify skeleton      - Amplify slider test    - DP Knapsack optimizer  - Parity test pass       - Hackathon portal
                        - End-of-day: Slider     - Monte Carlo bands      - 6 PM: FEATURE FREEZE     submission
                          changes Minto depth    - End-of-day: "Recommend"
                                                   shows baseline savings
```

---

## ⚖️ What We Claim vs. What We Do Not

Judges reward calibrated, defensible claims. Every team member must memorize this distinction:

| What NIRNAY Claims | What NIRNAY Does NOT Claim |
|---|---|
| **Scenario simulation & decision support** | Flood forecasting or real-time weather prediction |
| **Relative impact index with uncertainty ranges** | Exact counts of stranded people or cars |
| **Textbook hydrology (Rational method, storage balance)** | Calibrated 2D hydrodynamic hydrodynamic simulation |
| **Validated against known hotspots and historical events**| Street-level flood depth directly from DEM |
| **Optimal resource allocation under stated assumptions** | Hotspot coupling (hotspots are assumed independent) |

---

## 🚀 Quick Start for Team Setup

1. **Clone repository & checkout member branch**:
   ```bash
   git checkout -b feature/<your-role>
   ```
2. **Review your personal specification file**:
   - Member 1: Read [MEMBER_1_HYDROLOGY_GEODATA.md](./MEMBER_1_HYDROLOGY_GEODATA.md)
   - Member 2: Read [MEMBER_2_BACKEND_OPTIMIZATION_AGENT.md](./MEMBER_2_BACKEND_OPTIMIZATION_AGENT.md)
   - Member 3: Read [MEMBER_3_FRONTEND_DEMO_LEAD.md](./MEMBER_3_FRONTEND_DEMO_LEAD.md)
3. **Verify contracts**: Check [TEAM_CONTRACT_AND_INTERFACES.md](./TEAM_CONTRACT_AND_INTERFACES.md) before writing API endpoints or JSON schemas.
