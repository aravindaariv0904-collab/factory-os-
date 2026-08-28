"""Long-running asynchronous tasks executed by the Celery worker."""
import asyncio
from datetime import datetime, timezone

from celery.utils.log import get_task_logger

from backend.app.celery_app import celery_app

logger = get_task_logger(__name__)


def _run_async(coro):
    loop = asyncio.new_event_loop()
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()


@celery_app.task(name="backend.app.celery_tasks.generate_plant_report_task")
def generate_plant_report_task(factory_id: str, category: str = "oee", fmt: str = "PDF") -> dict:
    """Generates a plant report record asynchronously and persists it."""
    from backend.app.db.session import AsyncSessionLocal
    from backend.app.models import SystemReport

    async def _persist():
        async with AsyncSessionLocal() as session:
            report_id = f"rep_{int(datetime.now(timezone.utc).timestamp())}"
            report = SystemReport(
                title=f"Factory OS {category.title()} Report",
                category=category,
                format=fmt.upper(),
                status="Ready",
                download_url=f"/api/v1/reports/download/{report_id}",
                organization_id=organization_id,
                factory_id=factory_id,
            )
            session.add(report)
            await session.commit()
            return report_id

    report_id = _run_async(_persist())
    logger.info("Generated report %s for factory %s", report_id, factory_id)
    return {"status": "Ready", "report_id": report_id, "category": category}


@celery_app.task(name="backend.app.celery_tasks.refresh_model_registry_task")
def refresh_model_registry_task() -> dict:
    """Rebuilds the in-memory ML model registry (warm start for inference)."""
    from backend.app.ml.models import ml_registry

    ml_registry.fit()
    return {"status": "refreshed", "models": ["classifier", "rul_regressor", "anomaly_detector"]}


@celery_app.task(name="backend.app.celery_tasks.ingest_dataset_task")
def ingest_dataset_task(filename: str, content: bytes) -> dict:
    """Processes an uploaded dataset asynchronously through the ingestion pipeline."""
    from backend.app.pipeline.ingestion import IndustrialDataIngestionPipeline

    result = IndustrialDataIngestionPipeline.process_file_upload(content, filename)
    logger.info("Ingested %s (%s records)", filename, result.get("record_count", 0))
    return result
