"""Shared FastAPI dependencies for tenant scoping and authorization."""
from typing import Optional, Type, TypeVar

from fastapi import Depends, HTTPException, status
from sqlalchemy import Select, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.rbac import CurrentUser, get_current_user
from backend.app.db.session import get_db_session

T = TypeVar("T")


class TenantScope:
    """Query helpers that enforce organization-level tenant isolation."""

    @staticmethod
    def require_organization(user: CurrentUser) -> str:
        if not user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User is not scoped to an organization",
            )
        return user.organization_id

    @staticmethod
    def apply_org_filter(stmt: Select, model: Type[T], user: CurrentUser) -> Select:
        org_id = TenantScope.require_organization(user)
        if user.role.lower() in ("admin", "plant manager") and not user.factory_id:
            return stmt.where(model.organization_id == org_id)
        stmt = stmt.where(model.organization_id == org_id)
        if user.factory_id and hasattr(model, "factory_id"):
            stmt = stmt.where(
                (model.factory_id == user.factory_id) | (model.factory_id.is_(None))
            )
        return stmt

    @staticmethod
    def enforce_resource_access(user: CurrentUser, resource) -> None:
        org_id = TenantScope.require_organization(user)
        resource_org = getattr(resource, "organization_id", None)
        if resource_org and str(resource_org) != org_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cross-tenant access forbidden",
            )
        resource_factory = getattr(resource, "factory_id", None)
        if (
            user.factory_id
            and resource_factory
            and str(resource_factory) != user.factory_id
            and user.role.lower() not in ("admin",)
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cross-factory access forbidden",
            )


async def get_tenant_user(
    current_user: CurrentUser = Depends(get_current_user),
) -> CurrentUser:
    TenantScope.require_organization(current_user)
    return current_user


async def get_db(
    session: AsyncSession = Depends(get_db_session),
) -> AsyncSession:
    return session
