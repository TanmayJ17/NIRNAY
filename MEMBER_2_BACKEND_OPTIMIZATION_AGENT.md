# NIRNAY — Member 2: Optimization, Backend & Agent Engineer
**Owner:** Member 2 | **Track:** Heat & Water | **Hackathon:** WeMakeDevs x AWS (Oct 8–11, 2026)

---

## 1. Role Overview & Core Mission

As the **Optimization, Backend and Agent Engineer**, you are the architect of NIRNAY's **decision engine, AWS cloud infrastructure, and AI explainability layer**. 

While a typical hackathon project stops at an informational dashboard, your work elevates NIRNAY into an **operational decision engine** that actively solves the PWD allocation problem:
1. **Build the Resource Allocation Optimizer**: Implement exact Dynamic Programming (DP) and greedy marginal-gain heuristics to find the optimal placement of $N$ mobile pumps and $M$ drain crews.
2. **Quantify Uncertainty**: Run a 200-sample Monte Carlo engine generating $10\text{--}90\%$ confidence bounds and a **recommendation stability score** (e.g., "86% stable across parameter variations").
3. **Deploy the Grounded Strands Agent**: Use the open-source **Strands Agents SDK** on **Amazon Bedrock** with strict anti-hallucination guardrails where every factual claim is anchored in tool simulation outputs.
4. **Deliver Cloud Infrastructure on AWS**: Deploy serverless API Gateway, Lambda, DynamoDB, and Bedrock integrations while enforcing a strict budget alarm ($10 limit).

---

## 2. Gate Ownership (Go / No-Go Checklist)

You are the primary owner of **Gate 7 (Strands Hello)** and co-owner of **Gate 8 (AWS Architecture)** and **Gate 9 (Rules & Schedule)**.

| Gate | Check | Success Criterion | Fallback if Failed |
|---|---|---|---|
| **Gate 7** | Strands Agent Hello | Strands SDK executes a tool call against Bedrock (`simulate` tool returns JSON to agent, which formats response). | Direct Bedrock Converse API with tool definitions (LangChain/boto3 fallback). |
| **AWS Setup** | Bedrock Access | Access granted for Anthropic Claude 3.5 Sonnet / Claude 3 Haiku / Amazon Titan. | Request multiple models immediately; use Haiku for fast, low-cost responses. |
| **Cost Alert** | AWS CloudWatch Billing Alarm | An alarm configured at \$10 threshold with SNS email alert. | Mandatory before running any Bedrock agent or batch Lambda. |
| **Gate 8 (Co-owned)**| Lambda & DynamoDB Hello | `POST /scenarios` writes to DynamoDB and returns 200 OK. | Local SQLite / mock persistence during Day 1 development. |

---

## 3. Mathematical Optimization Formulation

### 3.1 Problem Definition
The PWD has a finite pool of deployable mobile pumps ($N \le 15$) and drain clearing / desilting crews ($M \le 5$). There are $n$ hotspots ($n \approx 15\text{--}20$).

Let:
- $k_i \in \{0, 1, \dots, K_{\max}\}$ be the number of mobile pumps allocated to hotspot $i$ (typically $K_{\max} = 3$).
- $c_i \in \{0, 1\}$ be the binary decision to dispatch a drain-clearing crew to hotspot $i$.
- $\text{Impact}_i(k_i, c_i)$ be the simulated impact score for hotspot $i$ under rainfall scenario $(P, D)$.
- $V_i(k_i, c_i) = \text{Impact}_i(0, 0) - \text{Impact}_i(k_i, c_i)$ be the **impact reduction (value gained)** by assigning $(k_i, c_i)$ to hotspot $i$.

### 3.2 Optimization Problem
Maximize total impact reduction subject to resource constraints:
$$\max_{\{k_i, c_i\}} \sum_{i=1}^n V_i(k_i, c_i)$$
$$\text{subject to} \quad \sum_{i=1}^n k_i \le N, \quad \sum_{i=1}^n c_i \le M, \quad k_i \in \{0, \dots, K_{\max}\}, \quad c_i \in \{0, 1\}$$

### 3.3 Independence Property & Dynamic Programming
Because each underpass is modeled as an independent catchment dip (a standard engineering simplification we openly state), the objective is **strictly separable**.

This reduces to a **2D Multi-Choice Knapsack Problem**, solvable to global optimality in milliseconds via Dynamic Programming:

#### DP State Formulation:
Let $DP[i, p, m]$ be the maximum impact saved using a subset of the first $i$ hotspots, with at most $p$ pumps and $m$ crews available.

#### Base Case:
$$DP[0, p, m] = 0 \quad \forall p \in [0, N], m \in [0, M]$$

#### Recurrence Relation:
$$DP[i, p, m] = \max_{\substack{0 \le k \le \min(p, K_{\max}) \\ 0 \le c \le \min(m, 1)}} \Big\{ DP[i-1, p - k, m - c] + V_i(k, c) \Big\}$$

#### Computational Complexity:
- States: $n \times (N+1) \times (M+1) = 20 \times 16 \times 6 = 1,920$ states.
- Transitions per state: $(K_{\max}+1) \times 2 = 4 \times 2 = 8$ evaluations.
- Total operations: $\approx 15,360$ simple additions and comparisons. Execution time in Python is **$< 5\text{ milliseconds}$**.

### 3.4 Baseline Comparators (Proving ROI)
To prove the value of NIRNAY over status-quo PWD operations, compare the optimal allocation against two realistic naive baselines:
1. **Equal Allocation Baseline**: Distribute $N$ pumps evenly across the top $N$ historically flooded hotspots ($1$ pump each).
2. **History-Proportional Baseline**: Distribute pumps proportionally to historical annual closure frequency ($\text{historical\_closure\_freq\_annual}_i$).
3. **Outputs to UI**:
   - Total closure-hours saved: $\text{ClosureHours}_{\text{baseline}} - \text{ClosureHours}_{\text{optimal}}$.
   - Relative impact reduction: $\frac{\text{Impact}_{\text{baseline}} - \text{Impact}_{\text{optimal}}}{\text{Impact}_{\text{baseline}}} \times 100\%$.

---

## 4. Monte Carlo Uncertainty Engine

Decisions cannot rely on static point estimates. You will implement a Monte Carlo engine that runs $S = 200$ simulations per scenario:

### 4.1 Parameter Perturbation:
For each simulation draw $s \in [1, 200]$ and each hotspot $i$:
- $C_{i}^{(s)} \sim \mathcal{U}(C_{i, \min}, C_{i, \max})$
- $Q_{\text{drain}, i}^{(s)} \sim Q_{\text{drain}, i} \times \mathcal{U}(0.70, 1.30)$ (±30% siltation variance)
- $Q_{\text{pump}, i}^{(s)} \sim Q_{\text{pump}, i} \times \mathcal{U}(0.70, 1.30)$ (±30% diesel pump efficiency variance)

### 4.2 Computed Outputs:
1. **Impact & Closure Bands**:
   - 10th percentile ($P_{10}$), Median ($P_{50}$), 90th percentile ($P_{90}$) for each hotspot and the aggregate catchment.
2. **Recommendation Stability Metric**:
   - For each draw $s$, re-run the DP optimizer with the sampled parameters.
   - Count what percentage of draws recommend the **exact same top-3 priority hotspots** as the nominal run.
   - Return `stability_percentage` (e.g. `86.5%`). This gives operators immense confidence during decision briefings!

---

## 5. Python Optimizer & Backend Implementation (`backend/optimizer.py`)

```python
"""
NIRNAY Dynamic Programming Recommender & Monte Carlo Uncertainty Engine
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from engine.simulator import HotspotParams, Intervention, run_simulation

class ResourceOptimizer:
    def __init__(self, hotspots: List[HotspotParams]):
        self.hotspots = hotspots

    def precompute_value_matrix(
        self, rain_mm: float, duration_h: float, max_pumps_per_spot: int = 3
    ) -> Dict[str, Dict[Tuple[int, int], float]]:
        """Precomputes impact savings V_i(k, c) for each hotspot."""
        val_matrix = {}
        for hp in self.hotspots:
            val_matrix[hp.id] = {}
            # Baseline with 0 resources
            base_res = run_simulation([hp], rain_mm, duration_h, {hp.id: Intervention(0, False)})
            base_impact = base_res["hotspots"][hp.id]["impact_score"]

            for k in range(max_pumps_per_spot + 1):
                for c in [0, 1]:
                    sim_res = run_simulation(
                        [hp], rain_mm, duration_h, 
                        {hp.id: Intervention(temp_pumps=k, drain_cleared=(c == 1))}
                    )
                    impact = sim_res["hotspots"][hp.id]["impact_score"]
                    savings = max(0.0, base_impact - impact)
                    val_matrix[hp.id][(k, c)] = savings
        return val_matrix

    def solve_dp(
        self, rain_mm: float, duration_h: float, total_pumps: int, total_crews: int
    ) -> Dict[str, Any]:
        """Solves 2D Knapsack DP for optimal pump and crew allocation."""
        n = len(self.hotspots)
        val_matrix = self.precompute_value_matrix(rain_mm, duration_h)
        
        # dp[i][p][m] -> float
        # choice[i][p][m] -> (k, c)
        dp = np.zeros((n + 1, total_pumps + 1, total_crews + 1), dtype=float)
        choice = np.zeros((n + 1, total_pumps + 1, total_crews + 1, 2), dtype=int)

        for i in range(1, n + 1):
            hp_id = self.hotspots[i - 1].id
            for p in range(total_pumps + 1):
                for m in range(total_crews + 1):
                    best_val = dp[i - 1, p, m]
                    best_k, best_c = 0, 0
                    
                    for k in range(min(p, 3) + 1):
                        for c in range(min(m, 1) + 1):
                            cand_val = dp[i - 1, p - k, m - c] + val_matrix[hp_id][(k, c)]
                            if cand_val > best_val:
                                best_val = cand_val
                                best_k, best_c = k, c
                                
                    dp[i, p, m] = best_val
                    choice[i, p, m] = [best_k, best_c]

        # Backtrack
        curr_p, curr_m = total_pumps, total_crews
        optimal_allocation = {}
        for i in range(n, 0, -1):
            hp_id = self.hotspots[i - 1].id
            k, c = choice[i, curr_p, curr_m]
            optimal_allocation[hp_id] = {"temp_pumps": int(k), "drain_cleared": bool(c == 1)}
            curr_p -= k
            curr_m -= c

        # Evaluate against baselines
        optimal_run = run_simulation(
            self.hotspots, rain_mm, duration_h, 
            {k: Intervention(**v) for k, v in optimal_allocation.items()}
        )
        
        # Baseline 1: Equal allocation (1 pump to each of top N hotspots)
        sorted_by_impact = sorted(self.hotspots, key=lambda h: h.historical_closure_freq_annual, reverse=True)
        equal_alloc = {h.id: Intervention(temp_pumps=1 if idx < total_pumps else 0) for idx, h in enumerate(sorted_by_impact)}
        equal_run = run_simulation(self.hotspots, rain_mm, duration_h, equal_alloc)

        return {
            "optimal_allocation": optimal_allocation,
            "optimal_impact": optimal_run["total_impact_score"],
            "optimal_closure_hours": optimal_run["total_closure_hours"],
            "equal_baseline_impact": equal_run["total_impact_score"],
            "equal_baseline_closure_hours": equal_run["total_closure_hours"],
            "closure_hours_saved_vs_baseline": round(equal_run["total_closure_hours"] - optimal_run["total_closure_hours"], 2),
            "impact_saved_vs_baseline": round(equal_run["total_impact_score"] - optimal_run["total_impact_score"], 2)
        }

    def run_monte_carlo(
        self, rain_mm: float, duration_h: float, total_pumps: int, total_crews: int, n_samples: int = 200
    ) -> Dict[str, Any]:
        """Runs 200 stochastic draws to compute confidence bounds and stability."""
        nom_result = self.solve_dp(rain_mm, duration_h, total_pumps, total_crews)
        nom_top_3 = sorted(
            nom_result["optimal_allocation"].items(), 
            key=lambda item: item[1]["temp_pumps"] + (1 if item[1]["drain_cleared"] else 0), 
            reverse=True
        )[:3]
        nom_top_3_ids = set([k for k, v in nom_top_3])

        impacts = []
        matching_top_3 = 0

        for _ in range(n_samples):
            # Perturb parameters
            perturbed_hotspots = []
            for hp in self.hotspots:
                perturbed_hp = HotspotParams(
                    id=hp.id,
                    name=hp.name,
                    catchment_km2=hp.catchment_km2,
                    runoff_coeff=np.random.uniform(hp.runoff_coeff_min, hp.runoff_coeff_max),
                    surface_area_m2=hp.surface_area_m2,
                    gravity_drain_capacity_m3s=hp.gravity_drain_capacity_m3s * np.random.uniform(0.7, 1.3),
                    permanent_pump_capacity_m3s=hp.permanent_pump_capacity_m3s * np.random.uniform(0.7, 1.3),
                    traffic_pcu_per_hour=hp.traffic_pcu_per_hour,
                    detour_penalty_mins=hp.detour_penalty_mins,
                    hospital_route=hp.hospital_route,
                    population_300m=hp.population_300m
                )
                perturbed_hotspots.append(perturbed_hp)

            sub_opt = ResourceOptimizer(perturbed_hotspots)
            sub_res = sub_opt.solve_dp(rain_mm, duration_h, total_pumps, total_crews)
            impacts.append(sub_res["optimal_impact"])

            sub_top_3 = sorted(
                sub_res["optimal_allocation"].items(), 
                key=lambda item: item[1]["temp_pumps"] + (1 if item[1]["drain_cleared"] else 0), 
                reverse=True
            )[:3]
            sub_top_3_ids = set([k for k, v in sub_top_3])
            if sub_top_3_ids == nom_top_3_ids:
                matching_top_3 += 1

        p10 = float(np.percentile(impacts, 10))
        p50 = float(np.percentile(impacts, 50))
        p90 = float(np.percentile(impacts, 90))
        stability = (matching_top_3 / n_samples) * 100.0

        return {
            "p10_impact": round(p10, 2),
            "median_impact": round(p50, 2),
            "p90_impact": round(p90, 2),
            "stability_percentage": round(stability, 1)
        }
```

---

## 6. Strands Agent Implementation on Amazon Bedrock

You will implement the AI explanation agent using the **Strands Agents SDK** (open-source) connecting to **Amazon Bedrock**.

### 6.1 Strict Anti-Hallucination Guardrails
The system prompt must enforce strict adherence to simulation data:
```python
STRANDS_SYSTEM_PROMPT = """
You are the NIRNAY Operational Decision Assistant for Delhi PWD engineers.
Your role is to explain hydrological simulation outputs and resource allocation recommendations.

STRICT CONSTRAINTS (VIOLATIONS RESULT IN REJECTION):
1. You must ONLY state numerical figures (minutes, closure durations, depths, pumps, impact scores) that are returned directly by your tools.
2. If the user asks for a value or prediction that is not present in the tool output, explicitly reply: "I do not have simulation data for this parameter."
3. Distinguish clearly between the HAZARD LAYER (water inflow, pump discharge, drain clearing) and the IMPACT LAYER (traffic diversion, road closures, detour penalties).
4. Never claim to forecast real-time weather or flood depths. State that NIRNAY provides scenario-based what-if decision support.
"""
```

### 6.2 Agent Tools Specification
Register 3 primary tools:
1. `simulate_scenario(rain_mm, duration_h, interventions_json)`: Executes hydrological water balance.
2. `recommend_resources(pumps, crews, rain_mm, duration_h)`: Executes the DP optimizer and Monte Carlo stability test.
3. `compare_decisions(scenario_a_json, scenario_b_json)`: Provides differential impact analysis between two configurations.

```python
"""
Strands Agent Integration File: backend/agent.py
"""
import json
from strands_agents import Agent, Tool  # Open-source Strands Agents SDK
import boto3

bedrock_client = boto3.client("bedrock-runtime", region_name="us-east-1")

def simulate_tool(rain_mm: float, duration_h: float, interventions: str) -> str:
    """Simulates water accumulation and closure times across Delhi hotspots."""
    interv_dict = json.loads(interventions) if isinstance(interventions, str) else interventions
    result = run_simulation(GLOBAL_HOTSPOTS, rain_mm, duration_h, interv_dict)
    return json.dumps(result)

def recommend_tool(pumps: int, crews: int, rain_mm: float, duration_h: float) -> str:
    """Optimizes pump and crew distribution using dynamic programming."""
    opt = ResourceOptimizer(GLOBAL_HOTSPOTS)
    res = opt.solve_dp(rain_mm, duration_h, pumps, crews)
    mc = opt.run_monte_carlo(rain_mm, duration_h, pumps, crews, n_samples=100)
    res.update(mc)
    return json.dumps(res)

nirnay_agent = Agent(
    model="anthropic.claude-3-haiku-20240307-v1:0",  # Fast and budget-friendly on Bedrock
    system_prompt=STRANDS_SYSTEM_PROMPT,
    tools=[
        Tool(name="simulate", func=simulate_tool, description="Run catchment hydrological simulation"),
        Tool(name="recommend", func=recommend_tool, description="Recommend optimal resource allocation with uncertainty")
    ]
)
```

---

## 7. AWS Cloud Architecture & Infrastructure Deployment

### 7.1 Serverless Stack
- **Amazon API Gateway (HTTP API)**: Routes requests with low latency and native CORS.
- **AWS Lambda (Python 3.11, ARM64 / Graviton2)**: Houses the simulator, DP optimizer, and Strands agent.
- **Amazon DynamoDB**: `Scenarios` table.
  - Partition Key: `scenarioId` (String, UUID).
  - Attributes: `rain_mm` (N), `duration_h` (N), `interventions` (M), `results` (M), `createdAt` (S), `ttl` (N).
- **Amazon S3**: Bucket hosting `hotspots.json` and static DEM assets.

### 7.2 API Endpoints Contract
| Method | Route | Description |
|---|---|---|
| `POST` | `/api/simulate` | Runs backend simulation (fallback for full batch). |
| `POST` | `/api/recommend` | Runs DP allocation, baselines comparison, and Monte Carlo stability. |
| `POST` | `/api/chat` | Strands Agent conversation endpoint with session history. |
| `POST` | `/api/scenarios` | Saves a scenario to DynamoDB. |
| `GET` | `/api/scenarios/{id}` | Retrieves a saved scenario by ID. |

---

## 8. Day-by-Day Execution Plan

### Tonight (Kickoff & Setup)
- Complete Gate 7 (Bedrock tool execution test).
- Configure AWS account, IAM user, and \$10 CloudWatch billing alert.
- Create DynamoDB `Scenarios` table via AWS CLI / Console.
- Set up git branch `feature/backend-optimizer-agent`.

### Day 1 (Oct 8): Optimizer Core & Hello Lambda
- Implement `backend/optimizer.py` with Dynamic Programming 2D Knapsack.
- Deploy basic AWS Lambda hello endpoint behind API Gateway.
- Connect DynamoDB read/write for scenario persistence.
- Provide mock API responses to Member 3 so frontend work is never blocked.

### Day 2 (Oct 9): Full Recommender & Monte Carlo Engine
- Ingest Member 1's finalized `data/hotspots.json`.
- Implement baseline comparators (Equal Split and History-Proportional).
- Implement 200-sample Monte Carlo uncertainty generator and recommendation stability metric.
- Wire `/api/recommend` endpoint with end-to-end testing.

### Day 3 (Oct 10): Strands Agent & Polish
- Finalize Bedrock Strands agent with strict tool-grounding prompts.
- Implement `/api/chat` endpoint and connect with frontend chat drawer.
- Test underpass explanation scenarios: "Why pump Minto over Zakhira?"
- **Code freeze at 6:00 PM**.

### Day 4 (Oct 11): Cloud Audit & Submission
- Verify AWS architecture diagram for pitch slide.
- Review AWS costs and ensure spending is under the \$10 budget.
- Co-write the AWS implementation section of the Builder Center blog post.

---

## 9. Handshake Contracts with Other Members

### Inputs Needed from Others:
- **From Member 1**: `data/hotspots.json` containing calibrated hotspot parameters and ranges.
- **From Member 3**: Required JSON schemas for frontend UI consumption (`recommend` response and `chat` payloads).

### Outputs Provided to Others:
- **To Member 3**: Live API Gateway Base URL (`https://xyz.execute-api.us-east-1.amazonaws.com`) and complete Swagger/Postman JSON.
- **To Member 3**: Fast `/api/recommend` payload with stability percentage and comparison numbers.
- **To Member 1**: Validation assistance by batch-running historical storm scenarios.
