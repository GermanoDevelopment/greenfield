from typing import Annotated

from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError
from app.db.base import BountyApplicantModel, BountyModel
from app.schemas.bounty import (
    BountyApplicantCreate,
    BountyApplicantOut,
    BountyCreate,
    BountyOut,
    BountyRewardUpdate,
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
            selectinload(BountyModel.applicants).selectinload(BountyApplicantModel.user),
        )
    )
    bounty = result.scalar_one_or_none()
    if bounty is None:
        raise NotFoundError("Bounty")
    return bounty


@router.post(
    "",
    response_model=BountyOut,
    status_code=201,
    summary="Criar task monetizada (bounty)",
)
async def create_bounty(
    data: BountyCreate, current_user: CurrentUser, db: DbSession
) -> BountyModel:
    """Cria uma nova bounty para uma issue do GitHub definindo a pontuação (100 pts = $1 USDC)."""
    bounty = await bounty_service.create_bounty(
        session=db,
        issuer=current_user,
        project_id=data.project_id,
        issue_url=str(data.issue_url),
        amount_usdc=data.amount_usdc,
        points=data.points,
        repository_id=data.repository_id,
        issue_number=data.issue_number,
        issue_title=data.issue_title,
        issue_body=data.issue_body,
        escrow_pda=data.escrow_pda,
    )
    return await _get_bounty_or_404(db, bounty.id)


@router.get(
    "",
    response_model=list[BountyOut],
    summary="Listar bounties",
)
async def list_bounties(
    db: DbSession,
    status: Annotated[
        BountyStatus | None, Query(description="Filtrar por status do ciclo de vida")
    ] = None,
    project_id: Annotated[int | None, Query(description="Filtrar por ID do projeto")] = None,
    hunter_id: Annotated[
        int | None, Query(description="Filtrar por ID do desenvolvedor atribuído")
    ] = None,
    repository_id: Annotated[int | None, Query(description="Filtrar por ID do repositório")] = None,
) -> list[BountyModel]:
    """
    Retorna a listagem de bounties com filtros opcionais por status,
    projeto, hunter ou repositório.
    """
    bounties = await bounty_service.list_bounties(
        db,
        status=status,
        project_id=project_id,
        hunter_id=hunter_id,
        repository_id=repository_id,
    )
    return list(bounties)


@router.get(
    "/{bounty_id}",
    response_model=BountyOut,
    summary="Obter detalhes da bounty",
)
async def get_bounty(bounty_id: int, db: DbSession) -> BountyModel:
    """
    Retorna detalhes completos de uma bounty, incluindo issue, pontuação,
    transação Solana e lista de candidatos.
    """
    return await _get_bounty_or_404(db, bounty_id)


@router.post(
    "/{bounty_id}/apply",
    response_model=BountyApplicantOut,
    status_code=201,
    summary="Candidatar-se para resolver a issue",
)
async def apply_to_bounty(
    bounty_id: int,
    data: BountyApplicantCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> BountyApplicantModel:
    """
    Permite que um desenvolvedor submeta sua candidatura com uma proposta técnica
    para assumir a task.
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    applicant = await bounty_service.apply_to_bounty(
        session=db,
        bounty=bounty,
        hunter=current_user,
        proposal=data.proposal,
    )
    applicant.user = current_user
    return applicant


@router.get(
    "/{bounty_id}/applicants",
    response_model=list[BountyApplicantOut],
    summary="Listar candidatos da issue",
)
async def list_bounty_applicants(
    bounty_id: int,
    db: DbSession,
) -> list[BountyApplicantModel]:
    """Retorna a lista de desenvolvedores que se candidataram para trabalhar nesta issue."""
    await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.list_bounty_applicants(db, bounty_id)


@router.post(
    "/{bounty_id}/applicants/{applicant_id}/accept",
    response_model=BountyOut,
    summary="Aceitar candidato (Mantenedor ou Admin)",
)
async def accept_bounty_applicant(
    bounty_id: int,
    applicant_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> BountyModel:
    """
    Aprova a candidatura de um desenvolvedor, transicionando a bounty para ASSIGNED
    e congelando a recompensa.
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    await bounty_service.accept_bounty_applicant(
        session=db,
        bounty=bounty,
        applicant_id=applicant_id,
        actor=current_user,
    )
    return await _get_bounty_or_404(db, bounty_id)


@router.patch(
    "/{bounty_id}/reward",
    response_model=BountyOut,
    summary="Ajustar recompensa da issue (Invariante 2)",
)
async def update_bounty_reward(
    bounty_id: int,
    data: BountyRewardUpdate,
    current_user: CurrentUser,
    db: DbSession,
) -> BountyModel:
    """
    Permite ao mantenedor ou ADMIN ajustar a pontuação e valor da issue,
    válido apenas enquanto a bounty estiver OPEN.
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    await bounty_service.update_bounty_reward(
        session=db,
        bounty=bounty,
        actor=current_user,
        points=data.points,
    )
    return await _get_bounty_or_404(db, bounty_id)


@router.post(
    "/{bounty_id}/assign",
    response_model=BountyOut,
    summary="Atribuição direta (legado)",
)
async def assign_bounty(bounty_id: int, current_user: CurrentUser, db: DbSession) -> BountyModel:
    """
    Permite a auto-atribuição direta de um desenvolvedor caso o fluxo
    simplificado sem applicants seja utilizado.
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.assign_bounty(db, bounty, current_user)


@router.post(
    "/{bounty_id}/submit",
    response_model=BountyOut,
    summary="Enviar Pull Request de solução",
)
async def submit_bounty(
    bounty_id: int, data: BountySubmit, current_user: CurrentUser, db: DbSession
) -> BountyModel:
    """
    Registra a URL do Pull Request no GitHub aberto pelo desenvolvedor atribuído,
    transicionando para SUBMITTED.
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.submit_bounty(db, bounty, current_user, str(data.pr_url))


@router.post(
    "/{bounty_id}/complete",
    response_model=BountyOut,
    summary="Completar bounty e disparar liquidação on-chain",
)
async def complete_bounty(bounty_id: int, current_user: CurrentUser, db: DbSession) -> BountyModel:
    """
    Verifica se o PR foi mesclado (Invariante 1) e dispara a liquidação
    de USDC na Solana via biblioteca Solinpy.
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.complete_bounty(db, bounty, current_user)


@router.post(
    "/{bounty_id}/cancel",
    response_model=BountyStatusOut,
    summary="Cancelar bounty",
)
async def cancel_bounty(bounty_id: int, current_user: CurrentUser, db: DbSession) -> BountyModel:
    """Cancela a bounty caso ainda não tenha sido concluída (exclusivo para mantenedor ou ADMIN)."""
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.cancel_bounty(db, bounty, current_user)


@router.post(
    "/{bounty_id}/reject-submission",
    response_model=BountyOut,
    summary="Recusar solução submetida",
)
async def reject_submission(
    bounty_id: int, current_user: CurrentUser, db: DbSession
) -> BountyModel:
    """
    Recusa a solução enviada pelo desenvolvedor, revertendo o status
    para ASSIGNED para que o PR possa ser ajustado (mantenedor ou ADMIN).
    """
    bounty = await _get_bounty_or_404(db, bounty_id)
    return await bounty_service.reject_bounty_submission(db, bounty, current_user)

