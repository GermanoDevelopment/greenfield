from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RepositoryCreate(BaseModel):
    github_repo: str = Field(
        description="Repositório no formato 'owner/repo'",
        examples=["GermanoDevelopment/greenfield-contracts"],
    )
    description: str | None = Field(
        default=None,
        description="Descrição ou propósito do repositório",
        examples=["Smart contracts Anchor do Greenfield"],
    )
    default_branch: str = Field(
        default="main",
        description="Branch padrão do repositório no GitHub",
        examples=["main"],
    )


class RepositoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Identificador único do repositório", examples=[1])
    project_id: int = Field(
        description="ID do projeto pai ao qual este repositório pertence", examples=[1]
    )
    github_owner: str = Field(
        description="Owner ou organização do GitHub", examples=["GermanoDevelopment"]
    )
    github_name: str = Field(
        description="Nome do repositório no GitHub", examples=["greenfield-contracts"]
    )
    github_repo: str = Field(
        description="Caminho canônico 'owner/repo'",
        examples=["GermanoDevelopment/greenfield-contracts"],
    )
    github_repo_id: int | None = Field(
        default=None, description="ID numérico retornado pela API do GitHub"
    )
    description: str | None = Field(default=None, description="Descrição do repositório")
    default_branch: str = Field(default="main", description="Branch principal")
    is_active: bool = Field(
        default=True, description="Indica se o repositório está ativo para rastreamento"
    )
    created_at: datetime = Field(description="Data de cadastro do repositório")
    updated_at: datetime = Field(description="Data da última modificação")


class GitHubIssueOut(BaseModel):
    number: int = Field(description="Número sequencial da issue (#123)", examples=[42])
    title: str = Field(
        description="Título da issue no GitHub",
        examples=["Otimizar cálculo de taxas no programa Anchor"],
    )
    body: str | None = Field(
        default=None, description="Corpo / descrição da issue (sem comentários)"
    )
    html_url: str = Field(
        description="URL direta da issue no GitHub",
        examples=["https://github.com/org/repo/issues/42"],
    )
    state: str = Field(description="Estado da issue no GitHub (open ou closed)", examples=["open"])
    author_username: str | None = Field(
        default=None, description="Login do criador da issue", examples=["octocat"]
    )
    labels: list[str] = Field(
        default=[],
        description="Lista de labels atribuídas à issue no GitHub",
        examples=[["bug", "solana"]],
    )
    has_bounty: bool = Field(
        default=False,
        description="Indica se esta issue já foi monetizada como bounty no Greenfield",
    )
    bounty_id: int | None = Field(
        default=None, description="ID da bounty vinculada no Greenfield (se houver)", examples=[10]
    )
    bounty_status: str | None = Field(
        default=None,
        description="Status da bounty vinculada (OPEN, ASSIGNED, etc.)",
        examples=["OPEN"],
    )
    bounty_points: int | None = Field(
        default=None, description="Pontos atribuídos à bounty vinculada", examples=[500]
    )
