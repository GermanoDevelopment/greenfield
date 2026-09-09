from enum import StrEnum

import base58
from pydantic import BaseModel, ConfigDict, Field, field_validator


class UserRole(StrEnum):
    ADMIN = "ADMIN"
    MAINTAINER = "MAINTAINER"
    CONTRIBUTOR = "CONTRIBUTOR"


def validate_solana_wallet(wallet: str) -> str:
    try:
        decoded = base58.b58decode(wallet)
    except ValueError as e:
        raise ValueError("Invalid Solana wallet address (bad base58)") from e
    if len(decoded) != 32:
        raise ValueError("Invalid Solana wallet address (must decode to 32 bytes)")
    return wallet


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Identificador único do usuário no Greenfield", examples=[1])
    github_id: int = Field(description="ID numérico da conta no GitHub", examples=[12345678])
    username: str = Field(
        description="Username do usuário no GitHub", examples=["GermanoDevelopment"]
    )
    avatar_url: str | None = Field(
        default=None,
        description="URL do avatar no GitHub",
        examples=["https://avatars.githubusercontent.com/u/12345678?v=4"],
    )
    wallet: str | None = Field(
        default=None,
        description="Endereço de carteira Solana (base58 de 32 bytes) para recebimento de payouts",
        examples=["9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"],
    )
    role: UserRole = Field(
        default=UserRole.CONTRIBUTOR,
        description="Papel do usuário no ecossistema (ADMIN, MAINTAINER, CONTRIBUTOR)",
        examples=[UserRole.CONTRIBUTOR],
    )


class UserUpdate(BaseModel):
    wallet: str = Field(
        description="Endereço de carteira Solana (base58 de 32 bytes) válido",
        examples=["9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"],
    )

    @field_validator("wallet")
    @classmethod
    def wallet_is_valid(cls, v: str) -> str:
        return validate_solana_wallet(v)


class UserRoleUpdate(BaseModel):
    role: UserRole = Field(
        description="Novo papel a ser atribuído ao usuário",
        examples=[UserRole.MAINTAINER],
    )


class UserPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Identificador único do usuário", examples=[1])
    username: str = Field(description="Username do GitHub", examples=["GermanoDevelopment"])
    avatar_url: str | None = Field(
        default=None,
        description="Avatar do GitHub",
        examples=["https://avatars.githubusercontent.com/u/12345678?v=4"],
    )
    wallet: str | None = Field(
        default=None,
        description="Endereço público da carteira Solana",
        examples=["9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"],
    )
    role: UserRole = Field(
        default=UserRole.CONTRIBUTOR,
        description="Papel do usuário",
        examples=[UserRole.CONTRIBUTOR],
    )
