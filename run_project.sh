#!/bin/bash

# NIRNAY Full Project One-Command Launcher Script

echo "============================================================"
echo "🌊 STARTING NIRNAY FULL-STACK APPLICATION"
echo "============================================================"

# 1. Start Python Backend FastAPI Server with --app-dir backend
echo "⚡ Step 1: Launching FastAPI Backend & AWS Strands Agent..."
python3 -m uvicorn app.main:app --app-dir backend --reload --port 8000 &
BACKEND_PID=$!

# Give backend 2 seconds to launch
sleep 2

echo "✅ Backend API Server running at http://localhost:8000"

# 2. Prepare Frontend & Launch Web Server
echo "🌐 Step 2: Launching Control Room Web Application..."
cd frontend

# Install node packages if missing
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies (first time setup)..."
    npm install
fi

echo "🚀 Starting Web Frontend..."
npm run dev

# Cleanup background backend process on exit
kill $BACKEND_PID
