# Atelier

One repository, two independent applications:

| Directory | Application | Package manager |
| --- | --- | --- |
| `frontend/` | Next.js | npm (`package-lock.json`) |
| `backend/` | NestJS + Prisma 8 | pnpm (`pnpm-lock.yaml`) |
| `atelier-containers/` | Local PostgreSQL configuration | Docker Compose |

Use Node.js 24, as declared in `.node-version`. Run Git commands from this directory. Each application keeps its own dependencies, environment and start command; workspaces are not required.

## Local development

Frontend, in its own terminal:

```sh
cd frontend
npm ci
npm run dev
```

Backend, in another terminal:

```sh
cd backend
pnpm install --frozen-lockfile
cp .env.example .env
# Configure DATABASE_URL in .env before using the database.
pnpm run contract:emit
pnpm run start:dev
```

Frontend uses port 3000; backend defaults to port 3001. Do not overwrite an existing `.env` when following the setup example.

## Independent CI

GitHub Actions runs on pull requests and pushes to `main`. Each workflow can also be run manually from Actions.

- Frontend changes run `.github/workflows/frontend.yml`: locked install, lint and TypeScript.
- Backend changes run `.github/workflows/backend.yml`: locked install, Prisma contract emission, lint, TypeScript, unit tests and HTTP end-to-end tests.
- Changes to a workflow run that workflow. Changes to the shared Node version or line-ending rules run both. Container changes run backend checks.
- A backend-only change does not run frontend checks, and vice versa. Production builds and compiled-server startup checks are not run in CI.

Backend CI uses a placeholder DATABASE_URL for offline contract emission. The current HTTP tests use the starter API and need no database. Add an isolated PostgreSQL service when tests start exercising persistence. CI never migrates a development or production database.

Run the same checks locally:

```sh
# frontend/
npm run lint
npm run typecheck

# backend/
pnpm run contract:emit
pnpm run lint:check
pnpm run typecheck
pnpm test --runInBand
pnpm run test:e2e --runInBand
```

`pnpm run lint` fixes backend lint issues locally; CI uses `lint:check` so it cannot silently repair files. Generated Prisma declarations are excluded from ESLint, but Prisma emission and TypeScript still check the contract integration.

## Deployment

These workflows implement CI, not automatic deployment. Choose the frontend/backend hosting targets before adding deployment jobs and GitHub environment secrets. Deploy each application from its own directory after its checks pass.

Path-filtered workflows can remain pending if configured as mandatory checks for unrelated changes. Before enabling branch protection, introduce always-running gate jobs or a central change-detection workflow. The workflows alone do not block direct pushes to `main`.

## Git history backup

The original `frontend/.git` and `backend/.git` metadata are preserved locally in `.git-backups/frontend.git` and `.git-backups/backend.git`, excluded from this repository. The root repository tracks both applications as ordinary directories. No application files or previous Git history were deleted.
