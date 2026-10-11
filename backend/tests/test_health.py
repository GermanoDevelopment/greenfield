from unittest.mock import AsyncMock

from app.db.session import get_db
from app.main import app


async def test_health_check(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "greenfield-backend"
    assert data["database"] == "connected"


async def test_liveness_check(client):
    resp = await client.get("/api/v1/health/live")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["service"] == "greenfield-backend"


async def test_health_check_database_down(client):
    async def mock_get_db_down():
        mock_session = AsyncMock()
        mock_session.execute.side_effect = Exception("DB connection timeout")
        yield mock_session

    app.dependency_overrides[get_db] = mock_get_db_down
    try:
        resp = await client.get("/api/v1/health")
        assert resp.status_code == 503
        data = resp.json()
        assert data["status"] == "unhealthy"
        assert data["database"] == "disconnected"
    finally:
        app.dependency_overrides.pop(get_db, None)
