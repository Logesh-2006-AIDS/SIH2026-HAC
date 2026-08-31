# AI-Powered Criminal Network Analysis Platform
**Smart India Hackathon 2026 (SIH26189)**  
*Project Repository: House-targaryen--2026*

---

## 📌 1. Background & Problem Statement

Modern criminal activities are increasingly organized and interconnected. Criminals operate through networks involving associates, intermediaries, financial channels, communication links, locations, and events. Law enforcement agencies collect large volumes of data from sources such as:
- **FIRs and police reports**
- **Call Detail Records (CDRs)**
- **Financial transaction records**
- **Surveillance and intelligence reports**
- **Social media intelligence**
- **Criminal history databases**

### The Core Challenge
Investigators frequently struggle to identify hidden relationships across suspects because the data is **fragmented, unstructured, and distributed across siloed systems**. Manual analysis is slow, labor-intensive, and prone to missing critical cross-case links.

### The Objective
To develop an **AI-powered software platform** that converts structured and unstructured crime-related data into an **interactive Knowledge Graph**, allowing authorized law enforcement investigators to discover hidden relationships, connect cross-case intelligence, identify key network influencers, and prioritize investigative leads with full explainability.

---

## 🌟 2. Key Innovations & Principles

1. **Cross-Case Intelligence**: Uncovering shared suspects, phone numbers, shell companies, and addresses across independent cases (e.g., *Case 101* $\leftrightarrow$ *Org X* $\leftrightarrow$ *Case 205*).
2. **Explainable AI + Evidence-Aware Scoring**: Every link prediction and centrality score provides visual evidence paths, source records, and confidence metrics.
3. **Human-in-the-Loop Verification**: AI predictions are strictly treated as **investigative leads**, not established facts. Investigators can verify, edit, merge, or dismiss connections.
4. **Data Privacy & Security**: Role-Based Access Control (RBAC), end-to-end encryption, audit logs, and data minimization.

---

## 🏗️ 3. Complete System Architecture

```
                          ┌────────────────────────────────────────┐
                          │         1. USER & ACCESS LAYER         │
                          │ Admin | Investigator | Analyst | Viewer│
                          └───────────────────┬────────────────────┘
                                              │
┌─────────────────────────────────────────────▼─────────────────────────────────────────────┐
│                                  3. APPLICATION LAYER                                     │
│                         FastAPI (Python) REST / WebSockets / Auth                         │
└───────┬───────────────────────────────┬───────────────────────────────┬───────────────────┘
        │                               │                               │
┌───────▼────────────────┐    ┌─────────▼─────────────────────┐    ┌────▼───────────────────┐
│ 4. AI / NLP LAYER      │    │ 5. GRAPH & ANALYTICS ENGINE   │    │ 7. INVESTIGATOR UI    │
│ • NER (spaCy/HF)       │    │ • Centrality (Degree/Betw)    │    │ • React.js            │
│ • Relationship Extract │    │ • Community (Louvain/Leiden)  │    │ • Cytoscape.js Graph  │
│ • Entity Resolution    │    │ • Shortest Path (BFS/Dijkstra)│    │ • Path Finder         │
│ • Sentence Embeddings  │    │ • Link Prediction (Jaccard)   │    │ • Case Comparison    │
└───────┬────────────────┘    └─────────┬─────────────────────┘    └───────────────────────┘
        │                               │
        └───────────────────────┬───────┘
                                │
             ┌──────────────────▼──────────────────┐
             │    6. STORAGE & DATABASE LAYER      │
             │  • Neo4j DB (Knowledge Graph)       │
             │  • PostgreSQL DB (Cases, Users, Logs│
             └─────────────────────────────────────┘
```

### Architectural Breakdown (12 Layers):
1. **User & Access Layer**: Role-based portals for Admin, Investigator, Analyst, and Viewer via secure web access.
2. **Data Sources & Ingestion Layer**: Multi-format ingestion (CSV, JSON, SQL records, PDF/DOC/TXT police reports) with parsing, normalization, and deduplication.
3. **Application Layer (FastAPI / Python)**: REST APIs, real-time WebSockets, request validation, rate limiting, and service orchestration.
4. **AI / NLP Processing Layer**:
   - *Entity Extraction (NER)*: `Person`, `Organization`, `Location`, `Case`, `Vehicle`, `Phone`, `Date`, `Event`, `Address`, `Financial Entities`.
   - *Relationship Extraction*: Semantic relationship mapping between entities.
   - *Entity Resolution*: Deduplication and record linkage (e.g., *Ravi Kumar* $\approx$ *R. Kumar* $\approx$ *Ravi K.*).
   - *Similarity Matching*: Cosine similarity, TF-IDF, sentence embeddings.
5. **Graph & Analytics Layer**: Graph construction, centrality metrics, community detection, shortest-path tracing, and link prediction engines.
6. **Knowledge Graph Storage Layer**:
   - **Neo4j**: Native graph storage with entity, relationship, and full-text indexes.
   - **PostgreSQL**: Relational metadata, user credentials, role policies, case files, and audit logs.
7. **Investigator Interface & Features**:
   - Cytoscape.js interactive graph exploration (pan, zoom, expand, collapse).
   - Entity search & advanced filtering (by date, case, type, confidence).
   - Shortest path finder & case comparison tool.
   - Entity details panel with source evidence view.
   - AI-powered natural language query interface.
8. **Security & Privacy Layer**: JWT/OAuth2 authentication, RBAC, data-at-rest & in-transit encryption, tamper-evident audit logs.
9. **Supporting Services**: Redis cache, Celery/RQ task queues for asynchronous NLP jobs, notification system.
10. **Algorithms Used**: Degree Centrality, Betweenness Centrality, Louvain/Leiden Community Detection, Dijkstra/BFS Shortest Path, Common Neighbors, Jaccard Index, Adamic-Adar.
11. **Cross-Cutting Features**: Explainable AI, human-in-the-loop actions, confidence scoring, temporal analysis.
12. **DevOps & Deployment**: Docker containers, Docker Compose, CI/CD pipelines, Prometheus/Grafana monitoring.

---

## 🔄 4. Working Process Flow (11 Steps)

```
[1. Data Collection] ➔ [2. Ingestion & Cleaning] ➔ [3. AI Entity Extraction (NER)]
                                                               │
                                                               ▼
[6. Knowledge Graph (Neo4j)] ◄─ [5. Entity Resolution] ◄─ [4. Relationship Extraction]
        │
        ▼
[7. Graph Analysis (Centrality/Community)] ➔ [8. Cross-Case & Link Analysis]
                                                               │
                                                               ▼
[11. Prioritized Lead] ◄─ [10. Human Verification] ◄─ [9. Explainable Insights]
```

1. **Investigation Data Collection**: Gather FIRs, CDRs, financial transactions, and surveillance notes.
2. **Data Ingestion & Cleaning**: Format standardization, noise removal, missing value handling.
3. **AI Entity Extraction**: Extract named entities using spaCy & transformer models.
4. **Relationship Extraction**: Identify relationship predicates between entities.
5. **Entity Resolution**: Match variations of entities using sentence embeddings and cosine similarity.
6. **Knowledge Graph Creation**: Populate Neo4j nodes and edges.
7. **Graph Analysis**: Calculate Degree Centrality, Betweenness Centrality, and Community Clusters via NetworkX/Neo4j.
8. **Cross-Case & Link Analysis**: Identify shared entities across cases and predict unrecorded links.
9. **Explainable Insights**: Generate evidence-backed explanations and confidence scores for every connection.
10. **Investigator Verification**: Review AI suggestions; accept, edit, or reject leads.
11. **Investigative Lead**: Deliver prioritized, actionable intelligence to the investigation team.

---

## 💻 5. Technology Stack Summary

| Layer / Feature | Technology |
| :--- | :--- |
| **Frontend Framework** | React.js |
| **Graph Visualization** | Cytoscape.js |
| **Backend Framework** | Python 3.10+ / FastAPI |
| **Knowledge Graph Database** | Neo4j (Cypher Query Language) |
| **Relational Database** | PostgreSQL |
| **NLP & NER** | spaCy, Hugging Face Transformers |
| **Semantic Embeddings** | `sentence-transformers` |
| **Graph Algorithms** | NetworkX & Neo4j Graph Data Science (GDS) |
| **Task Queue & Cache** | Redis, Celery / BackgroundTasks |
| **Security & Auth** | OAuth2 with JWT, RBAC, Passlib (bcrypt) |
| **Containerization** | Docker, Docker Compose |

---

## 🚀 6. Planned Directory Structure

```
House-targaryen--2026/
├── backend/
│   ├── app/
│   │   ├── api/             # FastAPI REST routes (auth, cases, graph, search)
│   │   ├── core/            # Config, security, database connectors
│   │   ├── models/          # PostgreSQL SQLAlchemy / Pydantic models
│   │   ├── nlp/             # spaCy / Transformer NER, RE & Resolution pipelines
│   │   ├── graph/           # Neo4j query handlers & NetworkX analytics
│   │   └── services/        # Ingestion, lead ranking, explainability engine
│   ├── tests/
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/      # Graph visualization (Cytoscape), details panels, filters
│   │   ├── pages/           # Dashboard, Case View, Entity Resolution, Lead Verification
│   │   ├── services/        # API client
│   │   └── App.jsx
│   ├── package.json
│   └── Dockerfile
├── data/
│   ├── raw/                 # Synthetic FIRs, CDRs, transaction samples
│   └── processed/
├── docker-compose.yml
├── implementation_plan.txt  # Step-by-step roadmap
└── README.md
```

---

## ⚖️ 7. Compliance & Ethical Safeguards
- **Synthetic Data**: Developed and tested purely with synthetic, fictitious crime datasets.
- **Investigator Sovereignty**: AI provides suggestions; only human investigators make decisions.
- **Audit Trails**: Every query, lead review, and entity merge is logged for transparency and legal accountability.



RUN THIS PROJECT

Based on your uploaded **SIH26189 project roadmap and README**, your stack is **FastAPI + React + Neo4j + PostgreSQL + Redis**, with Docker Compose planned for running the complete system.  

### 🚀 Run the project

Open **PowerShell** in your project root (`House-targaryen--2026`).

**1. Check Docker**

```powershell
docker --version
docker compose version
```

**2. Start all services**

```powershell
docker compose up --build
```

Your `docker-compose.yml` is designed to orchestrate the backend, frontend, Neo4j, PostgreSQL and Redis services. 

### 🔹 If you want to run in background

```powershell
docker compose up --build -d
```

Check containers:

```powershell
docker compose ps
```

View logs:

```powershell
docker compose logs -f
```

### 🔹 Stop the project

```powershell
docker compose down
```

If you also want to remove the database volumes:

```powershell
docker compose down -v
```

⚠️ **Don't use `-v` if you want to preserve your Neo4j/PostgreSQL data.**

---

### 🐍 Run backend separately

If you are **not using Docker for the backend**, according to the roadmap you need Python 3.10+ and the backend dependencies such as FastAPI, Uvicorn, Neo4j, PostgreSQL, spaCy, sentence-transformers, etc. 

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Then:

```powershell
uvicorn app.main:app --reload
```

Usually the API will be available at:

```text
http://localhost:8000
```

Swagger API documentation:

```text
http://localhost:8000/docs
```

### ⚛️ Run frontend separately

Open **another PowerShell**:

```powershell
cd frontend
npm install
npm run dev
```

Then open the URL shown by Vite, usually:

```text
http://localhost:5173
```

### ✅ Recommended for your SIH demo

If your project files are already implemented according to the uploaded structure, the easiest command sequence is:

```powershell
cd House-targaryen--2026
docker compose up --build
```

Then, in another terminal:

```powershell
docker compose ps
```

Your architecture is intended to process synthetic FIR/CDR/financial data → NLP extraction → entity resolution → Neo4j knowledge graph → graph analysis → investigator UI. 

**If `docker compose up --build` gives an error, send me the full terminal error. I can give you the exact command/fix for your project.**
