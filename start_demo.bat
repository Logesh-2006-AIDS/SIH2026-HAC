@echo off
title SIH 2026 - AI-Powered Criminal Network Analysis Platform
echo ==============================================================================
echo   SIH 2026: AI-POWERED CRIMINAL NETWORK ANALYSIS PLATFORM
echo   House-targaryen--2026 - Automated Launcher
echo ==============================================================================

:: 1. Ensure Docker containers are running
echo [1/3] Starting Docker services (PostgreSQL, Neo4j, Redis)...
docker compose up -d

:: 2. Initialize databases and seed knowledge graph
echo [2/3] Initializing schemas and seeding Knowledge Graph...
C:\Users\Dharshan\AppData\Local\Programs\Python\Python311\python.exe launch_platform.py

:: 3. Launch Backend in a new window
echo [3/3] Launching FastAPI Backend and React Frontend...
start "SIH Backend API (Port 8000)" cmd /k "cd backend && set PYTHONPATH=. && C:\Users\Dharshan\AppData\Local\Programs\Python\Python311\python.exe -m uvicorn app.main:app --reload --port 8000"

:: 4. Launch Frontend in a new window
start "SIH React Workbench (Port 5173)" cmd /k "cd frontend && npm run dev"

timeout /t 3 >nul
start http://localhost:5173

echo ==============================================================================
echo Platform running! Check your browser at http://localhost:5173
echo ==============================================================================
