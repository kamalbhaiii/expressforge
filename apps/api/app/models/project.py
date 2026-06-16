import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Project(Base):
    """Saved user project — stores full GenerateConfig + Route[] as JSONB."""

    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    # URL-safe slug, unique per user
    slug: Mapped[str] = mapped_column(String(200), nullable=False)

    # Full GenerateConfig dict serialized as JSON
    config: Mapped[dict] = mapped_column(JSON, nullable=False, default=dict)
    # Route[] array serialized as JSON
    routes: Mapped[list] = mapped_column(JSON, nullable=False, default=list)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
    last_generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    generation_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship("User", back_populates="projects")  # noqa: F821

    def to_summary(self) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "slug": self.slug,
            "config": self.config,
            "routes_count": len(self.routes) if self.routes else 0,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "last_generated_at": self.last_generated_at.isoformat() if self.last_generated_at else None,
            "generation_count": self.generation_count,
        }
