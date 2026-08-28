from pathlib import Path

import pandas as pd
import pytest

from backend.app.ai_engine.adaptive_intelligence import (
    AdaptiveSchemaIntelligence,
    ArtifactInferenceService,
    DataQualityEngine,
    DatasetRegistry,
    DriftMonitor,
    ExperimentEngine,
    QUALITY_REVIEW,
)


GOLDEN = Path(__file__).parents[2] / "docs" / "manufacturing_defect_dataset.csv"


def test_golden_dataset_profiles_maps_and_requires_leakage_review(tmp_path):
    raw = GOLDEN.read_bytes()
    df = pd.read_csv(GOLDEN)
    registry = DatasetRegistry(tmp_path / "registry")
    record = registry.register(raw, GOLDEN.name, source="test", owner="tester", organization_id="org-1")
    profile = AdaptiveSchemaIntelligence.profile(df)
    mappings = AdaptiveSchemaIntelligence.map_columns(df.columns)
    status, issues = DataQualityEngine.assess(profile, "Defect_Flag")
    registry.update_analysis(record, df, profile, mappings, status)

    assert record.file_hash
    assert record.row_count == 14
    assert any(mapping.canonical == "process.temperature" for mapping in mappings)
    assert any(mapping.canonical == "quality.defect" for mapping in mappings)
    assert all(mapping.mapping_method and mapping.reason for mapping in mappings)
    assert "Defect_Category" in profile.leakage_candidates
    assert status == QUALITY_REVIEW
    assert any(issue["code"] == "POTENTIAL_LEAKAGE" for issue in issues)
    assert Path(record.raw_path).read_bytes() == raw
    score = DataQualityEngine.score(profile, mappings)
    assert set(score["dimensions"]) == {"completeness", "uniqueness", "numeric_range_validity", "semantic_mapping_confidence", "schema_integrity"}
    assert 0 <= score["score"] <= 1


def test_training_is_reproducible_and_inference_requires_same_artifact(tmp_path):
    df = pd.read_csv(GOLDEN)
    registry = DatasetRegistry(tmp_path / "registry")
    record = registry.register(GOLDEN.read_bytes(), GOLDEN.name, source="test", owner="tester", organization_id="org-1")
    profile = AdaptiveSchemaIntelligence.profile(df)
    quality, _ = DataQualityEngine.assess(profile, "Defect_Flag")
    registry.update_analysis(record, df, profile, [], quality)
    first = ExperimentEngine().train(df, record, profile, target="Defect_Flag", artifact_dir=tmp_path / "models", allow_review=True)
    second = ExperimentEngine().train(df, record, profile, target="Defect_Flag", artifact_dir=tmp_path / "models-2", allow_review=True)

    assert first.metadata["metrics"] == second.metadata["metrics"]
    service = ArtifactInferenceService(Path(first.artifact_path))
    raw_feature_values = df.loc[0, first.metadata["feature_columns"]].to_dict()
    result = service.predict(raw_feature_values)
    assert result["model_id"] == first.model_id
    assert result["dataset_id"] == record.dataset_id
    assert result["feature_attributions"]
    with pytest.raises(ValueError, match="required feature"):
        service.predict({})


def test_drift_monitor_recommends_review_without_retraining():
    reference = pd.DataFrame({"temperature": list(range(20))})
    current = pd.DataFrame({"temperature": [500] * 20})
    assessment = DriftMonitor(reference, ["temperature"]).assess(current, threshold=.2)

    assert assessment["drift_detected"] is True
    assert assessment["recommend_retraining"] is True
    assert "Review" in assessment["recommendation"]
