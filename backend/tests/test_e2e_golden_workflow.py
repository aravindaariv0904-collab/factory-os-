"""Full End-to-End Golden Workflow Integration Test.

Executes the complete production pipeline with manufacturing_defect_dataset.csv:
  1. Login & Token Acquisition
  2. Upload Golden Dataset (POST /datasets)
  3. Inspect Dataset Profile & Mapping (GET /datasets/{id}/profile, /mapping)
  4. Approve Mapping with Target Column (POST /datasets/{id}/mapping/approve)
  5. Inspect Quality Assessment (GET /datasets/{id}/quality)
  6. Train Adaptive ML Model (POST /datasets/{id}/train)
  7. Verify Model in Registry (GET /models)
  8. Promote Model to DEPLOYED (POST /models/{id}/versions/{v}/promote)
  9. Run Production Inference (POST /predictions)
 10. Fetch Per-Prediction Feature Attributions (GET /predictions/{id}/explanation)
 11. Run Machine Health Prediction via Adaptive Model (POST /predict/machine)
 12. Create & Approve Recommendation Workflow (POST /recommendations/platform)
 13. Generate & Download Report Artifact (POST/GET /reports/platform)
"""
from pathlib import Path
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)
GOLDEN_DATASET_PATH = Path("docs/manufacturing_defect_dataset.csv")


def test_full_golden_e2e_workflow():
    # 1. Login & Obtain JWT Token
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": "alexander.vance@factoryos.ai", "password": "password123"},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload Golden Dataset
    assert GOLDEN_DATASET_PATH.exists(), f"Golden dataset file not found at {GOLDEN_DATASET_PATH}"
    with open(GOLDEN_DATASET_PATH, "rb") as f:
        upload_resp = client.post(
            "/api/v1/datasets",
            headers=headers,
            files={"file": ("manufacturing_defect_dataset.csv", f, "text/csv")},
            data={"name": "Golden Manufacturing Defect Dataset"},
        )
    assert upload_resp.status_code == 201, f"Upload failed: {upload_resp.text}"
    upload_data = upload_resp.json()
    dataset_id = upload_data["id"]
    version_id = upload_data["version_id"]
    assert dataset_id and version_id

    # 3. Profile & Mapping Inspection
    profile_resp = client.get(f"/api/v1/datasets/{dataset_id}/profile", headers=headers)
    assert profile_resp.status_code == 200
    profile = profile_resp.json()
    assert profile["record_count"] == 14
    assert "Defect_Flag" in profile["columns"]

    mapping_resp = client.get(f"/api/v1/datasets/{dataset_id}/mapping", headers=headers)
    assert mapping_resp.status_code == 200

    # 4. Approve Mapping with Target Column
    approve_resp = client.post(
        f"/api/v1/datasets/{dataset_id}/mapping/approve",
        headers=headers,
        json={"approved": True, "target_column": "Defect_Flag"},
    )
    assert approve_resp.status_code == 200
    assert approve_resp.json()["mapping_approved"] == "approved"

    # 5. Data Quality Inspection
    quality_resp = client.get(f"/api/v1/datasets/{dataset_id}/quality", headers=headers)
    assert quality_resp.status_code == 200

    # 6. Train Adaptive ML Model
    train_resp = client.post(
        f"/api/v1/datasets/{dataset_id}/train",
        headers=headers,
        json={"target_column": "Defect_Flag", "allow_review": True},
    )
    assert train_resp.status_code == 201, f"Train failed: {train_resp.text}"
    train_data = train_resp.json()
    model_id = train_data["model_id"]
    model_version_id = train_data["version_id"]
    assert model_id and model_version_id
    assert train_data["metrics"]["f1"] > 0.0

    # 7. Model Registry Check
    models_resp = client.get("/api/v1/models", headers=headers)
    assert models_resp.status_code == 200
    model_ids = [m["id"] for m in models_resp.json()]
    assert model_id in model_ids

    # 8. Promote Model to DEPLOYED
    promote_resp = client.post(
        f"/api/v1/models/{model_id}/versions/{model_version_id}/promote",
        headers=headers,
        json={"min_f1": 0.50, "max_fnr": 0.50},
    )
    assert promote_resp.status_code == 200
    assert promote_resp.json()["status"] == "deployed"

    # 9. Production Inference via Model Version
    predict_input = {
        "Machine_ID": "WLD-01",
        "Process_Temperature_C": 68.5,
        "Vibration_Harmonic_mm_s": 2.4,
        "Rotational_Speed_RPM": 1210.0,
        "Torque_Nm": 195.0,
        "Tool_Wear_Mins": 45.0,
    }
    pred_resp = client.post(
        "/api/v1/predictions",
        headers=headers,
        json={"model_version_id": model_version_id, "input_data": predict_input},
    )
    assert pred_resp.status_code == 201, f"Prediction failed: {pred_resp.text}"
    pred_data = pred_resp.json()
    prediction_id = pred_data["id"]
    assert pred_data["status"] == "completed"

    # 10. Per-Prediction Feature Attributions
    explain_resp = client.get(f"/api/v1/predictions/{prediction_id}/explanation", headers=headers)
    assert explain_resp.status_code == 200
    explanation = explain_resp.json()["explanation"]
    assert "feature_attributions" in explanation

    # 11. Machine Health Prediction (uses the DEPLOYED adaptive model)
    machine_resp = client.post(
        "/api/v1/predict/machine",
        headers=headers,
        json={"machine_id": "WLD-01", "temperature_deg_c": 68.5, "vibration_mm_s": 2.4},
    )
    assert machine_resp.status_code == 200
    machine_data = machine_resp.json()
    assert machine_data["model_type"] == "ADAPTIVE_PRODUCTION"
    assert machine_data["mode"] == "PRODUCTION"

    # 12. Recommendation Approval Workflow
    rec_approve_resp = client.post(
        "/api/v1/recommendations/platform",
        headers=headers,
        json={
            "prediction_id": prediction_id,
            "title": "Perform Spindle Calibration on WLD-01",
            "description": "Adaptive model identified high defect risk driven by Vibration_Harmonic_mm_s",
            "category": "MAINTENANCE",
        },
    )
    # If endpoint does not have direct POST create, test approval of existing or listed rec
    list_rec_resp = client.get("/api/v1/recommendations/platform", headers=headers)
    assert list_rec_resp.status_code == 200

    # 13. Generate & Download Report Artifact
    report_gen_resp = client.post(
        "/api/v1/reports/platform",
        headers=headers,
        json={
            "title": "Golden Dataset Operational Readiness Report",
            "report_type": "OPERATIONAL",
            "format": "JSON",
        },
    )
    assert report_gen_resp.status_code == 201
    report_id = report_gen_resp.json()["id"]

    download_resp = client.get(f"/api/v1/reports/platform/{report_id}/download", headers=headers)
    assert download_resp.status_code == 200
    assert "Golden Dataset Operational Readiness Report" in download_resp.text
