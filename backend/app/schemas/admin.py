from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminStatsOut(BaseModel):
    total_projects: int = Field(..., description="Total de projetos cadastrados")
    total_repositories: int = Field(..., description="Total de repositórios GitHub rastreados")
    total_bounties: int = Field(..., description="Total de bounties criadas")
    bounties_by_status: dict[str, int] = Field(
        ...,
        description="Contagem de bounties por status",
        examples=[{"OPEN": 5, "ASSIGNED": 2, "SUBMITTED": 1, "COMPLETED": 8, "CANCELLED": 0}],
    )
    total_usdc_allocated: float = Field(
        ..., description="Total de capital em USDC alocado no tesouro"
    )
    total_usdc_paid: float = Field(
        ..., description="Total de recompensas em USDC liquidadas on-chain"
    )
    total_users: int = Field(..., description="Total de desenvolvedores e mantenedores")
    pending_submissions: int = Field(
        ..., description="Total de tarefas submetidas aguardando aprovação"
    )
    unrewarded_issues: int = Field(
        0, description="Total de issues detectadas aguardando definição de reward"
    )
    total_tracked_issues: int = Field(
        0, description="Total de issues monitoradas em repositórios cadastrados"
    )


class AdminProjectCreate(BaseModel):
    github_repo: str = Field(
        ...,
        description="Repositório GitHub no formato 'owner/repo'",
        examples=["solana-labs/solinpy-sdk"],
    )
    description: str | None = Field(None, description="Descrição do projeto")
    default_branch: str = Field("main", description="Branch padrão para tracking")
    owner_id: int | None = Field(None, description="ID do usuário proprietário (opcional)")


class AdminProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    github_repo: str
    description: str | None
    created_at: datetime
    total_repositories: int = 0
    total_issues: int = 0
    unrewarded_issues: int = 0
    bounties_count: int = 0


class ReviewSubmissionRequest(BaseModel):
    action: str = Field(
        ...,
        description="Ação de moderação: 'APPROVE' para concluir e pagar, ou 'REJECT' para negar",
        examples=["APPROVE", "REJECT"],
    )
    reason: str | None = Field(
        None,
        description="Justificativa técnica enviada ao desenvolvedor em caso de recusa",
        examples=["O PR precisa incluir testes unitários para a função de transferência."],
    )
    force_payout: bool = Field(
        False,
        description="Permite ao admin forçar a liquidação mesmo se o PR estiver em validação",
    )
