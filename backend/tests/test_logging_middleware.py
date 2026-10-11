import logging


async def test_request_id_generated_and_returned_in_header(client):
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert "X-Request-ID" in resp.headers
    req_id = resp.headers["X-Request-ID"]
    assert len(req_id) >= 16


async def test_incoming_request_id_is_preserved(client):
    custom_id = "custom-trace-id-123456"
    resp = await client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
    assert resp.status_code == 200
    assert resp.headers.get("X-Request-ID") == custom_id


async def test_logs_include_request_id(client, caplog):
    custom_id = "trace-log-check-999"
    with caplog.at_level(logging.INFO):
        resp = await client.get("/api/v1/health", headers={"X-Request-ID": custom_id})
        assert resp.status_code == 200

    # Ensure log records captured during the request have request_id set
    records_with_req_id = [r for r in caplog.records if getattr(r, "request_id", None) == custom_id]
    assert len(records_with_req_id) >= 1
