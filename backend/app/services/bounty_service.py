from datetime import UTC, datetime

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.base import BountyApplicantModel, BountyModel, ProjectModel, UserModel
from app.schemas.bounty import BOUNTY_TRANSITIONS, BountyStatus
from app.services import github_service, solana_service


async def get_bounty(session: AsyncSession, bounty_id: int) -> BountyModel:
    stmt = (
        select(BountyModel)
        .where(BountyModel.id == bounty_id)
        .options(
            selectinload(BountyModel.issuer),
            selectinload(BountyModel.hunter),
            selectinload(BountyModel.applicants).selectinload(BountyApplicantModel.user),
        )
    )
    result = await session.execute(stmt)
    bounty = result.scalar_one_or_none()
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


def _require_wallet(user: UserModel, role: str) -> str:
    if not user.wallet:
        raise ValidationError(f"Connect a Solana wallet before acting as the {role}")
    return user.wallet


async def _run_onchain_or_rollback(session: AsyncSession, action) -> str | None:
    """Executa uma instrução on-chain dentro da transação do banco ainda não commitada."""
    if not solana_service.is_onchain_enabled():
        return None
    try:
        return await action()
    except solana_service.SolanaNotConfiguredError:
        return None
    except solana_service.SolanaServiceError as e:
        await session.rollback()
        raise ValidationError(f"On-chain transaction failed: {e}") from e


async def create_bounty(
    session: AsyncSession,
    issuer: UserModel,
    project_id: int,
    issue_url: str,
    amount_usdc: int | None = None,
    points: int = 100,
    repository_id: int | None = None,
    issue_number: int | None = None,
    issue_title: str | None = None,
    issue_body: str | None = None,
    escrow_pda: str | None = None,
) -> BountyModel:
    project = await get_project(session, project_id)
    if project.owner_id != issuer.id and issuer.role != "ADMIN":
        raise ForbiddenError("Only the project owner or an admin can create bounties")

    if solana_service.is_onchain_enabled():
        _require_wallet(issuer, "maintainer")

    issue_open = await github_service.is_issue_open(issue_url)
    if issue_open is False:
        raise ValidationError("GitHub issue is closed")

    # If amount_usdc is not specified, calculate canonical conversion:
    # 100 pts = $1 USDC = 1_000_000 micro-USDC
    final_amount_usdc = amount_usdc if amount_usdc is not None else points * 10_000

    # Auto-extract issue details from GitHub if missing
    parsed = github_service.parse_issue_url(issue_url)
    if parsed:
        owner, repo, num = parsed
        if issue_number is None:
            issue_number = num
        if not issue_title:
            details = await github_service.fetch_issue_details(owner, repo, num)
            if details:
                issue_title = details.get("title")
                if issue_body is None:
                    issue_body = details.get("body")

    if escrow_pda is not None:
        expected_ui_amount = final_amount_usdc / 10**solana_service.USDC_DECIMALS
        escrow_funded = await solana_service.verify_escrow_funded(escrow_pda, expected_ui_amount)
        if escrow_funded is False:
            raise ValidationError("Escrow account is not funded with the required USDC amount")

    bounty = BountyModel(
        project_id=project_id,
        repository_id=repository_id,
        issuer_id=issuer.id,
        issue_url=issue_url,
        issue_number=issue_number,
        issue_title=issue_title,
        issue_body=issue_body,
        points=points,
        amount_usdc=final_amount_usdc,
        escrow_pda=escrow_pda,
        status=BountyStatus.OPEN.value,
    )
    session.add(bounty)
    await session.flush()

    await _run_onchain_or_rollback(
        session,
        lambda: solana_service.create_bounty_onchain(
            bounty.id, bounty.amount_usdc, issuer.wallet or "11111111111111111111111111111111"
        ),
    )

    await session.commit()
    await session.refresh(bounty)
    return bounty


async def list_bounties(
    session: AsyncSession,
    status: BountyStatus | None = None,
    project_id: int | None = None,
    hunter_id: int | None = None,
    repository_id: int | None = None,
) -> list[BountyModel]:
    stmt = (
        select(BountyModel)
        .options(
            selectinload(BountyModel.issuer),
            selectinload(BountyModel.hunter),
            selectinload(BountyModel.applicants).selectinload(BountyApplicantModel.user),
        )
        .order_by(BountyModel.created_at.desc())
    )
    if status is not None:
        stmt = stmt.where(BountyModel.status == status.value)
    if project_id is not None:
        stmt = stmt.where(BountyModel.project_id == project_id)
    if hunter_id is not None:
        stmt = stmt.where(BountyModel.hunter_id == hunter_id)
    if repository_id is not None:
        stmt = stmt.where(BountyModel.repository_id == repository_id)
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def apply_to_bounty(
    session: AsyncSession,
    bounty: BountyModel,
    hunter: UserModel,
    proposal: str | None = None,
) -> BountyApplicantModel:
    """A developer applies to work on an open bounty."""
    if bounty.status != BountyStatus.OPEN.value:
        raise ConflictError("Can only apply to open bounties")
    if bounty.issuer_id == hunter.id:
        raise ForbiddenError("The bounty issuer cannot apply to their own bounty")

    # Check if hunter already applied
    stmt = select(BountyApplicantModel).where(
        BountyApplicantModel.bounty_id == bounty.id,
        BountyApplicantModel.user_id == hunter.id,
    )
    existing = (await session.execute(stmt)).scalar_one_or_none()
    if existing is not None:
        raise ConflictError("You have already applied to this bounty")

    applicant = BountyApplicantModel(
        bounty_id=bounty.id,
        user_id=hunter.id,
        proposal=proposal,
        status="PENDING",
    )
    session.add(applicant)
    await session.commit()
    await session.refresh(applicant)
    return applicant


async def list_bounty_applicants(
    session: AsyncSession,
    bounty_id: int,
) -> list[BountyApplicantModel]:
    """List all applicants for a given bounty."""
    stmt = (
        select(BountyApplicantModel)
        .where(BountyApplicantModel.bounty_id == bounty_id)
        .options(selectinload(BountyApplicantModel.user))
        .order_by(BountyApplicantModel.created_at.asc())
    )
    result = await session.execute(stmt)
    return list(result.scalars().all())


async def accept_bounty_applicant(
    session: AsyncSession,
    bounty: BountyModel,
    applicant_id: int,
    actor: UserModel,
) -> BountyModel:
    """Maintainer or Admin accepts an applicant, assigning the bounty and locking reward."""
    if bounty.issuer_id != actor.id and actor.role != "ADMIN":
        raise ForbiddenError("Only the bounty issuer or an admin can accept applicants")
    if bounty.status != BountyStatus.OPEN.value:
        raise ConflictError("Bounty is not open for applicant selection")

    stmt = select(BountyApplicantModel).where(
        BountyApplicantModel.id == applicant_id,
        BountyApplicantModel.bounty_id == bounty.id,
    )
    applicant = (await session.execute(stmt)).scalar_one_or_none()
    if applicant is None:
        raise NotFoundError("Applicant")

    applicant.status = "ACCEPTED"

    # Reject other pending applicants for this bounty
    stmt_others = select(BountyApplicantModel).where(
        BountyApplicantModel.bounty_id == bounty.id,
        BountyApplicantModel.id != applicant_id,
        BountyApplicantModel.status == "PENDING",
    )
    others = (await session.execute(stmt_others)).scalars().all()
    for other in others:
        other.status = "REJECTED"

    # Transition bounty to ASSIGNED and freeze reward (Invariant 2)
    _transition(bounty, BountyStatus.ASSIGNED)
    bounty.hunter_id = applicant.user_id

    if solana_service.is_onchain_enabled() and applicant.user and applicant.user.wallet:
        await _run_onchain_or_rollback(
            session,
            lambda: solana_service.assign_developer_onchain(bounty.id, applicant.user.wallet),
        )

    await session.commit()
    await session.refresh(bounty)
    return bounty


async def update_bounty_reward(
    session: AsyncSession,
    bounty: BountyModel,
    actor: UserModel,
    points: int,
) -> BountyModel:
    """Admin or Owner can adjust the points/reward only while the bounty is OPEN (Invariant 2)."""
    if bounty.issuer_id != actor.id and actor.role != "ADMIN":
        raise ForbiddenError("Only the project owner or an admin can adjust bounty rewards")
    if bounty.status != BountyStatus.OPEN.value:
        raise ConflictError("Cannot modify reward of an assigned or ongoing bounty (Invariant 2)")

    bounty.points = points
    bounty.amount_usdc = points * 10_000
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def assign_bounty(
    session: AsyncSession, bounty: BountyModel, hunter: UserModel
) -> BountyModel:
    if bounty.issuer_id == hunter.id:
        raise ForbiddenError("The bounty issuer cannot assign it to themselves")
    if solana_service.is_onchain_enabled():
        _require_wallet(hunter, "developer")

    _transition(bounty, BountyStatus.ASSIGNED)
    bounty.hunter_id = hunter.id

    if solana_service.is_onchain_enabled() and hunter.wallet:
        await _run_onchain_or_rollback(
            session,
            lambda: solana_service.assign_developer_onchain(bounty.id, hunter.wallet),
        )

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
    if bounty.issuer_id != actor.id and actor.role != "ADMIN":
        raise ForbiddenError("Only the bounty issuer or an admin can complete it")
    if not bounty.pr_url:
        raise ConflictError("Bounty has no PR submitted")

    merged = await github_service.is_pr_merged(bounty.pr_url)
    if merged is None:
        raise ConflictError("Could not verify PR status on GitHub")
    if not merged:
        raise ValidationError("Pull request is not merged yet")

    _transition(bounty, BountyStatus.COMPLETED)

    # Invariant 1: Approve claim on-chain unlocks developer's own claim transaction
    if solana_service.is_onchain_enabled():
        await _run_onchain_or_rollback(
            session,
            lambda: solana_service.approve_claim_onchain(bounty.id),
        )
    else:
        # Execute on-chain payout via Solinpy if hunter has wallet registered (legacy/fallback mode)
        if bounty.hunter_id:
            hunter = await session.get(UserModel, bounty.hunter_id)
            if hunter and hunter.wallet:
                try:
                    tx_sig = await solana_service.execute_bounty_payout(
                        destination_wallet=hunter.wallet,
                        amount_micro_usdc=bounty.amount_usdc,
                    )
                    bounty.tx_signature = tx_sig
                    bounty.claimed_at = datetime.now(UTC)
                except Exception:
                    pass

    await session.commit()
    await session.refresh(bounty)
    return bounty


async def cancel_bounty(
    session: AsyncSession, bounty: BountyModel, actor: UserModel
) -> BountyModel:
    if bounty.issuer_id != actor.id and actor.role != "ADMIN":
        raise ForbiddenError("Only the bounty issuer or an admin can cancel it")
    _transition(bounty, BountyStatus.CANCELLED)

    await _run_onchain_or_rollback(
        session,
        lambda: solana_service.cancel_bounty_onchain(bounty.id),
    )

    await session.commit()
    await session.refresh(bounty)
    return bounty


async def record_claim(
    session: AsyncSession, bounty: BountyModel, actor: UserModel, tx_signature: str
) -> BountyModel:
    """Registra a assinatura de claim executada pela carteira do desenvolvedor."""
    if bounty.hunter_id != actor.id and actor.role != "ADMIN":
        raise ForbiddenError("Only the assigned developer or an admin can report a claim")

    if solana_service.is_onchain_enabled():
        try:
            account = await solana_service.get_bounty_account(bounty.id)
        except solana_service.SolanaServiceError as e:
            raise ConflictError(f"Could not verify claim on-chain: {e}") from e
        if account is None or account["status"] != solana_service.BOUNTY_STATUS_CLAIMED:
            raise ValidationError("The claim transaction has not been confirmed on-chain yet")

    _transition(bounty, BountyStatus.CLAIMED)
    bounty.tx_signature = tx_signature
    bounty.claimed_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def reject_bounty_submission(
    session: AsyncSession, bounty: BountyModel, actor: UserModel, reason: str | None = None
) -> BountyModel:
    if bounty.issuer_id != actor.id and actor.role != "ADMIN":
        raise ForbiddenError("Only the bounty issuer or an admin can reject a submission")
    if bounty.status != BountyStatus.SUBMITTED.value:
        raise ConflictError(f"Cannot reject submission for bounty with status {bounty.status}")

    _transition(bounty, BountyStatus.ASSIGNED)
    bounty.pr_url = None
    await session.commit()
    await session.refresh(bounty)
    return bounty


async def get_admin_stats(session: AsyncSession) -> dict:
    from app.db.base import RepositoryModel

    projects_res = await session.execute(select(func.count(ProjectModel.id)))
    total_projects = projects_res.scalar() or 0

    repos_res = await session.execute(select(func.count(RepositoryModel.id)))
    total_repositories = repos_res.scalar() or 0

    users_res = await session.execute(select(func.count(UserModel.id)))
    total_users = users_res.scalar() or 0

    bounties_res = await session.execute(select(BountyModel))
    all_bounties = list(bounties_res.scalars().all())

    total_bounties = len(all_bounties)
    bounties_by_status = {
        BountyStatus.OPEN.value: 0,
        BountyStatus.ASSIGNED.value: 0,
        BountyStatus.SUBMITTED.value: 0,
        BountyStatus.COMPLETED.value: 0,
        BountyStatus.CANCELLED.value: 0,
    }
    total_allocated_micro = 0
    total_paid_micro = 0

    for b in all_bounties:
        if b.status in bounties_by_status:
            bounties_by_status[b.status] += 1
        if b.status not in (BountyStatus.CANCELLED.value,):
            total_allocated_micro += b.amount_usdc
        if b.status == BountyStatus.COMPLETED.value:
            total_paid_micro += b.amount_usdc

    return {
        "total_projects": total_projects,
        "total_repositories": total_repositories,
        "total_bounties": total_bounties,
        "bounties_by_status": bounties_by_status,
        "total_usdc_allocated": round(total_allocated_micro / 1_000_000, 2),
        "total_usdc_paid": round(total_paid_micro / 1_000_000, 2),
        "total_users": total_users,
        "pending_submissions": bounties_by_status[BountyStatus.SUBMITTED.value],
    }

