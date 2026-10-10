.PHONY: verify dev backend frontend install

# Verify system sanity
verify:
	python3 scripts/verify_system.py

# Install all dependencies
install:
	python3 -m pip install -r backend/requirements.txt
	cd frontend && npm install

# Start backend FastAPI server
backend:
	python3 -m uvicorn backend.app.main:app --reload --port 8000

# Start frontend Next.js server
frontend:
	cd frontend && npm run dev

# One-command full-stack launcher
dev:
	./run_project.sh
