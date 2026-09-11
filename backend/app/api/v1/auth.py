from fastapi import APIRouter, Query
from fastapi.responses import RedirectResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, DbSession
from app.core.exceptions import AuthenticationError, ConflictError, ValidationError
from app.core.security import create_access_token, hash_password, verify_password
from app.db.base import UserModel
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse
from app.schemas.user import UserOut
from app.services import github_service
from app.services.github_service import GitHubServiceError

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/login",
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
    stmt = select(UserModel).where(func.lower(UserModel.email) == norm_email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if (
        user is None
        or not user.password_hash
        or not verify_password(payload.password, user.password_hash)
    ):
        raise AuthenticationError("E-mail ou senha incorretos")

    token = create_access_token(user.id, user.username, email=user.email, role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post(
    "/register",
    response_model=TokenResponse,
    summary="Registrar novo usuário com e-mail e senha",
    status_code=201,
)
async def register(
    db: DbSession,
    payload: RegisterRequest,
) -> TokenResponse:
    """
    Registra um novo usuário na aplicação com e-mail e senha.
    Se o e-mail pertencer ao domínio @greenfield.com, concede automaticamente o papel ADMIN.
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

    role = "ADMIN" if norm_email.endswith("@greenfield.com") else "CONTRIBUTOR"

    user = UserModel(
        email=norm_email,
        username=norm_username,
        password_hash=hash_password(payload.password),
        role=role,
        avatar_url=f"https://avatar.vercel.sh/{norm_username}",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    token = create_access_token(user.id, user.username, email=user.email, role=user.role)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


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
    from app.core.config import get_settings

    settings = get_settings()
    is_admin = gh_user["username"] in settings.admin_github_usernames

    result = await db.execute(select(UserModel).where(UserModel.github_id == gh_user["github_id"]))
    user = result.scalar_one_or_none()
    if user is None:
        user = UserModel(
            github_id=gh_user["github_id"],
            username=gh_user["username"],
            avatar_url=gh_user["avatar_url"],
            role="ADMIN" if is_admin else "CONTRIBUTOR",
        )
        db.add(user)
    else:
        user.username = gh_user["username"]
        user.avatar_url = gh_user["avatar_url"]
        if is_admin:
            user.role = "ADMIN"
    await db.commit()
    await db.refresh(user)
    return user


@router.get(
    "/github/callback",
    response_model=TokenResponse,
    summary="Callback do GitHub OAuth",
)
async def github_callback(
    db: DbSession,
    code: str | None = Query(None, description="Código temporário fornecido pelo GitHub OAuth"),
    error: str | None = Query(None, description="Mensagem de erro enviada pelo GitHub caso negado"),
):
    """
    Processa o código de autorização retornado pelo GitHub,
    cria ou atualiza o perfil do usuário e emite o JWT.
    """
    if error:
        raise ValidationError(f"GitHub OAuth error: {error}")
    if not code:
        raise ValidationError("Missing 'code' query parameter")

    try:
        access_token = await github_service.exchange_code_for_token(code)
        gh_user = await github_service.get_authenticated_user(access_token)
    except GitHubServiceError as e:
        raise ValidationError(str(e)) from e

    user = await _upsert_github_user(db, gh_user)
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
