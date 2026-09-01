# YOLO — AI Travel Agent

Monorepo for the YOLO AI travel agent application.

## Structure

```
├── frontend/     React 19 + Vite + Tailwind
├── backend/      Fastify API server
├── prisma/       PostgreSQL schema & migrations
├── tests/        Unit, integration, e2e, AI evaluation
└── docs/         Architecture & feature documentation
```

## Prerequisites

- Node.js 18+
- PostgreSQL 16 (or Docker via `docker-compose up -d`)

## Setup

```bash
cp .env.example .env
# Edit .env with your credentials

docker compose up -d   # optional: start Postgres

npm install
npm run db:generate
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Health: http://localhost:3001/api/health

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend + backend |
| `npm run build` | Build both apps |
| `npm run lint` | Lint frontend + backend |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright e2e tests |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database |

## Documentation

| Document | Description |
|----------|-------------|
| [docs/architecture.md](./docs/architecture.md) | **Architecture & engineering (Milestone 21.2)** — system design, AI, pipelines, diagrams |
| [docs/authentication.md](./docs/authentication.md) | Auth flows and endpoints |
| [docs/database.md](./docs/database.md) | Prisma models and seed data |
| [docs/ai-agents.md](./docs/ai-agents.md) | AI agent reference |
| [docs/security.md](./docs/security.md) | Security controls |
| [docs/payments.md](./docs/payments.md) | Razorpay test integration |
| [docs/evaluation.md](./docs/evaluation.md) | AI evaluation scenarios |

## Legacy Code

The original Travel Bucket List SPA is preserved at `frontend/src/legacy/` for reference during migration.
