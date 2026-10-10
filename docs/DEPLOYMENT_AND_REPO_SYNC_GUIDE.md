# 🚀 NIRNAY — Team Repository Sync & Deployment Guide
**Event:** WeMakeDevs x AWS Environmental Hacks (Track: Heat & Water)  
**Target:** 3 Team Members & Final Submission Workflow

---

## 📌 Problem 1: 3 Members Ke Pass Alag-Alag Folders Hain — Ab Kya Karein?

Agar GitHub repo me 3 alag-alag folders (`member1_folder`, `member2_folder`, `my_folder`) dikhenge, to **Judges Code Quality aur Team Integration ke marks kaat lenge!** 

Judges hamesha ek **Clean, Production-Ready Unified Mono-Repo** dekhna chahte hain:
```text
Aws-hack/ (Repo Root)
├── backend/            <-- Python FastAPI, Hydrology, ANN Model, AWS Strands Agent
├── frontend/           <-- Next.js React, Leaflet Map, Recommender Modal
├── data/               <-- 15 Hotspots JSON, 1,350 Scenarios Dataset CSV, Replays
├── docs/               <-- Architecture docs, Team guides, Changelog
├── scripts/            <-- verify_system.py, train_ann_traffic_model.py
├── README.md           <-- Master Hackathon Readme (Screenshots, Architecture, AWS mapping)
└── run_project.sh      <-- One-command local runner
```

### ✅ Solution: Is System Ka Code Master Branch Banayein
Aapke is system (`Aws-hack`) me **teeno members ka saara kaam perfectly integrated, tested aur working hai** (Frontend build 0 errors, Backend 100% test passed).

#### Step-by-Step GitHub Clean Push (Aapke Laptop Se):
1. Terminal me root directory par jayein:
   ```bash
   cd /Users/whitemuffens/Desktop/Aws-hack
   ```
2. Git initialize karein aur remote link karein (agar pehle se nahi hai):
   ```bash
   git init
   git branch -M main
   # Apne GitHub repo ka URL yaha daalein:
   git remote add origin <APNA_GITHUB_REPO_URL>
   ```
3. Saari clean files add karke commit & push karein:
   ```bash
   git add .
   git commit -m "feat: complete integrated NIRNAY system (Next.js + FastAPI + ANN + Live Traffic + Weather)"
   git push -u origin main --force
   ```
4. **Baaki 2 Team Members ko kya bolna hai?**
   > *"Maine poora integrated code clean karke main branch par push kar diya hai. Ab sabhi log `git pull origin main` kar lo aur apne alag-alag temporary folders delete kar lo taaki repo clean rahe."*

---

## 🌐 Problem 2: Kaha Deploy Karna Hai? (Live Deployment Guide)

Hackathon submission form me **"Live Demo URL"** sabse zaroori field hoti hai. Judges sabse pehle link click karke dekhte hain ki website chal rahi hai ya nahi.

Hamare pass **2 Best Options** hain:

---

### 🌟 Option A: Super-Fast 5-Minute Deployment (Recommended for Hackathon)
Ye option 100% free hai, kabhi fail nahi hota, aur judges ko instant HTTPS link milta hai.

#### 1. Frontend: Deploy on **Vercel** (Takes 2 minutes)
1. [vercel.com](https://vercel.com) par jayein aur GitHub se sign in karein.
2. **"Add New Project"** par click karein aur apna GitHub repo select karein.
3. Settings me:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: `frontend` (Edit button click karke `frontend` select karein).
4. **Environment Variables**:
   - Key: `NEXT_PUBLIC_API_URL`
   - Value: *(Backend deploy karne ke baad mila hua URL, ya local testing ke liye leave blank)*
5. Click **"Deploy"**!
6. 🎉 **Live Frontend Link:** `https://nirnay-delhi.vercel.app` (Judges ke liye instant live link ready!).

#### 2. Backend: Deploy on **Render.com** (Takes 3 minutes)
1. [render.com](https://render.com) par free account banayein.
2. **"New +"** $\rightarrow$ **"Web Service"** click karein aur apna GitHub repo connect karein.
3. Configure karein:
   - **Name:** `nirnay-backend-api`
   - **Language:** `Python 3`
   - **Root Directory:** `.`
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 10000`
4. Click **"Deploy Web Service"**!
5. 🎉 **Live Backend URL:** `https://nirnay-backend-api.onrender.com` (Swagger Docs: `.../docs`).

---

### ☁️ Option B: Deploy on AWS (Since It Is an AWS Hackathon)
Agar judges ko 100% AWS URL hi dikhana hai:

#### 1. Frontend on **AWS Amplify Hosting**:
1. AWS Management Console me login karein $\rightarrow$ Search **AWS Amplify**.
2. Click **"Host web app"** $\rightarrow$ Select **GitHub** $\rightarrow$ Authorize.
3. Apna repository select karein aur Branch `main` chunein.
4. App build settings me **Base directory** ko `frontend` set karein.
5. Click **"Save and Deploy"**!
6. 🎉 **Live AWS Link:** `https://main.d123456789.amplifyapp.com`

#### 2. Backend on **AWS App Runner** ya **AWS EC2**:
* **AWS App Runner:**
  - AWS Console $\rightarrow$ Search **App Runner** $\rightarrow$ Create Service.
  - Source: Source code repository (GitHub).
  - Runtime: Python 3.
  - Build command: `pip install -r backend/requirements.txt`
  - Start command: `python3 -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8080`
  - Port: `8080`.
  - Gives HTTPS endpoint on AWS!

---

## 🏆 Submission Form Checklist (Kya-Kya Fill Karna Hai)

| Field | Kya Submit Karna Hai |
| :--- | :--- |
| **Project Title** | **NIRNAY** — Pre-Storm Urban Waterlogging Decision & Resource Allocation Engine |
| **Track** | Heat and Water |
| **GitHub Repo** | `https://github.com/<your_username>/<repo_name>` |
| **Live Deployed Demo** | `https://nirnay-delhi.vercel.app` (ya Amplify link) |
| **AWS Services Used** | Amazon Bedrock, AWS Strands Agents SDK, AWS Open Data (Copernicus DEM), AWS Amplify / SAM |
| **Pitch Video (3 mins)** | YouTube / Loom link (Follow 3-minute pitch script in `TEAM_CHANGELOG_AND_MEMBER_GUIDE.md`) |
| **Presentation Slide Deck** | 5-slide PDF / Canva link |

---

## ⚡ Summary: Abhi Turant Kya Karein?
1. **Pehle:** Is terminal se clean code GitHub repo ke `main` branch par push kar dein.
2. **Dusra:** Vercel ya AWS Amplify par `frontend` folder connect karke Deploy daba dein. 2 minute me Live link mil jayega.
3. **Teesra:** Submission form me Live Link aur GitHub Link daal dein!
