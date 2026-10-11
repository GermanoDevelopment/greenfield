from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_JWT_SECRET = "supersecretjwtkey_change_in_production"
DEFAULT_DATABASE_URL = "postgresql+asyncpg://greenfield:greenfield@localhost:5432/greenfield"
DEV_ENVIRONMENTS = {"development", "dev", "local", "test"}
MIN_JWT_SECRET_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    port: int = 8080
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    frontend_url: str = "http://localhost:5173"

    database_url: str = DEFAULT_DATABASE_URL

    jwt_secret: str = DEFAULT_JWT_SECRET
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 60 * 24

    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8080/api/v1/auth/github/callback"
    github_webhook_secret: str = ""
    github_token: str | None = None
    enable_dev_login: bool = False

    solana_rpc_url: str = "https://api.devnet.solana.com"
    solana_cluster: str = "devnet"
    solana_program_id: str = ""
    usdc_mint: str | None = None
    usdc_mint_mainnet: str = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    usdc_mint_devnet: str = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
    solana_treasury_keypair_path: str | None = None
    solana_treasury_private_key: str | None = None
    solana_authority_secret_key: str = ""

    @property
    def current_usdc_mint(self) -> str:
        if self.usdc_mint:
            return self.usdc_mint
        cluster = self.solana_cluster.lower()
        rpc = self.solana_rpc_url.lower()
        if "mainnet" in cluster or "mainnet" in rpc:
            return self.usdc_mint_mainnet
        return self.usdc_mint_devnet

    admin_github_usernames: list[str] = []

    rate_limit_enabled: bool = True
    rate_limit_auth_per_minute: int = 10
    rate_limit_webhook_per_minute: int = 120
    rate_limit_github_per_minute: int = 30
    login_max_failures: int = 5
    login_lockout_minutes: int = 15

    @property
    def is_dev(self) -> bool:
        return self.environment.strip().lower() in DEV_ENVIRONMENTS

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


class ConfigurationError(RuntimeError):
    pass


def validate_settings(settings: Settings) -> None:
    """Falha na inicialização, fora de dev, se segredos estiverem vazios ou no padrão."""
    if settings.is_dev:
        return
    problems = []
    if (
        settings.jwt_secret == DEFAULT_JWT_SECRET
        or len(settings.jwt_secret) < MIN_JWT_SECRET_LENGTH
    ):
        problems.append(
            f"JWT_SECRET must be set to a random value of at least {MIN_JWT_SECRET_LENGTH} chars"
        )
    if not settings.github_webhook_secret:
        problems.append("GITHUB_WEBHOOK_SECRET must be set")
    if settings.database_url == DEFAULT_DATABASE_URL:
        problems.append("DATABASE_URL must not use the default development credentials")
    if bool(settings.github_client_id) != bool(settings.github_client_secret):
        problems.append("GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must be set together")
    if problems:
        raise ConfigurationError(
            f"Invalid configuration for ENVIRONMENT={settings.environment!r}: "
            + "; ".join(problems)
        )
