from pydantic import BaseModel, Field

from app.schemas.user import UserOut


class TokenResponse(BaseModel):
    access_token: str = Field(
        description="JWT Bearer token para autenticação nas rotas protegidas",
        examples=["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."],
    )
    token_type: str = Field(
        default="bearer",
        description="Tipo do token de autorização",
        examples=["bearer"],
    )
    user: UserOut = Field(description="Dados cadastrais do usuário autenticado")


class GitHubLoginURL(BaseModel):
    login_url: str = Field(
        description="URL de autorização do GitHub OAuth para redirecionamento",
        examples=["https://github.com/login/oauth/authorize?client_id=..."],
    )


class LoginRequest(BaseModel):
    email: str = Field(
        description="E-mail de autenticação",
        examples=["germano@greenfield.com"],
    )
    password: str = Field(
        min_length=6,
        description="Senha de acesso do usuário",
        examples=["admin123"],
    )


class RegisterRequest(BaseModel):
    email: str = Field(
        description="E-mail do novo usuário",
        examples=["usuario@greenfield.com"],
    )
    password: str = Field(
        min_length=6,
        description="Senha de acesso",
        examples=["admin123"],
    )
    username: str = Field(
        min_length=2,
        max_length=50,
        description="Nome de usuário / apelido",
        examples=["germano"],
    )
