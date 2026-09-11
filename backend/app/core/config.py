from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    port: int = 8080
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    database_url: str = "postgresql+asyncpg://greenfield:greenfield@localhost:5432/greenfield"

    jwt_secret: str = "supersecretjwtkey_change_in_production"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24

    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8080/api/v1/auth/github/callback"
    github_webhook_secret: str = ""
    github_token: str | None = None

    solana_rpc_url: str = "https://api.devnet.solana.com"
    solana_program_id: str = ""
    usdc_mint_devnet: str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    solana_treasury_keypair_path: str | None = None
    solana_treasury_private_key: str | None = None

    admin_github_usernames: list[str] = ["GermanoDevelopment"]

    @property
    def database_url_sync(self) -> str:
        return self.database_url.replace("+asyncpg", "")


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    settings.database_url = _normalize_database_url(settings.database_url)
    return settings


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url
