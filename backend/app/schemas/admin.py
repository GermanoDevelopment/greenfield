from pydantic import BaseModel, Field


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
