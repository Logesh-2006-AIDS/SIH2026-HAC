# 🛡️ CRIMENEXUS AI — SIH 2026 Criminal Network Intelligence Platform

> **An AI-powered multimodal investigation platform for law enforcement agencies that extracts legal entities from FIR documents, constructs interconnected knowledge graphs, and uncovers criminal syndicates.**

---

## 🏛️ Architecture: PostgreSQL vs Neo4j (Hybrid Polyglot Storage)

| Storage Layer | Component | Purpose & Data Model |
| :--- | :--- | :--- |
| **📁 Local File System** | `/backend/data/uploads/fir/` | Original FIR documents (PDF / TXT / CSV) stored with SHA-256 integrity hashing for legal chain of custody. |
| **🗄️ Relational Store** | SQLite / PostgreSQL | User authentication, RBAC permissions (**Admin**, **Investigator**, **Analyst**), case file metadata, audit trails, and raw extracted text. |
| **🕸️ Knowledge Graph** | Neo4j Graph Database | Stores all extracted entities as **Nodes** (`Person`, `Vehicle`, `Phone`, `Location`, `Gang`, `FIR_Case`, `Legal_Section`) and **Edges** (`CO_ACCUSED`, `CALLED`, `OWNS_VEHICLE`, `OPERATES_IN`, `TRANSFERRED_MONEY`). |

---

## 🚀 3 Dedicated Role-Based Dashboards

### 1. 🛡️ Admin Operations
- **System Health Telemetry**: Live status of FastAPI, Relational DB, Neo4j Graph, and Local Storage.
- **Dataset Ingestion Station**: One-click seeding of all 9 CSV tables from the SIH Investigation Database.
- **Compliance & Audit Trail**: Real-time logging of all officer actions, file uploads, and graph queries.

### 2. 🔍 Investigator Command Station
- **FIR File Ingestion**: Drag-and-drop upload supporting PDF, TXT, CSV with SHA-256 cryptographic verification.
- **Real-Time NLP Stream**: Live extraction of suspects, aliases (`Ravi @ Ravan`), vehicles, phones, and IPC sections.
- **Explainable Legal Triples**: Sentence-level evidence citations for every extracted relationship.
- **Case Evidence Registry**: Search and download raw local copies of FIR records.

### 3. 📊 Analyst Intelligence Hub
- **Interactive Knowledge Graph**: 2D/3D Force Graph visualization with node filtering, zoom/pan, and search.
- **Betweenness Centrality & Kingpin Leaderboard**: Ranks key orchestrators and bridge suspects.
- **Shortest Path Link Discovery**: Calculates multi-hop degrees of separation between any two suspects.
- **Syndicate Ring Detection**: Clusters connected criminal sub-graphs (e.g. *Viper Syndicate*, *Apex Front*).
- **AI Graph Copilot**: Natural language query engine to interrogate knowledge graph connections.

---

## 🧠 High-Precision NLP Core Workflow

1. **Legal Text Preprocessing**: Normalizes Indian police text, removes OCR artifacts, and segments document sections.
2. **Indian Law Enforcement NER**:
   - **Suspects & Aliases**: Captures formats like `Ravi Kumar @ Ravan`, `Vikram Singh alias Vicky`.
   - **Vehicle Plates**: High-precision Indian format matching (`DL 01 AB 1234`, `HR 26 DQ 5544`).
   - **Phone & CDR**: Indian mobile formats (`+91-98765-XXXXX`, `10-digit mobile`).
   - **IPC & Special Acts**: `Section 302, 307, 120B IPC`, `Arms Act 25/54/59`, `NDPS Act`, `IT Act 66D`.
   - **Financials**: Currency amounts (INR, Lakhs, Crores, ₹), UPI IDs, and crypto wallets.
3. **Relationship Extraction**: Extracts `(Subject, PREDICATE, Object)` triples with exact sentence quotes.
4. **Entity Resolution**: Groups aliases and phonetic variations into unified master criminal identities.

---

## ⚡ Quick Start

### 1. Launch Platform (One-Click)
```bash
python start_platform.py
```
*Or double click `run_platform.bat` on Windows.*

- **Frontend UI**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Default Login Roles
- **Analyst**: `analyst` / `password123`
- **Investigator**: `investigator` / `password123`
- **Admin**: `admin` / `password123`
