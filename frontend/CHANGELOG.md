# Changelog

Todas as alterações notáveis deste projeto serão documentadas neste arquivo.

O formato é baseado no [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/)
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

---

## [Não Lançado]

### Planejado
- Integração direta com smart contracts Anchor da Solana via RPC da Mainnet/Devnet.
- Webhook receiver ou GitHub App para sincronização automática em tempo real de PRs e Merges.
- Sistema de reputação on-chain (V2 do roadmap).

---

## [0.3.0] - 2026-09-09

### Adicionado
- **Sidemenu Lateral Persistente (`Sidebar.tsx`)**:
  - Menu lateral persistente em desktop (`w-64`) e gaveta responsiva móvel para usuários autenticados.
  - Indicadores em tempo real: status Solana Devnet e status de conexão FastAPI / Demo Mode.
  - Seletor rápido de personas e perfil de usuário conectado com chave pública truncada.
- **Fluxo Primário do Usuário Conectado**:
  - `RepositoriesPage`: Listagem de repositórios GitHub sincronizados para tracking de bounties.
  - `RepositoryIssuesPage`: Listagem de issues com cálculo canônico de pontuações (1 pt = 1 USDC), modal de candidatura técnica (Apply) e submissão de Pull Request para tarefas atribuídas.
  - `MyRewardsPage`: Extrato de recompensas concluídas com link direto para o Solana Explorer Devnet (`https://explorer.solana.com/tx/...`).
  - `ProfilePage`: Gerenciamento do perfil de desenvolvedor e sincronização da carteira Solana via `PATCH /api/v1/users/me`.
- **Painel de Governança e Administração (`AdminPage.tsx`)**:
  - Visão Geral & Stats: Métricas consolidadas de repositórios, bounties e USDC liquidado on-chain.
  - Gerenciamento de Repositórios: Cadastro de novos projetos e repositórios via `POST /api/v1/admin/repositories`.
  - Gerenciamento de Rewards por Issue: Ajuste de pontuação para bounties `OPEN` antes da atribuição.
  - Fila de Moderação: Fluxo de aprovação (liquidação on-chain via Devnet) e rejeição com parecer técnico (reversão para `ASSIGNED`).

---

## [0.2.0] - 2026-09-08

### Adicionado
- **Integração com Branch Develop**:
  - Suporte ao tema Dark Mode completo com tokens de cor e layout de navbar aprimorado.
  - Conexão de carteira Solana multi-provedores com `@solana/react` e `@solana/kit-plugin-wallet` através do componente `WalletButton`.
  - Página de Configurações (`SettingsPage`) para ajuste de rede e parâmetros de carteira.
  - Indicador de pulso on-chain no Navbar exibindo a rede conectada (`Solana Devnet`).
  - Suíte de documentação Solana Developer em `.agents/skills/solana-dev`.
- **Ponte de Comunicação com Backend FastAPI**:
  - Cliente tipado `greenfieldApi` em `src/services/api.ts` cobrindo todos os endpoints REST de projetos, múltiplos repositórios, issues, bounties e candidatos.
  - Repositório híbrido `HybridBountyRepository` com verificação de conectividade com a API (`checkConnectivity`), consumo dinâmico dos endpoints FastAPI e fallback para o armazenamento local em modo offline/demo.
  - Indicador em tempo real de status da API no Navbar (`API Live` vs `Demo Mode`).
- **Orquestração Docker Monorepo Completa**:
  - `frontend/Dockerfile` com compilação multi-stage (`node:20-alpine` + `nginx:alpine`).
  - `frontend/nginx.conf` configurado com suporte a HTML5 History mode e proxy reverso para `/api/v1/` e `/docs`.
  - Atualização do `docker-compose.yml` para orquestrar PostgreSQL, FastAPI backend e Frontend React em um único comando (`docker compose up -d`).

---

## [0.1.0] - 2026-09-05

### Adicionado
- **Identidade Visual Oficial da Marca**:
  - Paleta de cores corporativa integrada ao Tailwind, CSS global e Design Tokens do Desygen:
    - `#D9EED6` (Mint / Light): textos de suporte e badges sutis.
    - `#28B110` (Primary Green): botões de ação (CTA), acentos e estados ativos.
    - `#1B1E1A` (Dark Background): plano de fundo padrão e superfícies escuras.
    - `#145907` (Forest Accent): gradientes e estados hover.
  - Componente átomo `BrandBanner` com o ativo oficial `public/Icon-banner.png`.
  - Logo oficial `public/Icon-only.png` adicionado à barra de navegação (`Navbar`) e ao cabeçalho principal (`LandingHero`).
  - Suíte completa de favicons em `public/favicon/` (`favicon.ico`, `16x16`, `32x32`, `apple-touch-icon`, `android-chrome`).

- **SEO & Indexação**:
  - Metadados semânticos completos em `index.html` (OpenGraph, Twitter Cards, descrição e tema).
  - Arquivo de mapa do site `public/sitemap.xml`.
  - Diretrizes para robôs de busca em `public/robots.txt`.

- **Landing Page Singular e Otimizada**:
  - Redesenho completo com densidade equilibrada em 4 blocos limpos:
    1. *Hero com Banner e CTAs*: headline com a proposta central e botões diretos para acesso como Mantenedor ou Desenvolvedor.
    2. *Visão Geral em 3 Passos*: `Issue & Recompensa → Merge Obrigatório → Claim On-Chain`.
    3. *Calculadora de Pontos*: conversão canônica rápida (`100 pontos = $1 USDC`) com presets rápidos (100 a 10.000 pts).
    4. *Chamada Final de Ação (CTA)*: direcionamento para exploração das recompensas ativas.

- **Arquitetura Limpa e Invariantes de Negócio**:
  - **Domínio (`src/core/domain/`)**: tipos fortes e contratos de repositório para `Bounty`, `Repository`, `Issue`, `User`, `PullRequest`, `TreasuryPool` e `Claim`.
  - **Casos de Uso & 4 Invariantes (`src/core/usecases/bountyUseCases.ts`)**:
    - *Invariante 1*: `PR aberto ≠ Recompensa liberada` (Merge obrigatório).
    - *Invariante 2*: Imutabilidade da recompensa após atribuição (`valor_inicial == valor_final`).
    - *Invariante 3*: Prevenção criptográfica de double-claim (`claimed == false`).
    - *Invariante 4*: Garantia de solvência do tesouro com teto de $25.000 USDC.
  - **Infraestrutura (`src/infrastructure/`)**:
    - Persistência desacoplada em `localStorage` para navegação e testes interativos.
    - Dados iniciais demonstrativos baseados nos cenários de Alice, Bob e Carol.
    - Mocks do serviço de GitHub e integração com carteiras Solana Devnet com link direto para o Solana Explorer.

- **Design System & Componentes (`desygen`)**:
  - Integração da biblioteca de componentes `desygen` (`DesygenButton`, `DesygenInput`, `design.system.json`).
  - Componentes atômicos e templates para consistência visual.

- **Fluxos da Aplicação**:
  - `DashboardPage`: alternância dinâmica entre papéis de Mantenedor e Desenvolvedor.
  - `CreateBountyPage`: formulário para criação de issues com reserva de tesouro.
  - `BountyDetailsPage`: simulação completa do ciclo de vida com abertura de PR, merge e validação das regras.
  - `MyContributionsPage`: listagem de issues atribuídas ao desenvolvedor logado.
  - `ClaimPage`: resgate assinado on-chain com envio de USDC para a wallet conectada.
  - `PaymentHistoryPage`: histórico e recibos das transações liquidadas na Solana.
