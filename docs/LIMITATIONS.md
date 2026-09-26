# System Limitations & Constraints

## 1. Demo Mode Dependencies
*   **Hardcoded Fallbacks**: While the system fully supports dynamic RBAC and JWT token propagation, `DEMO_MODE=True` allows auto-provisioning of users at login. This should be disabled in production.
*   **Local Graph Overlay (Demo Only)**: The running demo uses `LocalFixtureStore` in `DEMO_MODE` with mock data; it does *not* use a live Memgraph connection. If Memgraph is unavailable, the system defaults to this local overlay which persists state to a JSON file (`persisted_graph_state.json`). This is designed for demonstration and is not suitable for high-concurrency production environments.

## 2. Ingestion & NLP Constraints
*   **Language Support**: The NLP pipeline (spaCy) currently supports English only. Regional language FIRs must be translated prior to ingestion.
*   **Extraction Confidence**: Entity resolution is probabilistic. Entities with confidence scores below 85% require manual human-in-the-loop approval by an Analyst before they are merged into the canonical graph.

## 3. Performance Thresholds
*   **Graph Rendering limitations**: The frontend knowledge graph canvas may experience dropped frames if a single visualization renders > 500 nodes simultaneously. Analysts should use "Case Filters" to narrow the scope.
*   **Audit Chain Re-hashing**: The `Simulate Tampering` and `Verify Integrity` operations are computationally expensive `O(N)` where N is the number of audit records since they recalculate the hash chain.

## 4. Synthetic Data
*   The current demo uses a synthetic pipeline (Phase 5 generated datasets). No real-world PII (Personally Identifiable Information) or active police intelligence is stored in this repository. All phone numbers and account numbers are fictional.
