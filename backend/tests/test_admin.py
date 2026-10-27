import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_admin_sessions_list():
    res = client.get("/api/admin/sessions")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)

def test_admin_cleanup_empty():
    # 1. Vytvoříme testovací sezení bez pre/post
    init_res = client.post("/api/session/init", json={"mode": "pilot"}).json()
    code = init_res["session_code"]

    # 2. Zavoláme cleanup empty
    clean_res = client.post("/api/admin/cleanup", json={"filter_type": "empty"})
    assert clean_res.status_code == 200
    res_data = clean_res.json()
    assert res_data["status"] == "ok"
    assert res_data["deleted_count"] >= 1

    # 3. Ověříme, že smazané sezení už neexistuje
    sessions = client.get("/api/admin/sessions").json()
    codes = [s["session_code"] for s in sessions]
    assert code not in codes

def test_admin_delete_single():
    # Vytvoříme a smažeme jedno sezení
    init_res = client.post("/api/session/init", json={"mode": "pilot"}).json()
    code = init_res["session_code"]

    del_res = client.delete(f"/api/admin/sessions/{code}")
    assert del_res.status_code == 200
    assert del_res.json()["deleted"] == code

def test_evaluation_charts_and_latex():
    res = client.get("/api/admin/evaluation-charts")
    assert res.status_code == 200
    data = res.json()
    assert "sus_benchmark_avg" in data
    assert "sus_histogram" in data
    assert "tam_pu_avg" in data
    assert "tam_peou_avg" in data
    assert "riasec_means" in data
    assert "latex_table_code" in data
    assert "\\begin{table}" in data["latex_table_code"]

def test_export_json():
    res = client.get("/api/admin/export.json")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/json"
    data = res.json()
    assert isinstance(data, list)
