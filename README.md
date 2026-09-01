# 🌱 Greenfield

> Transforme contribuições open source em recompensas instantâneas na Solana.

**Repositório:** [github.com/GermanoDevelopment/greenfield](https://github.com/GermanoDevelopment/greenfield)

Issue → PR → Merge → USDC.

---

## 🏗️ Estrutura do Repositório

```
greenfield/
├── backend/                                   # Golang (API + Worker)
├── frontend/                                  # React + Vite + TS + Tailwind + Solana Wallets
├── contract/                                  # Solana Anchor Program
├── docker-compose.yml                         # Postgres Database
└── README.md
```

---

## 🚀 Como Executar

### 1. Pré-requisitos
- Docker & Docker Compose
- Go 1.22+
- Node.js 20+ & npm
- Solana CLI & Rust / Anchor

### 2. Infraestrutura Local (Postgres)
```bash
docker compose up -d
```

### 3. Backend (Go API)
```bash
cd backend
go run cmd/api/main.go
```

### 4. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

### 5. Smart Contract (Solana Anchor)
```bash
cd contract
anchor build
anchor test
```
