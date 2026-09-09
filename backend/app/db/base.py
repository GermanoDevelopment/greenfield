from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
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
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="CONTRIBUTOR", index=True)

    projects: Mapped[list["ProjectModel"]] = relationship(back_populates="owner")
    issued_bounties: Mapped[list["BountyModel"]] = relationship(
        back_populates="issuer", foreign_keys="BountyModel.issuer_id"
    )
    hunted_bounties: Mapped[list["BountyModel"]] = relationship(
        back_populates="hunter", foreign_keys="BountyModel.hunter_id"
    )
    applications: Mapped[list["BountyApplicantModel"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
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
    repositories: Mapped[list["RepositoryModel"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    bounties: Mapped[list["BountyModel"]] = relationship(back_populates="project")


class RepositoryModel(Base, TimestampMixin):
    __tablename__ = "repositories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    github_owner: Mapped[str] = mapped_column(String(255), nullable=False)
    github_name: Mapped[str] = mapped_column(String(255), nullable=False)
    github_repo: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    github_repo_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    description: Mapped[str | None] = mapped_column(String, nullable=True)
    default_branch: Mapped[str] = mapped_column(String(64), nullable=False, default="main")
    is_active: Mapped[bool] = mapped_column(nullable=False, default=True)

    project: Mapped[ProjectModel] = relationship(back_populates="repositories")
    bounties: Mapped[list["BountyModel"]] = relationship(back_populates="repository")


class BountyApplicantModel(Base, TimestampMixin):
    __tablename__ = "bounty_applicants"
    __table_args__ = (UniqueConstraint("bounty_id", "user_id", name="uq_bounty_applicant"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    bounty_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("bounties.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="PENDING", index=True)
    proposal: Mapped[str | None] = mapped_column(String(2048), nullable=True)

    bounty: Mapped["BountyModel"] = relationship(back_populates="applicants")
    user: Mapped[UserModel] = relationship(back_populates="applications")


class BountyModel(Base, TimestampMixin):
    __tablename__ = "bounties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    repository_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("repositories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    issuer_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hunter_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), index=True
    )
    issue_url: Mapped[str] = mapped_column(String(512), nullable=False)
    issue_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    issue_title: Mapped[str | None] = mapped_column(String(512), nullable=True)
    issue_body: Mapped[str | None] = mapped_column(String, nullable=True)
    pr_url: Mapped[str | None] = mapped_column(String(512))
    points: Mapped[int] = mapped_column(Integer, nullable=False, default=100)
    amount_usdc: Mapped[int] = mapped_column(BigInteger, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="OPEN", index=True)
    escrow_pda: Mapped[str | None] = mapped_column(String(44))
    tx_signature: Mapped[str | None] = mapped_column(String(128), nullable=True)
    claimed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    project: Mapped[ProjectModel] = relationship(back_populates="bounties")
    repository: Mapped[RepositoryModel | None] = relationship(back_populates="bounties")
    issuer: Mapped[UserModel] = relationship(
        back_populates="issued_bounties", foreign_keys=[issuer_id]
    )
    hunter: Mapped[UserModel | None] = relationship(
        back_populates="hunted_bounties", foreign_keys=[hunter_id]
    )
    applicants: Mapped[list[BountyApplicantModel]] = relationship(
        back_populates="bounty", cascade="all, delete-orphan"
    )

    @property
    def claim_signature(self) -> str | None:
        return self.tx_signature

    @claim_signature.setter
    def claim_signature(self, value: str | None) -> None:
        self.tx_signature = value
