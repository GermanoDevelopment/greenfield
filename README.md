# 🌱 Greenfield

> Transforme contribuições open source em recompensas financeiras instantâneas em USDC na Solana.

**Repositório Oficial:** [github.com/GermanoDevelopment/greenfield](https://github.com/GermanoDevelopment/greenfield)  
**Fluxo do Protocolo:** `Issue → Candidatura → Aprovação → PR → Merge → Claim (USDC)`

---

## 📌 Sumário

- [Visão Geral](#-visão-geral)
- [Proposta de Valor](#-proposta-de-valor)
- [Invariantes do Protocolo](#-invariantes-do-protocolo)
- [Arquitetura do Sistema](#-arquitetura-do-sistema)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Como Executar](#-como-executar)
  - [Opção 1: Ambiente Completo via Docker Compose (Recomendado)](#opção-1-ambiente-completo-via-docker-compose-recomendado)
  - [Opção 2: Execução Local por Módulo](#opção-2-execução-local-por-módulo)
- [Configuração de Variáveis de Ambiente](#-configuração-de-variáveis-de-ambiente)
- [Endpoints da API (Backend REST)](#-endpoints-da-api-backend-rest)
- [Smart Contract (Solana Anchor)](#-smart-contract-solana-anchor)
- [Qualidade e Testes](#-qualidade-e-testes)

---

## 📖 Visão Geral

O **Greenfield** resolve a falta de incentivo financeiro para resolução de issues em projetos de código aberto conectando o fluxo nativo do GitHub a liquidações financeiras on-chain na blockchain Solana (em USDC SPL Token).

A plataforma elimina burocracias de programas convencionais de grants e bounties: todo o ciclo de vida — da triagem da issue à verificação do merge e liberação dos fundos — ocorre com rastreabilidade integrada entre GitHub APIs/Webhooks e o Smart Contract de custódia (Tesouro Comunitário).

---

## 🎯 Proposta de Valor

### Para Mantenedores
- Autenticação via GitHub OAuth e vinculação de carteira Solana (Phantom / Solflare).
- Seleção direta de repositórios e issues abertas.
- Definição de recompensas em pontos equivalentes a USDC.
- Avaliação de propostas técnicas e atribuição a desenvolvedores com congelamento de valor.
- Liberação automática ou assistida dos fundos condicionada estritamente ao **merge do PR** no branch principal.

### Para Desenvolvedores
- Descoberta de issues abertas com recompensas financeiras garantidas.
- Envio de candidatura com plano de implementação.
- Desenvolvimento padrão no GitHub (Issue → Branch → Pull Request).
- Liquidação on-chain via assinatura de transação de `Claim` diretamente para sua carteira Solana após a aprovação do merge.

---

## 🛡️ Invariantes do Protocolo

O Greenfield opera sob quatro invariantes obrigatórias de integridade e solvência:

1. **Merge Obrigatório**: A recompensa é liberada exclusivamente após a confirmação de merge do Pull Request correspondente no branch padrão do repositório.
2. **Imutabilidade da Recompensa**: Uma vez que uma candidatura é aceita e o desenvolvedor é atribuído à bounty (`ASSIGNED`), o valor da recompensa é congelado e não pode ser reduzido.
3. **Prevenção contra Double-Claim**: O ciclo de vida da bounty possui estado terminal `CLAIMED` registrado on-chain e sincronizado no banco relacional, impedindo duplicação de pagamentos.
4. **Solvência do Tesouro e Conversão Canônica**: Toda bounty aberta exige reserva prévia do saldo disponível no Tesouro Comunitário. A paridade fixa do protocolo é:
   $$\text{100 pontos} = \$1.00\text{ USDC} = 1.000.000\text{ micro-USDC (6 decimais)}$$

---

## 🏛️ Arquitetura do Sistema

```
                      ┌─────────────────────────────────────────┐
                      │             GitHub Platform             │
                      │  (OAuth / Issues / PRs / Webhooks)      │
                      └───────────────┬─────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────┐   REST / Webhooks   ┌─────────────────────────┐
│     Frontend (SPA)      │ ──────────────────► │      Backend (API)      │
│  React 19 + Vite + TS   │                     │  FastAPI + SQLAlchemy   │
│  Tailwind + Solana Kit  │                     │  PostgreSQL 15 (Async)  │
└────────────┬────────────┘                     └────────────┬────────────┘
             │                                               │
             │ Assinatura do Claim                           │ Autorização (CPI) / Payout
             ▼                                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Solana Network (Devnet / Mainnet)                   │
│                     Anchor Smart Contract (Greenfield)                  │
│               Vault USDC / Tesouro Comunitário / Contas PDA             │
└─────────────────────────────────────────────────────────────────────────┘
```

### Componentes Técnicos

- **Frontend (`/frontend`)**: Interface Single Page Application construída com React 19 (`react@^19.2`), TypeScript, Vite, Tailwind CSS, TanStack React Query (`^5.102`), React Router DOM v7 (`^7.18`) e ecossistema Solana Kit 8 (`@solana/kit`, `@solana/react` com `ClientProvider` e `@wallet-standard/ui`) para suporte universal a carteiras da rede Solana.
- **Backend (`/backend`)**: API REST assíncrona desenvolvida com Python 3.12+, FastAPI, SQLAlchemy 2.0 (modo async com driver `asyncpg`), Alembic para migrações relacionais, Pydantic v2 para validação e serialização, autenticação via JWT/OAuth GitHub e integração com a rede Solana via `solinpy`, `solana` e `solders`.
  - Suporta **modo on-chain via Anchor** (quando `SOLANA_PROGRAM_ID` e `SOLANA_AUTHORITY_SECRET_KEY` estão presentes) e **modo custodial fallback** direto via transferências SPL Token.
- **Smart Contract (`/contract`)**: Programa Anchor em Rust na Solana responsável pela custódia do pool financeiro em cofre PDA, reserva de balanço, controle de estados e transferência segura de tokens SPL USDC aos desenvolvedores autorizados.
- **Demo Video (`/demo-video`)**: Aplicação Remotion em React/TypeScript configurada para geração programática e renderização automatizada de vídeos demonstrativos da plataforma.

---

## 📂 Estrutura do Repositório

```text
greenfield/
├── backend/                  # API FastAPI, modelos SQLAlchemy, migrações Alembic e testes
│   ├── alembic/              # Scripts de migração de banco de dados
│   ├── app/                  # Núcleo da aplicação (api, core, db, models, schemas, services)
│   ├── tests/                # Testes automatizados unitários e de integração (pytest)
│   ├── Dockerfile            # Imagem de produção do backend
│   └── pyproject.toml        # Dependências gerenciadas via uv
├── frontend/                 # Aplicação Web React 19 + Vite + TypeScript
│   ├── src/                  # Código-fonte (componentes, páginas, contextos e infraestrutura)
│   ├── nginx.conf            # Configuração de proxy reverso Nginx para produção
│   ├── Dockerfile            # Imagem multi-stage do frontend com Nginx
│   └── package.json          # Dependências e scripts npm
├── contract/                 # Smart Contract Solana desenvolvido com Anchor Framework
│   ├── programs/greenfield/  # Código-fonte do programa Solana em Rust
│   ├── tests/                # Suíte de testes de integração Anchor/TypeScript
│   └── Anchor.toml           # Configuração de rede, programas e provedores Anchor
├── demo-video/               # Composição de vídeo automatizada com Remotion
├── docker-compose.yml        # Orquestração local dos serviços (Postgres, Backend, Frontend)
└── README.md                 # Documentação central do projeto
```

---

## 🚀 Como Executar

### Pré-requisitos Gerais
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- [Python 3.12+](https://www.python.org/) e gerenciador de pacotes [uv](https://docs.astral.sh/uv/)
- [Node.js 20+](https://nodejs.org/) e npm
- [Rust](https://www.rust-lang.org/), [Solana CLI](https://docs.solanalabs.com/cli/install) e [Anchor CLI](https://www.anchor-lang.com/docs/installation) (necessários para compilar o smart contract)

---

### Opção 1: Ambiente Completo via Docker Compose (Recomendado)

Esta opção inicializa toda a infraestrutura com um único comando: banco PostgreSQL, migrações automáticas de schema, backend FastAPI e frontend com proxy reverso Nginx.

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/GermanoDevelopment/greenfield.git
   cd greenfield
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. **Inicie os contêineres:**
   ```bash
   docker compose up -d --build
   ```

4. **Acesse as interfaces:**
   - **Frontend Web:** [http://localhost:3000](http://localhost:3000)
   - **Swagger UI (Documentação Interativa):** [http://localhost:8080/docs](http://localhost:8080/docs)
   - **ReDoc:** [http://localhost:8080/redoc](http://localhost:8080/redoc)
   - **Healthcheck:** [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)

Para parar os serviços:
```bash
docker compose down
```

---

### Opção 2: Execução Local por Módulo

Caso prefira executar os serviços individualmente em modo de desenvolvimento com hot-reload:

#### 1. Banco de Dados (PostgreSQL via Docker)
```bash
docker compose up -d postgres
```

#### 2. Backend (FastAPI + uv)
```bash
cd backend
cp .env.example .env
# Configure as credenciais no .env se necessário

uv sync
uv pip install solinpy --no-deps
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8080
```

#### 3. Frontend (React + Vite)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
O frontend local estará acessível em [http://localhost:5173](http://localhost:5173).

#### 4. Smart Contract (Solana Anchor)
```bash
cd contract
npm install
anchor build
anchor test
```

#### 5. Vídeo Demonstrativo (Remotion)
```bash
cd demo-video
npm install
npm run dev               # Abre a interface de visualização do Remotion
npx remotion render       # Renderiza o vídeo em arquivo final
```

---

## ⚙️ Configuração de Variáveis de Ambiente

### Backend (`backend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `PORT` | `8080` | Porta HTTP do serviço FastAPI |
| `DATABASE_URL` | `postgresql+asyncpg://greenfield:greenfield@localhost:5432/greenfield` | URL de conexão assíncrona ao PostgreSQL |
| `JWT_SECRET` | `supersecretjwtkey_change_in_production` | Chave simétrica para assinatura de tokens JWT |
| `JWT_EXPIRATION_MINUTES` | `1440` (24 horas) | Tempo de expiração do token de sessão |
| `GITHUB_CLIENT_ID` | `""` | Client ID da GitHub OAuth App |
| `GITHUB_CLIENT_SECRET` | `""` | Client Secret da GitHub OAuth App |
| `GITHUB_REDIRECT_URI` | `http://localhost:8080/api/v1/auth/github/callback` | Callback de autorização registrado no GitHub |
| `GITHUB_WEBHOOK_SECRET` | `""` | Secret de validação de assinatura HMAC dos webhooks do GitHub |
| `SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Endpoint RPC da rede Solana |
| `SOLANA_PROGRAM_ID` | `""` | Public Key do programa Greenfield na Solana |
| `SOLANA_AUTHORITY_SECRET_KEY`| `""` | Chave privada da autoridade backend (habilita modo on-chain Anchor) |
| `CORS_ORIGINS` | `["http://localhost:5173","http://localhost:3000"]` | Origens autorizadas para requisições CORS |
| `ADMIN_GITHUB_USERNAMES` | `["GermanoDevelopment"]` | Lista de usuários GitHub com privilégios administrativos |

### Frontend (`frontend/.env`)

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api/v1` | Endpoint base da API REST do Greenfield |
| `VITE_SOLANA_RPC_URL` | `https://api.devnet.solana.com` | Endpoint RPC utilizado pelas carteiras e listeners Web3 |
| `VITE_SOLANA_CHAIN` | `solana:devnet` | Identificador de cluster da rede Solana |

---

## 📡 Endpoints da API (Backend REST)

Todas as rotas estão sob o prefixo `/api/v1`:

| Categoria | Método | Rota | Descrição |
|---|---|---|---|
| **Health** | `GET` | `/health` | Status de integridade e versão da API |
| **Auth** | `GET` | `/auth/github/login` | Inicia fluxo de redirecionamento para o GitHub OAuth |
| | `GET` | `/auth/github/callback` | Processa o código do GitHub e emite o token de acesso JWT |
| | `GET` | `/auth/me` | Retorna os dados do usuário atualmente autenticado |
| **Users** | `GET` | `/users/me` | Retorna o perfil completo do usuário autenticado |
| | `PATCH` | `/users/me` | Atualiza dados cadastrais e vincula carteira Solana |
| | `GET` | `/users` | Listagem pública de usuários cadastrados |
| | `GET` | `/users/{id}` | Perfil público detalhado de um usuário |
| **Projects** | `POST` | `/projects` | Registra novo projeto/organização |
| | `GET` | `/projects` | Lista projetos ativos |
| | `GET` | `/projects/{id}` | Recupera detalhes de um projeto específico |
| | `PATCH` | `/projects/{id}` | Atualiza configurações de um projeto |
| | `DELETE` | `/projects/{id}` | Remove um projeto |
| **Repositories** | `POST` | `/projects/{id}/repositories` | Vincula repositório do GitHub a um projeto |
| | `GET` | `/projects/{id}/repositories` | Lista repositórios monitorados do projeto |
| | `GET` | `/repositories/{id}` | Detalhes de um repositório |
| | `DELETE` | `/repositories/{id}` | Desvincula repositório |
| | `GET` | `/repositories/{id}/issues` | Lista issues do GitHub disponíveis para criação de bounty |
| **Bounties** | `POST` | `/bounties` | Cria uma nova task monetizada associada a uma issue |
| | `GET` | `/bounties` | Lista bounties com filtros por status, projeto e hunter |
| | `GET` | `/bounties/{id}` | Detalhes completos da bounty e histórico |
| | `PATCH` | `/bounties/{id}/reward` | Atualiza a pontuação/recompensa da bounty (somente se `OPEN`) |
| | `POST` | `/bounties/{id}/apply` | Submete candidatura de desenvolvedor com proposta técnica |
| | `GET` | `/bounties/{id}/applicants` | Lista candidatos que aplicaram para a issue |
| | `POST` | `/bounties/{id}/applicants/{applicant_id}/accept` | Aprova candidato e congela a recompensa (`ASSIGNED`) |
| | `POST` | `/bounties/{id}/assign` | Auto-atribuição direta (legado) |
| | `POST` | `/bounties/{id}/submit` | Submete o Pull Request de solução (`SUBMITTED`) |
| | `POST` | `/bounties/{id}/complete` | Conclui a bounty e dispara liquidação on-chain |
| | `POST` | `/bounties/{id}/reject-submission` | Recusa a solução e reverte status para `ASSIGNED` |
| | `POST` | `/bounties/{id}/claimed` | Registra confirmação de claim assinado on-chain pelo desenvolvedor |
| | `POST` | `/bounties/{id}/cancel` | Cancela uma bounty aberta e devolve a reserva ao Tesouro |
| **Admin** | `GET` | `/admin/stats` | Estatísticas globais do ecossistema e capital alocado |
| | `POST` | `/admin/repositories` | Cadastro de repositório com privilégio de administrador |
| | `POST` | `/admin/bounties/{bounty_id}/review` | Moderação de submissão (Aprovação com payout ou Rejeição) |
| **Webhooks** | `POST` | `/webhooks/github` | Recebe eventos do GitHub (`pull_request.closed` com merge) para liquidação automática |

---

## ⚡ Smart Contract (Solana Anchor)

O smart contract gerencia o cofre de tokens SPL USDC e os estados das recompensas on-chain:

- **Program ID:** `DFebMWgv4WEJgzodxnQwvXavUeFKXT3mPPMXtMrWyoRv`
- **Instruções Principais:**
  - `initialize_treasury`: Cria o Tesouro Comunitário para o mint de USDC e configura a conta de autoridade do backend.
  - `fund_treasury`: Deposita tokens USDC no cofre PDA do Tesouro, expandindo o saldo total disponível para financiamento.
  - `create_bounty`: Reserva o montante em USDC do saldo do Tesouro e associa um identificador único de bounty.
  - `assign_developer`: Registra a chave pública da carteira do desenvolvedor selecionado para a resolução da issue.
  - `approve_claim`: Autoriza a liberação dos fundos após a verificação de merge do Pull Request pelo backend.
  - `claim`: Executada e assinada pelo desenvolvedor para transferir o USDC reservado do cofre PDA diretamente para seu token account associado.
  - `cancel_bounty`: Cancela uma bounty não reivindicada e devolve o montante reservado para o saldo disponível do Tesouro.

---

## 🧪 Qualidade e Testes

### Backend
Para executar a verificação estática de código, formatação e a suíte completa de testes:
```bash
cd backend
uv run ruff check .               # Análise estática de código (Linter)
uv run ruff format --check .      # Validação de formatação de código
uv run pytest                     # Execução de testes unitários e de integração
```

### Frontend
Para verificar a integridade da tipagem TypeScript e a geração do pacote de produção:
```bash
cd frontend
npm run build                     # Validação de tipos TypeScript e build de produção
```

### Smart Contract
Para rodar a suíte de testes de integração on-chain no ambiente local:
```bash
cd contract
anchor test
```

---

## 📄 Licença

Este projeto é desenvolvido para o ecossistema open source sob licença MIT. Consulte os arquivos individuais de cada módulo para termos específicos de dependências.
