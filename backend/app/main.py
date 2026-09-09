from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import get_settings
from app.core.exceptions import DomainError
from app.core.security import TokenError

API_DESCRIPTION = """
## 🌱 GREENFIELD — Protocolo de Recompensas Open-Source na Solana

O **GREENFIELD** conecta o fluxo natural de desenvolvimento do GitHub a liquidações financeiras
instantâneas em **USDC** na rede **Solana**:

> **Issue → PR → Merge → USDC**

### 📐 Regra de Conversão Financeira
- **100 pontos = $1 USDC = 1.000.000 micro-USDC** (6 casas decimais nativas da SPL).

### 🛡️ 4 Invariantes Canônicas de Negócio
1. **Merge Obrigatório**: Pull Request aberto ou aprovado **não** libera fundos.
   A recompensa é desbloqueada estritamente quando o PR é mesclado (*merged*).
2. **Imutabilidade Pós-Atribuição**: O valor acordado entre mantenedor e desenvolvedor fica
   congelado assim que o candidato é aceito (`ASSIGNED`).
3. **Prevenção de Double-Claim**: Nenhuma issue pode ser paga mais de uma vez (`claimed == false`).
4. **Solvência do Tesouro**: O volume total de bounties não pode exceder o saldo garantido
   do pool comunitário ($25.000 USDC).

### 👥 Papéis do Sistema
- **ADMIN**: Governança global, controle de projetos/repositórios e ajuste de valores.
- **MAINTAINER**: Dono do projeto que cadastra repositórios, monetiza issues e seleciona candidatos.
- **CONTRIBUTOR**: Desenvolvedor que se candidata (*applicant*), envia PR e recebe USDC na wallet.
"""

TAGS_METADATA = [
    {
        "name": "health",
        "description": "Verificação de integridade operacional e status da API.",
    },
    {
        "name": "auth",
        "description": "Autenticação via GitHub OAuth 2.0 e emissão de tokens JWT Bearer.",
    },
    {
        "name": "users",
        "description": "Perfis de usuário e vinculação de carteiras Solana.",
    },
    {
        "name": "projects",
        "description": "Criação e gestão de projetos cadastrados no Greenfield.",
    },
    {
        "name": "repositories",
        "description": "Repositórios GitHub e consulta de issues abertas para monetização.",
    },
    {
        "name": "bounties",
        "description": "Ciclo de vida das tasks monetizadas: criação, candidatos, PR e liquidação.",
    },
    {
        "name": "admin",
        "description": "Painel de governança: métricas, repositórios e moderação de tasks.",
    },
    {
        "name": "webhooks",
        "description": "Recepção de webhooks do GitHub (Pull Request merged auto-complete).",
    },
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="GREENFIELD — Solana Dev Rewards API",
        description=API_DESCRIPTION,
        version="0.1.0",
        openapi_tags=TAGS_METADATA,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router)

    @app.exception_handler(DomainError)
    async def domain_error_handler(request: Request, exc: DomainError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

    @app.exception_handler(TokenError)
    async def token_error_handler(request: Request, exc: TokenError) -> JSONResponse:
        return JSONResponse(status_code=401, content={"detail": str(exc)})

    return app


app = create_app()
