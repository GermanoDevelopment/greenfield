import base58
from pydantic import BaseModel, ConfigDict, field_validator


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

    id: int
    github_id: int
    username: str
    avatar_url: str | None = None
    wallet: str | None = None


class UserUpdate(BaseModel):
    wallet: str

    @field_validator("wallet")
    @classmethod
    def wallet_is_valid(cls, v: str) -> str:
        return validate_solana_wallet(v)


class UserPublicOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    avatar_url: str | None = None
    wallet: str | None = None
