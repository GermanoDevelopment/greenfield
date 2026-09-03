from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.schemas.user import UserPublicOut, validate_solana_wallet


class BountyStatus(StrEnum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    SUBMITTED = "SUBMITTED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


# Valid transitions of the bounty state machine
BOUNTY_TRANSITIONS: dict[BountyStatus, set[BountyStatus]] = {
    BountyStatus.OPEN: {BountyStatus.ASSIGNED, BountyStatus.CANCELLED},
    BountyStatus.ASSIGNED: {BountyStatus.SUBMITTED, BountyStatus.CANCELLED},
    BountyStatus.SUBMITTED: {BountyStatus.COMPLETED},
    BountyStatus.COMPLETED: set(),
    BountyStatus.CANCELLED: set(),
}


class BountyCreate(BaseModel):
    project_id: int
    issue_url: HttpUrl
    amount_usdc: int = Field(gt=0)
    escrow_pda: str | None = None

    @field_validator("escrow_pda")
    @classmethod
    def escrow_pda_is_valid(cls, v: str | None) -> str | None:
        return validate_solana_wallet(v) if v is not None else None


class BountySubmit(BaseModel):
    pr_url: HttpUrl


class BountyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    project_id: int
    issuer_id: int
    hunter_id: int | None = None
    issue_url: str
    pr_url: str | None = None
    amount_usdc: int
    status: BountyStatus
    escrow_pda: str | None = None
    created_at: datetime
    updated_at: datetime
    issuer: UserPublicOut | None = None
    hunter: UserPublicOut | None = None

    @field_validator("issue_url", "pr_url", mode="before")
    @classmethod
    def url_to_str(cls, v):
        return str(v) if v is not None else None


class BountyStatusOut(BaseModel):
    id: int
    status: BountyStatus
