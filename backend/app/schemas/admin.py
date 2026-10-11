from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class AdminStatsOut(BaseModel):
    total_projects: int = Field(..., description="Total de projetos cadastrados")
    total_repositories: int = Field(..., description="Total de repositórios GitHub rastreados")
    total_bounties: int = Field(..., description="Total de bounties criadas")
    bounties_by_status: dict[str, int] = Field(
        ...,
        description="Contagem de bounties por status",
        examples=[
            {
                "OPEN": 5,
                "ASSIGNED": 2,
                "SUBMITTED": 1,
                "CLAIMABLE": 3,
                "CLAIMED": 5,
                "CLAIM_FAILED": 0,
                "CANCELLED": 0,
            }
        ],
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


class FailedBountyApprovalOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bounty_id: int
    project_id: int
    issue_url: str
    issue_title: str | None = None
    status: str
    amount_usdc: int
    claim_error: str | None = None
    retry_count: int = 0
    last_retry_at: datetime | None = None
    hunter_id: int | None = None
    hunter_username: str | None = None
    hunter_wallet: str | None = None
    can_retry: bool = True
    next_retry_available_at: datetime | None = None


class BatchRetryResultOut(BaseModel):
    total_failed: int
    retried_count: int
    succeeded_count: int
    failed_count: int
    results: list[dict]
