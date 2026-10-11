# Contributing to Greenfield

> [!IMPORTANT]
> **Contributions to this repository are voluntary and unpaid.** Greenfield is an MVP for a Solana hackathon and does not pay anyone yet. The issues in this repository are our MVP backlog, not bounties.

## What Greenfield pays for, and what it does not

Greenfield is a platform that rewards people who contribute to **open source projects listed on it**. A maintainer funds a bounty on an issue of their project, and a confirmed merge pays USDC to the contributor (see [How it works](README.md#how-it-works)).

The Greenfield codebase is not one of those projects. Opening a PR here does not earn a reward, and no payout is planned for past or future PRs to this repository. Payouts today run on Solana devnet for demos only.

If you are happy to help anyway, thank you. This is how to do it.

## Workflow

1. **Pick or propose an issue.** Comment on it before starting anything large, so we do not duplicate work.
2. **Check open PRs** for the same issue. One PR per issue; if one already exists, review or comment on it instead.
3. **Branch from `develop`** and open the PR **against `develop`**, not `main`.
4. **Reference the issue** in the PR description (`closes #N`).
5. **Keep it small and focused.** Large changes that mix unrelated fixes are slow to review.

## Before you open a PR

Setup commands are in the [README](README.md#quickstart). Run the checks for the area you changed.

Backend (`backend/`):

```bash
uv run pytest
uv run ruff check .
uv run ruff format --check .
```

Frontend (`frontend/`):

```bash
npm run lint
npm run build
```

In the PR description, say what you changed and how you tested it. For backend changes that add a migration, check that Alembic still has a single head.

## Commit messages

We use [Conventional Commits](https://www.conventionalcommits.org/), for example `fix(frontend): correct USDC unit display` or `feat(backend): paginate GET /bounties`.

## Questions

Open an issue or comment on the relevant PR.
