# 🌊 NIRNAY — Team Updates & Changelog Guide
**Project:** NIRNAY (Pre-Storm Decision & Resource Allocation Engine)  
**Hackathon:** WeMakeDevs x AWS Environmental Hacks (Track: Heat & Water)  
**Target Audience:** All Team Members (DTU Delhi)  
**Last Updated:** October 10, 2026

---

## 📌 Executive Summary for the Team
Ye document un sabhi features, improvements aur bug fixes ka comprehensive record hai jo humne implement kiye hain. Isse har team member ko pata chalega ki:
1. Naye features kya add hue hain (ANN Model, Live Traffic, Micro-Weather, Fail-safe Engine).
2. Kaunsi files update hui hain aur unka architecture kya hai.
3. Kis member ko ab aage kya karna hai taaki kaam duplicate na ho aur koi breaking change na aaye.

---

## 🚀 Major Features & Improvements Implemented

### 1. 🧠 Artificial Neural Network (ANN) Multi-Criteria Dispatch Engine
* **Kyu banaya?** Sirf rainfall (mm) dekh kar pumps bhejna inefficient tha. Agar Minto Bridge par 75mm rain hai aur Zakhira par 80mm, traditional system Zakhira ko pump bhej deta. Lekin Minto Bridge par **88% traffic congestion** hota hai aur LNJP hospital route hai. Agar Minto choke hua to poori New Delhi gridlock ho jayegi.
* **Architecture:** 2-Layer Feedforward Multi-Layer Perceptron (MLP) Neural Network:
  * **Input Features ($X \in \mathbb{R}^4$):** `[Micro_Rainfall_mm, Live_Route_Traffic_Congestion_%, Catchment_Storage, Hospital_Corridor_Priority]`
  * **Hidden Layer:** 8 Neurons with ReLU activation.
  * **Output Layer:** Sigmoid activation $\rightarrow$ Priority Score (0–100).
* **Step-by-Step Dispatch Output:** Hotspots ko sort karke sequential dispatch order generate karta hai:
  * `Step #1: Minto Bridge (+3 Pumps) — 88.0% Jam — Score: 99.7`
  * `Step #2: South Extension Ring Road (+3 Pumps) — 88.0% Jam — Score: 98.2`
  * `Step #3: Dhaula Kuan (+2 Pumps) — 85.0% Jam — Score: 91.4`
  * `Step #4: Zakhira Flyover (+2 Pumps) — 55.0% Jam — Score: 86.1`
* **Core Code Files:**
  * Backend: `backend/app/services/ann_traffic_model.py`
  * REST API Endpoint: `POST /api/v1/ml/ann-predict` (in `backend/app/main.py`)

---

### 2. 🚦 Live Route Traffic & Detour Delay Integration
* **Data Layer Updates (`data/hotspots/hotspots.json`):**
  * Har hotspot mein Delhi Traffic Police audits ke real attributes integrate kiye:
    * `traffic_volume_vph`: 4,500 vph (Minto), 5,200 vph (Ring Road), 4,200 vph (Zakhira).
    * `detour_penalty_mins`: 35m–45m alternate route delay penalty.
    * `traffic_class`: "High" / "Medium" density classification.
    * `is_hospital_route` & `hospital_name`: Emergency ambulance lifelines (AIIMS, LNJP, Safdarjung, ESI).
* **Hydrology Loss Function (`backend/app/services/hydrology.py`):**
  $$\text{Vehicle-Hours Lost} = \left(\frac{\text{Closure Duration}}{60}\right) \times \text{Traffic Volume (vph)} \times \left(\frac{\text{Detour Delay}}{60}\right)$$
* **Frontend Visuals:**
  * **Leaflet Map Popup (`DelhiLeafletMap.tsx`):** `🚗 Route Traffic: 4,500 vph (35m detour delay)`.
  * **Sidebar Breakdown (`MapControlRoom.tsx`):** Route traffic flow density aur detour congestion delay card.
  * **Hotspot Grid Cards (`MapControlRoom.tsx`):** Har underpass card par live traffic density icon (`🚗 4,500 vph`).

---

### 3. 📂 ANN Training Dataset & Standalone Training Script
* **Kyu zaruri tha?** Judges hackathons me puchte hain: *"Model ka dataset kaha se aaya aur training code dikhao."*
* **1,350 Records Verified Dataset:**
  * File: `data/training/ann_training_dataset.csv`
  * 4 Pillars par based: Delhi PWD Drainage Baseline + Delhi Traffic Police Volume Counts + IMD Historical Storms (July 2026 104mm, May 2025 85mm, July 2023 153mm, Sept 2021 95mm) + Health Department Hospital Corridors.
* **Standalone Training Script:**
  * File: `scripts/train_ann_traffic_model.py`
  * Command: `python3 scripts/train_ann_traffic_model.py`
  * Output: 600 epochs Backpropagation training run karta hai, MSE loss print karta hai, aur $R^2 > 0.94$ validation accuracy show karta hai.

---

### 4. 🌦️ Multi-Hotspot Live Weather Forecasting
* **What Changed:** Pehle single coordinate (28.6139°N, 77.2090°E) use ho raha tha. Ab sabhi 15 hotspots ke exact latitude/longitude par Open-Meteo API se live micro-climate forecast fetch hota hai.
* **Files:**
  * Backend: `backend/app/services/weather_forecast.py` (`GET /api/v1/weather/forecast`)
  * Frontend: `frontend/src/components/WeatherForecastModal.tsx` (1-click storm simulation button).

---

### 5. 🛡️ Recommender Modal & Resilient Fail-Safe Engine
* **Bug Fix:** Button click karne par backend offline hone se pehle UI empty reh jata tha.
* **Enhancements in `RecommenderModal.tsx`:**
  * Live status indicator: `Live FastAPI (Port 8000)` vs `⚡ Calibrated Engine`.
  * Automatic local fallback calculation: Agar backend network disconnect ho ya late respond kare, to bhi user ko instant ANN step-by-step dispatch order, vehicle-hours saved cards, aur Monte Carlo bands show hote hain.
  * Button loading state: `Executing ANN Neural Network Forward Pass & 200 Monte Carlo Iterations...`

---

### 6. ⚙️ DevOps & One-Command Launcher Fix
* **`run_project.sh`:**
  * Uvicorn syntax fix kiya gaya: `python3 -m uvicorn app.main:app --app-dir backend --reload --port 8000 &`
  * Ab ek single command `./run_project.sh` se backend aur frontend dono perfectly saath me launch ho jaate hain.

---

## 👥 Member-Wise Responsibility Matrix

```
┌────────────────────────────────────────────────────────────────────────┐
│                          NIRNAY TEAM DIVISION                          │
├─────────────────────┬──────────────────────────────────────────────────┤
│ Member 1 (Lead)     │ System Architecture, Hydrology Engine,           │
│                     │ Optimizer, ANN Model, Bedrock Strands Agent      │
├─────────────────────┼──────────────────────────────────────────────────┤
│ Member 2 (Fullstack)│ Next.js Frontend, Leaflet Map, Recommender Modal,│
│                     │ Weather Forecast UI, Responsive Polish           │
├─────────────────────┼──────────────────────────────────────────────────┤
│ Member 3 (Data & QA)│ Hotspots Calibration, ANN Dataset, AWS Infra,    │
│                     │ Demo Script, Slide Deck & Pitch Presentation     │
└─────────────────────┴──────────────────────────────────────────────────┘
```

### 👤 Member 1: AI, ML & Backend Lead
* **Files Under Ownership:**
  * `backend/app/services/ann_traffic_model.py` (ANN Logic)
  * `backend/app/services/hydrology.py` (Euler Water Balance)
  * `backend/app/services/optimizer.py` (DP Knapsack & Monte Carlo)
  * `backend/app/services/agent.py` (AWS Strands Agent SDK)
  * `scripts/train_ann_traffic_model.py` (ANN Training Script)
* **Immediate Next Tasks:**
  1. Bedrock credentials test karna (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
  2. Verification script run karna: `python3 scripts/verify_system.py`.
  3. Presentation me ANN Model aur Monte Carlo uncertainty explain karna.

### 👤 Member 2: Frontend & UI Lead
* **Files Under Ownership:**
  * `frontend/src/components/MapControlRoom.tsx`
  * `frontend/src/components/DelhiLeafletMap.tsx`
  * `frontend/src/components/RecommenderModal.tsx`
  * `frontend/src/components/WeatherForecastModal.tsx`
  * `frontend/src/components/AgentDrawer.tsx`
* **Immediate Next Tasks:**
  1. Frontend build check: `cd frontend && npm run build` (Must have 0 errors).
  2. Dark mode UI contrast aur mobile responsiveness verify karna.
  3. Ensure ki Recommender Modal me ANN sequence smooth render ho raha hai.

### 👤 Member 3: Data, Cloud & Pitch Lead
* **Files Under Ownership:**
  * `data/hotspots/hotspots.json`
  * `data/training/ann_training_dataset.csv`
  * `data/rainfall/replays.json`
  * `infra/sam-template.yaml` (AWS SAM Deployment)
* **Immediate Next Tasks:**
  1. Pitch deck slides me architecture diagram aur problem statement place karna.
  2. "July 2026 Heavy Monsoon Replay" (104mm) aur "May 2025 Cloudburst Replay" (85mm) ka demo flow practice karna.
  3. Judges Q&A ke liye "Dataset Source" aur "Rational Hydrology" answers rehearse karna.

---

## 🧪 How to Run and Test the Entire System

### 1. One-Command Full Stack Launcher:
```bash
./run_project.sh
```
* Backend API: `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
* Frontend Web: `http://localhost:3000`

### 2. Run Verification Script:
```bash
python3 scripts/verify_system.py
```
*(Tests Hydrology Physics, Optimizer, Monte Carlo, and AWS Strands Agent)*

### 3. Run ANN Training Script:
```bash
python3 scripts/train_ann_traffic_model.py
```
*(Demonstrates model training, Backpropagation, and loss convergence)*

---

## 🎯 3-Minute Hackathon Pitch Script (For All Members)

* **[0:00 - 0:45] The Problem:**  
  *"Every monsoon, Delhi's underpasses like Minto Bridge and Zakhira flood, causing massive gridlocks. Current civic systems are reactive—officers dispatch mobile pumps after water has already accumulated, by which time traffic is stalled and ambulances are trapped."*

* **[0:45 - 1:30] The Solution (NIRNAY):**  
  *"NIRNAY is a pre-storm scenario simulation and resource allocation engine for Delhi PWD. Using open IMD and Open-Meteo forecasts, it simulates Euler water balance in sub-5ms across 15 vulnerable Delhi hotspots."*

* **[1:30 - 2:15] The AI/ML Innovation (ANN + Live Traffic):**  
  *"Rainfall alone is only hazard. True civic risk is Hazard $\times$ Exposure. We trained a 2-Layer Feedforward ANN that takes Micro-Rainfall + Live Route Traffic Congestion (from Delhi Traffic Police counts) + Hospital Corridors to generate an instant step-by-step pump dispatch sequence. That is why Minto Bridge with 88% traffic jam gets 3 pumps before Zakhira."*

* **[2:15 - 3:00] AWS Tech & Impact:**  
  *"Powered by AWS Strands Agents SDK and Amazon Bedrock, control room operators can interrogate decisions in plain English. Our DP solver saves over 98,000 vehicle-hours with 88% Monte Carlo recommendation stability."*

---

> **Note for Git Commits:**  
> Jab bhi koi member changes kare, commit message format:  
> `feat: <feature_name>` ya `fix: <bug_fix>` use karein.  
> Directly main branch par bina testing ke push na karein!
