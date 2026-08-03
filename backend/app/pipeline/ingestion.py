import io
import json
from typing import List, Dict, Any, Union
import pandas as pd
from backend.app.pipeline.cleaner import DataCleaner
from backend.app.pipeline.feature_engineer import FeatureEngineer

class IndustrialDataIngestionPipeline:
    @staticmethod
    def process_file_upload(file_contents: bytes, filename: str) -> Dict[str, Any]:
        """Parses CSV, Excel, or JSON payload through cleaning and feature engineering."""
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(file_contents))
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(file_contents))
        elif filename.endswith(".json"):
            raw_data = json.loads(file_contents.decode("utf-8"))
            df = pd.DataFrame(raw_data if isinstance(raw_data, list) else [raw_data])
        else:
            raise ValueError(f"Unsupported file format for ingestion: {filename}")

        records = df.to_dict(orient="records")

        # Step 1: Cleaning & Missing Value Imputation
        cleaned_records = DataCleaner.handle_missing_values(records)
        cleaned_records = DataCleaner.clamp_outliers(cleaned_records, keys=["temperature", "vibration"])

        # Step 2: Feature Engineering
        featured_records = FeatureEngineer.extract_telemetry_features(cleaned_records)

        return {
            "status": "Pipeline Ingestion Complete",
            "filename": filename,
            "record_count": len(featured_records),
            "columns": list(featured_records[0].keys()) if featured_records else [],
            "sample_records": featured_records[:3],
        }

    @staticmethod
    def process_mqtt_telemetry(payload: Dict[str, Any]) -> Dict[str, Any]:
        """Processes real-time MQTT / OPC-UA protocol telemetry payload."""
        cleaned = DataCleaner.handle_missing_values([payload])
        featured = FeatureEngineer.extract_telemetry_features(cleaned)
        return featured[0]
