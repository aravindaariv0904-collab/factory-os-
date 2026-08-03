import logging
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger("factoryos.audit")
logging.basicConfig(level=logging.INFO)

class AuditLogger:
    @staticmethod
    def log_event(
        user_email: str,
        action: str,
        resource: str,
        tenant_id: str = "fact_01",
        status: str = "SUCCESS",
        metadata: Optional[Dict[str, Any]] = None,
    ):
        event = {
            "timestamp": datetime.now().isoformat(),
            "user": user_email,
            "action": action,
            "resource": resource,
            "tenant_id": tenant_id,
            "status": status,
            "metadata": metadata or {},
        }
        logger.info(f"[AUDIT] {event}")
        return event

audit_logger = AuditLogger()
