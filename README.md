# LumaLedger AI

LumaLedger AI is a personal finance web app built as a React and Express monorepo. This repository contains Phase 1, the local product preview and API foundation.

## Run locally

Use Node.js 24 LTS and pnpm 11.25.0. From the repository root:

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

- [Landing page](http://127.0.0.1:5174/)
- [Interactive dashboard preview](http://127.0.0.1:5174/demo)
- [Registration layout](http://127.0.0.1:5174/register)
- [API health](http://127.0.0.1:4000/api/health)

`pnpm dev:client` and `pnpm dev:server` also run the workspaces independently. The API defaults to loopback. Set `WEB_PORT`, `PORT`, and `CLIENT_ORIGINS` in the root environment file if local ports or origins change. Leave `VITE_API_ORIGIN` blank to use Vite’s development and preview proxy.

## What you can try

- Open the dashboard preview, switch reporting periods, and add a sample expense or income entry. The overview, account balances, reports, and applicable budget alerts recalculate from the sample ledger. Entries live in memory and reset when you reload or exit the workspace.
- Use the search button or Cmd/Ctrl+K to find transactions and navigate. The transaction view offers search, type filters, sorting, pagination, detail dialogs, and CSV export of matching rows.
- Toggle the light or dark theme. The browser remembers the preference. The settings screen can query the real Express health endpoint.
- Open the sign-in, registration, and password recovery layouts. These validate example form inputs locally. Live registration, sessions, and password recovery are Phase 2 work.

## Architecture

| Location | Responsibility |
| --- | --- |
| `client/src/app` | Router, lazy-loaded screens, query client, theme, and error boundary |
| `client/src/components/ui` | Source-owned shadcn-style buttons and Radix dialogs |
| `client/src/features/landing` | Product site and illustrative dashboard mockup |
| `client/src/features/auth` | React Hook Form and Zod auth layout previews |
| `client/src/features/demo` | Isolated sample ledger, money arithmetic, Recharts, and preview navigation |
| `server/src` | Express API, config validation, CORS allowlist, Helmet, request IDs, structured logging, and JSON errors |
| `client/tests`, `server/tests` | Ledger calculations and HTTP contract tests |
| `.github/workflows/ci.yml` | Install, lint, type check, test, and production build |

The demo ledger stores amounts as integer paise and formats currency at the display boundary. Calendar ranges use the browser’s local date. Month-to-date comparisons use the same elapsed window in the preceding month where possible. Sample data is isolated inside the `/demo` routes. Spending insights in this phase are deterministic calculations, and the dashboard performs no external AI processing.

The API logs request IDs, methods, status codes, and timings. It omits headers, query strings, and submitted bodies from request logs. Health is a lightweight liveness endpoint. The rate limiter is in-memory for the initial single-instance API. A multi-instance deployment can add a shared limiter when protected routes are introduced.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The server integration tests open temporary loopback ports. The production artifacts are `client/dist` and `server/dist`. Start the compiled API with `pnpm start`. To serve the client build for a local production smoke test, run `pnpm --filter @lumaledger/client preview` and open [port 4173](http://127.0.0.1:4173/).

## Deploy the Phase 1 preview

1. Build the client with `pnpm --filter @lumaledger/client build` and publish `client/dist` on a static host. Configure SPA fallback to `index.html` for routes such as `/demo/reports` and `/register`.
2. Build the API with `pnpm --filter @lumaledger/server build` and start with `pnpm start`. Set `HOST=0.0.0.0`, use the platform-provided `PORT`, and set `CLIENT_ORIGINS` to the frontend HTTPS origin. Configure the exact proxy hop count if needed for the chosen host.
3. Set `VITE_API_ORIGIN` to the API’s HTTPS origin at client build time, or route `/api` through a same-origin proxy. Check `GET /api/health` and the connection status in preview settings.

## Remaining phases

Phase 2 requires a Supabase project or a local Supabase stack, its project URL and publishable key, auth redirect configuration, versioned database migrations, and RLS isolation verification. The Supabase entries in `.env.example` are reserved for that phase. Use the [Supabase API key guide](https://supabase.com/docs/guides/getting-started/api-keys) when connecting the client. Keep all secret credentials and paid provider API keys on the server.

After auth and data isolation, the implementation sequence is core finance, financial planning, provider-backed AI, and production hardening. A configured AI or document extraction provider is a later prerequisite for provider-backed features. This preview has been verified locally.
