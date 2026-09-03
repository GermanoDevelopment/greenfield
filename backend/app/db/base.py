from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )


class UserModel(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    github_id: Mapped[int] = mapped_column(BigInteger, unique=True, nullable=False, index=True)
    username: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512))
    wallet: Mapped[str | None] = mapped_column(String(44))

    projects: Mapped[list["ProjectModel"]] = relationship(back_populates="owner")
    issued_bounties: Mapped[list["BountyModel"]] = relationship(
        back_populates="issuer", foreign_keys="BountyModel.issuer_id"
    )
    hunted_bounties: Mapped[list["BountyModel"]] = relationship(
        back_populates="hunter", foreign_keys="BountyModel.hunter_id"
    )


class ProjectModel(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    github_repo: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(String)

    owner: Mapped[UserModel] = relationship(back_populates="projects")
    bounties: Mapped[list["BountyModel"]] = relationship(back_populates="project")


class BountyModel(Base, TimestampMixin):
    __tablename__ = "bounties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    issuer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hunter_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    issue_url: Mapped[str] = mapped_column(String(512), nullable=False)
    pr_url: Mapped[str | None] = mapped_column(String(512))
    amount_usdc: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="OPEN", index=True)
    escrow_pda: Mapped[str | None] = mapped_column(String(44))

    project: Mapped[ProjectModel] = relationship(back_populates="bounties")
    issuer: Mapped[UserModel] = relationship(
        back_populates="issued_bounties", foreign_keys=[issuer_id]
    )
    hunter: Mapped[UserModel | None] = relationship(
        back_populates="hunted_bounties", foreign_keys=[hunter_id]
    )
