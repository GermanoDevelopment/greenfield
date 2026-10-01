# 🌱 Greenfield

> Transforme contribuições open source em recompensas em USDC na Solana.

Greenfield liga **issues do GitHub** a **bounties**. Mantenedores precificam uma issue, contribuidores se candidatam e abrem um PR, e o **merge confirmado** libera o pagamento em USDC para a carteira do contribuidor.

```mermaid
flowchart LR
    A[Issue no GitHub] --> B[Bounty criada<br/>100 pontos = US$ 1]
    B --> C[Contribuidor se candidata]
    C --> D[Mantenedor aceita<br/>recompensa congelada]
    D --> E[PR enviado]
    E --> F{PR mergeado?}
    F -- "sim" --> G[Pagamento em USDC<br/>na Solana]
    F -- "não" --> E
```

**Repositório:** [github.com/GermanoDevelopment/greenfield](https://github.com/GermanoDevelopment/greenfield)

---

## Sumário

- [Quickstart](#-quickstart)
- [Como funciona](#-como-funciona)
- [Variáveis de ambiente](#-variáveis-de-ambiente)
- [Comandos do dia a dia](#-comandos-do-dia-a-dia)
- [API](#-api)
- [Estrutura do repositório](#-estrutura-do-repositório)
- [Troubleshooting](#-troubleshooting)

---

## ⚡ Quickstart

### Pré-requisitos

| Ferramenta | Versão | Para quê |
|---|---|---|
| Docker + Docker Compose | recente | Postgres (e a stack completa no Modo A) |
| Python | 3.12+ | Backend (Modo B) |
| [uv](https://docs.astral.sh/uv/) | recente | Gerenciar dependências do backend |
| Node.js + npm | 20+ | Frontend (Modo B) |
| Solana CLI, Rust, Anchor | opcional | Só se for mexer em `contract/` |

```bash
docker --version && docker compose version
python3 --version && uv --version
node --version && npm --version
```

### Escolha um modo

| | Modo A: Docker | Modo B: Híbrido ⭐ |
|---|---|---|
| Para quê | Ver o app funcionando, sem codar | Desenvolver com hot-reload |
| O que roda no Docker | Postgres + backend + frontend | Só o Postgres |
| Frontend | `http://localhost:3000` (Nginx) | `http://localhost:5173` (Vite HMR) |

### Modo A: tudo via Docker

```bash
docker compose up -d --build
docker compose ps
curl http://localhost:8080/api/v1/health
```

O backend aplica `alembic upgrade head` sozinho ao subir. Depois abra:

- App: http://localhost:3000
- Swagger: http://localhost:8080/docs

```bash
docker compose logs -f backend frontend   # acompanhar logs
docker compose down                       # parar, mantendo os dados
docker compose down -v                    # parar e APAGAR o banco local
```

> **Atenção:** o frontend do Docker é um build estático. O `VITE_API_URL` é embutido **na hora do build**, e o `.env` do frontend é ignorado pelo `.dockerignore`. Sem ele, o app chama `http://localhost:8080/api/v1` direto do navegador (o CORS já libera a porta `3000`). Mudou algo do frontend? Rode `docker compose up -d --build frontend`.

### Modo B: desenvolvimento local híbrido

**1. Banco**

```bash
docker compose up -d postgres
pg_isready -h localhost -p 5432 -U greenfield || docker compose logs postgres
```

**2. Backend** (terminal 1)

```bash
cd backend
cp .env.example .env
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8080
```

Confira: http://localhost:8080/api/v1/health e http://localhost:8080/docs

> O `DATABASE_URL=postgres://...` do `.env.example` já funciona. O backend converte para `postgresql+asyncpg://` sozinho.

**3. Frontend** (terminal 2)

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abra http://localhost:5173

Pronto: o backend recarrega com `--reload` e o frontend com HMR.

### Primeiro acesso

Existem três caminhos de login, e só o último exige configuração:

| Caminho | Como | Precisa configurar? |
|---|---|---|
| **E-mail e senha** | Modal de login/cadastro do app, ou `POST /auth/register` | Não |
| **Admin de desenvolvimento** | O backend cria contas ADMIN de seed a cada boot, todas com a senha `admin123`. Veja `backend/app/services/admin_seed.py` | Não |
| **GitHub OAuth** | `GET /auth/github/login` | Sim: `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` |

> ⚠️ **Só para desenvolvimento.** As contas de seed usam senha pública. Antes de qualquer deploy compartilhado, remova o seed ou troque as senhas. Defina também um `JWT_SECRET` próprio.

---

## 🧭 Como funciona

### Arquitetura

```mermaid
flowchart TB
    U([Navegador + carteira Solana])
    subgraph stack["Docker ou local"]
        FE[Frontend<br/>React + Vite]
        BE[Backend<br/>FastAPI]
        DB[(Postgres 15)]
    end
    GH[GitHub<br/>API e webhooks]
    SOL[Solana RPC<br/>devnet]

    U --> FE
    FE -- "/api/v1" --> BE
    BE --> DB
    BE -- "issues, PRs, OAuth" --> GH
    GH -- "webhook: PR mergeado" --> BE
    BE -- "transferência de USDC (SPL)" --> SOL
    FE -. "RPC da carteira" .-> SOL
```

| Parte | Stack | Porta local |
|---|---|---|
| Postgres | `postgres:15-alpine` | `5432` |
| Backend | FastAPI, SQLAlchemy 2 (async), asyncpg, Alembic | `8080` |
| Frontend (Docker) | Nginx servindo `dist/` | `3000` |
| Frontend (dev) | React 19, Vite, TypeScript, Tailwind, `@solana/kit` | `5173` |
| Contract | Anchor (Rust) | localnet / devnet |

### Ciclo de vida de uma bounty

```mermaid
stateDiagram-v2
    [*] --> OPEN
    OPEN --> ASSIGNED: candidato aceito
    OPEN --> CANCELLED
    ASSIGNED --> SUBMITTED: PR enviado
    ASSIGNED --> CANCELLED
    SUBMITTED --> COMPLETED: PR mergeado
    SUBMITTED --> ASSIGNED: PR rejeitado
    SUBMITTED --> CANCELLED
    COMPLETED --> [*]
    CANCELLED --> [*]
```

`COMPLETED` e `CANCELLED` são finais. A conclusão acontece de duas formas: o webhook do GitHub recebe o PR mergeado, ou o emissor/admin chama `POST /bounties/{id}/complete`. Nos dois casos o backend confere o merge antes de concluir.

### Regras do protocolo

1. **Merge obrigatório.** A conclusão só acontece com o PR mergeado no GitHub. Se o backend não conseguir verificar, a bounty não conclui.
2. **Recompensa congelada.** O valor só pode ser ajustado em `OPEN`. Depois que um candidato é aceito (`ASSIGNED`), ele não muda.
3. **Sem double-claim.** Uma issue é liquidada uma única vez, e o `complete` só vale a partir de `SUBMITTED`.
4. **Conversão fixa.** `100 pontos = US$ 1 USDC = 1.000.000 micro-USDC`.

### Como o pagamento é feito hoje

O pagamento **não passa pelo contrato Anchor**. Ao concluir, o backend faz uma transferência SPL de USDC da **tesouraria** para a carteira do contribuidor, usando o [`solinpy`](https://pypi.org/project/solinpy/).

- A tesouraria vem de `SOLANA_TREASURY_KEYPAIR_PATH` ou `SOLANA_TREASURY_PRIVATE_KEY`. Sem nenhuma das duas, o backend gera um keypair efêmero sem fundos.
- Se o contribuidor **não tem carteira vinculada**, a bounty é concluída sem pagamento.
- Se a transferência falhar por qualquer motivo (sem `solinpy`, RPC fora, tesouraria sem USDC), o backend grava uma assinatura **simulada** no formato `sim_<carteira>_<valor>` e segue. Em desenvolvimento isso mantém o fluxo de ponta a ponta. **Uma assinatura `sim_...` não é uma transação real.**
- O `contract/` é um scaffold: tem só a instrução `initialize`. Ele não é necessário para rodar nem para testar o fluxo.

Para pagar de verdade na devnet, instale o `solinpy` e configure a tesouraria:

```bash
cd backend
uv pip install solinpy --no-deps
```

---

## 🔧 Variáveis de ambiente

Para rodar o fluxo básico, copie os `.env.example` e não mude nada.

### Backend (`backend/.env`)

```bash
cp backend/.env.example backend/.env
```

| Variável | Padrão | Quando mexer |
|---|---|---|
| `PORT` | `8080` | Quase nunca. Não muda a porta do Uvicorn: no Modo B use `--port` |
| `DATABASE_URL` | `postgres://greenfield:greenfield@localhost:5432/greenfield` | Quase nunca. No Docker Compose é sobrescrita para o host `postgres` |
| `JWT_SECRET` | `supersecretjwtkey_change_in_production` | **Sempre em produção** |
| `JWT_EXPIRATION_MINUTES` | `1440` | Para mudar a duração do token |
| `CORS_ORIGINS` | `["http://localhost:5173","http://localhost:3000"]` | Se o frontend usar outra origem |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | vazio | Para testar OAuth real do GitHub |
| `GITHUB_REDIRECT_URI` | `http://localhost:8080/api/v1/auth/github/callback` | Se mudar host ou porta do backend |
| `GITHUB_WEBHOOK_SECRET` | vazio | Para validar a assinatura HMAC do webhook. **Vazio aceita qualquer payload** |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Para usar outro cluster |
| `SOLANA_PROGRAM_ID` | vazio | Reservado para o contrato on-chain |

Opcionais, lidas pelo `Settings` mas ausentes do `.env.example`:

| Variável | Padrão | Para quê |
|---|---|---|
| `GITHUB_TOKEN` | nenhum | Token para a API do GitHub quando não há token do usuário |
| `SOLANA_TREASURY_KEYPAIR_PATH` | nenhum | Caminho do JSON da tesouraria que paga as bounties |
| `SOLANA_TREASURY_PRIVATE_KEY` | nenhum | Chave privada da tesouraria em base58 (alternativa ao caminho) |
| `USDC_MINT_DEVNET` | `4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU` | Mint do USDC usado nos pagamentos |
| `ADMIN_GITHUB_USERNAMES` | `["GermanoDevelopment"]` | Usernames do GitHub que entram como ADMIN via OAuth |

### Frontend (`frontend/.env`)

```bash
cp frontend/.env.example frontend/.env
```

| Variável | Padrão | Observação |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | O Vite lê no boot: reinicie o `npm run dev` ao mudar |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Não precisa mudar em dev |
| `VITE_SOLANA_CHAIN` | `solana:devnet` | Não precisa mudar em dev |

---

## 🧪 Comandos do dia a dia

### Backend (em `backend/`)

```bash
uv run uvicorn app.main:app --reload --port 8080       # servidor de dev
uv run alembic upgrade head                            # aplicar migrations
uv run alembic revision --autogenerate -m "descricao"  # nova migration após mudar models
uv run pytest                                          # testes
uv run ruff check .                                    # lint
uv run ruff format --check .                           # checar formatação
```

Os testes usam SQLite em memória (`aiosqlite`), então rodam **sem Postgres**.

### Frontend (em `frontend/`)

```bash
npm run dev       # dev com HMR em :5173
npm run build     # typecheck (tsc) + build em dist/
npm run preview   # servir o build local
npm run lint      # oxlint
```

### Docker (na raiz)

```bash
docker compose up -d --build     # tudo
docker compose up -d postgres    # só o banco (Modo B)
docker compose logs -f backend   # logs do backend
docker compose down              # parar
docker compose down -v           # parar e apagar o volume postgres_data
```

### Contract (opcional, em `contract/`)

```bash
npm install
anchor build
anchor test
```

`Anchor.toml` usa `cluster = "Localnet"` e a carteira `~/.config/solana/id.json`. Program ID (localnet e devnet): `Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS`. Para a devnet: `solana config set --url devnet && solana airdrop 2`.

---

## 📡 API

Toda a API vive sob `/api/v1`. A documentação interativa é gerada pelo FastAPI:

| Recurso | URL |
|---|---|
| Swagger UI | http://localhost:8080/docs |
| ReDoc | http://localhost:8080/redoc |
| OpenAPI JSON | http://localhost:8080/openapi.json |
| Health check | http://localhost:8080/api/v1/health |

| Grupo | Prefixo | O que faz |
|---|---|---|
| Auth | `/auth` | Login e cadastro por e-mail, OAuth do GitHub, `/auth/me` |
| Users | `/users` | Perfil, vínculo da carteira Solana, perfis públicos |
| Projects | `/projects` | CRUD de projetos |
| Repositories | `/projects/{id}/repositories`, `/repositories` | Vincular repositórios e listar issues do GitHub |
| Bounties | `/bounties` | Criar, candidatar, aceitar, enviar PR, concluir e cancelar |
| Admin | `/admin` | Estatísticas, projetos, sincronização de repositórios, issues sem recompensa, revisão de PR |
| Webhooks | `/webhooks/github` | Recebe PR mergeado e eventos de issues |

A tabela completa de rotas de bounties está em [`backend/README.md`](backend/README.md).

### Webhook do GitHub

Para concluir bounties automaticamente no merge, aponte um webhook do repositório para `POST /api/v1/webhooks/github`, com `Content-Type: application/json` e os eventos **Pull requests** e **Issues**. Defina o mesmo segredo em `GITHUB_WEBHOOK_SECRET` no GitHub e no `.env`.

---

## 📁 Estrutura do repositório

```
greenfield/
├── backend/             # FastAPI + SQLAlchemy (async) + Alembic
│   ├── app/api/v1/      #   rotas
│   ├── app/services/    #   regras de negócio (bounties, GitHub, Solana)
│   ├── alembic/         #   migrations
│   └── tests/           #   pytest
├── frontend/            # React + Vite + TS + Tailwind
│   └── src/
│       ├── core/            #   domínio e casos de uso
│       ├── infrastructure/  #   repositórios, serviços e Solana
│       └── presentation/    #   páginas, componentes e contexto
├── contract/            # Programa Anchor (scaffold)
├── demo-video/          # Vídeo de demonstração (Remotion)
├── docker-compose.yml   # Postgres + backend + frontend
└── FRONTEND-REQUIREMENTS.md
```

---

## 🩺 Troubleshooting

| Sintoma | Causa provável e correção |
|---|---|
| `port 5432 already in use` | Há um Postgres local rodando. Pare o serviço local ou veja quem usa a porta: `sudo lsof -i :5432` |
| `port 8080 already in use` | Outro Uvicorn ou o backend do Docker. `docker compose stop backend` ou `lsof -i :8080` |
| `connection refused` do backend ao banco | O Postgres ainda está subindo. Veja `docker compose ps` e `docker compose logs postgres`, depois rode `uv run alembic upgrade head` de novo |
| `alembic` diz "up to date", mas faltam tabelas | `DATABASE_URL` aponta para outro banco. Confira o `backend/.env` |
| Frontend com `Failed to fetch` ou erro de CORS | `VITE_API_URL` errado ou backend fora do ar. Teste `curl localhost:8080/api/v1/health`. Se mudou o `.env`, reinicie o `npm run dev` |
| Mudou `VITE_*` e nada aconteceu | O Vite só lê o env no boot. No Docker, é preciso `--build` |
| Frontend do Docker mostra versão antiga | Cache de build: `docker compose up -d --build frontend` |
| `/auth/github/login` retorna erro | `GITHUB_CLIENT_ID` e `GITHUB_CLIENT_SECRET` vazios. É esperado em dev: use e-mail e senha |
| Bounty concluída com `tx_signature` começando em `sim_` | O pagamento foi simulado. Veja [Como o pagamento é feito hoje](#como-o-pagamento-é-feito-hoje) |
| Bounty concluída sem `tx_signature` | O contribuidor não tem carteira vinculada em `PATCH /users/me` |
| Webhook responde `403 Invalid signature` | O `GITHUB_WEBHOOK_SECRET` do `.env` é diferente do segredo configurado no GitHub |

### Reset total do ambiente local

```bash
docker compose down -v
docker compose up -d postgres
cd backend && uv run alembic upgrade head
```
