from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentAdminUser, DbSession
from app.core.exceptions import ConflictError, NotFoundError
from app.db.base import BountyModel, ProjectModel, RepositoryModel
from app.schemas.admin import AdminStatsOut, ReviewSubmissionRequest
from app.schemas.bounty import BountyOut, BountyStatus
from app.schemas.repository import RepositoryCreate, RepositoryOut
from app.services import bounty_service, github_service, solana_service

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get(
    "/stats",
    response_model=AdminStatsOut,
    summary="Obter estatísticas administrativas do ecossistema",
)
async def get_admin_stats(
    _admin: CurrentAdminUser,
    db: DbSession,
) -> dict:
    """
    Retorna estatísticas consolidadas da plataforma: total de projetos,
    repositórios, contagem de bounties por status, capital alocado e pago em USDC.
    """
    return await bounty_service.get_admin_stats(db)


@router.post(
    "/repositories",
    response_model=RepositoryOut,
    status_code=201,
    summary="Cadastrar novo repositório (Admin)",
)
async def admin_add_repository(
    project_id: int,
    data: RepositoryCreate,
    _admin: CurrentAdminUser,
    db: DbSession,
) -> RepositoryModel:
    """
    Permite ao administrador cadastrar um novo repositório GitHub em qualquer
    projeto da plataforma para rastreamento e monetização.
    """
    project = await db.get(ProjectModel, project_id)
    if project is None:
        raise NotFoundError("Project")

    cleaned = data.github_repo.strip().removeprefix("https://github.com/").strip("/")
    parts = cleaned.split("/")
    if len(parts) != 2 or not all(parts):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid github_repo format. Must be 'owner/repo'.",
        )
    owner, repo_name = parts[0], parts[1]

    stmt = select(RepositoryModel).where(
        RepositoryModel.project_id == project_id,
        RepositoryModel.github_repo == cleaned,
    )
    existing = (await db.execute(stmt)).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Repository already added to this project",
        )

    repo = RepositoryModel(
        project_id=project_id,
        github_owner=owner,
        github_name=repo_name,
        github_repo=cleaned,
        description=data.description,
        default_branch=data.default_branch,
        is_active=True,
    )
    db.add(repo)
    await db.commit()
    await db.refresh(repo)
    return repo


@router.post(
    "/bounties/{bounty_id}/review",
    response_model=BountyOut,
    summary="Moderar conclusão de task (Aprovar ou Negar)",
)
async def review_bounty_submission(
    bounty_id: int,
    data: ReviewSubmissionRequest,
    admin: CurrentAdminUser,
    db: DbSession,
) -> BountyModel:
    """
    Avalia a solução de uma tarefa submetida:
    - 'APPROVE': conclui a tarefa e dispara a liquidação de USDC na Solana via Solinpy.
    - 'REJECT': recusa a solução e reverte o status para ASSIGNED para correções.
    """
    bounty = await bounty_service.get_bounty(db, bounty_id)
    if bounty.status != BountyStatus.SUBMITTED.value:
        raise ConflictError(f"Cannot review bounty with status {bounty.status}")

    action = data.action.upper()
    if action == "APPROVE":
        if not bounty.pr_url:
            raise ConflictError("Bounty has no PR submitted")

        if not data.force_payout:
            merged = await github_service.is_pr_merged(bounty.pr_url)
            if merged is None:
                raise ConflictError("Could not verify PR status on GitHub")
            if not merged:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Pull request is not merged yet on GitHub",
                )

        bounty_service._transition(bounty, BountyStatus.COMPLETED)

        if bounty.hunter_id:
            from app.db.base import UserModel

            hunter = await db.get(UserModel, bounty.hunter_id)
            if hunter and hunter.wallet:
                try:
                    from datetime import UTC, datetime

                    tx_sig = await solana_service.execute_bounty_payout(
                        destination_wallet=hunter.wallet,
                        amount_micro_usdc=bounty.amount_usdc,
                    )
                    bounty.tx_signature = tx_sig
                    bounty.claimed_at = datetime.now(UTC)
                except Exception:
                    pass

        await db.commit()
        await db.refresh(bounty)
        return await bounty_service.get_bounty(db, bounty_id)

    elif action == "REJECT":
        return await bounty_service.reject_bounty_submission(
            session=db,
            bounty=bounty,
            actor=admin,
            reason=data.reason,
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid action. Must be 'APPROVE' or 'REJECT'.",
        )
