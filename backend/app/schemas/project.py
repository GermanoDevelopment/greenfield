from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.schemas.repository import RepositoryOut
from app.schemas.user import UserPublicOut


class ProjectBase(BaseModel):
    github_repo: str = Field(
        description="Repositório principal do projeto no formato 'owner/repo'",
        examples=["GermanoDevelopment/greenfield"],
    )
    description: str | None = Field(
        default=None,
        description="Descrição detalhada do projeto ou ecossistema",
        examples=["Ecossistema de recompensas para desenvolvedores na Solana"],
    )

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
    description: str | None = Field(
        default=None,
        description="Atualização da descrição do projeto",
        examples=["Nova descrição atualizada do ecossistema"],
    )


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Identificador único do projeto", examples=[1])
    owner_id: int = Field(
        description="ID do usuário mantenedor proprietário do projeto", examples=[1]
    )
    owner: UserPublicOut | None = Field(default=None, description="Dados públicos do mantenedor")
    repositories: list[RepositoryOut] = Field(
        default=[],
        description="Lista de múltiplos repositórios GitHub monitorados sob este projeto",
    )
    created_at: datetime = Field(description="Data e hora de criação do projeto")
    updated_at: datetime = Field(description="Data e hora da última atualização do projeto")
