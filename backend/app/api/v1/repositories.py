from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import BountyModel, ProjectModel, RepositoryModel
from app.schemas.repository import GitHubIssueOut, RepositoryCreate, RepositoryOut
from app.services import github_service

router = APIRouter(tags=["repositories"])


async def _get_project_or_404(db: DbSession, project_id: int) -> ProjectModel:
    project = await db.get(ProjectModel, project_id)
    if project is None:
        raise NotFoundError("Project")
    return project


async def _get_repository_or_404(db: DbSession, repository_id: int) -> RepositoryModel:
    repo = await db.get(RepositoryModel, repository_id)
    if repo is None:
        raise NotFoundError("Repository")
    return repo


@router.post(
    "/projects/{project_id}/repositories",
    response_model=RepositoryOut,
    status_code=201,
    summary="Adicionar repositório ao projeto",
)
async def add_repository_to_project(
    project_id: int,
    data: RepositoryCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> RepositoryModel:
    """
    Cadastra um novo repositório GitHub para rastreamento sob o projeto
    (exclusivo para o dono ou ADMIN).
    """
    project = await _get_project_or_404(db, project_id)
    if project.owner_id != current_user.id and current_user.role != "ADMIN":
        raise ForbiddenError("Only the project owner or an admin can add repositories")

    cleaned = data.github_repo.strip().removeprefix("https://github.com/").strip("/")
    parts = cleaned.split("/")
    if len(parts) != 2 or not all(parts):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid github_repo format. Must be 'owner/repo'.",
        )
    owner, repo_name = parts[0], parts[1]

    # Check duplication in this project
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


@router.get(
    "/projects/{project_id}/repositories",
    response_model=list[RepositoryOut],
    summary="Listar repositórios do projeto",
)
async def list_project_repositories(
    project_id: int,
    db: DbSession,
) -> list[RepositoryModel]:
    """Retorna todos os repositórios GitHub vinculados a um determinado projeto."""
    await _get_project_or_404(db, project_id)
    stmt = (
        select(RepositoryModel)
        .where(RepositoryModel.project_id == project_id)
        .order_by(RepositoryModel.created_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/repositories/{repository_id}",
    response_model=RepositoryOut,
    summary="Obter detalhes de repositório",
)
async def get_repository(
    repository_id: int,
    db: DbSession,
) -> RepositoryModel:
    """Consulta as informações detalhadas de um repositório cadastrado."""
    return await _get_repository_or_404(db, repository_id)


@router.delete(
    "/repositories/{repository_id}",
    status_code=204,
    summary="Remover repositório",
)
async def delete_repository(
    repository_id: int,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """
    Desvincula e remove um repositório GitHub do projeto
    (exclusivo para o dono ou ADMIN).
    """
    repo = await _get_repository_or_404(db, repository_id)
    project = await _get_project_or_404(db, repo.project_id)
    if project.owner_id != current_user.id and current_user.role != "ADMIN":
        raise ForbiddenError("Only the project owner or an admin can delete repositories")
    await db.delete(repo)
    await db.commit()


@router.get(
    "/repositories/{repository_id}/issues",
    response_model=list[GitHubIssueOut],
    summary="Listar issues do repositório para monetização",
)
async def list_repository_issues_for_tracking(
    repository_id: int,
    db: DbSession,
) -> list[GitHubIssueOut]:
    """
    Consulta as issues abertas na API do GitHub (sem comentários)
    e indica se já foram monetizadas na plataforma.
    """
    repo = await _get_repository_or_404(db, repository_id)

    raw_issues = await github_service.fetch_repository_issues(
        owner=repo.github_owner,
        repo=repo.github_name,
    )

    # Fetch active bounties for this repository to correlate
    stmt = select(BountyModel).where(
        (BountyModel.repository_id == repository_id) | (BountyModel.project_id == repo.project_id)
    )
    bounties = (await db.execute(stmt)).scalars().all()
    bounty_by_num = {b.issue_number: b for b in bounties if b.issue_number is not None}
    bounty_by_url = {b.issue_url: b for b in bounties}

    results: list[GitHubIssueOut] = []
    for issue in raw_issues:
        matched_bounty = bounty_by_num.get(issue["number"]) or bounty_by_url.get(issue["html_url"])
        results.append(
            GitHubIssueOut(
                number=issue["number"],
                title=issue["title"],
                body=issue["body"],
                html_url=issue["html_url"],
                state=issue["state"],
                author_username=issue["author_username"],
                labels=issue["labels"],
                has_bounty=matched_bounty is not None,
                bounty_id=matched_bounty.id if matched_bounty else None,
                bounty_status=matched_bounty.status if matched_bounty else None,
                bounty_points=matched_bounty.points if matched_bounty else None,
            )
        )
    return results
