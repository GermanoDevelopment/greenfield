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
        .options(selectinload(ProjectModel.owner))
    )
    project = result.scalar_one_or_none()
    if project is None:
        raise NotFoundError("Project")
    return project


@router.post("", response_model=ProjectOut, status_code=201)
async def create_project(
    data: ProjectCreate, current_user: CurrentUser, db: DbSession
) -> ProjectModel:
    project = ProjectModel(
        owner_id=current_user.id,
        github_repo=data.github_repo,
        description=data.description,
    )
    db.add(project)
    await db.commit()
    await db.refresh(project, attribute_names=["owner"])
    return project


@router.get("", response_model=list[ProjectOut])
async def list_projects(
    db: DbSession, owner_id: int | None = Query(None), limit: int = 50, offset: int = 0
) -> list[ProjectModel]:
    stmt = (
        select(ProjectModel)
        .options(selectinload(ProjectModel.owner))
        .order_by(ProjectModel.created_at.desc())
        .limit(min(limit, 100))
        .offset(offset)
    )
    if owner_id is not None:
        stmt = stmt.where(ProjectModel.owner_id == owner_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: int, db: DbSession) -> ProjectModel:
    return await _get_project_or_404(db, project_id)


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int, data: ProjectUpdate, current_user: CurrentUser, db: DbSession
) -> ProjectModel:
    project = await _get_project_or_404(db, project_id)
    if project.owner_id != current_user.id:
        raise ForbiddenError("Only the project owner can update it")
    if data.description is not None:
        project.description = data.description
    await db.commit()
    await db.refresh(project, attribute_names=["owner"])
    return project


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: int, current_user: CurrentUser, db: DbSession) -> None:
    project = await _get_project_or_404(db, project_id)
    if project.owner_id != current_user.id:
        raise ForbiddenError("Only the project owner can delete it")
    await db.delete(project)
    await db.commit()
