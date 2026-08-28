"""Independent golden dataset validation for Factory OS audit."""
import pandas as pd
import numpy as np
import sys

df = pd.read_csv('docs/manufacturing_defect_dataset.csv')
print("=== INDEPENDENT GOLDEN DATASET ANALYSIS ===")
print(f"Rows: {len(df)}")
print(f"Columns: {len(df.columns)}")
print(f"Column names: {list(df.columns)}")
print(f"Dtypes:\n{df.dtypes}")
print(f"Missing values:\n{df.isna().sum()}")
print(f"Duplicate rows: {df.duplicated().sum()}")
print(f"Defect_Flag distribution:\n{df['Defect_Flag'].value_counts()}")
print(f"Defect_Category distribution:\n{df['Defect_Category'].value_counts()}")
print(f"Numeric stats:\n{df.describe()}")
print(f"Unique Machine_IDs: {list(df['Machine_ID'].unique())}")
class_balance = df['Defect_Flag'].value_counts(normalize=True)
print(f"Class balance: {class_balance.to_dict()}")
print()

# Now run adaptive intelligence on the dataset
from backend.app.ai_engine.adaptive_intelligence import (
    AdaptiveSchemaIntelligence,
    DataQualityEngine,
    DatasetRegistry,
    ExperimentEngine,
    ArtifactInferenceService,
)
from pathlib import Path
import tempfile

print("=== FACTORY OS PROFILE vs INDEPENDENT ANALYSIS ===")
profile = AdaptiveSchemaIntelligence.profile(df)
mappings = AdaptiveSchemaIntelligence.map_columns(df.columns)
quality, issues = DataQualityEngine.assess(profile, 'Defect_Flag')

print(f"Numeric columns: {profile.numeric_columns}")
print(f"Categorical columns: {profile.categorical_columns}")
print(f"Identifier columns: {profile.identifier_columns}")
print(f"Timestamp columns: {profile.timestamp_columns}")
print(f"Target candidates: {profile.target_candidates}")
print(f"Leakage candidates: {profile.leakage_candidates}")
print(f"Duplicate rows (system): {profile.duplicate_rows}")
print(f"Quality status: {quality}")
print(f"Quality issues:")
for issue in issues:
    print(f"  [{issue['severity']}] {issue['code']}: {issue['message']}")
print()
print("=== COLUMN MAPPINGS ===")
for m in mappings:
    status = "AUTO-ACCEPTED" if m.accepted else f"CONFIDENCE={m.confidence:.2f}"
    print(f"  {m.source:35s} -> {str(m.canonical):35s} [{status}]")

print()
print("=== TRAINING PIPELINE ===")
with tempfile.TemporaryDirectory() as tmp:
    registry = DatasetRegistry(Path(tmp) / 'registry')
    raw = Path('docs/manufacturing_defect_dataset.csv').read_bytes()
    record = registry.register(raw, 'manufacturing_defect_dataset.csv',
                               source='audit', owner='audit-engineer', organization_id='org-audit')
    registry.update_analysis(record, df, profile, mappings, quality)
    
    engine = ExperimentEngine(random_state=42)
    model = engine.train(df, record, profile, target='Defect_Flag',
                         artifact_dir=Path(tmp) / 'models', allow_review=True)
    
    print(f"Champion algorithm: {model.metadata['algorithm']}")
    print(f"Features used: {model.metadata['feature_columns']}")
    print(f"Excluded columns: {model.metadata['excluded_columns']}")
    print(f"Metrics:")
    for k, v in model.metadata['metrics'].items():
        if k != 'confusion_matrix':
            print(f"  {k}: {v}")
    print(f"Confusion matrix: {model.metadata['metrics']['confusion_matrix']}")
    print(f"Approval state: {model.metadata['approval_state']}")
    print(f"Deployment state: {model.metadata['deployment_state']}")
    print()
    
    print("=== INFERENCE TEST ===")
    svc = ArtifactInferenceService(Path(model.artifact_path))
    first_row = df.loc[0, model.metadata['feature_columns']].to_dict()
    print(f"Input features: {first_row}")
    result = svc.predict(first_row)
    print(f"Prediction: {result['prediction']}")
    print(f"Confidence: {result['confidence']:.4f}")
    print(f"Model ID matches: {result['model_id'] == model.model_id}")
    print(f"Dataset ID matches: {result['dataset_id'] == record.dataset_id}")
    print(f"Feature attributions: {result['feature_attributions']}")
    print()
    
    print("=== ALL EXPERIMENTS ===")
    for name, m in model.metadata['experiments'].items():
        print(f"  {name}: F1={m['f1']:.4f} ROC-AUC={m['roc_auc']:.4f} PR-AUC={m['pr_auc']:.4f} FNR={m['false_negative_rate']}")

print()
print("=== AUDIT COMPLETE ===")
