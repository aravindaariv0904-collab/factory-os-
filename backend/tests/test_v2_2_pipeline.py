import io
from backend.app.pipeline.cleaner import DataCleaner
from backend.app.pipeline.feature_engineer import FeatureEngineer
from backend.app.pipeline.ingestion import IndustrialDataIngestionPipeline

def test_data_cleaner_imputation():
    raw = [
        {"temperature": 45.0, "vibration": 1.2},
        {"temperature": None, "vibration": 1.5},
        {"temperature": 52.0, "vibration": None},
    ]
    cleaned = DataCleaner.handle_missing_values(raw)
    assert cleaned[1]["temperature"] == 45.0  # forward fill
    assert cleaned[2]["vibration"] == 1.5      # forward fill

def test_feature_engineering():
    raw = [
        {"temperature": 45.0, "vibration": 1.2},
        {"temperature": 50.0, "vibration": 2.0},
    ]
    featured = FeatureEngineer.extract_telemetry_features(raw)
    assert "thermal_gradient" in featured[1]
    assert featured[1]["thermal_gradient"] == 5.0
    assert "computed_health_index" in featured[1]

def test_csv_ingestion_pipeline():
    csv_data = b"temperature,vibration\n45.0,1.2\n48.0,1.5\n52.0,2.1\n"
    res = IndustrialDataIngestionPipeline.process_file_upload(csv_data, "test.csv")
    assert res["status"] == "Pipeline Ingestion Complete"
    assert res["record_count"] == 3
    assert "thermal_gradient" in res["columns"]
