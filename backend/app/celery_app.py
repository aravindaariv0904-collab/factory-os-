"""Celery application entrypoint for asynchronous task execution.

Used by docker-compose celery-worker and celery-beat services:
    celery -A backend.app.celery_app worker --loglevel=info
    celery -A backend.app.celery_app beat --loglevel=info
"""
import os
from celery import Celery

BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")

celery_app = Celery(
    "factory_os",
    broker=BROKER_URL,
    backend=RESULT_BACKEND,
    include=["backend.app.celery_tasks"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_soft_time_limit=300,
)

celery_app.conf.beat_schedule = {
    "refresh-model-registry-every-5-minutes": {
        "task": "backend.app.celery_tasks.refresh_model_registry_task",
        "schedule": 300.0,
    },
    "generate-plant-report-daily": {
        "task": "backend.app.celery_tasks.generate_plant_report_task",
        "schedule": 86400.0,
    },
}
