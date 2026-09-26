import time
import requests

API_BASE = "http://localhost:8000/api/v1"
USERNAME = "analyst@police.gov.in"
PASSWORD = "analyst123"

def get_token():
    resp = requests.post(f"{API_BASE}/auth/login", data={"username": USERNAME, "password": PASSWORD})
    resp.raise_for_status()
    return resp.json()["data"]["access_token"]

def measure_endpoint(session, name, url):
    start = time.perf_counter()
    resp = session.get(url)
    end = time.perf_counter()
    if resp.status_code == 200:
        print(f"[{name}] Response Time: {(end - start)*1000:.2f} ms (Status: 200 OK)")
    else:
        print(f"[{name}] FAILED! Status: {resp.status_code}, Msg: {resp.text}")

def main():
    print("Measuring Performance...")
    token = get_token()
    session = requests.Session()
    session.headers.update({"Authorization": f"Bearer {token}"})

    measure_endpoint(session, "Knowledge Graph Rendering", f"{API_BASE}/graph/subgraph")
    measure_endpoint(session, "Global Search (query='Ravi')", f"{API_BASE}/search/entities?q=Ravi")
    measure_endpoint(session, "Pattern Detection (Leads)", f"{API_BASE}/analyst/patterns")

if __name__ == "__main__":
    main()
