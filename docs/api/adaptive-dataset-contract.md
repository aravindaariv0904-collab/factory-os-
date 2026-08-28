# Adaptive dataset contract

The dataset profile and mapping responses expose derived metadata only; they never replace raw uploaded bytes.

## Mapping item

Each mapping item contains:

```json
{
  "source": "Temp_C",
  "canonical": "process.temperature",
  "confidence": 0.82,
  "unit": "celsius",
  "accepted": true,
  "mapping_method": "alias_containment",
  "reason": "source contains alias 'temperature'"
}
```

`accepted` is `false` when confidence is below `0.80`; clients must render such mappings for human review. `mapping_method` is one of `exact_alias`, `alias_containment`, `token_overlap`, or `unmapped`.

## Quality score

The adaptive engine can return an informational quality score with `completeness`, `uniqueness`, `numeric_range_validity`, `semantic_mapping_confidence`, and `schema_integrity` dimensions. Consumers must not treat this score as approval: the authoritative quality state remains `READY`, `REVIEW_REQUIRED`, `DEGRADED`, or `BLOCKED`.

