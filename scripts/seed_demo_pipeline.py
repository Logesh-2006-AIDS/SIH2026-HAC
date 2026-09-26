"""
Phase 5: Seed Demo Pipeline
Uses real API endpoints to upload synthetic data into the platform.
This is meant to be run before a live demonstration.
"""
import os
import time
import requests

API_BASE = "http://localhost:8000/api/v1"
USERNAME = "investigator@police.gov.in"
PASSWORD = "investigator123"

# Base directory for generated raw files
RAW_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "raw"))

def get_token():
    print(f"Logging in as {USERNAME}...")
    # Using form data
    resp = requests.post(f"{API_BASE}/auth/login", data={
        "username": USERNAME,
        "password": PASSWORD
    })
    resp.raise_for_status()
    data = resp.json()
    token = data["data"]["access_token"]
    print("[OK] Authenticated successfully.")
    return token

def upload_file(session, file_path, case_id=None, source_type=None, auth_ref=None):
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return
        
    print(f"Uploading {os.path.basename(file_path)}...")
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f)}
        data = {}
        if case_id: data["case_id"] = case_id
        if source_type: data["source_type"] = source_type
        if auth_ref: data["authorization_reference"] = auth_ref
        
        resp = session.post(f"{API_BASE}/ingest/file", files=files, data=data)
        
        if resp.status_code == 201:
            print(f"[OK] Uploaded {os.path.basename(file_path)} successfully.")
        else:
            print(f"[FAIL] Failed to upload {os.path.basename(file_path)}: {resp.text}")

def main():
    if not os.path.exists(RAW_DIR):
        print(f"Data directory {RAW_DIR} not found. Please run data/scripts/generate_synthetic_data.py first.")
        return

    token = get_token()
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {token}"})

    # Upload FIRs (101 to 104). Leave 105 out for live demo upload.
    fir_dir = os.path.join(RAW_DIR, "fir_reports")
    if os.path.exists(fir_dir):
        for fname in sorted(os.listdir(fir_dir)):
            if fname.endswith(".txt"):
                if "105" in fname:
                    print(f"Skipping {fname} (Keep this for LIVE demo upload!)")
                    continue
                case_no = fname.split("_")[-1].replace(".txt", "")
                upload_file(session, os.path.join(fir_dir, fname), case_id=case_no)

    # Upload Intelligence
    intel_path = os.path.join(RAW_DIR, "intelligence", "informant_briefs.json")
    upload_file(session, intel_path, source_type="INTELLIGENCE")

    # Upload CDR
    cdr_path = os.path.join(RAW_DIR, "cdr", "call_detail_records.csv")
    upload_file(session, cdr_path, auth_ref="COURT-ORDER-CDR-2025-09", source_type="CDR")

    # Upload Financial
    fin_path = os.path.join(RAW_DIR, "financial", "financial_transactions.csv")
    upload_file(session, fin_path, auth_ref="ED-WARRANT-FIN-2025-07", source_type="FINANCIAL")

    print("\nData seeding completed!")
    print("For the live demo, manually upload: data/raw/fir_reports/FIR_2025_ND_105.txt")

if __name__ == "__main__":
    main()
