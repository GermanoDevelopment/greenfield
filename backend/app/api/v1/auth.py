import hashlib

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import (
    AuthenticationError,
    ConflictError,
    NotFoundError,
    ValidationError,
)
from app.core.rate_limit import auth_rate_limit, login_lockout
from app.core.security import (
    create_access_token,
    generate_oauth_state,
    hash_password,
    verify_oauth_state,
    verify_password,
)
from app.db.base import UserModel
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserOut
from app.services import github_service
from app.services.github_service import GitHubServiceError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
    dependencies=[Depends(auth_rate_limit)],
    response_model=TokenResponse,
    summary="Login com e-mail e senha",
)
async def login(
    db: DbSession,
    payload: LoginRequest,
) -> TokenResponse:
    """
    Autentica um usuário ou administrador utilizando e-mail e senha.
    Retorna o token JWT Bearer e os dados cadastrais do usuário autenticado.
    """
    norm_email = payload.email.strip().lower()
    login_lockout.check(norm_email)
    stmt = select(UserModel).where(func.lower(UserModel.email) == norm_email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if (
        user is None
        or not user.password_hash
        or not verify_password(payload.password, user.password_hash)
    ):
        login_lockout.record_failure(norm_email)
        raise AuthenticationError("E-mail ou senha incorretos")
    login_lockout.record_success(norm_email)

    token = create_access_token(user.id, user.username, email=user.email, role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post(
    "/register",
    dependencies=[Depends(auth_rate_limit)],
    response_model=TokenResponse,
    summary="Registrar novo usuário com e-mail e senha",
    status_code=201,
)
async def register(
    db: DbSession,
    payload: RegisterRequest,
) -> TokenResponse:
    """
    Registra um novo usuário na aplicação com e-mail e senha, sempre como CONTRIBUTOR.
    O e-mail não é verificado, então nunca concede papel privilegiado.
    """
    norm_email = payload.email.strip().lower()
    norm_username = payload.username.strip()

    stmt_email = select(UserModel).where(func.lower(UserModel.email) == norm_email)
    res_email = await db.execute(stmt_email)
    if res_email.scalar_one_or_none() is not None:
        raise ConflictError("Este e-mail já está cadastrado")

    stmt_user = select(UserModel).where(func.lower(UserModel.username) == norm_username.lower())
    res_user = await db.execute(stmt_user)
    if res_user.scalar_one_or_none() is not None:
        raise ConflictError("Este nome de usuário já está em uso")

    user = UserModel(
        email=norm_email,
        username=norm_username,
        password_hash=hash_password(payload.password),
        role="CONTRIBUTOR",
        avatar_url=f"https://avatar.vercel.sh/{norm_username}",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.username, email=user.email, role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


class AuthConfigOut(BaseModel):
    github_oauth_configured: bool
    dev_login_enabled: bool


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
        github_oauth_configured=bool(settings.github_client_id and settings.github_client_secret),
        dev_login_enabled=_dev_login_enabled(),
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
    """Redireciona para autorização OAuth do GitHub com state CSRF."""
    if not state:
        state = generate_oauth_state()
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
    dependencies=[Depends(auth_rate_limit)],
    summary="Callback do GitHub OAuth",
)
async def github_callback(
    request: Request,
    db: DbSession,
    code: str | None = Query(None, description="Código temporário fornecido pelo GitHub OAuth"),
    state: str | None = Query(None, description="Estado de segurança CSRF retornado pelo GitHub"),
    error: str | None = Query(None, description="Mensagem de erro enviada pelo GitHub caso negado"),
):
    """Processa OAuth do GitHub, valida CSRF state e redireciona ao SPA."""
    settings = get_settings()
    frontend_callback = f"{settings.frontend_url.rstrip('/')}/auth/callback"
    is_json = "application/json" in request.headers.get("accept", "")

    if error:
        if is_json:
            raise ValidationError(f"GitHub OAuth error: {error}")
        return RedirectResponse(f"{frontend_callback}?error={error}")

    if not verify_oauth_state(state):
        if is_json:
            raise ValidationError("Missing or invalid 'state' CSRF parameter")
        return RedirectResponse(f"{frontend_callback}?error=invalid_state")

    if not code:
        if is_json:
            raise ValidationError("Missing 'code' query parameter")
        return RedirectResponse(f"{frontend_callback}?error=missing_code")

    try:
        access_token = await github_service.exchange_code_for_token(code)
        gh_user = await github_service.get_authenticated_user(access_token)
    except GitHubServiceError as e:
        if is_json:
            raise ValidationError(str(e)) from e
        return RedirectResponse(f"{frontend_callback}?error={e}")

    user = await _upsert_github_user(db, gh_user)
    token = create_access_token(user.id, user.username)

    if is_json:
        return TokenResponse(access_token=token, user=UserOut.model_validate(user))
    return RedirectResponse(f"{frontend_callback}?token={token}")


def _dev_login_enabled() -> bool:
    settings = get_settings()
    oauth_configured = bool(settings.github_client_id and settings.github_client_secret)
    return settings.enable_dev_login and not oauth_configured


def _dev_github_id(username: str) -> int:
    """Id falso estável entre reinícios (ao contrário de `hash()`, que é aleatório
    por processo) e sempre negativo, para nunca colidir com um id real do GitHub."""
    digest = hashlib.sha256(username.encode("utf-8")).digest()
    return -(int.from_bytes(digest[:4], "big") % (2**31 - 1)) - 1


@router.post(
    "/dev-login",
    dependencies=[Depends(auth_rate_limit)],
    response_model=TokenResponse,
    summary="Login direto de desenvolvimento",
)
async def dev_login(data: DevLoginRequest, db: DbSession) -> TokenResponse:
    """Login rápido para desenvolvimento e demonstrações locais sem requisições ao GitHub."""
    if not _dev_login_enabled():
        raise NotFoundError("Route")

    username = data.username.strip()
    if not username:
        raise ValidationError("username must not be blank")

    fake_github_id = _dev_github_id(username)

    result = await db.execute(select(UserModel).where(UserModel.github_id == fake_github_id))
    user = result.scalar_one_or_none()

    # The username is not verified here, so dev-login never grants ADMIN.
    if user is None:
        user = UserModel(
            github_id=fake_github_id,
            username=username,
            role="CONTRIBUTOR",
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
