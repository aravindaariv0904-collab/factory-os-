"""Object storage abstraction for raw datasets, artifacts, and reports."""
import hashlib
import os
from pathlib import Path
from typing import BinaryIO, Optional

from backend.app.core.config import get_settings


class StorageService:
    """Local filesystem storage with tenant-scoped paths.

    Production deployments should swap this backend for S3/MinIO via the same interface.
    """

    def __init__(self, root: Optional[str] = None):
        settings = get_settings()
        self.root = Path(root or settings.storage_root)
        self.root.mkdir(parents=True, exist_ok=True)

    def _tenant_path(self, organization_id: str, category: str, *parts: str) -> Path:
        path = self.root / organization_id / category / Path(*parts)
        path.parent.mkdir(parents=True, exist_ok=True)
        return path

    def store_bytes(
        self,
        organization_id: str,
        category: str,
        filename: str,
        content: bytes,
    ) -> str:
        safe_name = filename.replace("..", "").replace("/", "_").replace("\\", "_")
        digest = hashlib.sha256(content).hexdigest()[:12]
        rel = f"{digest}_{safe_name}"
        path = self._tenant_path(organization_id, category, rel)
        path.write_bytes(content)
        return str(path.relative_to(self.root))

    def store_file(
        self,
        organization_id: str,
        category: str,
        filename: str,
        file_obj: BinaryIO,
    ) -> str:
        return self.store_bytes(organization_id, category, filename, file_obj.read())

    def read_bytes(self, storage_path: str) -> bytes:
        full = self.root / storage_path
        if not full.exists():
            raise FileNotFoundError(f"Storage object not found: {storage_path}")
        return full.read_bytes()

    def exists(self, storage_path: str) -> bool:
        return (self.root / storage_path).exists()

    def absolute_path(self, storage_path: str) -> str:
        return str(self.root / storage_path)

    def delete(self, storage_path: str) -> None:
        full = self.root / storage_path
        if full.exists():
            full.unlink()


storage_service = StorageService()
