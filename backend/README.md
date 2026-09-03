# Greenfield Backend (Python + FastAPI)

API do Greenfield: bounties para issues do GitHub, pagos em USDC na Solana (devnet).

## Stack

- FastAPI + Uvicorn
- SQLAlchemy 2.0 (async) + asyncpg + Alembic
- Pydantic v2 + pydantic-settings
- PyJWT (autenticação), httpx (OAuth/API GitHub e RPC Solana)
- pytest, Ruff

## Como rodar

### 1. Infraestrutura (Postgres)

Na raiz do monorepo:

```bash
docker compose up -d
```

### 2. Configuração

```bash
cp .env.example .env
# preencha GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET (GitHub OAuth App)
```

### 3. Instalar dependências e migrar o banco

```bash
uv sync
uv run alembic upgrade head
```

### 4. Subir a API

```bash
uv run uvicorn app.main:app --reload --port 8080
```

- Swagger UI: http://localhost:8080/docs
- Health check: http://localhost:8080/api/v1/health

## Endpoints (`/api/v1`)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/auth/github/login` | Inicia OAuth GitHub |
| GET | `/auth/github/callback` | Callback OAuth → JWT |
| GET | `/auth/me` | Usuário autenticado |
| GET/PATCH | `/users/me` | Perfil / vincular wallet Solana |
| GET | `/users/{id}` | Perfil público |
| POST/GET | `/projects` | Criar / listar projetos |
| GET/PATCH/DELETE | `/projects/{id}` | Detalhe / atualizar / remover |
| POST/GET | `/bounties` | Criar / listar bounties |
| GET | `/bounties/{id}` | Detalhe do bounty |
| POST | `/bounties/{id}/assign` | Hunter assume o bounty |
| POST | `/bounties/{id}/submit` | Hunter envia PR |
| POST | `/bounties/{id}/complete` | Issuer completa (valida PR mergeado) |
| POST | `/bounties/{id}/cancel` | Isser cancela |
| POST | `/webhooks/github` | Webhook PR merged → auto-complete |

## Fluxo do bounty

```
OPEN ──assign──▶ ASSIGNED ──submit──▶ SUBMITTED ──complete──▶ COMPLETED
  │                 │
  └────cancel───────┴────────────▶ CANCELLED
```

## Desenvolvimento

```bash
uv run ruff check .     # lint
uv run pytest           # testes (SQLite in-memory, não precisa do Postgres)
uv run alembic revision --autogenerate -m "..."  # nova migration
```
