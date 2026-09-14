def test_health_endpoint(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert "status" in data
    assert "services" in data
    assert "postgresql" in data["services"]
    # Graph store is Memgraph (with JSON fallback when offline)
    assert "memgraph" in data["services"] or "neo4j" in data["services"]
