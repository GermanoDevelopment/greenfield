from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError, ValidationError
from app.db.base import ProjectModel, RepositoryModel
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from app.services import github_service

router = APIRouter(prefix="/projects", tags=["projects"])


async def _get_project_or_404(db: DbSession, project_id: int) -> ProjectModel:
    result = await db.execute(
        select(ProjectModel)
        .where(ProjectModel.id == project_id)
        .options(
            selectinload(ProjectModel.owner),
            selectinload(ProjectModel.repositories),
        )
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project")
    return project


@router.post(
    "",
    response_model=ProjectOut,
    status_code=201,
    summary="Criar novo projeto",
)
async def create_project(
    data: ProjectCreate, current_user: CurrentUser, db: DbSession
) -> ProjectModel:
    """
    Registra um novo projeto no Greenfield associado a um repositório GitHub
    primário do usuário mantenedor após validação de propriedade.
    """
    cleaned = data.github_repo.strip().removeprefix("https://github.com/").strip("/")
    parts = cleaned.split("/")
    if len(parts) != 2 or not all(parts):
        raise ValidationError("Invalid github_repo format. Must be 'owner/repo'.")
    owner, repo_name = parts[0], parts[1]

    # Verify repository exists and metadata via GitHub API
    repo_details = await github_service.fetch_repository_details(owner, repo_name)
    if repo_details is None:
        raise NotFoundError(f"GitHub repository '{cleaned}'")

    # Verify ownership or admin permission
    is_owner = github_service.check_repository_ownership(repo_details, current_user.username)
    if not is_owner and current_user.role != "ADMIN":
        raise ForbiddenError(f"You do not own or administer the repository '{cleaned}'")

    # Check for duplicate project
    existing = await db.execute(select(ProjectModel).where(ProjectModel.github_repo == cleaned))
    if existing.scalar_one_or_none():
        raise ConflictError(f"Project for repository '{cleaned}' is already registered")

    project = ProjectModel(
        owner_id=current_user.id,
        github_repo=cleaned,
        description=data.description or repo_details.get("description"),
    )
    db.add(project)
    await db.flush()

    repo = RepositoryModel(
        project_id=project.id,
        github_owner=repo_details["owner"],
        github_name=repo_details["name"],
        github_repo=cleaned,
        github_repo_id=repo_details.get("github_repo_id"),
        description=repo_details.get("description"),
        default_branch=repo_details.get("default_branch", "main"),
        is_active=True,
    )
    db.add(repo)

    # Automatically promote contributor to MAINTAINER role
    if current_user.role == "CONTRIBUTOR":
        current_user.role = "MAINTAINER"
        db.add(current_user)

    await db.commit()
    await db.refresh(project, attribute_names=["owner", "repositories"])
    return project


@router.get(
    "",
    response_model=list[ProjectOut],
    summary="Listar projetos",
)
async def list_projects(
    db: DbSession,
    owner_id: int | None = Query(
        None, description="Filtrar projetos por ID do mantenedor proprietário"
    ),
    limit: int = Query(50, ge=1, le=100, description="Limite de registros retornados"),
    offset: int = Query(0, ge=0, description="Deslocamento para paginação"),
) -> list[ProjectModel]:
    """Lista projetos cadastrados na plataforma com seus respectivos repositórios vinculados."""
    stmt = (
        select(ProjectModel)
        .options(
            selectinload(ProjectModel.owner),
            selectinload(ProjectModel.repositories),
        )
        .order_by(ProjectModel.created_at.desc())
        .limit(min(limit, 100))
        .offset(offset)
    )
    if owner_id is not None:
        stmt = stmt.where(ProjectModel.owner_id == owner_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get(
    "/{project_id}",
    response_model=ProjectOut,
    summary="Obter detalhes do projeto",
)
async def get_project(project_id: int, db: DbSession) -> ProjectModel:
    """
    Consulta os detalhes de um projeto específico, incluindo dados do mantenedor
    e lista de repositórios vinculados.
    """
    return await _get_project_or_404(db, project_id)


@router.patch(
    "/{project_id}",
    response_model=ProjectOut,
    summary="Atualizar projeto",
)
async def update_project(
    project_id: int, data: ProjectUpdate, current_user: CurrentUser, db: DbSession
) -> ProjectModel:
    """
    Permite que o mantenedor proprietário ou um usuário com role ADMIN
    atualize a descrição do projeto.
    """
    project = await _get_project_or_404(db, project_id)
    if project.owner_id != current_user.id and current_user.role != "ADMIN":
        raise ForbiddenError("Only the project owner or an admin can update it")
    if data.description is not None:
        project.description = data.description
    await db.commit()
    await db.refresh(project, attribute_names=["owner", "repositories"])
    return project


@router.delete(
    "/{project_id}",
    status_code=204,
    summary="Excluir projeto",
)
async def delete_project(project_id: int, current_user: CurrentUser, db: DbSession) -> None:
    """
    Remove o projeto e todos os seus repositórios vinculados em cascata
    (restrito ao dono ou ADMIN).
    """
    project = await _get_project_or_404(db, project_id)
    if project.owner_id != current_user.id and current_user.role != "ADMIN":
        raise ForbiddenError("Only the project owner or an admin can delete it")
    await db.delete(project)
    await db.commit()
