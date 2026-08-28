"""Initial platform schema — all SQLAlchemy models.

Revision ID: 001_initial
Revises:
Create Date: 2026-08-28

"""
from typing import Sequence, Union

from alembic import op

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    from backend.app import models  # noqa: F401
    from backend.app.db.session import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind)


def downgrade() -> None:
    from backend.app import models  # noqa: F401
    from backend.app.db.session import Base

    bind = op.get_bind()
    Base.metadata.drop_all(bind)
