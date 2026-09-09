from fastapi import APIRouter, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import ForbiddenError, NotFoundError
from app.db.base import ProjectModel
from app.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate

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
    primário do usuário mantenedor.
    """
    project = ProjectModel(
        owner_id=current_user.id,
        github_repo=data.github_repo,
        description=data.description,
    )
    db.add(project)
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
