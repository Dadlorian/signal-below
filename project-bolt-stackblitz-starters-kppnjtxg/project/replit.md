# JB PLAYNET BETA

A free-to-play browser arcade where players can launch casual games, track personal bests, and personalize their profile.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/global-arcade/` — the arcade web app
- `artifacts/global-arcade/src/lib/arcade-store.ts` — browser-local profile, friend list, and score persistence

## Architecture decisions

- The initial arcade is a browser-only prototype: profile, friend names, and scores are stored locally; accounts and network multiplayer are not implied.
- Core games remain free. Customization can be offered, but gameplay must not depend on payment; this prototype has no checkout or purchase flow.

## Product

Players can discover and play free casual games, keep personal bests, add local demo friends, challenge a friend in pass-and-play Tic-Tac-Toe, and customize a profile with free options.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
