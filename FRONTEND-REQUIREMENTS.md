# GREENFIELD — Projeto de Plataforma MVP

## 1. Visão geral

O GREENFIELD propõe transformar contribuições open-source em recompensas financeiras pagas instantaneamente em USDC na Solana.

**Proposta central:**

> Issue → PR → Merge → USDC

O MVP deve conectar o fluxo natural de desenvolvimento no GitHub a um mecanismo simples de recompensa financeira, reduzindo a burocracia de programas tradicionais de grants e bounties.

**Fonte-base:** documento conceitual do projeto GREENFIELD. fileciteturn0file0L3-L11

---

# 2. Análise do conceito

## 2.1 Problema

O projeto parte de três problemas principais:

1. Issues importantes permanecem abertas durante meses por falta de incentivo.
2. Programas tradicionais de grants/bounties são burocráticos e ficam separados do fluxo natural do GitHub.
3. Desenvolvedores têm pouco incentivo financeiro para contribuir com projetos que ainda não conhecem.

O ponto mais forte do problema é a combinação entre **descoberta do trabalho no GitHub, execução da contribuição e pagamento**, sem exigir que o desenvolvedor abandone esse fluxo.

**Fonte:** fileciteturn0file0L6-L11

## 2.2 Proposta de valor

Para o mantenedor:

- conectar GitHub e wallet Solana;
- selecionar uma Issue;
- definir uma recompensa;
- atribuir a recompensa a um desenvolvedor;
- ter a liberação condicionada ao merge.

Para o desenvolvedor:

- encontrar uma contribuição financiada;
- resolver a Issue;
- abrir o PR;
- receber após o merge;
- fazer o Claim diretamente para sua wallet Solana.

**Fonte:** fileciteturn0file0L12-L22

## 2.3 Diferencial

O diferencial técnico não é simplesmente pagar bounties em cripto. É separar responsabilidades:

**Backend**
- OAuth do GitHub;
- Webhooks;
- validação dos PRs;
- controle do fluxo da aplicação.

**Programa Solana / Smart Contract**
- Tesouro;
- reserva de USDC;
- autorização do Claim;
- prevenção de double-claim.

Isso permite que o backend determine que uma contribuição foi verificada, mas que o pagamento seja efetivamente assinado pelo desenvolvedor em uma transação on-chain.

**Fonte:** fileciteturn0file0L35-L41

---

# 3. Escopo do MVP

O MVP deve ser deliberadamente pequeno.

## 3.1 Atores

### Mantenedor

Responsável por:

- autenticar com GitHub;
- conectar wallet Solana;
- selecionar repositório;
- selecionar Issue;
- criar bounty;
- definir quantidade de pontos;
- atribuir a um desenvolvedor;
- aprovar/mergear o PR;
- acompanhar o estado da recompensa.

### Desenvolvedor

Responsável por:

- autenticar com GitHub;
- conectar wallet Solana;
- visualizar bounties atribuídas;
- resolver Issue;
- abrir PR;
- aguardar validação;
- realizar Claim;
- assinar a transação USDC.

### Tesouro

No MVP, o financiamento vem de um Tesouro Comunitário. O documento prevê um pool inicial de US$ 25.000.

**Fonte:** fileciteturn0file0L23-L29

---

# 4. Fluxo funcional principal

## Estado 1 — Criação

1. Mantenedor conecta GitHub.
2. Mantenedor conecta wallet Solana.
3. Plataforma carrega os repositórios autorizados.
4. Mantenedor seleciona uma Issue.
5. Define a recompensa em pontos.
6. Sistema verifica saldo disponível.
7. Bounty é criada.

## Estado 2 — Aceitação

1. Mantenedor atribui a Issue a um desenvolvedor.
2. Sistema registra o valor da recompensa.
3. O valor torna-se imutável.

**Regra:** depois que o desenvolvedor aceita, a recompensa não pode ser reduzida.

## Estado 3 — Desenvolvimento

1. Desenvolvedor trabalha na Issue.
2. Desenvolvedor abre PR.
3. Plataforma acompanha o PR por integração com GitHub.

## Estado 4 — Verificação

1. Mantenedor revisa o PR.
2. Mantenedor faz o merge.
3. Webhook do GitHub informa o merge.
4. Backend valida os critérios.
5. Recompensa muda para `CLAIMABLE`.

**Importante:** abrir o PR não libera o pagamento; somente o merge libera a recompensa.

**Fonte:** fileciteturn0file0L50-L54

## Estado 5 — Claim

1. Desenvolvedor acessa a bounty.
2. Visualiza o valor em USDC.
3. Clica em `CLAIM`.
4. Wallet solicita assinatura.
5. Transação é executada na Solana.
6. Sistema registra o Claim.
7. Interface apresenta o comprovante/assinatura da transação.

---

# 5. Sistema de pontos

O projeto define:

**100 pontos = 1 USDC**

Os pontos não são tokens ou criptomoedas. São apenas uma unidade contábil interna.

Exemplos:

| Pontos | USDC |
|---:|---:|
| 100 | $1 |
| 500 | $5 |
| 1.000 | $10 |
| 5.000 | $50 |
| 10.000 | $100 |

O fluxo financeiro é:

**Contribuição verificada → Pontos → Claim → USDC**

**Fonte:** fileciteturn0file0L30-L34

---

# 6. Arquitetura proposta para o MVP

```text
                         ┌────────────────────┐
                         │      GitHub        │
                         │ Issues / PRs / API │
                         └─────────┬──────────┘
                                   │
                              OAuth/Webhook
                                   │
                                   ▼
┌──────────────┐          ┌────────────────────┐
│ Mantenedor   │─────────▶│   GREENFIELD API   │
└──────────────┘          │      Backend       │
                          │                    │
┌──────────────┐          │ Bounties           │
│ Desenvolvedor│─────────▶│ Users              │
└──────────────┘          │ Verification       │
                          │ Claims              │
                          └─────────┬──────────┘
                                    │
                           autorização financeira
                                    │
                                    ▼
                          ┌────────────────────┐
                          │ Solana Program     │
                          │ / Anchor           │
                          └─────────┬──────────┘
                                    │
                                    ▼
                             ┌────────────┐
                             │ USDC Vault │
                             │ / Treasury │
                             └────────────┘
                                    │
                                    ▼
                             Wallet do Dev
```

---

# 7. Componentes do sistema

## 7.1 Frontend

Responsabilidades:

- Login com GitHub;
- conexão da wallet;
- dashboard do mantenedor;
- dashboard do desenvolvedor;
- criação de bounty;
- acompanhamento de status;
- tela de Claim;
- histórico de recompensas;
- link para Explorer.

### Telas mínimas

1. Landing page
2. Login / conexão
3. Dashboard
4. Criar bounty
5. Detalhes da bounty
6. Minhas contribuições
7. Claim
8. Histórico de pagamentos

---

## 7.2 Backend

O documento propõe Python como base do backend.

Responsabilidades:

- GitHub OAuth;
- integração com GitHub;
- recebimento de Webhooks;
- validação de Issue/PR;
- gerenciamento de usuários;
- gerenciamento de bounties;
- controle de estados;
- registro de eventos;
- geração/validação dos dados necessários ao Claim.

O backend **não deve ser responsável por custodiar o USDC do desenvolvedor**.

---

## 7.3 GitHub Integration

Eventos essenciais:

```text
Issue criada/selecionada
        ↓
Bounty associada
        ↓
Dev atribuído
        ↓
PR aberto
        ↓
PR merged
        ↓
Webhook
        ↓
GREENFIELD valida
        ↓
Bounty = CLAIMABLE
```

No MVP, o evento crítico é o **merge**.

---

# 8. Modelo de dados

## User

```text
id
github_id
github_username
wallet_address
role
created_at
```

## Repository

```text
id
github_repository_id
owner
name
github_url
maintainer_user_id
```

## Issue

```text
id
github_issue_id
repository_id
number
title
url
status
```

## Bounty

```text
id
issue_id
maintainer_id
developer_id
points
usdc_amount
status
created_at
accepted_at
merged_at
claimed_at
```

## Pull Request

```text
id
bounty_id
github_pr_id
number
url
author_github_id
merged
merged_at
```

## Claim

```text
id
bounty_id
developer_id
wallet_address
usdc_amount
transaction_signature
status
created_at
```

---

# 9. Máquina de estados da bounty

A bounty deve possuir estados explícitos.

```text
DRAFT
  ↓
FUNDED
  ↓
ASSIGNED
  ↓
IN_PROGRESS
  ↓
PR_OPEN
  ↓
MERGED
  ↓
CLAIMABLE
  ↓
CLAIMED
```

Estados de exceção:

```text
CANCELLED
EXPIRED
VERIFICATION_FAILED
CLAIM_FAILED
```

### Regras

- `DRAFT`: ainda não publicada.
- `FUNDED`: existe saldo suficiente.
- `ASSIGNED`: desenvolvedor definido.
- `IN_PROGRESS`: desenvolvedor aceitou.
- `PR_OPEN`: PR associado.
- `MERGED`: GitHub confirmou merge.
- `CLAIMABLE`: recompensa validada e pronta para saque.
- `CLAIMED`: USDC transferido.
- `CANCELLED`: encerrada sem pagamento.
- `CLAIM_FAILED`: tentativa de pagamento que precisa ser reprocessada.

---

# 10. Smart Contract

O contrato deve ter o menor escopo possível no MVP.

## Responsabilidades

- armazenar/configurar o Tesouro;
- manter reserva de USDC;
- registrar bounties autorizadas;
- permitir Claim;
- impedir double-claim;
- garantir que o valor autorizado seja respeitado.

## Não colocar no contrato

Evitar transformar o smart contract em um sistema de GitHub.

O contrato não precisa:

- consultar GitHub;
- interpretar PR;
- analisar código;
- decidir se um PR foi bom;
- gerenciar OAuth;
- administrar interface.

Essas responsabilidades permanecem fora da blockchain.

---

# 11. Segurança e invariantes

As regras de negócio devem ser tratadas como invariantes do sistema.

### Invariante 1 — Merge obrigatório

```text
PR aberto ≠ recompensa liberada
PR merged = condição necessária para liberação
```

### Invariante 2 — Valor imutável

Após a aceitação da bounty:

```text
valor_inicial == valor_final
```

O mantenedor não pode reduzir o valor.

### Invariante 3 — Double-claim

```text
claimed == false
```

é condição necessária para executar Claim.

Após sucesso:

```text
claimed = true
```

### Invariante 4 — Tesouro solvente

Não permitir criação de bounty quando não existir saldo suficiente.

**Fonte das regras:** fileciteturn0file0L50-L54

---

# 12. Dashboard do MVP

## Mantenedor

### Cards

- Saldo do Tesouro
- Bounties ativas
- Bounties em desenvolvimento
- Bounties aguardando merge
- Total pago

### Lista

```text
Issue       Dev       Reward       Status
#123        alice     5.000 pts    In Progress
#127        bob       2.500 pts    PR Open
#131        carol     10.000 pts   Claimable
```

## Desenvolvedor

### Cards

- Bounties atribuídas
- Em desenvolvimento
- Claimable
- Total recebido

### Ação principal

Quando disponível:

```text
CLAIM $50 USDC
```

A simplicidade dessa tela é importante para preservar o impacto da demonstração.

---

# 13. UX principal

O MVP deve evitar transformar a plataforma em um marketplace complexo.

A experiência ideal é:

```text
GitHub
   ↓
Issue financiada
   ↓
Dev resolve
   ↓
PR
   ↓
Merge
   ↓
GREENFIELD
   ↓
CLAIM
   ↓
Wallet
   ↓
USDC
```

A interface deve tornar esse fluxo visualmente evidente.

---

# 14. Demo / Pitch

A demonstração descrita no projeto é também uma excelente definição de **happy path do MVP**.

## Roteiro

1. Abrir uma Issue real no GitHub.
2. Mostrar a badge de recompensa.
3. Mostrar o desenvolvedor pegando a Issue.
4. Abrir o PR.
5. Fazer o Merge.
6. Voltar ao dashboard.
7. Mostrar:

```text
CLAIM $50 USDC
```

8. Clicar.
9. Assinar na wallet.
10. Abrir o Solana Explorer.
11. Mostrar a transação real.

O clímax da demonstração é a confirmação on-chain.

**Fonte:** fileciteturn0file0L42-L49

---

# 15. O que NÃO construir no MVP

Para preservar foco, os seguintes recursos devem ficar fora da primeira versão:

- marketplace aberto;
- sistema complexo de reputação;
- IA de classificação;
- múltiplos patrocinadores;
- token próprio;
- governança DAO;
- ranking global;
- sistema avançado de descoberta;
- análise automática de qualidade do código;
- pagamentos em múltiplas criptomoedas.

Esses elementos pertencem à visão futura.

O próprio projeto prevê evolução posterior para reputação, bounties abertas, IA e múltiplos patrocinadores. fileciteturn0file0L55-L59

---

# 16. Roadmap

## MVP

**Objetivo:** provar que o ciclo financeiro funciona.

```text
GitHub
+
Bounty
+
Dev atribuído
+
PR
+
Merge
+
Claim
+
USDC
```

## V2 — Reputação

Separar:

- reputação técnica;
- reputação econômica.

## V3 — Bounties abertas

Modelo:

```text
Issue
  ↓
Bounty aberta
  ↓
vários desenvolvedores
  ↓
primeiro PR válido
  ↓
recompensa
```

## V5 — IA

IA para:

- classificação de dificuldade;
- avaliação de qualidade do PR.

## V6 — Multi-patrocinadores

Possibilidade de:

```text
Superteam
+
Fundação
+
DAOs
      ↓
Pool compartilhado
```

**Fonte:** fileciteturn0file0L55-L59

---

# 17. Métricas do MVP

O projeto ainda não define métricas no documento-base. Para projetar o MVP, recomenda-se acompanhar:

## Ativação

- mantenedores conectados;
- desenvolvedores conectados;
- repositórios conectados;
- primeira bounty criada.

## Execução

- bounties criadas;
- bounties aceitas;
- PRs abertos;
- PRs merged;
- tempo médio Issue → Merge.

## Financeiro

- pontos distribuídos;
- USDC disponibilizado;
- USDC reivindicado;
- taxa de Claim;
- número de pagamentos concluídos.

## Saúde do sistema

- webhooks processados;
- falhas de validação;
- falhas de transação;
- tentativas de double-claim bloqueadas.

---

# 18. Critérios de sucesso do MVP

O MVP pode ser considerado validado quando conseguir executar de ponta a ponta, de forma confiável:

```text
Mantenedor conecta GitHub
        ↓
Conecta wallet
        ↓
Cria bounty
        ↓
Atribui dev
        ↓
Dev abre PR
        ↓
Mantenedor faz merge
        ↓
Webhook detecta merge
        ↓
Bounty vira CLAIMABLE
        ↓
Dev assina
        ↓
USDC chega à wallet
        ↓
Transação aparece no Explorer
```

O principal indicador não é quantidade de funcionalidades, mas a capacidade de executar esse ciclo sem intervenção manual.

---

# 19. Riscos que precisam ser resolvidos no design

## 19.1 Identidade GitHub ↔ Wallet

O sistema precisa estabelecer claramente como uma conta GitHub fica associada a uma wallet Solana.

## 19.2 Autoridade para criar bounty

Deve existir uma verificação de que o usuário realmente possui permissão sobre o repositório.

## 19.3 Verificação do merge

O webhook não deve ser tratado isoladamente como prova suficiente sem validação de autenticidade e consistência do evento.

## 19.4 Alterações posteriores

É necessário definir o comportamento quando:

- PR é revertido;
- branch é alterada;
- Issue é fechada sem merge;
- mantenedor tenta cancelar uma bounty;
- desenvolvedor perde acesso à wallet.

## 19.5 Falhas on-chain

O sistema precisa distinguir:

```text
Recompensa validada
≠
Transação executada
```

Uma falha de transação não pode resultar em perda do direito ao Claim.

---

# 20. Decisões de produto

## Decisão 1

**GitHub é a origem do trabalho.**

GREENFIELD não precisa substituir o GitHub.

## Decisão 2

**Solana é a camada financeira.**

A blockchain entra onde gera valor concreto: custódia/autorização e pagamento.

## Decisão 3

**O backend coordena; o contrato protege o pagamento.**

Essa separação reduz a complexidade do MVP.

## Decisão 4

**Pontos são contabilidade, não ativo financeiro.**

O sistema trabalha internamente com pontos e converte o valor no momento do pagamento.

## Decisão 5

**Merge é o gatilho de validação.**

A recompensa não depende apenas de atividade do desenvolvedor, mas da integração efetiva da contribuição ao projeto.

---

# 21. Backlog inicial

## Epic 1 — Autenticação

- [ ] GitHub OAuth
- [ ] criação de usuário
- [ ] conexão wallet
- [ ] associação GitHub ↔ wallet

## Epic 2 — GitHub

- [ ] listar repositórios
- [ ] listar Issues
- [ ] selecionar Issue
- [ ] identificar permissões do mantenedor
- [ ] receber Webhooks
- [ ] consultar PR
- [ ] detectar merge

## Epic 3 — Bounties

- [ ] criar bounty
- [ ] definir pontos
- [ ] validar saldo
- [ ] atribuir desenvolvedor
- [ ] congelar valor
- [ ] acompanhar estado

## Epic 4 — Solana

- [ ] criar/configurar Tesouro
- [ ] depositar USDC
- [ ] reservar fundos
- [ ] autorizar Claim
- [ ] impedir double-claim
- [ ] registrar assinatura da transação

## Epic 5 — Dashboard

- [ ] dashboard do mantenedor
- [ ] dashboard do desenvolvedor
- [ ] detalhes da bounty
- [ ] status do Claim
- [ ] histórico

## Epic 6 — Demo

- [ ] Issue real
- [ ] bounty
- [ ] PR
- [ ] merge
- [ ] Claim
- [ ] Explorer

---

# 22. Arquitetura lógica final

```text
                    GREENFIELD MVP

       ┌──────────────────────────────┐
       │           GITHUB             │
       │                              │
       │ Issues ─── PRs ─── Merge     │
       └──────────────┬───────────────┘
                      │
                 OAuth/Webhook
                      │
                      ▼
       ┌──────────────────────────────┐
       │          BACKEND             │
       │                              │
       │ Users                        │
       │ Repositories                 │
       │ Bounties                     │
       │ Verification                 │
       │ Claims                       │
       └──────────────┬───────────────┘
                      │
              Claim Authorization
                      │
                      ▼
       ┌──────────────────────────────┐
       │      SOLANA PROGRAM          │
       │                              │
       │ Treasury                     │
       │ USDC Reserve                 │
       │ Claim                        │
       │ Anti Double-Claim            │
       └──────────────┬───────────────┘
                      │
                      ▼
                 DEV WALLET
                      │
                      ▼
                    USDC
```

---

# 23. Definição do MVP em uma frase

> **GREENFIELD é uma camada de incentivo financeiro sobre o GitHub que transforma uma Issue atribuída e efetivamente merged em uma recompensa USDC resgatável diretamente na wallet Solana do desenvolvedor.**

---

# 24. Princípio de produto

O MVP deve ser guiado por uma única pergunta:

> **Conseguimos transformar uma contribuição real no GitHub em USDC na wallet do desenvolvedor, de maneira verificável, automática e sem double-claim?**

Se a resposta for sim, o núcleo do GREENFIELD está validado.

