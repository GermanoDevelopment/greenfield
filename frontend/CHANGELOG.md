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
