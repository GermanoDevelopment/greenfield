from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.base import BountyModel, ProjectModel, UserModel
from app.schemas.bounty import BOUNTY_TRANSITIONS, BountyStatus
from app.services import github_service, solana_service


async def get_bounty(session: AsyncSession, bounty_id: int) -> BountyModel:
    bounty = await session.get(BountyModel, bounty_id)
    if bounty is None:
        raise NotFoundError("Bounty")
    return bounty


async def get_project(session: AsyncSession, project_id: int) -> ProjectModel:
    project = await session.get(ProjectModel, project_id)
    if project is None:
        raise NotFoundError("Project")
    return project


def _transition(bounty: BountyModel, to_status: BountyStatus) -> None:
    current = BountyStatus(bounty.status)
    if to_status not in BOUNTY_TRANSITIONS[current]:
        raise ConflictError(f"Cannot transition bounty from {current.value} to {to_status.value}")
    bounty.status = to_status.value


async def create_bounty(
    session: AsyncSession,
    issuer: UserModel,
    project_id: int,
    issue_url: str,
    amount_usdc: int,
    escrow_pda: str | None,
) -> BountyModel:
    project = await get_project(session, project_id)
    if project.owner_id != issuer.id:
        raise ForbiddenError("Only the project owner can create bounties")

    issue_open = await github_service.is_issue_open(issue_url)
    if issue_open is False:
        raise ValidationError("GitHub issue is closed")

    if escrow_pda is not None:
        expected_ui_amount = amount_usdc / 10**solana_service.USDC_DECIMALS
        escrow_funded = await solana_service.verify_escrow_funded(escrow_pda, expected_ui_amount)
        if escrow_funded is False:
            raise ValidationError("Escrow account is not funded with the required USDC amount")

    bounty = BountyModel(
        project_id=project_id,
        issuer_id=issuer.id,
        issue_url=issue_url,
        amount_usdc=amount_usdc,
        escrow_pda=escrow_pda,
        status=BountyStatus.OPEN.value,
    )
    session.add(bounty)
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def list_bounties(
    session: AsyncSession,
    status: BountyStatus | None = None,
    project_id: int | None = None,
    hunter_id: int | None = None,
) -> list[BountyModel]:
    stmt = (
        select(BountyModel)
        .options(selectinload(BountyModel.issuer), selectinload(BountyModel.hunter))
        .order_by(BountyModel.created_at.desc())
    )
    if status is not None:
        stmt = stmt.where(BountyModel.status == status.value)
    if project_id is not None:
        stmt = stmt.where(BountyModel.project_id == project_id)
    if hunter_id is not None:
        stmt = stmt.where(BountyModel.hunter_id == hunter_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def assign_bounty(
    session: AsyncSession, bounty: BountyModel, hunter: UserModel
) -> BountyModel:
    if bounty.issuer_id == hunter.id:
        raise ForbiddenError("The bounty issuer cannot assign it to themselves")
    _transition(bounty, BountyStatus.ASSIGNED)
    bounty.hunter_id = hunter.id
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def submit_bounty(
    session: AsyncSession, bounty: BountyModel, hunter: UserModel, pr_url: str
) -> BountyModel:
    if bounty.hunter_id != hunter.id:
        raise ForbiddenError("Only the assigned hunter can submit a PR")
    _transition(bounty, BountyStatus.SUBMITTED)
    bounty.pr_url = str(pr_url)
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def complete_bounty(
    session: AsyncSession, bounty: BountyModel, actor: UserModel
) -> BountyModel:
    if bounty.issuer_id != actor.id:
        raise ForbiddenError("Only the bounty issuer can complete it")
    if not bounty.pr_url:
        raise ConflictError("Bounty has no PR submitted")

    merged = await github_service.is_pr_merged(bounty.pr_url)
    if merged is None:
        raise ConflictError("Could not verify PR status on GitHub")
    if not merged:
        raise ValidationError("Pull request is not merged yet")

    _transition(bounty, BountyStatus.COMPLETED)
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def cancel_bounty(
    session: AsyncSession, bounty: BountyModel, actor: UserModel
) -> BountyModel:
    if bounty.issuer_id != actor.id:
        raise ForbiddenError("Only the bounty issuer can cancel it")
    _transition(bounty, BountyStatus.CANCELLED)
    await session.commit()
    await session.refresh(bounty)
    return bounty
