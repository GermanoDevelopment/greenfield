from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator

from app.schemas.user import UserPublicOut, validate_solana_wallet


class BountyStatus(StrEnum):
    OPEN = "OPEN"
    ASSIGNED = "ASSIGNED"
    SUBMITTED = "SUBMITTED"
    COMPLETED = "COMPLETED"
    CLAIMED = "CLAIMED"
    CANCELLED = "CANCELLED"


# Valid transitions of the bounty state machine
BOUNTY_TRANSITIONS: dict[BountyStatus, set[BountyStatus]] = {
    BountyStatus.OPEN: {BountyStatus.ASSIGNED, BountyStatus.CANCELLED},
    BountyStatus.ASSIGNED: {BountyStatus.SUBMITTED, BountyStatus.CANCELLED},
    BountyStatus.SUBMITTED: {BountyStatus.COMPLETED, BountyStatus.ASSIGNED, BountyStatus.CANCELLED},
    BountyStatus.COMPLETED: {BountyStatus.CLAIMED},
    BountyStatus.CLAIMED: set(),
    BountyStatus.CANCELLED: set(),
}


class BountyCreate(BaseModel):
    project_id: int = Field(
        description="ID do projeto ao qual o bounty pertence",
        examples=[1],
    )
    repository_id: int | None = Field(
        default=None,
        description="ID do repositório específico (se o projeto tiver múltiplos repositórios)",
        examples=[1],
    )
    issue_url: HttpUrl = Field(
        description="URL canônica da issue no GitHub",
        examples=["https://github.com/GermanoDevelopment/greenfield/issues/42"],
    )
    points: int = Field(
        gt=0,
        default=100,
        description="Pontuação da issue (100 pontos = $1 USDC = 1.000.000 micro-USDC)",
        examples=[500],
    )
    amount_usdc: int | None = Field(
        default=None,
        description="Valor em micro-USDC (se omitido, calcula automaticamente: points * 10_000)",
        examples=[5000000],
    )
    issue_number: int | None = Field(
        default=None,
        description="Número da issue no GitHub (auto-extraído se omitido)",
        examples=[42],
    )
    issue_title: str | None = Field(
        default=None,
        description="Título da issue (auto-extraído via GitHub se omitido)",
        examples=["Otimizar persistência de dados"],
    )
    issue_body: str | None = Field(
        default=None,
        description="Descrição da issue sem comentários",
    )
    escrow_pda: str | None = Field(
        default=None,
        description="Endereço PDA do escrow on-chain na Solana (opcional)",
        examples=["9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"],
    )

    @field_validator("escrow_pda")
    @classmethod
    def escrow_pda_is_valid(cls, v: str | None) -> str | None:
        return validate_solana_wallet(v) if v is not None else None


class BountySubmit(BaseModel):
    pr_url: HttpUrl = Field(
        description="URL do Pull Request no GitHub aberto para resolver a issue",
        examples=["https://github.com/GermanoDevelopment/greenfield/pull/88"],
    )


class ApplicantStatus(StrEnum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"


class BountyApplicantCreate(BaseModel):
    proposal: str | None = Field(
        default=None,
        max_length=2048,
        description="Proposta técnica do desenvolvedor e estimativa de entrega",
        examples=["Tenho experiência com essa stack e pretendo entregar a solução em 2 dias."],
    )


class BountyApplicantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Identificador único da candidatura", examples=[1])
    bounty_id: int = Field(description="ID da bounty", examples=[10])
    user_id: int = Field(description="ID do desenvolvedor candidato", examples=[2])
    status: ApplicantStatus = Field(
        description="Status da candidatura (PENDING, ACCEPTED, REJECTED, WITHDRAWN)",
        examples=[ApplicantStatus.PENDING],
    )
    proposal: str | None = Field(default=None, description="Mensagem de proposta do candidato")
    created_at: datetime = Field(description="Data da candidatura")
    updated_at: datetime = Field(description="Data de atualização da candidatura")
    user: UserPublicOut | None = Field(default=None, description="Dados públicos do candidato")


class BountyRewardUpdate(BaseModel):
    points: int = Field(
        gt=0,
        description="Nova pontuação da issue (Invariante 2: alterável apenas em status OPEN)",
        examples=[1000],
    )


class BountyClaimSubmit(BaseModel):
    """Submetido pelo desenvolvedor ao assinar a transação de claim on-chain."""
    tx_signature: str = Field(
        min_length=64,
        max_length=128,
        description="Assinatura da transação Solana Devnet",
    )


class BountyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Identificador único da bounty", examples=[1])
    project_id: int = Field(description="ID do projeto", examples=[1])
    repository_id: int | None = Field(
        default=None, description="ID do repositório vinculado", examples=[1]
    )
    issuer_id: int = Field(description="ID do mantenedor criador da bounty", examples=[1])
    hunter_id: int | None = Field(
        default=None, description="ID do desenvolvedor assumido/atribuído", examples=[2]
    )
    issue_url: str = Field(
        description="URL da issue no GitHub", examples=["https://github.com/org/repo/issues/42"]
    )
    issue_number: int | None = Field(
        default=None, description="Número da issue no GitHub", examples=[42]
    )
    issue_title: str | None = Field(
        default=None, description="Título da issue", examples=["Implementar cache"]
    )
    issue_body: str | None = Field(default=None, description="Descrição da issue")
    pr_url: str | None = Field(
        default=None,
        description="URL do Pull Request enviado",
        examples=["https://github.com/org/repo/pull/88"],
    )
    points: int = Field(default=100, description="Pontos atribuídos à issue", examples=[500])
    amount_usdc: int = Field(
        description="Valor em micro-USDC (1 USDC = 1.000.000)", examples=[5000000]
    )
    status: BountyStatus = Field(
        description="Status atual do bounty (OPEN, ASSIGNED, SUBMITTED, COMPLETED, CLAIMED)",
        examples=[BountyStatus.OPEN],
    )
    escrow_pda: str | None = Field(default=None, description="Endereço PDA do escrow on-chain")
    tx_signature: str | None = Field(
        default=None,
        description="Assinatura da transação de pagamento on-chain na Solana (Solana Explorer)",
        examples=["5J7XQ8..."],
    )
    claim_signature: str | None = Field(
        default=None,
        description="Assinatura da transação on-chain reportada pelo claim",
    )
    claimed_at: datetime | None = Field(
        default=None, description="Data e hora da liquidação on-chain"
    )
    created_at: datetime = Field(description="Data de criação da bounty")
    updated_at: datetime = Field(description="Data da última modificação")
    issuer: UserPublicOut | None = Field(default=None, description="Dados do mantenedor")
    hunter: UserPublicOut | None = Field(
        default=None, description="Dados do desenvolvedor atribuído"
    )
    applicants: list[BountyApplicantOut] = Field(
        default=[], description="Lista de candidatos tentando resolver a issue"
    )

    @field_validator("issue_url", "pr_url", mode="before")
    @classmethod
    def url_to_str(cls, v):
        return str(v) if v is not None else None


class BountyStatusOut(BaseModel):
    id: int = Field(description="ID da bounty", examples=[1])
    status: BountyStatus = Field(
        description="Novo status da bounty", examples=[BountyStatus.CANCELLED]
    )
