"""
SIH 2026: AI Criminal Network Investigation Platform
Unified Dual-Process Launcher (FastAPI Backend + Vite Frontend)
"""
import subprocess
import sys
import os
import time

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")

def main():
    print("=" * 70)
    print("  🚀 SIH 2026: AI CRIMINAL NETWORK INVESTIGATION PLATFORM")
    print("=" * 70)
    print("  ► Backend:  FastAPI + NLP Engine + Neo4j Graph + Local Storage")
    print("  ► Frontend: React 18 + Vite + Interactive Force Graph (Port 5173)")
    print("  ► Dashboards: 🛡️ Admin  •  🔍 Investigator  •  📊 Analyst")
    print("=" * 70)

    # 1. Start Backend
    print("\n[1/2] Starting Backend Server (http://127.0.0.1:8000)...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"],
        cwd=BACKEND_DIR
    )

    time.sleep(2)

    # 2. Start Frontend
    print("\n[2/2] Starting Frontend UI (http://localhost:5173)...")
    frontend_proc = subprocess.Popen(
        ["npm.cmd" if sys.platform == "win32" else "npm", "run", "dev"],
        cwd=FRONTEND_DIR
    )

    print("\n" + "=" * 70)
    print("  🎉 Platform is LIVE!")
    print("  🌐 Open Frontend:  http://localhost:5173")
    print("  📖 API Swagger Docs: http://localhost:8000/docs")
    print("=" * 70)
    print("  Press Ctrl+C to terminate both servers.")

    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping services...")
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()
