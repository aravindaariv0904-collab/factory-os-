"""Dataset lifecycle service — upload, profile, mapping, quality."""
from __future__ import annotations

import io
from dataclasses import asdict
from typing import Any, Optional

import pandas as pd
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.ai_engine.adaptive_intelligence import (
    AdaptiveSchemaIntelligence,
    DataQualityEngine,
)
from backend.app.models.platform import Dataset, DatasetVersion
from backend.app.services.audit_service import audit_service
from backend.app.services.storage import storage_service


class DatasetService:
    SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".json"}

    @staticmethod
    def _parse_dataframe(content: bytes, filename: str) -> pd.DataFrame:
        lower = filename.lower()
        if lower.endswith(".csv"):
            return pd.read_csv(io.BytesIO(content))
        if lower.endswith((".xlsx", ".xls")):
            return pd.read_excel(io.BytesIO(content))
        if lower.endswith(".json"):
            return pd.read_json(io.BytesIO(content))
        raise ValueError(f"Unsupported file format: {filename}")

    @staticmethod
    async def get_dataset(
        db: AsyncSession,
        dataset_id: str,
        organization_id: str,
    ) -> Optional[Dataset]:
        result = await db.execute(
            select(Dataset).where(
                Dataset.id == dataset_id,
                Dataset.organization_id == organization_id,
            )
        )
        return result.scalars().first()

    @staticmethod
    async def get_latest_version(
        db: AsyncSession,
        dataset_id: str,
        organization_id: str,
    ) -> Optional[DatasetVersion]:
        result = await db.execute(
            select(DatasetVersion)
            .where(
                DatasetVersion.dataset_id == dataset_id,
                DatasetVersion.organization_id == organization_id,
            )
            .order_by(desc(DatasetVersion.version_number))
            .limit(1)
        )
        return result.scalars().first()

    @staticmethod
    async def create_from_upload(
        db: AsyncSession,
        *,
        filename: str,
        content: bytes,
        organization_id: str,
        factory_id: Optional[str],
        created_by: str,
        name: Optional[str] = None,
    ) -> tuple[Dataset, DatasetVersion]:
        ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
        if ext not in DatasetService.SUPPORTED_EXTENSIONS:
            raise ValueError(f"Unsupported file format: {filename}")

        storage_path = storage_service.store_bytes(
            organization_id, "raw_datasets", filename, content
        )

        dataset = Dataset(
            name=name or filename,
            description=f"Uploaded from {filename}",
            source_type="upload",
            status="profiling",
            created_by=created_by,
            organization_id=organization_id,
            factory_id=factory_id,
        )
        db.add(dataset)
        await db.flush()

        version = DatasetVersion(
            dataset_id=dataset.id,
            version_number=1,
            storage_path=storage_path,
            original_filename=filename,
            record_count=0,
            status="uploaded",
            organization_id=organization_id,
            factory_id=factory_id,
        )
        db.add(version)
        await db.flush()
        return dataset, version

    @staticmethod
    async def profile_version(
        db: AsyncSession,
        version: DatasetVersion,
        *,
        organization_id: str,
        user_email: str,
    ) -> DatasetVersion:
        if not version.storage_path:
            raise ValueError("Dataset version has no stored raw file")

        raw = storage_service.read_bytes(version.storage_path)
        filename = version.original_filename or "dataset.csv"
        df = DatasetService._parse_dataframe(raw, filename)

        profile = AdaptiveSchemaIntelligence.profile(df)
        mappings = AdaptiveSchemaIntelligence.map_columns(df.columns)
        target = profile.target_candidates[0] if profile.target_candidates else None
        quality_status, issues = DataQualityEngine.assess(profile, target)

        version.record_count = len(df)
        version.columns = list(df.columns)
        version.profile = asdict(profile)
        version.mapping = {
            "mappings": [asdict(m) for m in mappings],
            "target_column": target,
            "quality_status": quality_status,
            "issues": issues,
        }
        version.quality = {
            "status": quality_status,
            "issues": issues,
            "warnings": [i for i in issues if i.get("severity") != "BLOCKED"],
        }
        version.status = "profiled"
        version.mapping_approved = "pending"

        dataset = await DatasetService.get_dataset(db, version.dataset_id, organization_id)
        if dataset:
            dataset.status = "mapped" if quality_status == "READY" else "profiling"

        await audit_service.log(
            db,
            organization_id=organization_id,
            factory_id=version.factory_id,
            user_email=user_email,
            action="DATASET_PROFILED",
            resource_type="dataset_version",
            resource_id=str(version.id),
            resource_version=str(version.version_number),
            metadata={"quality_status": quality_status, "record_count": version.record_count},
        )
        await db.flush()
        return version

    @staticmethod
    async def approve_mapping(
        db: AsyncSession,
        version: DatasetVersion,
        *,
        organization_id: str,
        user_email: str,
        approved: bool,
        target_column: Optional[str] = None,
        mapping_overrides: Optional[dict[str, str]] = None,
    ) -> DatasetVersion:
        if not version.mapping:
            raise ValueError("Dataset has not been profiled yet")

        if not approved:
            version.mapping_approved = "rejected"
            version.status = "failed"
            await audit_service.log(
                db,
                organization_id=organization_id,
                factory_id=version.factory_id,
                user_email=user_email,
                action="MAPPING_REJECTED",
                resource_type="dataset_version",
                resource_id=str(version.id),
                result="rejected",
            )
            await db.flush()
            return version

        mapping_data = dict(version.mapping)
        if target_column:
            mapping_data["target_column"] = target_column
        if mapping_overrides:
            for item in mapping_data.get("mappings", []):
                if item.get("source") in mapping_overrides:
                    item["canonical"] = mapping_overrides[item["source"]]
                    item["accepted"] = True

        version.mapping = mapping_data
        version.mapping_approved = "approved"
        version.status = "validated"

        dataset = await DatasetService.get_dataset(db, version.dataset_id, organization_id)
        if dataset:
            dataset.status = "ready"

        await audit_service.log(
            db,
            organization_id=organization_id,
            factory_id=version.factory_id,
            user_email=user_email,
            action="MAPPING_APPROVED",
            resource_type="dataset_version",
            resource_id=str(version.id),
            resource_version=str(version.version_number),
            metadata={"target_column": mapping_data.get("target_column")},
        )
        await db.flush()
        return version

    @staticmethod
    async def list_datasets(
        db: AsyncSession,
        organization_id: str,
        factory_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        stmt = (
            select(Dataset)
            .where(Dataset.organization_id == organization_id)
            .order_by(desc(Dataset.created_at))
            .offset(offset)
            .limit(limit)
        )
        if factory_id:
            stmt = stmt.where(
                (Dataset.factory_id == factory_id) | (Dataset.factory_id.is_(None))
            )
        datasets = (await db.execute(stmt)).scalars().all()
        summaries: list[dict[str, Any]] = []
        for ds in datasets:
            latest = await DatasetService.get_latest_version(db, ds.id, organization_id)
            summaries.append(
                {
                    "id": str(ds.id),
                    "name": ds.name,
                    "description": ds.description,
                    "source_type": ds.source_type,
                    "status": ds.status,
                    "created_at": ds.created_at,
                    "latest_version": latest.version_number if latest else None,
                }
            )
        return summaries


dataset_service = DatasetService()
