# FRONTEND FUNCTIONAL SPECIFICATION
## SIH26189 — AI-Powered Criminal Network Analysis Platform
### Team: House Targaryen | Target: Smart India Hackathon (SIH)

---

## 1. Executive Summary & Purpose of this Specification

This document serves as the **authoritative functional contract** between the software engineering logic and future UI/UX design (e.g., in Figma). 

### Separation of Concerns
1. **Design Independence**: The visual design (color palette, typography, layout grids, borders, shadows, skeuomorphic vs flat aesthetics, card styles, and component placements) is completely decoupled from functionality.
2. **Behavioral Invariance**: Any future UI design can completely redesign the presentation layer without altering or breaking:
   - State management flows
   - Graph operations (Cytoscape focus, expansion, path highlighting)
   - Entity correlation & cross-case logic
   - Human-in-the-loop lead verification state transitions
   - Mock service data structures
3. **100% Client-Side Architecture (Demo Phase)**: The platform functions completely offline without active backend servers (Neo4j, PostgreSQL, Redis, or Docker). All features run on a centralized mock investigation dataset ([mockData.js](file:///f:/sih%20-%20criminal%20network%20analysis/frontend/src/data/mockData.js)) and asynchronous simulated service layer ([mockService.js](file:///f:/sih%20-%20criminal%20network%20analysis/frontend/src/data/mockService.js)).

---

## 2. Core Product Investigation Workflow

The application supports a continuous, closed-loop forensic investigation workflow:

```
[1. Multi-Source Ingestion]
       │ (FIR Text, CDR Call Logs, Financial Wire Statements, Covert Intel)
       ▼
[2. AI/NLP Entity Extraction]
       │ (Named Entity Recognition: Persons, Phones, Accounts, Vehicles, Locations)
       ▼
[3. Entity Resolution]
       │ (Phonetic matching, Alias clustering, e.g. "Ravi K." -> PERSON-001)
       ▼
[4. Relationship Mapping & Knowledge Graph]
       │ (Topological synthesis, Co-occurrence, Call frequency, Bank wires)
       ▼
[5. Graph Analysis & Key/Bridge Entity Identification]
       │ (Cross-Case Bridge Scoring, Hub identification, Ravi Kumar Nexus)
       ▼
[6. Suspicious Pattern Detection]
       │ (Pre-incident transfers, Burner telecom spikes, Hawala layering)
       ▼
[7. Cross-Case Relationship Discovery]
       │ (Matrix intersections between CASE-101, CASE-102, CASE-103)
       ▼
[8. Red-String Path Finding]
       │ (Multi-hop path tracing from suspect to front company with evidence)
       ▼
[9. AI Investigation Copilot]
       │ (Natural language evidence-backed Q&A with direct graph inspect)
       ▼
[10. Timeline & Evidence Grounding]
       │ (Clickable chronological events linked to graph nodes)
       ▼
[11. Actionable Leads Synthesis]
       │ (High-priority leads generated from corroborated evidence)
       ▼
[12. Human-in-the-Loop Verification]
       │ (Investigator review: AI_SUGGESTED -> UNDER_REVIEW -> VERIFIED / REJECTED)
       ▼
[Court-Ready Intelligence Brief]
```

---

## 3. The Three Primary Operational Dashboards Architecture

The platform provides **three distinct operational environments**, each answering a unique investigative question:

| Dashboard | Question Answered | Operational Focus | Role In Platform |
| :--- | :--- | :--- | :--- |
| 🛡️ **ADMIN DASHBOARD** | **“Is the platform secure and properly managed?”** | **CONTROL** | System Command Center, User Administration, Access Policies, Audit Logs, Pipeline Feeds |
| 🔎 **INVESTIGATOR DASHBOARD** | **“How is this person/case connected?”** | **CONNECTION** | Investigation Workbench, Network Graph, Person Focus Mode, Path Finding, Lead Verification |
| 📊 **ANALYST DASHBOARD** | **“What patterns exist across the larger crime network?”** | **PATTERN** | Strategic Intelligence, Macro Trends, Heatmaps, Gang Cluster Detection, Link Prediction |

---

### 3.1. 🛡️ ADMIN DASHBOARD — System & Security Control (`AdminDashboard.jsx`)
- **Core Purpose**: Manage the entire platform ecosystem, officer access, data governance, and cryptographic audit logs.
- **Unique UI Metaphor**: **Command Center Console**.
- **Core Functional Modules**:
  1. **System Overview**: Total users (18 officers), active investigations (5 cases), data sources ingested (4), system health (`OPTIMAL 99.9%`), real-time API latency ($14\text{ ms}$), active sessions, memory/storage allocation ($4.8\text{ MB} / 50\text{ MB}$).
  2. **Micro-Services Health Monitor**: Status checks for AI/NLP Named Entity Engine (Online), Forensic Knowledge Graph Engine (Online), Multi-Case Correlation Bus (Online), Red-String Path Computation (Online), Audit & Evidence Chain Ledger (Secured).
  3. **User & Role Management**: Directory table of authorized personnel with badge numbers, departments, roles (`INVESTIGATOR`, `ANALYST`, `ADMIN`, `VIEWER`), active status, last active timestamps, and toggle action to deactivate/reactivate officers.
  4. **Access Control & RBAC Policies**: Matrix detailing permissions per role, case-level jurisdiction constraints, dataset permissions, and formal lead verification authorization.
  5. **Forensic Audit & Evidentiary Chain Ledger**: Chronological event trail tracking user logins, query operations, data pipeline runs, and lead approvals with timestamps, officer IDs, severity flags, and IP addresses. Includes free-form search and severity filter.
  6. **Data Source Governance**: Reviewing ingested evidence files (FIR, CDR, Banking, Intel) with file format, record counts, synchronization status, and cryptographic SHA-256 integrity hashes.

---

### 3.2. 🔎 INVESTIGATOR DASHBOARD — Investigation Workbench (`CriminalBoard.jsx` & `CaseInvestigation.jsx`)
- **Core Purpose**: Enable field detectives to follow specific leads, trace money/phone links, and verify connections for court prosecution.
- **Unique UI Metaphor**: **Tactical Corkboard & Interactive Link Analysis**.
- **Core Functional Modules**:
  1. **Case Management**: Active case overview, incident parameters, primary accused list, chronological event timeline.
  2. **Interactive Knowledge Graph (`network`)**: Full Cytoscape canvas mapping Person, Phone, Org, Location, Vehicle, and Case relationships.
  3. **Person Focus Mode**:
     - Clicking any suspect isolates that person's immediate network while dimming unrelated nodes to $25\%$ opacity.
     - Features explicit expansion controls: **`“Expand 1 Hop”`** ➔ **`“Expand 2 Hops”`** ➔ **`“🌐 Full Network”`**.
  4. **Red-String Path Finder (`pathfinder`)**: Multi-hop path tracing between two entities with hop-by-hop evidence cards and "Explain this path" automated natural language synthesis.
  5. **AI Investigation Copilot (`copilot`)**: Conversational assistant grounded in FIR, CDR, and bank transcripts with clickable entity chips.
  6. **Lead Discovery & Human Verification (`leads`)**: AI-suggested suspect merges and cross-case links requiring mandatory investigator review (`AI_SUGGESTED` ➔ `UNDER_REVIEW` ➔ `VERIFIED` / `REJECTED`) with officer remarks input.

---

### 3.3. 📊 ANALYST DASHBOARD — Intelligence & Pattern Analysis (`AnalystDashboard.jsx`)
- **Core Purpose**: Discover the macro-level structure of organized crime syndicates across multiple police jurisdictions.
- **Unique UI Metaphor**: **Strategic Intelligence & Pattern Studio**.
- **Core Functional Modules**:
  1. **Crime Trends & Patterns**: Time-series incident growth (Monthly counts), rising modus operandi (Contraband smuggling $+34\%$, Hawala transfers $+21\%$, Firearms $+12\%$), declining patterns (Street extortion $-14\%$).
  2. **Persistent Geographical Crime Hotspots**: Repeated crime zones linked across multiple FIRs (Chennai Port Terminal 7, Koyambedu Logistics Terminal, T. Nagar Commercial Hub, Tuticorin Deepwater Port) with case citations and alert summaries.
  3. **Community & Gang Cluster Detection (Louvain / Leiden Detection)**:
     - **Cluster A**: Coastal Maritime Smuggling Wing (Ravi Kumar, Dinesh Rao, Container trucks; Cases 101, 103).
     - **Cluster B**: Hawala Financial Laundering Cell (Arun Selvam, Suresh Babu, Southern Hawala; Cases 101, 102).
     - **Cluster C**: Inland Arms & Transit Logistics (Meena Krishnan, Vikram Nair; Cases 102, 103).
     - **Apex Bridge Entity Analysis**: Reveals **Ravi Kumar** (`PERSON-001`) with Inter-Cluster Centrality $0.98$, explaining how neutralizing this nexus fragments the entire syndicate into disconnected cells.
  4. **Algorithmic Link Prediction**:
     - Surfaces hidden conspiratorial connections using Adamic-Adar, Jaccard Similarity, and Common Neighbors.
     - Clearly tagged with **`AI SUGGESTED POTENTIAL LINK`** and confidence scores (e.g. Suresh Babu ⟷ Ravi Kumar: $88\%$).
     - Displays actionable legal/investigative recommendations (e.g., subpoena CDR records).
  5. **Network Centrality Ranking**: Top-ranked nodes by Degree Centrality, Betweenness proxy, and Cross-Case Bridge Score.
  6. **Cross-Case Intersection Matrix**: Multi-case shared entities and connection strengths.
  7. **One-Click Strategic Intelligence Report Export**: Generates and downloads a court-ready strategic brief as a client-side Markdown file.

---

## 4. Global State Architecture (`InvestigationContext.jsx`)

The global state is managed via React Context (`InvestigationContext.jsx`). All pages communicate through this state layer.

| State Variable | Type | Description | Read By | Modified By |
| :--- | :--- | :--- | :--- | :--- |
| `currentRole` | `String` ('INVESTIGATOR', 'ANALYST', 'ADMIN') | Active user role determining accessible views and menu hierarchy | Sidebar, Header, App, CriminalBoard | LoginScreen, Header, CriminalBoard |
| `activeTab` | `String` | Active view identifier (`dashboard`, `network`, `cases`, `patterns`, `nlp`, `keyentities`, `pathfinder`, `leads`, `investigation`, `map`, `copilot`, `brief`, `ingest`, `verification`, `report`) | App, Sidebar, CriminalBoard | Sidebar, CriminalBoard, Any cross-tab action button |
| `selectedCase` | `String` ('101', '102', '103') | Currently active investigation case number | Header, GraphControls, CaseInvestigation, SmartCaseBrief, CriminalBoard | Case selectors in Header, Board, Dossiers |
| `casesList` | `Array<CaseObject>` | Metadata list of active criminal cases | Header, CriminalBoard, CaseDossiers | Fetched on load via `mockService.getCases()` |
| `caseSummary` | `Object` | Dossier summary, entity count, relationship count, lead count | CriminalBoard, CaseInvestigation | Updated when `selectedCase` changes |
| `nodes` | `Array<NodeObject>` | Graph nodes currently loaded in Cytoscape | GraphCanvas, GraphControls, KeyEntities, CaseInvestigation | `fetchSubgraph` in Context |
| `edges` | `Array<EdgeObject>` | Graph edges with relationships, confidence, evidence | GraphCanvas, CaseInvestigation | `fetchSubgraph` in Context |
| `selectedEntity` | `Object \| null` | The entity currently selected for detailed inspection | GraphCanvas, EntityInspector, CaseInvestigation | GraphCanvas (node tap), KeyEntities, CrossCasePanel, Copilot |
| `graphFocusEntity` | `String \| null` | Entity ID being focused / isolated in graph | GraphCanvas, GraphControls, EntityInspector | EntityInspector ("Focus Entity"), CrossCasePanel, Leads |
| `focusMode` | `Boolean` | When true, isolates focus entity and its N-hop neighbors | GraphCanvas, GraphControls | GraphControls toggle, EntityInspector |
| `expandHops` | `Number` (1 or 2) | Neighborhood expansion depth in focus mode | GraphControls, Context `fetchSubgraph` | GraphControls hops selector |
| `highlightedPath` | `Array<String>` | Ordered array of Node IDs representing active shortest path | GraphCanvas, GraphControls, App (PathBanner) | `handleFindPath` in Context, PathFinder |
| `pathDetails` | `Object \| null` | Hops, total distance, evidence citations for active path | App (PathBanner), PathFinder | `findShortestPath` in mockService |
| `pathSourceId` | `String \| null` | Pre-selected starting entity ID for path tracing | GraphControls, PathFinder | EntityInspector ("Trace Path from Here") |
| `leads` | `Array<LeadObject>` | Actionable investigation leads managed by local reducer | InvestigationLeads, LeadVerification, CriminalBoard, CaseInvestigation | `dispatchLeads` (`VERIFY_LEAD`, `RESET`) |
| `ingestionDone` | `Boolean` | Flag indicating whether demo data ingestion has executed | DataIngestion, Header, Sidebar | DataIngestion completion |
| `demoMode` | `Boolean` (constant `true`) | Enforces local client-side offline execution | Throughout platform | Set to `true` by default |

### Lead Reducer Actions (`leadsReducer`)
- `SET_LEADS`: Sets full leads array.
- `VERIFY_LEAD`: Receives `{ id, status }`. Updates target lead to `status` ('VERIFIED', 'UNDER_REVIEW', 'REJECTED'), adds `verified_at` timestamp and `verified_by: 'Investigator'`.
- `RESET`: Resets leads back to initial state.

---

## 4. Subsystem Functional Contracts

### 4.1. Cytoscape Knowledge Graph Contract (`GraphCanvas.jsx` & `GraphControls.jsx`)

#### Node Representations & Types
- **Person** (`#D9AA3D` Gold): Attributes include `name`, `alias`, `role`, `age`, `occupation`, `cases`, `confidence`.
- **Phone** (`#5E9F68` Green): Attributes include `number`, `carrier`, `imei`, `cases`.
- **Financial Account** (`#D8C58A` Sand/Gold): Attributes include `account_number`, `bank`, `account_type`, `cases`.
- **Organization** (`#E8D9A8` Light Gold): Attributes include `name`, `registration_number`, `type`, `cases`.
- **Vehicle** (`#94A3B8` Slate/Steel): Attributes include `reg_number`, `make_model`, `registered_owner`, `cases`.
- **Location** (`#C92A2A` Crimson): Attributes include `name`, `lat`, `lon`, `jurisdiction`, `cases`.

#### Relationship Types (Directed Edges)
- `COMMUNICATED_WITH`: Call/SMS logs with duration, timestamps, call count.
- `TRANSFERRED_FUNDS_TO`: NEFT/RTGS wire transfer with amount, date, transaction ID.
- `OPERATES`: Organization control / management link.
- `OWNS`: Account or vehicle ownership.
- `ASSOCIATE_OF`: Direct co-accused or criminal associate link.
- `USED_IN_INCIDENT`: Vehicle or weapon tied to a crime scene.
- `LOCATED_AT`: Geo-spatial positioning at time of incident.

#### Graph Behaviors & Interactions
1. **Node Tap / Click**: Emits `onSelectEntity(rawEntityData)`. Opens `EntityInspector` drawer on the right.
2. **Background Tap**: Clears `selectedEntity` and closes `EntityInspector`.
3. **Focus Mode (Isolation)**:
   - When enabled with an active `focusEntityId`, only the target node and its 1-hop or 2-hop connected neighbors remain full opacity.
   - All unrelated nodes and edges are set to `opacity: 0.25` (dimmed) with classes `node.dimmed`.
   - The focus node receives class `node.focus-core` (prominent border, high z-index).
4. **Path Highlighting**:
   - Nodes in `highlightedPath` receive class `node.path-highlight` (`#D62828` red background, white text, z-index 998).
   - Edges connecting sequential path nodes receive class `edge.path-edge-highlight` (thick red line width 4.5px, glowing).
5. **Layout Algorithms Supported**:
   - `cose`: Force-directed physics layout.
   - `concentric`: Radial hierarchical hierarchy rings.
   - `circle`: Circular clustering.
   - `grid`: Matrix grid arrangement.
6. **Case Filtering**:
   - Changing the case dropdown re-queries `mockService.getSubgraph(caseId)`. Selecting "All Cases" renders the cross-case syndicate network.

---

### 4.2. Entity Inspector Functional Contract (`EntityInspector.jsx`)

When an investigator selects an entity in the graph or clicks "Inspect" anywhere in the app, the Entity Inspector renders:

#### Displayed Data
- **Header**: Entity icon, Primary Title (Name/Number/Reg), Entity Type, Sub-role (`role`).
- **Identifiers**: Entity Unique ID (e.g. `PERSON-001`), Case badges (`CASE-101`, `CASE-102`, etc.).
- **Cross-Case Alert**: Displayed if entity appears in more than 1 case (`"CROSS-CASE BRIDGE"`).
- **Core Statistics**:
  - Direct connection count
  - Cases involved count
  - Evidence records count
  - AI confidence percentage
- **Direct Relationships List**: Top 5 immediate neighbors with relationship verbs (e.g., `COMMUNICATED_WITH`, `TRANSFERRED_FUNDS_TO`).
- **Corroborated Evidence Excerpts**: Brief citations from FIR, CDR, or Bank ledgers.

#### Primary Functional Actions
1. **`Focus Entity in Graph`**: Triggers `onFocusEntity(entity)` -> isolates the node in Cytoscape with dimming.
2. **`Trace Path from Here`**: Sets `pathSourceId` to this entity ID -> opens/pre-fills Path Finder.
3. **`Evidence`**: Navigates to `investigation` tab with section set to `evidence`.
4. **`Cross-Case`**: Navigates to `crosscase` tab focusing on this entity's intersections.
5. **`Open Case [X]`**: Sets `selectedCase` and opens the case workspace.
6. **`Close Drawer`**: Deselects the entity and restores full graph view.

---

### 4.3. Data Ingestion Functional Contract (`DataIngestion.jsx`)

Demonstrates ingestion of multi-modal law enforcement files.

#### Supported Data Sources
1. **FIR Report Document** (`.txt`): Unstructured police complaints containing suspect names, locations, narratives.
2. **CDR / Call Detail Records** (`.csv`): Telecom call logs, durations, cell towers, timestamps.
3. **Financial Transactions** (`.csv`): Bank wire transactions, NEFT/RTGS, account numbers, amounts.
4. **Intelligence Brief** (`.json`): Informant tips, surveillance reports, alias intelligence.

#### Pipeline Execution States
1. `IDLE`: Displays 4 active source cards with status badges ("READY TO INGEST" or "SYNCHRONIZED").
2. `PROCESSING`: Animated sequence showing 5 pipeline stages:
   - **Stage 1 (15%)**: Evidence Validation & Checksum Verification
   - **Stage 2 (40%)**: AI/NLP Named Entity Recognition (Persons, Vehicles, Phones)
   - **Stage 3 (65%)**: Cross-Case Entity Resolution & Alias Disambiguation
   - **Stage 4 (85%)**: Knowledge Graph Topology Generation & Relationship Mapping
   - **Stage 5 (100%)**: Suspicious Pattern Detection & Centrality Computation
3. `COMPLETED`: Summary card displaying:
   - Total sources ingested (4)
   - Entities resolved (24)
   - Edges created (38)
   - Cross-case bridge nodes discovered (3)
   - Action buttons: "Inspect NLP Extractions", "Explore Knowledge Graph".

---

### 4.4. NLP Entity Extraction & Resolution Contract (`NLPEntityExtraction.jsx`)

Demonstrates automated transformation of unstructured FIR text into structured graph entities.

#### Displayed Data
- **FIR Document Viewer**: Verbatim text of First Information Report (Case 101, Chennai Port Narcotics).
- **Interactive Highlighting**: Entity spans within the text are wrapped in color-coded pills corresponding to entity types (Gold = Person, Green = Phone, Blue = Account, Slate = Vehicle, Crimson = Location).
- **Entity Mentions Panel**: List of all extracted tokens with:
  - Mentioned text (e.g., "Ravi Kumar", "TN-09-BX-4532")
  - Entity category
  - Extraction confidence score (e.g., 97%, 92%)
  - Source document reference
  - Linked resolved entity ID (`PERSON-001`, `VEH-001`)
- **Entity Resolution Showcase**:
  - Interactive comparison cards demonstrating how aliases and abbreviations map to canonical entities:
    - `"Ravi Kumar"`, `"R. Kumar"`, `"Ravi K."` -> `PERSON-001` (Confidence 96%)
    - `"Arun Selvam"`, `"A. Selvam"` -> `PERSON-002` (Confidence 94%)
    - `"Southern Hawala Exchange"`, `"Southern Hawala"` -> `ORG-002` (Confidence 98%)

#### User Actions
- **Click Extracted Token**: Highlights corresponding resolved entity card and displays resolution justification.
- **"View in Knowledge Graph"**: Sets `graphFocusEntity` and navigates to `network` tab.

---

### 4.5. Suspicious Patterns Functional Contract (`SuspiciousPatterns.jsx`)

Identifies and explains 6 rule-based criminal heuristics across the dataset.

#### The 6 Heuristic Patterns
1. **Pre-Incident Hawala Transfer** (`CRITICAL`):
   - *Rule*: Significant funds transferred to associate accounts within 48 hours prior to the incident date.
   - *Entities*: Account-204 (Ravi Kumar) -> Account-319 (Arun Selvam) (₹8,50,000).
   - *Cases*: CASE-101, CASE-102.
2. **Burner Telecom Activity Spike** (`CRITICAL`):
   - *Rule*: Abnormal call frequency between co-accused during late night / pre-incident hours.
   - *Entities*: PHONE-001 (Ravi Kumar) <-> PHONE-002 (Arun Selvam) (38 calls in 6 hours).
   - *Cases*: CASE-101.
3. **Multi-Case Bridge Coordinator** (`CRITICAL`):
   - *Rule*: Entity appears as accused or key contact in 3 or more independent jurisdictional FIRs.
   - *Entities*: Ravi Kumar (`PERSON-001`).
   - *Cases*: CASE-101, CASE-102, CASE-103.
4. **Rapid Financial Layering Scheme** (`HIGH`):
   - *Rule*: Large deposit immediately dispersed into multiple smaller accounts within 24 hours.
   - *Entities*: Account-512 (Suresh Babu) -> Account-319 -> Account-457 (Meena Krishnan).
   - *Cases*: CASE-102.
5. **Cross-Case Courier Link** (`MEDIUM`):
   - *Rule*: Secondary courier or logistics operator communicating with ringleaders across distinct cases.
   - *Entities*: Meena Krishnan (`PERSON-003`).
   - *Cases*: CASE-102, CASE-103.
6. **Vehicle Re-use Across Smuggling Nodes** (`MEDIUM`):
   - *Rule*: Registered commercial vehicle logged in multiple port and transit checkpoints under different case FIRs.
   - *Entities*: Container Truck `TN-09-BX-4532` (Dinesh Rao).
   - *Cases*: CASE-101, CASE-103.

#### User Actions
- **Expand / Collapse Card**: Reveals rule explanation, timestamp, and supporting evidence bullets.
- **"Inspect Pattern in Graph"**: Focuses the involved entities in the knowledge graph.
- **Filter by Severity**: CRITICAL, HIGH, MEDIUM, ALL.

---

### 4.6. Key & Bridge Entities Contract (`KeyEntities.jsx`)

Analytic ranking identifying the most connected and cross-cutting individuals in the network.

#### Metric Definition
- **"Cross-Case Bridge Score" (0–100)**: A transparent, composite connectivity score based on:
  1. Number of active cases the entity appears in ($40\%$)
  2. Total direct connections ($30\%$)
  3. Diversity of connection types (phones, accounts, associates) ($20\%$)
  4. Corroborated evidence record count ($10\%$)
- *Note*: We purposefully use "Cross-Case Bridge Score" and "Connectivity Score" rather than deceptive claims of complex Betweenness Centrality.

#### Displayed Data
- **Top 3 Podium / Highlight Cards**:
  1. *Ravi Kumar* (`PERSON-001`) — Bridge Score: **98/100** (Appears in all 3 cases, 8 direct connections).
  2. *PHONE-001* (`+91-9876543210`) — Bridge Score: **94/100** (Present in CDRs across all 3 cases).
  3. *Account-204* (`State Bank of India`) — Bridge Score: **89/100** (Source of operation funding in 2 cases).
- **Ranked Entity Table**:
  - Columns: Rank, Entity, Category, Cases Involved, Total Connections, Cross-Case Bridge Score, Primary Forensic Role, Action.

#### User Actions
- **Row Click / "Inspect"**: Selects entity, focuses in graph, and opens Entity Inspector.
- **Filter by Type**: All, Persons, Phones, Accounts, Organizations.

---

### 4.7. Cross-Case Intelligence Contract (`CrossCasePanel.jsx`)

Enables cross-jurisdictional intelligence sharing by revealing connections across police stations.

#### Displayed Data
1. **Case Intersection Matrix Table**:
   - Shows pairwise comparisons (`CASE-101 ↔ CASE-102`, `CASE-101 ↔ CASE-103`, `CASE-102 ↔ CASE-103`).
   - Columns: Shared Suspects, Shared CDR Phones, Shared Bank Accounts, Link Strength (`CRITICAL 98%`, `STRONG 93%`, `STRONG 91%`).
2. **Bridge Entities Cards**:
   - For each bridge entity: Name, Type, Shared cases count, and an explicit **"Why This Link Matters"** explanation.

#### User Actions
- **Case Filter Buttons**: Focus on CASE-101, CASE-102, or CASE-103.
- **"Inspect in Graph"**: Centers Cytoscape on the shared entity and highlights its edges to both cases.

---

### 4.8. Red-String Path Finder Contract (`PathFinder.jsx`)

Traces the forensic chain of evidence connecting two seemingly unrelated entities.

#### Pre-configured Forensic Paths
1. **Path 1**: *Ravi Kumar* (`PERSON-001`) ➔ *Arun Selvam* (`PERSON-002`) ➔ *Southern Hawala Exchange* (`ORG-002`).
2. **Path 2**: *Ravi Kumar* (`PERSON-001`) ➔ *PHONE-001* ➔ *PHONE-003* ➔ *Meena Krishnan* (`PERSON-003`) ➔ *Inland Cargo Services* (`ORG-003`).
3. **Path 3**: *Account-204* ➔ *Account-319* ➔ *Account-457* (Financial Layering Chain).

#### Interactive Hop Inspection
- Selecting or calculating a path renders an **interactive multi-hop pipeline**:
  - Each node icon, name, and entity type.
  - Directional connection line showing relationship verb.
- **Clicking any Hop** displays:
  - Connecting Relationship
  - Evidentiary Source (e.g. `CDR-CASE-101`, `FIN-CASE-102`)
  - Timestamp / Date
  - Legal Case Reference
  - Evidentiary Confidence Score

#### Path Explanation
- **"Explain This Path"**: Automatically generates a natural-language forensic narrative summarizing how the suspect controls or communicates with the destination organization through intermediaries.
- **"View Path in Graph"**: Sets `highlightedPath` in Cytoscape, drawing the glowing red string across nodes.

---

### 4.9. AI Investigation Copilot Contract (`AICopilot.jsx`)

An evidence-grounded conversational agent for investigating detectives.

#### Input & Suggested Forensic Queries
- Input query text box.
- Suggested query chips:
  - *"How is Ravi Kumar connected to Case-103?"*
  - *"Show suspicious financial activity."*
  - *"Find entities shared across cases."*
  - *"Why is Ravi Kumar a key entity?"*
  - *"What evidence connects Ravi Kumar and Arun Selvam?"*
  - *"Show the shortest connection between Ravi Kumar and Organization ABC."*

#### Answer Format
- **Forensic Narrative Text**: Plain-language intelligence summary answering the query.
- **Evidence Grounding Confidence**: Bar and percentage (e.g. 96%).
- **Correlated Graph Entities Chips**: Clickable entity pills with type and role. Clicking any entity opens it in the graph.
- **Evidence Sources**: Specific case document tags cited (e.g., `FIR-CASE-101`, `CDR-CASE-101`, `FIN-CASE-101`).
- **Related Cases Badges**: Cases touched by the answer.

#### States
- `Analyzing Investigation Dataset & Forensic Graph...` (Loading spinner).
- Message history preserved during the session.

---

### 4.10. Actionable Leads & Human Verification Contract (`InvestigationLeads.jsx` & `LeadVerification.jsx`)

Implements the **Human-in-the-Loop** verification principle mandated for law enforcement AI systems.

#### Lead Structure
```javascript
{
  id: 'LEAD-001',
  title: 'Ravi Kumar — Cross-Case Network Nexus',
  priority: 'CRITICAL', // CRITICAL, HIGH, MEDIUM, LOW
  status: 'AI_SUGGESTED', // AI_SUGGESTED, UNDER_REVIEW, VERIFIED, REJECTED
  entities: ['PERSON-001', 'PHONE-001', 'ACC-001'],
  cases: ['CASE-101', 'CASE-102', 'CASE-103'],
  reason: 'Detailed explainable AI justification...',
  evidence: ['Supporting bullet 1', 'Supporting bullet 2', ...],
  confidence: 0.97,
  verified_at: '14:22:10', // Populated upon verification
  verified_by: 'Investigator (Demo)'
}
```

#### State Transition Model
```
[ AI_SUGGESTED ]
       │
       ├─────────────────────────┐
       ▼                         ▼
[ UNDER_REVIEW ]           [ REJECTED ]
       │
       ▼
  [ VERIFIED ]
```

#### User Actions
1. **"Review Evidence"**: Expands/collapses complete evidence list.
2. **Investigator Remarks**: Free-form text input to enter official justification notes.
3. **"Mark Under Review"**: Transitions status to `UNDER_REVIEW`.
4. **"Approve / Verify Lead"**: Transitions status to `VERIFIED`. Updates global lead counts, displays green verified badge with timestamp.
5. **"Dismiss Lead"**: Transitions status to `REJECTED`.
6. **"View in Graph"**: Focuses lead entities in knowledge graph.
7. **Status Filter Tabs**: All Leads, Needs Review, Under Review, Verified Leads, Dismissed.

---

### 4.11. Timeline & Evidence Grounding Contract (`CaseInvestigation.jsx`)

Maintains chronological integrity of criminal operations.

#### Timeline Event Structure
- `date`: Incident timestamp.
- `title`: Event header (e.g., "Narcotics Seizure at Port", "Pre-incident Wire Transfer").
- `description`: Narrative of the event.
- `evidence_source`: Source reference (`FIR-CASE-101`, `CDR-CASE-101`).
- `confidence`: Grounding percentage.
- `entity_id`: Primary entity tied to event.

#### User Interaction
- **Click Event / "Focus Entity"**: Emits entity ID to Cytoscape -> highlights corresponding node in the graph.
- **Export Court Brief**: Generates and downloads a client-side Markdown file (`Investigation_Report_CASE_101.md`).

---

## 5. Detailed Page-by-Page Design Handoff Specification

This section provides the complete specification for every screen to be designed in Figma.

---

### PAGE 1: Criminal Pinboard / Dashboard (`dashboard`)
- **Purpose**: Central visual hub for the active case. Presents high-level metrics, corkboard wanted posters, and interactive navigation to all forensic modules.
- **Primary User**: Police Investigator / Detective.
- **Key Information**:
  - Active Case Header (Number, Title, Status, Jurisdiction).
  - Metrics row: Total Entities, Relationships, Cross-Case links, Suspicious Patterns, Actionable Leads.
  - Wanted Poster / Hub: Central case suspect silhouette with active status.
  - Interactive Sticky Notes / Cards representing all workflow steps.
- **Primary Actions**:
  - Click "Continue Investigation" -> opens Case Brief workspace.
  - Click any Sticky Note -> navigates directly to that module (`cases`, `network`, `keyentities`, `crosscase`, `pathfinder`, `patterns`, `nlp`, `leads`, `copilot`, `map`, `ingest`).
- **Secondary Actions**:
  - Case Selector dropdown.
  - Role switch dropdown.
  - Desk Lamp toggle (Day/Dark atmosphere mode).
- **Required States**:
  - Active (Normal).
  - Hovered (highlights connecting red-string lines).
- **Navigation Destinations**: All other 11 pages.
- **Global State Dependencies**: `selectedCase`, `caseSummary`, `casesList`, `currentRole`.

---

### PAGE 2: Case Dossiers (`cases` / `dossiers`)
- **Purpose**: Browse and select active criminal investigation files.
- **Primary User**: Investigator & Analyst.
- **Key Information**:
  - Dossier cards for Case 101, Case 102, Case 103, Case 104, Case 105.
  - Each card: Case number, crime category, status, investigating officer, FIR date, location, brief summary.
  - Network footprint preview: Entity count, edge count, cross-case badge.
- **Primary Actions**:
  - "Open Case Workspace" -> sets `selectedCase` and opens `investigation` tab.
  - "Explore Case Graph" -> sets `selectedCase` and opens `network` tab.
- **Global State Dependencies**: `casesList`, `selectedCase`.

---

### PAGE 3: Case Workspace (`investigation`)
- **Purpose**: In-depth dossier inspection for a single case with tabbed evidence views.
- **Primary User**: Lead Investigator.
- **Sub-sections (Sub-tabs)**:
  1. `Case Brief`: Executive summary, incident parameters, primary persons accused.
  2. `Entities`: Filtered entity cards grouped by type (Person, Phone, Vehicle, Account, Location).
  3. `Timeline`: Chronological event trail with clickable nodes.
  4. `Cross-Case`: Case-specific shared links.
  5. `Evidence`: Underlying graph edge table with confidence and source FIR/CDR.
  6. `Potential Leads`: Case-specific AI leads.
  7. `Report`: Printable summary and "Download Court-Ready Brief" export button.
- **Interactions**:
  - Clicking an entity card selects it and opens Entity Inspector.
  - Clicking a timeline event highlights the associated node in the graph.
- **Global State Dependencies**: `selectedCase`, `selectedEntity`, `investigationSection`.

---

### PAGE 4: Evidence Ingestion Engine (`ingest`)
- **Purpose**: Ingest and synchronize multi-source crime data into the forensic knowledge graph.
- **Primary User**: Admin / Forensic Technician / Investigator.
- **Key Information**:
  - 4 Source Cards: FIR Document, CDR Telecom logs, Banking Statements, Field Intelligence.
  - Each card: format, record count, sync status.
- **Primary Actions**:
  - "Run Multi-Source Ingestion (Demo Pipeline)" -> triggers 5-stage animated processing sequence.
  - "Upload New [Format]" -> opens custom file dropzone.
- **States**:
  - `IDLE`: Cards ready to process.
  - `PROCESSING`: Active progress bar (0% -> 100%) and stage checkmarks.
  - `COMPLETED`: Success banner with metrics (4 sources, 24 entities resolved, 38 edges created).
- **Navigation Destinations**: "Inspect NLP Extractions", "Explore Knowledge Graph".
- **Global State Dependencies**: `ingestionDone`, `selectedCase`.

---

### PAGE 5: AI/NLP Entity Extraction & Resolution (`nlp`)
- **Purpose**: Showcase how raw FIR text is parsed using NER, annotated, and resolved across alias variants.
- **Primary User**: Forensic Analyst / Judge / Inspector.
- **Key Information**:
  - Verbatim FIR narrative with inline color-coded token highlights.
  - Extracted entity table with token name, entity category, extraction confidence, and document tag.
  - Entity Resolution carousel showing phonetic/alias clusters mapping to canonical suspects.
- **Primary Actions**:
  - Click token in text -> scrolls and highlights the resolved suspect card.
  - "Inspect Entity in Graph" -> focuses entity in Cytoscape.
- **Global State Dependencies**: `graphFocusEntity`, `selectedEntity`.

---

### PAGE 6: Knowledge Graph Explorer (`network`)
- **Purpose**: Interactive topological network visualization of criminal syndicates.
- **Primary User**: Analyst & Investigator.
- **Key Information**:
  - Cytoscape graph canvas with color-coded nodes and labeled directional edges.
  - Top Graph Controls Bar: Case filter, Layout selector (`cose`, `concentric`, `circle`, `grid`), Focus Mode toggle, Hops selector (1-hop / 2-hop), Red-string path trigger.
  - Active Path Banner: Displays hops and confidence when a shortest path is highlighted.
  - Entity Inspector Drawer: Slides in from the right when any node is tapped.
- **Primary Actions**:
  - Tap node -> selects entity and opens Inspector.
  - Tap canvas -> deselects entity.
  - Toggle Focus Mode -> dims unlinked nodes.
  - Zoom / Pan / Drag nodes.
- **Global State Dependencies**: `nodes`, `edges`, `selectedEntity`, `graphFocusEntity`, `focusMode`, `highlightedPath`, `layoutName`.

---

### PAGE 7: Key & Bridge Entities (`keyentities`)
- **Purpose**: Identify ringleaders, brokers, and logistics bottlenecks across cases.
- **Primary User**: Senior Investigator / Intelligence Analyst.
- **Key Information**:
  - Top-3 Podium Cards: Ranked bridge entities (Ravi Kumar #1, Phone-001 #2, Account-204 #3).
  - Analytics Table: Entity name, category, case badges, direct connection count, Cross-Case Bridge Score bar, and forensic role summary.
- **Primary Actions**:
  - Click table row / "Inspect" -> focuses node in graph.
  - Category filter tabs.
- **Global State Dependencies**: `selectedEntity`, `graphFocusEntity`.

---

### PAGE 8: Cross-Case Intelligence (`crosscase`)
- **Purpose**: Detect multi-jurisdictional syndicate operations by computing intersections between police cases.
- **Primary User**: Inter-state Crime Intelligence Officers.
- **Key Information**:
  - Cross-Case Intersection Matrix Table showing shared persons, CDR phones, bank accounts, and link strength.
  - Bridge Entity cards explaining "Why This Link Matters" in plain investigative language.
- **Primary Actions**:
  - Case filter buttons (Case 101, Case 102, Case 103).
  - "Inspect in Graph" button per bridge entity.
- **Global State Dependencies**: `selectedCase`, `graphFocusEntity`.

---

### PAGE 9: Red-String Path Finder (`pathfinder`)
- **Purpose**: Trace multi-hop connections and financial/telecom intermediaries between any two entities.
- **Primary User**: Detective investigating money trails and conspiracy links.
- **Key Information**:
  - Source Entity dropdown / quick-select chip.
  - Target Entity dropdown / quick-select chip.
  - Hop-by-hop visual connection pipeline with interactive step icons.
  - Hop detail card: Relationship verb, evidentiary proof, case source, timestamp, confidence.
  - Natural language narrative: "Explain This Path" synthesis.
- **Primary Actions**:
  - "Find Red-String Connection" -> computes and displays path.
  - Click hop node -> updates displayed evidence for that step.
  - "Highlight on Graph" -> activates red string in Cytoscape.
- **Global State Dependencies**: `highlightedPath`, `pathDetails`, `pathSourceId`.

---

### PAGE 10: Suspicious Pattern Intelligence (`patterns`)
- **Purpose**: Explainable AI heuristics that flag criminal modus operandi without black-box opacity.
- **Primary User**: Analyst & Supervising Officer.
- **Key Information**:
  - 6 Heuristic Pattern Cards (Pre-incident hawala transfer, Burner telecom spikes, Bridge coordinator, Layering scheme, Courier link, Vehicle re-use).
  - Severity Badges: CRITICAL (Red), HIGH (Orange), MEDIUM (Yellow).
  - Rule-based reasoning description and supporting evidence list.
- **Primary Actions**:
  - Expand/collapse pattern card details.
  - "Inspect in Graph" -> focuses pattern entities in Cytoscape.
  - Filter by severity.
- **Global State Dependencies**: `graphFocusEntity`.

---

### PAGE 11: AI Investigation Copilot (`copilot`)
- **Purpose**: Conversational assistant grounded in multi-source evidence records.
- **Primary User**: Investigating Detective.
- **Key Information**:
  - Chat feed with user query and assistant response cards.
  - Suggested Query Chips at the top.
  - Each response: grounded text narrative, confidence percentage, clickable entity chips, cited case documents.
- **Primary Actions**:
  - Type query or click suggested question.
  - Click entity chip -> focuses entity in graph.
- **States**:
  - `Idle`: suggestions visible.
  - `Analyzing`: spinner with "Analyzing Investigation Dataset & Forensic Graph...".
- **Global State Dependencies**: `selectedCase`, `selectedEntity`, `graphFocusEntity`.

---

### PAGE 12: Actionable Leads & Verification (`leads` / `verification`)
- **Purpose**: Human-in-the-loop review workbench to formally approve, reject, or mark leads under review.
- **Primary User**: Case Officer / Investigating Inspector.
- **Key Information**:
  - Summary metric counters: Total Leads, Critical Priority, Pending Review, Verified.
  - Filter tabs: All Leads, Needs Review, Under Review, Verified Leads, Dismissed.
  - Lead Cards: Title, Priority, Status badge (`AI_SUGGESTED`, `UNDER_REVIEW`, `VERIFIED`, `REJECTED`), AI confidence meter, case tags, entities, AI reasoning, expandable evidence bullets.
  - Officer remarks text input field.
- **Primary Actions**:
  - "Review Evidence" (expand/collapse).
  - "Mark Under Review" -> updates status to `UNDER_REVIEW`.
  - "Approve / Verify Lead" -> updates status to `VERIFIED`, records timestamp.
  - "Dismiss Lead" -> updates status to `REJECTED`.
  - "View in Graph" -> opens Cytoscape focused on lead entities.
- **Global State Dependencies**: `leads`, `dispatchLeads`.

---

### PAGE 13: Crime Intelligence Map (`map`)
- **Purpose**: Geospatial crime distribution across jurisdictions.
- **Primary User**: Senior Officers / Strategic Analysts.
- **Key Information**:
  - India jurisdictions map with interactive state centroids (Delhi, Tamil Nadu, Maharashtra, Karnataka, UP, etc.).
  - State crime summaries with trend indicators (Increasing, Moderate, Stable, Decreasing).
  - Incident markers linked to cases.
- **Primary Actions**:
  - Click state / location -> filters cases for that jurisdiction.
  - "Inspect Case" -> opens selected case workspace.
- **Global State Dependencies**: `selectedCase`.

---

### PAGE 14: Authentication & Role Selection (`LoginScreen`)
- **Purpose**: Entry screen providing secure login and 1-click demo entry.
- **Primary User**: All users.
- **Key Information**:
  - Platform branding (House Targaryen, SIH 2026).
  - One-Click Demo Mode bar:
    - `Investigator Board` button (Insp. Rajesh Vardhan).
    - `Analyst Console` button (Dr. Priya Sankar).
  - Traditional email/password credentials form.
- **Primary Actions**:
  - Click instant demo role button -> immediately authenticates and opens appropriate dashboard.
- **Global State Dependencies**: Sets user in `localStorage` and initializes `currentRole`.

---

## 6. Reusable Component Inventory

When designing in Figma, create these shared components:

1. **`ForensicPanel`**: Container card with subtle border, dark translucent background, and optional glassmorphism blur.
2. **`EntityBadge` / `TypeChip`**: Compact badge with entity type icon and color code:
   - Person: Gold
   - Phone: Green
   - Financial Account: Sand
   - Organization: Light Gold
   - Vehicle: Steel/Slate
   - Location: Crimson
3. **`PriorityBadge`**:
   - `CRITICAL`: Red
   - `HIGH`: Orange
   - `MEDIUM`: Yellow
   - `LOW`: Cyan
4. **`VerificationStatusBadge`**:
   - `AI_SUGGESTED`: Indigo / Purple ("AI Suggested")
   - `UNDER_REVIEW`: Orange ("Under Review")
   - `VERIFIED`: Emerald Green ("Human Verified")
   - `REJECTED`: Gray ("Dismissed")
5. **`ConfidenceMeter`**: Progress bar or circular meter showing percentage (e.g., 97%) with color gradient (Green >= 90%, Yellow 75-89%, Orange < 75%).
6. **`InvestigatorBar`**: Top utility bar displaying active page icon, title, active case selector, role selector, demo mode tag, and "Pinboard" return button.
7. **`Sidebar`**: Grouped collapsible navigation bar with sections:
   - `INVESTIGATION`: Criminal Pinboard, Active Cases, Evidence Ingestion
   - `NETWORK INTELLIGENCE`: Knowledge Graph, Key & Bridge Entities, Cross-Case Network, Red-String Path Finder
   - `AI FORENSIC INTELLIGENCE`: Suspicious Patterns, AI/NLP Entity Extraction, AI Investigation Copilot, Actionable Leads
   - `EVIDENCE & MAPPING`: Case Workspace, Crime Intelligence Map
8. **`EvidenceRecordItem`**: Bullet row with document tag (`FIR-101`, `CDR-101`), timestamp, and verbatim citation.

---

## 7. Exact Integration Points for Future UI Implementation

When the new Figma design is handed back, developers will replace the JSX markup while binding to these exact hooks and services:

1. **Navigation Hook**: `const { activeTab, setActiveTab, currentRole, setCurrentRole } = useInvestigation();`
2. **Graph Binding**: `<GraphCanvas nodes={nodes} edges={edges} selectedEntity={selectedEntity} onSelectEntity={selectEntity} highlightedPath={highlightedPath} focusEntityId={graphFocusEntity} />`
3. **Entity Inspection**: `<EntityInspector entity={selectedEntity} onClose={() => selectEntity(null)} onFocusEntity={focusEntityById} onTraceFrom={(id) => setPathSourceId(id)} />`
4. **Lead Actions**: `dispatchLeads({ type: 'VERIFY_LEAD', id: leadId, status: 'VERIFIED' })`
5. **Path Calculation**: `findShortestPath(sourceId, targetId)` from `mockService.js`
6. **Copilot Query**: `getCopilotAnswer(queryText)` from `mockService.js`
7. **Data Ingestion**: `getIngestionStats()` and `setIngestionDone(true)`
8. **Case Switching**: `setSelectedCase(caseNumber)`

---

## 8. Summary of Preserved Capabilities

| Capability | Supported in Current Codebase | Status for Figma Redesign |
| :--- | :--- | :--- |
| **Complete 27-Step SIH Video Workflow** | Yes, fully operational | Must be fully retained |
| **Offline Client-Side Execution** | Yes, zero backend dependencies | Must be fully retained |
| **Interactive Cytoscape Graph** | Yes, 4 layouts, focus mode, path highlighting | Preserve Cytoscape canvas integration |
| **Entity Resolution Demo** | Yes, color-coded FIR text + alias resolver | Present in new UI layout |
| **6 Rule-Based Suspicious Patterns** | Yes, with evidentiary explanations | Present in new UI card system |
| **Cross-Case Intersection Matrix** | Yes, 3 cases compared with strength score | Present in new UI table system |
| **Key & Bridge Entities Podium** | Yes, with Cross-Case Bridge Score | Present in new UI layout |
| **Red-String Hop-by-Hop Path Tracing** | Yes, with "Explain this path" NL output | Present in new UI pipeline |
| **Human-in-the-Loop Verification** | Yes, local reducer state with remarks | Present in new UI queue |
| **AI Copilot Q&A** | Yes, with suggested chips & entity citations | Present in new UI chat interface |
| **Court-Ready Markdown Export** | Yes, client-side Blob download | Present as export button |
