from fastapi import APIRouter, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import NotFoundError, ValidationError
from app.core.security import create_access_token
from app.db.base import UserModel
from app.schemas.auth import TokenResponse
from app.schemas.user import UserOut
from app.services import github_service
from app.services.github_service import GitHubServiceError

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthConfigOut(BaseModel):
    github_oauth_configured: bool


class DevLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=255)


@router.get(
    "/config",
    response_model=AuthConfigOut,
    summary="Verifica configuração de autenticação",
)
async def auth_config() -> AuthConfigOut:
    settings = get_settings()
    return AuthConfigOut(
        github_oauth_configured=bool(settings.github_client_id and settings.github_client_secret)
    )


@router.get(
    "/github/login",
    summary="Iniciar login com GitHub",
    response_class=RedirectResponse,
    status_code=307,
)
async def github_login(
    state: str | None = Query(None, description="Estado de segurança CSRF opcional"),
) -> RedirectResponse:
    """Redireciona o navegador do usuário para a página de autorização OAuth do GitHub."""
    login_url = await github_service.build_login_url(state)
    return RedirectResponse(login_url)


async def _upsert_github_user(db: AsyncSession, gh_user: dict) -> UserModel:
    settings = get_settings()
    is_admin = gh_user["username"] in settings.admin_github_usernames

    result = await db.execute(select(UserModel).where(UserModel.github_id == gh_user["github_id"]))
    user = result.scalar_one_or_none()
    if user is None:
        user = UserModel(
            github_id=gh_user["github_id"],
            username=gh_user["username"],
            avatar_url=gh_user.get("avatar_url"),
            role="ADMIN" if is_admin else "CONTRIBUTOR",
        )
        db.add(user)
    else:
        user.username = gh_user["username"]
        user.avatar_url = gh_user.get("avatar_url")
        if is_admin:
            user.role = "ADMIN"
    await db.commit()
    await db.refresh(user)
    return user


@router.get(
    "/github/callback",
    summary="Callback do GitHub OAuth",
)
async def github_callback(
    request: Request,
    db: DbSession,
    code: str | None = Query(None, description="Código temporário fornecido pelo GitHub OAuth"),
    error: str | None = Query(None, description="Mensagem de erro enviada pelo GitHub caso negado"),
):
    """Processa autorização do GitHub OAuth e retorna o token JWT."""
    settings = get_settings()
    frontend_callback = f"{settings.frontend_url.rstrip('/')}/auth/callback"

    if error:
        if "application/json" in request.headers.get("accept", ""):
            raise ValidationError(f"GitHub OAuth error: {error}")
        return RedirectResponse(f"{frontend_callback}?error={error}")

    if not code:
        if "application/json" in request.headers.get("accept", ""):
            raise ValidationError("Missing 'code' query parameter")
        return RedirectResponse(f"{frontend_callback}?error=missing_code")

    try:
        access_token = await github_service.exchange_code_for_token(code)
        gh_user = await github_service.get_authenticated_user(access_token)
    except GitHubServiceError as e:
        if "application/json" in request.headers.get("accept", ""):
            raise ValidationError(str(e)) from e
        return RedirectResponse(f"{frontend_callback}?error={e}")

    user = await _upsert_github_user(db, gh_user)
    token = create_access_token(user.id, user.username)

    if "application/json" in request.headers.get("accept", ""):
        return TokenResponse(access_token=token, user=UserOut.model_validate(user))
    return RedirectResponse(f"{frontend_callback}?token={token}")


@router.post("/dev-login", response_model=TokenResponse, summary="Login direto de desenvolvimento")
async def dev_login(data: DevLoginRequest, db: DbSession) -> TokenResponse:
    """Login rápido para desenvolvimento e demonstrações locais sem requisições ao GitHub."""
    settings = get_settings()
    if settings.github_client_id and settings.github_client_secret:
        raise NotFoundError("Route")

    username = data.username.strip()
    if not username:
        raise ValidationError("username must not be blank")

    fake_github_id = -abs(hash(username)) % (2**31)

    result = await db.execute(select(UserModel).where(UserModel.github_id == fake_github_id))
    user = result.scalar_one_or_none()
    is_admin = username in settings.admin_github_usernames

    if user is None:
        user = UserModel(
            github_id=fake_github_id,
            username=username,
            role="ADMIN" if is_admin else "CONTRIBUTOR",
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    token = create_access_token(user.id, user.username)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get(
    "/me",
    response_model=UserOut,
    summary="Obter usuário autenticado",
)
async def me(current_user: CurrentUser) -> UserModel:
    """Retorna os dados cadastrais, role e carteira Solana do usuário autenticado pelo JWT."""
    return current_user
