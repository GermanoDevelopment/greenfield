# Greenfield Backend (Python + FastAPI)

API do Greenfield: bounties para issues do GitHub, pagos em USDC na Solana (devnet/mainnet).

## Stack

- **FastAPI** + **Uvicorn**
- **SQLAlchemy 2.0 (async)** + **asyncpg** + **Alembic**
- **Pydantic v2** + **pydantic-settings**
- **PyJWT** (autenticação JWT)
- **httpx** (OAuth / GitHub REST API)
- **solinpy**, **solana**, **solders** (liquidação on-chain Solana USDC)
- **pytest**, **Ruff**

---

## Como Rodar

### Opção 1: Via Docker Compose (Recomendado para subir tudo)

Na raiz do repositório:

```bash
docker compose up -d --build
```

O comando irá:
1. Subir o contêiner do PostgreSQL 15 (`greenfield-postgres`) com health check.
2. Aguardar o banco estar saudável.
3. Construir e iniciar o backend (`greenfield-backend`), aplicando automaticamente todas as migrações Alembic (`alembic upgrade head`) e servindo a API na porta `8080`.
4. Construir e iniciar o frontend SPA (`greenfield-frontend`), servindo a interface na porta `3000` via Nginx com proxy reverso transparente para `/api/v1/`.

- **Frontend Web**: [http://localhost:3000](http://localhost:3000)
- **Swagger UI interativo**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **ReDoc**: [http://localhost:8080/redoc](http://localhost:8080/redoc)
- **Health check**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

---

### Opção 2: Desenvolvimento Local com `uv`

#### 1. Iniciar apenas o Postgres
```bash
docker compose up -d postgres
```

#### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Preencha GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET conforme necessário
```

#### 3. Instalar dependências e migrar o banco
```bash
uv sync
uv pip install solinpy --no-deps
uv run alembic upgrade head
```

#### 4. Subir a API em modo reload
```bash
uv run uvicorn app.main:app --reload --port 8080
```

---

## Endpoints Principais (`/api/v1`)

| Categoria | Método | Rota | Descrição |
|---|---|---|---|
| **Health** | GET | `/health` | Status de integridade e versão do serviço |
| **Auth** | GET | `/auth/github/login` | Inicia fluxo OAuth GitHub |
| | GET | `/auth/github/callback` | Callback OAuth GitHub → emite JWT |
| | GET | `/auth/me` | Dados do usuário autenticado |
| **Users** | GET/PATCH | `/users/me` | Perfil e vinculação de carteira Solana |
| | GET | `/users/{id}` | Perfil público de desenvolvedor |
| | GET | `/users` | Listagem pública de usuários |
| **Projects** | POST/GET | `/projects` | Criar / listar projetos |
| | GET/PATCH/DELETE | `/projects/{id}` | Obter / atualizar / remover projeto |
| **Repositories**| POST/GET | `/projects/{id}/repositories` | Vincular / listar repositórios adicionais |
| | GET/DELETE | `/repositories/{id}` | Detalhes / remover repositório |
| | GET | `/repositories/{id}/issues` | Listar issues do GitHub para monetização |
| **Bounties** | POST/GET | `/bounties` | Criar task monetizada / listar bounties |
| | GET | `/bounties/{id}` | Detalhes completos da bounty |
| | POST | `/bounties/{id}/apply` | Submeter candidatura com proposta técnica |
| | GET | `/bounties/{id}/applicants` | Listar candidatos da issue |
| | POST | `/bounties/{id}/applicants/{applicant_id}/accept` | Aceitar candidato e congelar recompensa |
| | PATCH | `/bounties/{id}/reward` | Ajustar pontuação da issue (somente `OPEN`) |
| | POST | `/bounties/{id}/assign` | Auto-atribuição direta (legado) |
| | POST | `/bounties/{id}/submit` | Enviar PR de solução |
| | POST | `/bounties/{id}/complete` | Concluir bounty e disparar liquidação on-chain |
| | POST | `/bounties/{id}/cancel` | Cancelar bounty |
| **Webhooks** | POST | `/webhooks/github` | Webhook do GitHub para auto-complete no merge |

---

## Invariantes do Protocolo Greenfield

1. **Merge Obrigatório**: Recompensas são liberadas exclusivamente após merge confirmado do PR no branch padrão.
2. **Recompensa Imutável após Atribuição**: A pontuação/valor só pode ser ajustada em status `OPEN`. Após aprovação de candidato (`ASSIGNED`), o valor é congelado.
3. **Anti Double-Claim**: Cada issue só pode ser liquidada uma única vez; PRs já pagos são bloqueados.
4. **Solvência do Tesouro / Conversão**: Regra canônica de `100 pontos = $1 USDC = 1_000_000 micro-USDC`.

---

## Testes & Qualidade

```bash
uv run ruff check .               # Linter
uv run ruff format --check .      # Formatador
uv run pytest                     # Suite de 41 testes unitários e de integração
```
