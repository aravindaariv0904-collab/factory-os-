from typing import Dict, Any, List
from fastapi import HTTPException, status
from backend.app.core.rbac import CurrentUser

class TenantIsolationManager:
    @staticmethod
    def enforce_tenant_scope(user: CurrentUser, resource_tenant_id: str) -> bool:
        if user.role == "Admin":
            return True
        if user.factory_id and user.factory_id != resource_tenant_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cross-tenant access forbidden. Resource belongs to factory '{resource_tenant_id}'.",
            )
        return True

    @staticmethod
    def filter_records_by_tenant(user: CurrentUser, records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if user.role == "Admin" or not user.factory_id:
            return records
        return [r for r in records if r.get("factory_id", "fact_01") == user.factory_id]

tenant_manager = TenantIsolationManager()
