from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.db.base import BountyModel
from app.schemas.bounty import (
    BountyCreate,
    BountyOut,
    BountyStatus,
    BountyStatusOut,
    BountySubmit,
)
from app.services import bounty_service

router = APIRouter(prefix="/bounties", tags=["bounties"])


async def _get_bounty_or_404(db: DbSession, bounty_id: int) -> BountyModel:
    result = await db.execute(
        select(BountyModel)
        .where(BountyModel.id == bounty_id)
        .options(
            selectinload(BountyModel.issuer),
            selectinload(BountyModel.hunter),
        )
    )
    bounty = result.scalar_one_or_none()
    if bounty is None:
        raise NotFoundError("Bounty")
    return bounty


@router.post("", response_model=BountyOut, status_code=201)
async def create_bounty(
    data: BountyCreate, current_user: CurrentUser, db: DbSession
) -> BountyModel:
    bounty = await bounty_service.create_bounty(
        session=db,
        issuer=current_user,
        project_id=data.project_id,
        issue_url=str(data.issue_url),
        amount_usdc=data.amount_usdc,
        escrow_pda=data.escrow_pda,
    )
    return await _get_bounty_or_404(db, bounty.id)


@router.get("", response_model=list[BountyOut])
async def list_bounties(
    db: DbSession,
    status: Annotated[BountyStatus | None, Query()] = None,
    project_id: Annotated[int | None, Query()] = None,
    hunter_id: Annotated[int | None, Query()] = None,
) -> list[BountyModel]:
    bounties = await bounty_service.list_bounties(
        db, status=status, project_id=project_id, hunter_id=hunter_id
    )
    return list(bounties)


@router.get("/{bounty_id}", response_model=BountyOut)
async def get_bounty(bounty_id: int, db: DbSession) -> BountyModel:
    return await _get_bounty_or_404(db, bounty_id)


@router.post("/{bounty_id}/assign", response_model=BountyOut)
async def assign_bounty(bounty_id: int, current_user: CurrentUser, db: DbSession) -> BountyModel:
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.assign_bounty(db, bounty, current_user)


@router.post("/{bounty_id}/submit", response_model=BountyOut)
async def submit_bounty(
    bounty_id: int, data: BountySubmit, current_user: CurrentUser, db: DbSession
) -> BountyModel:
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.submit_bounty(db, bounty, current_user, str(data.pr_url))


@router.post("/{bounty_id}/complete", response_model=BountyOut)
async def complete_bounty(bounty_id: int, current_user: CurrentUser, db: DbSession) -> BountyModel:
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.complete_bounty(db, bounty, current_user)


@router.post("/{bounty_id}/cancel", response_model=BountyStatusOut)
async def cancel_bounty(bounty_id: int, current_user: CurrentUser, db: DbSession) -> BountyModel:
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.cancel_bounty(db, bounty, current_user)
