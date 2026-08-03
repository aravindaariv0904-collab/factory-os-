import numpy as np
import pandas as pd
from backend.app.ai_engine.config import MODEL_CONFIGS
from backend.app.ai_engine.preprocessing.tabular import tabular_preprocessor
from backend.app.ai_engine.preprocessing.timeseries import timeseries_preprocessor
from backend.app.ai_engine.feature_engineering import feature_extractor
from backend.app.ai_engine.train import MasterAITrainingPipeline
from backend.app.ai_engine.inference import inference_engine

def test_tabular_and_timeseries_preprocessors():
    df = pd.DataFrame({
        "temperature": [45.0, None, 85.0, 52.0],
        "vibration": [1.2, 1.5, 9.8, None],
    })
    scaled = tabular_preprocessor.fit_transform(df, ["temperature", "vibration"])
    assert scaled.shape == (4, 2)

    signal = np.sin(np.linspace(0, 10, 100))
    fft_res = timeseries_preprocessor.extract_fft_features(signal)
    assert "fft_peak_freq_bin" in fft_res
    assert "fft_spectral_energy" in fft_res

def test_feature_extractor():
    df = pd.DataFrame({"temperature": [45.0, 50.0, 55.0], "vibration": [1.2, 1.4, 1.8]})
    df_feat = feature_extractor.compute_features(df)
    assert "rolling_temp_avg_5" in df_feat.columns
    assert "health_score" in df_feat.columns

def test_master_ai_training_pipeline():
    pipeline = MasterAITrainingPipeline()
    res = pipeline.run_training_pipeline()
    assert res["status"] == "Training Completed Successfully"
    assert "accuracy" in res["classifier_metrics"]
    assert "mae" in res["regressor_metrics"]
    assert "shap_values" in res["sample_shap_explanation"]
    assert len(res["exported_models"]) == 3

def test_low_latency_inference():
    inf_res = inference_engine.run_fast_inference({"temperature": 82.0, "vibration": 7.5})
    assert inf_res["latency_ms"] < 10.0
    assert "failure_probability" in inf_res
    assert inf_res["is_anomaly"] is True
