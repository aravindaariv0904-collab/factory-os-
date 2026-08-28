"""Persistent audit logging service."""
from typing import Any, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.platform import AuditEvent


class AuditService:
    @staticmethod
    async def log(
        db: AsyncSession,
        *,
        organization_id: str,
        user_email: str,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        resource_version: Optional[str] = None,
        factory_id: Optional[str] = None,
        user_id: Optional[str] = None,
        result: str = "success",
        metadata: Optional[dict[str, Any]] = None,
        request_id: Optional[str] = None,
    ) -> AuditEvent:
        event = AuditEvent(
            organization_id=organization_id,
            factory_id=factory_id,
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            resource_version=resource_version,
            result=result,
            metadata_json=metadata or {},
            request_id=request_id,
        )
        db.add(event)
        await db.flush()
        return event


audit_service = AuditService()
