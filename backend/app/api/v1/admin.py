from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentAdminUser, DbSession
from app.core.exceptions import ConflictError, NotFoundError
from app.db.base import BountyModel, ProjectModel, RepositoryModel
from app.schemas.admin import (
    AdminProjectCreate,
    AdminProjectOut,
    AdminStatsOut,
    ReviewSubmissionRequest,
)
from app.schemas.bounty import BountyOut, BountyStatus
from app.schemas.project import ProjectUpdate
from app.schemas.repository import RepositoryCreate, RepositoryOut
from app.schemas.tracked_issue import AssignRewardRequest, TrackedIssueOut
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


@router.get(
    "/projects",
    response_model=list[AdminProjectOut],
    summary="Listar projetos do ecossistema para administração",
)
async def admin_list_projects(
    _admin: CurrentAdminUser,
    db: DbSession,
) -> list[AdminProjectOut]:
    """Retorna todos os projetos cadastrados com métricas de repositórios, issues e bounties."""
    stmt = (
        select(ProjectModel)
        .options(
            selectinload(ProjectModel.repositories),
            selectinload(ProjectModel.tracked_issues),
            selectinload(ProjectModel.bounties),
        )
        .order_by(ProjectModel.created_at.desc())
    )
    result = await db.execute(stmt)
    projects = result.scalars().all()

    items: list[AdminProjectOut] = []
    for p in projects:
        repos_count = len(p.repositories)
        tracked = p.tracked_issues
        total_issues = len(tracked)
        unrewarded = sum(1 for ti in tracked if not ti.has_bounty and ti.state == "open")
        bounties_count = len(p.bounties)
        items.append(
            AdminProjectOut(
                id=p.id,
                owner_id=p.owner_id,
                github_repo=p.github_repo,
                description=p.description,
                created_at=p.created_at,
                total_repositories=repos_count,
                total_issues=total_issues,
                unrewarded_issues=unrewarded,
                bounties_count=bounties_count,
            )
        )
    return items


@router.post(
    "/projects",
    response_model=AdminProjectOut,
    status_code=201,
    summary="Cadastrar novo projeto e repositório principal (Admin)",
)
async def admin_create_project(
    data: AdminProjectCreate,
    admin: CurrentAdminUser,
    db: DbSession,
) -> AdminProjectOut:
    """
    Cadastra um novo projeto e vincula automaticamente o repositório principal informado.
    """
    cleaned = data.github_repo.strip().removeprefix("https://github.com/").strip("/")
    parts = cleaned.split("/")
    if len(parts) != 2 or not all(parts):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid github_repo format. Must be 'owner/repo'.",
        )
    owner, repo_name = parts[0], parts[1]

    existing_stmt = select(ProjectModel).where(ProjectModel.github_repo == cleaned)
    if (await db.execute(existing_stmt)).scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project with this repository already exists",
        )

    owner_id = data.owner_id if data.owner_id is not None else admin.id

    project = ProjectModel(
        owner_id=owner_id,
        github_repo=cleaned,
        description=data.description,
    )
    db.add(project)
    await db.flush()

    repo = RepositoryModel(
        project_id=project.id,
        github_owner=owner,
        github_name=repo_name,
        github_repo=cleaned,
        description=data.description,
        default_branch=data.default_branch,
        is_active=True,
    )
    db.add(repo)
    await db.commit()
    await db.refresh(project)

    return AdminProjectOut(
        id=project.id,
        owner_id=project.owner_id,
        github_repo=project.github_repo,
        description=project.description,
        created_at=project.created_at,
        total_repositories=1,
        total_issues=0,
        unrewarded_issues=0,
        bounties_count=0,
    )


@router.patch(
    "/projects/{project_id}",
    response_model=AdminProjectOut,
    summary="Atualizar dados de um projeto (Admin)",
)
async def admin_update_project(
    project_id: int,
    data: ProjectUpdate,
    _admin: CurrentAdminUser,
    db: DbSession,
) -> AdminProjectOut:
    """Atualiza metadados de um projeto cadastrado."""
    stmt = (
        select(ProjectModel)
        .where(ProjectModel.id == project_id)
        .options(
            selectinload(ProjectModel.repositories),
            selectinload(ProjectModel.tracked_issues),
            selectinload(ProjectModel.bounties),
        )
    )
    project = (await db.execute(stmt)).scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project")

    if data.description is not None:
        project.description = data.description
    await db.commit()
    await db.refresh(project)

    tracked = project.tracked_issues
    unrewarded = sum(1 for ti in tracked if not ti.has_bounty and ti.state == "open")

    return AdminProjectOut(
        id=project.id,
        owner_id=project.owner_id,
        github_repo=project.github_repo,
        description=project.description,
        created_at=project.created_at,
        total_repositories=len(project.repositories),
        total_issues=len(tracked),
        unrewarded_issues=unrewarded,
        bounties_count=len(project.bounties),
    )


@router.delete(
    "/projects/{project_id}",
    status_code=204,
    summary="Remover projeto (Admin)",
)
async def admin_delete_project(
    project_id: int,
    _admin: CurrentAdminUser,
    db: DbSession,
) -> None:
    """Remove o projeto e todos os seus vínculos em cascata."""
    project = await db.get(ProjectModel, project_id)
    if project is None:
        raise NotFoundError("Project")
    await db.delete(project)
    await db.commit()


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
    "/repositories/{repository_id}/sync",
    summary="Sincronizar issues do repositório via API do GitHub",
)
async def admin_sync_repository_issues(
    repository_id: int,
    _admin: CurrentAdminUser,
    db: DbSession,
) -> dict:
    """
    Varre a API do GitHub buscando issues abertas e registrando-as como
    TrackedIssues sem reward para moderação.
    """
    return await bounty_service.sync_repository_issues_from_github(db, repository_id)


@router.get(
    "/unrewarded-issues",
    response_model=list[TrackedIssueOut],
    summary="Listar issues rastreadas pendentes de definição de recompensa",
)
async def admin_list_unrewarded_issues(
    _admin: CurrentAdminUser,
    db: DbSession,
    repository_id: int | None = None,
    project_id: int | None = None,
) -> list[TrackedIssueOut]:
    """Retorna todas as issues abertas dos repositórios que ainda não viraram bounties."""
    issues = await bounty_service.list_unrewarded_issues(
        session=db,
        repository_id=repository_id,
        project_id=project_id,
    )
    return [TrackedIssueOut.from_model(issue) for issue in issues]


@router.post(
    "/unrewarded-issues/{issue_id}/assign-reward",
    response_model=BountyOut,
    status_code=201,
    summary="Definir recompensa para uma issue e publicá-la como grant/bounty",
)
async def admin_assign_reward_to_issue(
    issue_id: int,
    data: AssignRewardRequest,
    admin: CurrentAdminUser,
    db: DbSession,
) -> BountyModel:
    """
    Atribui pontuação à issue rastreada e a publica imediatamente como um
    Bounty no estado OPEN, disponível publicamente no mural de grants.
    """
    bounty = await bounty_service.assign_reward_to_tracked_issue(
        session=db,
        issue_id=issue_id,
        points=data.points,
        admin_user=admin,
    )
    return await bounty_service.get_bounty(db, bounty.id)



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
