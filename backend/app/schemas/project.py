from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.user import UserPublicOut


class ProjectBase(BaseModel):
    github_repo: str
    description: str | None = None

    @field_validator("github_repo")
    @classmethod
    def validate_repo(cls, v: str) -> str:
        v = v.strip().removeprefix("https://github.com/").strip("/")
        parts = v.split("/")
        if len(parts) != 2 or not all(parts):
            raise ValueError("github_repo must be in 'owner/repo' format")
        return v


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    description: str | None = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    owner: UserPublicOut | None = None
    created_at: datetime
    updated_at: datetime
