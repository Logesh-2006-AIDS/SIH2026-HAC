# AI-Powered Criminal Network Analysis Platform
**Smart India Hackathon 2026 (PS 26189)**  
*Ministry of Home Affairs | NCRB Women Safety Division | Theme: Blockchain & Cybersecurity*

---

## 📌 1. Background & Problem Statement

Modern criminal networks operate across fragmented channels—FIRs, CDR call logs, financial transactions, seized device records, and intelligence briefs. Manual analysis across siloed data leads to missed links between masterminds, intermediaries, shell companies, and cross-case operations.

### The Objective
To convert multi-source criminal records into an **interactive Knowledge Graph** that empowers law enforcement to:
- Detect hidden cross-case links (e.g., shared shell companies, burner phones, couriers).
- Identify key network influencers using graph centrality algorithms.
- Uncover suspicious multi-hop fund flows and temporal communication patterns.
- Keep the human officer in control with explainable AI scoring and audit logging.

---

## 🏗️ 2. System Architecture

```
                          ┌────────────────────────────────────────┐
                          │         1. USER & ACCESS LAYER         │
                          │   Admin  |  Investigator  |  Analyst   │
                          └───────────────────┬────────────────────┘
                                              │
┌─────────────────────────────────────────────▼─────────────────────────────────────────────┐
│                                  2. APPLICATION LAYER                                     │
│                         FastAPI (Python) REST / RBAC Auth / Routing                       │
└───────┬───────────────────────────────┬───────────────────────────────┬───────────────────┘
        │                               │                               │
┌───────▼────────────────┐    ┌─────────▼─────────────────────┐    ┌────▼───────────────────┐
│ 3. AI / NLP ENGINE     │    │ 4. GRAPH & ANALYTICS ENGINE   │    │ 5. FORENSIC WORKBENCH  │
│ • Hybrid Legal NER     │    │ • Betweenness Centrality      │    │ • React & Cytoscape.js │
│ • Relationship Extract │    │ • Shortest Path (BFS/Dijkstra)│    │ • Geographic Heatmap   │
│ • Entity Resolution    │    │ • Community Detection         │    │ • Lead Verification   │
│ • Explainable AI (XAI) │    │ • Dynamic Ego-Networks        │    │ • Case Dossier Briefs  │
└───────┬────────────────┘    └─────────┬─────────────────────┘    └────────────────────────┘
        │                               │
        └───────────────────────┬───────┘
                                │
             ┌──────────────────▼──────────────────┐
             │    6. STORAGE & DATA LAYER          │
             │  • Graph Store Interface:           │
             │    - LocalFixtureStore (In-Memory)  │
             │    - MemgraphStore (Bolt Protocol)  │
             │  • Relational Store (SQLite/Postgres│
             └─────────────────────────────────────┘
```

---

## 🌟 3. Graph Store Architecture

The platform provides **one unified Graph Store interface** (`BaseGraphStore`) with two pluggable implementations:
1. **`LocalFixtureStore`** *(Default in `DEMO_MODE=true`)*: High-performance in-memory graph pre-loaded with the canonical 50-node, 22-edge dataset across 5 cases. Supports dynamic graph additions from live document ingestion.
2. **`MemgraphStore`**: Direct Bolt-protocol connector for real Memgraph graph database deployments.

Select the active graph store with the `GRAPH_STORE` environment variable (`fixture` or `memgraph`).

---

## 🚀 4. Quickstart & Setup (Zero Docker Required)

The entire platform runs locally with **zero external dependencies** using SQLite and `LocalFixtureStore`.

### Prerequisites
- Python 3.10+
- Node.js 18+

### Step 1: Clone and Set Up Backend
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
```

### Step 2: Set Up Frontend
```bash
cd ../frontend
npm install
```

### Step 3: Initialize / Reset Demo Database
Run the schema setup and seeding script:
```bash
python reset_demo_db.py
```

### Step 4: Run the Application
Open two terminals (or run `python launch_platform.py`):

**Terminal 1 (Backend - Port 8000):**
> 💡 **Important for Demo Video Recording**: Run uvicorn **without** `--reload` so that document uploads and database writes do not trigger hot-reload restarts mid-demo.
```bash
cd backend
uvicorn app.main:app --port 8000
```
*(For active development only, you may optionally use `uvicorn app.main:app --reload --port 8000`)*

**Terminal 2 (Frontend - Port 5173):**
```bash
cd frontend
npm run dev
```

Open your browser at **`http://localhost:5173`** (Interactive API Docs at `http://localhost:8000/docs`).

---

## 🔑 5. Demo Credentials

| Role | Email | Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Investigator** | `investigator@police.gov.in` *(or `investigator@sih.gov.in`)* | `investigator123` | Knowledge Graph, Red-String Path Finder, Multi-Source Ingestion, Actionable Leads, Crime Map, Case Briefs |
| **Analyst** | `analyst@police.gov.in` *(or `analyst@sih.gov.in`)* | `analyst123` | KPI Overview, Cross-Case Matrix, Community Detection, Key Influencers, Entity Resolution Review (Approve/Reject/Split) |
| **Admin** | `admin@police.gov.in` *(or `admin@sih.gov.in`)* | `admin123` | RBAC User Management, 8-Step Ingestion Pipeline Monitor, System Health & Diagnostics, Audit Log |

---

## 🔍 6. 3-Minute Demonstration Walkthrough

1. **Investigator Workbench (`http://localhost:5173`)**:
   - Explore the Knowledge Graph color-coded by entity type (Persons, Phones, Organizations, Vehicles, Accounts, Locations).
   - Filter by **Case 101** to isolate the Armed Robbery syndicate.
2. **Multi-Source Ingestion (`Data Ingestion` tab)**:
   - Ingest `sample_fir_001.txt` -> Watch the 8-step pipeline extract entities, resolve candidates against the graph, and update the graph in real-time.
   - Ingest `sample_cdr_001.csv` or `sample_financial_001.csv` -> Maps structured records with `STRUCTURED_RECORD` extraction method (skipping NLP).
3. **Analyst Entity Resolution Review**:
   - Navigate to **Entity Resolution** tab -> Review candidate pairs with rapidfuzz match score, corroborating signals (shared phone/account/vehicle), and click **Approve**, **Reject**, or **Split**.
4. **Red-String Path Finder**:
   - Select Source `P001 (Ravi Kumar)` and Target `P004 (Aarav Mehta)` -> Visualizes multi-hop transfer trail through shell company and crypto exchange with confidence scores.
5. **Admin Ingestion Monitor & Audit Log**:
   - Review 8-step pipeline execution diagnostics, per-step latencies, duplicate upload skipping, and tamper-evident audit logs.

---

## 🧪 7. Testing & Verification

Run the automated test suite (150+ tests covering ingestion, NLP, resolution, reversibility, and APIs):
```bash
cd backend
pytest tests/ -v
```
Verify core health check endpoint:
```bash
curl http://localhost:8000/api/v1/health
```
