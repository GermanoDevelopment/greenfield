# 🌱 Greenfield

> Transforme contribuições open source em recompensas instantâneas na Solana.

**Repositório:** [github.com/GermanoDevelopment/greenfield](https://github.com/GermanoDevelopment/greenfield)

Fluxo: **Issue → PR → Merge → USDC.**

## 🏗️ Estrutura

```
greenfield/
├── backend/            # Python FastAPI + SQLAlchemy (async) + Alembic
├── frontend/           # React + Vite + TS + Tailwind + Solana Wallets
├── contract/           # Solana Anchor Program (opcional p/ dev local)
├── docker-compose.yml  # Postgres + backend + frontend (demo / prod local)
└── README.md
```

| Parte | Stack | Porta local |
|---|---|---|
| Postgres | `postgres:15-alpine` via Docker | `5432` |
| Backend | FastAPI + Uvicorn + asyncpg | `8080` |
| Frontend (Docker) | Nginx servindo `dist/` | `3000` |
| Frontend (dev) | Vite HMR (`npm run dev`) | `5173` |
| Contract | Anchor + Solana CLI | localnet / devnet |

URLs importantes (com tudo rodando):

- Frontend Docker: http://localhost:3000
- Frontend dev (Vite): http://localhost:5173
- API docs (Swagger): http://localhost:8080/docs
- ReDoc: http://localhost:8080/redoc
- Health check: http://localhost:8080/api/v1/health
- OpenAPI JSON: http://localhost:8080/openapi.json

---

## ✅ Pré-requisitos

Obrigatório para desenvolvimento local híbrido (recomendado):

- Docker + Docker Compose (`docker --version`, `docker compose version`)
- Python 3.12+ (`python3 --version`)
- [uv](https://docs.astral.sh/uv/) (`uv --version`)
- Node.js 20+ + npm (`node --version`, `npm --version`)

Opcional (só se for mexer no contrato Solana):

- Solana CLI (`solana --version`), Rust, Anchor (`anchor --version`)

Verificação rápida:

```bash
docker --version && docker compose version
python3 --version && uv --version
node --version && npm --version
```

---

## ⚡ Quickstart

Escolha um dos 2 modos. Para codar no dia a dia, use o **Modo B**.

### Modo A — Tudo via Docker (demo rápida, sem codar)

Sobe Postgres + backend (com `alembic upgrade head` automático) + frontend Nginx:

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:8080/api/v1/health
```

Abra:

- http://localhost:3000
- http://localhost:8080/docs

Logs / parar:

```bash
docker compose logs -f backend frontend
docker compose down        # para e mantém dados
docker compose down -v     # para e APAGA o banco local
```

> Nesse modo o frontend em `http://localhost:3000` já proxya `/api/v1/` para o backend interno. Não precisa configurar `.env` do frontend.

### Modo B — Dev local híbrido (recomendado para codar) ⭐

Roda só o Postgres no Docker, e backend + frontend direto na sua máquina com hot-reload.

**1. Suba só o banco:**

```bash
docker compose up -d postgres
docker compose ps
pg_isready -h localhost -p 5432 -U greenfield || docker compose logs postgres
```

**2. Backend (FastAPI):**

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8080
```

Cheque: http://localhost:8080/api/v1/health e http://localhost:8080/docs

> `DATABASE_URL=postgres://greenfield:greenfield@localhost:5432/greenfield` no `.env.example` já funciona — o backend normaliza para `postgresql+asyncpg://` sozinho. Não precisa mudar.

**3. Frontend (Vite) — em outro terminal:**

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abra http://localhost:5173

> `VITE_API_URL=http://localhost:8080/api/v1` no `.env.example` já aponta para o backend local. `CORS_ORIGINS` do backend já inclui `5173` e `3000`, então não precisa mexer.

Pronto. Backend com `--reload` + Vite com HMR: editou, recarregou.

---

## 🔧 Variáveis de ambiente

Você consegue rodar e testar o fluxo básico **sem preencher nada além dos `.env.example`**.

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

| Var | Default | Precisa mexer? |
|---|---|---|
| `DATABASE_URL` | `postgres://greenfield:greenfield@localhost:5432/greenfield` | Não (dev híbrido). No Docker-compose é sobrescrito para `postgres:5432` interno |
| `JWT_SECRET` | `supersecretjwtkey_change_in_production` | Só em produção |
| `CORS_ORIGINS` | `["http://localhost:5173","http://localhost:3000"]` | Não, a menos que use outra porta |
| `GITHUB_CLIENT_ID/SECRET` | vazio | Só para testar login OAuth real. Sem isso, `/auth/github/login` retorna erro esperado |
| `GITHUB_REDIRECT_URI` | `http://localhost:8080/api/v1/auth/github/callback` | Só se mudar porta/host do backend |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Não |
| `SOLANA_PROGRAM_ID` | vazio | Só para payout on-chain real |

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

| Var | Default | Nota |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Deve apontar para o backend. Reinicie `npm run dev` após mudar (Vite só lê no boot) |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Não precisa mudar p/ dev |
| `VITE_SOLANA_CHAIN` | `solana:devnet` | Não precisa mudar p/ dev |

---

## 🧪 Comandos do dia a dia

### Backend (dentro de `backend/`)

```bash
uv run uvicorn app.main:app --reload --port 8080  # dev
uv run alembic upgrade head                       # migrar banco
uv run alembic revision --autogenerate -m "descricao"  # nova migration após mudar models
uv run pytest                                     # 41 testes unitários + integração
uv run ruff check .                               # lint
uv run ruff format --check .                      # checar formatação
```

Payout Solana real exige `solinpy` (import lazy, só no `complete`):

```bash
uv pip install solinpy --no-deps
```

### Frontend (dentro de `frontend/`)

```bash
npm run dev      # dev com HMR em :5173
npm run build    # typecheck (tsc) + build p/ dist/
npm run preview  # serve o build local p/ conferência
npm run lint     # oxlint
```

### Docker

```bash
docker compose up -d --build        # tudo
docker compose up -d postgres       # só banco (modo dev)
docker compose logs -f backend      # logs backend
docker compose logs -f postgres     # logs banco
docker compose down                 # para
docker compose down -v              # reseta banco (apaga volume postgres_data)
```

### Contract (opcional)

```bash
cd contract
npm install
anchor build
anchor test
```

- `Anchor.toml`: `cluster = "Localnet"`, `wallet = "~/.config/solana/id.json"`, program `greenfield = "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS"` (localnet + devnet).
- Para devnet real: `solana config set --url devnet && solana airdrop 2`.
- Backend/frontend funcionam sem o contract — ele só é necessário para liquidação on-chain de verdade.

Detalhes da API (endpoints, invariantes `100 pontos = $1 USDC`, regras de merge/anti-double-claim): ver [`backend/README.md`](backend/README.md).

---

## 🩺 Troubleshooting

| Sintoma | Causa provável / fix |
|---|---|
| `port 5432 already in use` | Postgres local já rodando. Ou `sudo lsof -i :5432`, ou use só o Docker: `docker compose up -d postgres` e pare o serviço local |
| `port 8080 already in use` | Outro Uvicorn/Docker backend. `docker compose stop backend` ou `lsof -i :8080` e mate o processo |
| `connection refused` no backend → banco | Postgres ainda subindo. Aguarde healthcheck: `docker compose ps`, `docker compose logs postgres`. Depois `uv run alembic upgrade head` de novo |
| `alembic` diz “up to date” mas tabelas faltam | Você apontou para outro banco. Confira `DATABASE_URL` no `backend/.env` |
| Frontend `Failed to fetch` / CORS | `VITE_API_URL` errado ou backend fora do ar. Confira `curl localhost:8080/api/v1/health`. Se mudou `.env` do frontend, reinicie `npm run dev` |
| Mudou `VITE_*` e nada aconteceu | Vite só lê env no boot. Reinicie `npm run dev`. Para Docker, precisa de `--build` |
| `/auth/github/login` 500 / vazio | `GITHUB_CLIENT_ID/SECRET` não configurados — esperado em dev sem OAuth. Fluxo de bounties/projects funciona sem isso |
| `solinpy` / payout falha | Normal sem `SOLANA_PROGRAM_ID` + treasury configurada. Instale com `uv pip install solinpy --no-deps` só se for testar payout real na devnet |
| Docker frontend mostra versão velha | Cache de build. `docker compose up -d --build frontend` |

Reset total do ambiente local (volta ao zero):

```bash
docker compose down -v
docker compose up -d postgres
cd backend && uv run alembic upgrade head
```
