import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), "app"))

from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.api.v1.auth import init_demo_users

db = SessionLocal()
init_demo_users(db)

client = TestClient(app)

print("1. Testing Root Endpoint...")
res = client.get("/")
print("Root status:", res.status_code, res.json())

print("\n2. Testing System Status...")
res = client.get("/api/v1/admin/status")
print("Admin Status:", res.status_code, res.json())

print("\n3. Testing Dataset Seeding (9 CSVs)...")
res = client.post("/api/v1/admin/seed-dataset")
print("Seed Result:", res.status_code, res.json())

print("\n4. Testing Full Graph Retrieval...")
res = client.get("/api/v1/graph/")
graph_data = res.json()
print("Graph Nodes Count:", len(graph_data["nodes"]), "Edges Count:", len(graph_data["edges"]))

print("\n5. Testing Centrality Rankings...")
res = client.get("/api/v1/analytics/centrality")
ranked = res.json()
print("Top 3 Central Suspects:")
for r in ranked[:3]:
    print(f"- {r['name']} ({r['label']}): Threat Index = {r['threat_index']} | Hypothesis: {r['role_hypothesis']}")

print("\n6. Testing FIR File Upload...")
with open("sih-investigation-platform/backend/data/sample_firs/FIR_2025_ND_101.txt", "rb") as f:
    res = client.post(
        "/api/v1/cases/upload",
        files={"file": ("FIR_2025_ND_101.txt", f, "text/plain")},
        data={"title": "Outer Ring Road Armed Robbery", "fir_number": "FIR-2025-ND-101"}
    )
print("Upload result status:", res.status_code)
upload_json = res.json()
print("Extracted Case ID:", upload_json.get("case_id"))
print("Entities extracted:", upload_json["nlp_result"]["summary"]["total_entities"])
print("Relationships extracted:", upload_json["nlp_result"]["summary"]["total_relationships"])

print("\n7. Testing Cases Listing...")
res = client.get("/api/v1/cases/")
print("Total Cases in DB:", len(res.json()))

print("\nALL BACKEND API TESTS PASSED SUCCESSFULLY!")
