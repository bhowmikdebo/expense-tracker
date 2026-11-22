# LumaLedger AI

LumaLedger AI is a personal finance web app built as a React and Express monorepo. The app includes live Supabase accounts and a separate finance dashboard preview.

## Run locally

Use Node.js 24 LTS and pnpm 11.25.0. From the repository root:

```sh
pnpm install --frozen-lockfile
cp -n .env.example .env
pnpm dev
```

- [Landing page](http://127.0.0.1:5174/)
- [Interactive dashboard preview](http://127.0.0.1:5174/demo)
- [Create an account](http://127.0.0.1:5174/register)
- [API health](http://127.0.0.1:4000/api/health)

`pnpm dev:client` and `pnpm dev:server` also run the workspaces independently. The API defaults to loopback. Set `WEB_PORT`, `PORT`, and `CLIENT_ORIGINS` in the root environment file if local ports or origins change. Leave `VITE_API_ORIGIN` blank to use Vite’s development and preview proxy.

## What you can try

- Open the dashboard preview, switch reporting periods, and add a sample expense or income entry. The overview, account balances, reports, and applicable budget alerts recalculate from the sample ledger. Entries live in memory and reset when you reload or exit the workspace.
- Use the search button or Cmd/Ctrl+K to find transactions and navigate. The transaction view offers search, type filters, sorting, pagination, detail dialogs, and CSV export of matching rows.
- Toggle the light or dark theme. The browser remembers the preference. The settings screen can query the real Express health endpoint.
- Create an account and verify your email. Sign in, reload to check the saved session, and sign out from your account page. Password recovery uses a single-use email link.

## Architecture

| Location | Responsibility |
| --- | --- |
| `client/src/app` | Router, lazy-loaded screens, query client, theme, and error boundary |
| `client/src/components/ui` | Source-owned shadcn-style buttons and Radix dialogs |
| `client/src/features/landing` | Product site and illustrative dashboard mockup |
| `client/src/features/auth` | Supabase signup, confirmation, password recovery, protected routes, and account sessions |
| `client/src/features/demo` | Isolated sample ledger, money arithmetic, Recharts, and preview navigation |
| `server/src` | Express API, config validation, CORS allowlist, Helmet, request IDs, structured logging, server-side token verification, and JSON errors |
| `client/tests`, `server/tests` | Ledger calculations, API auth contract, and HTTP error tests |
| `.github/workflows/ci.yml` | Install, lint, type check, test, and production build |

The demo ledger stores amounts as integer paise and formats currency at the display boundary. Calendar ranges use the browser’s local date. Month-to-date comparisons use the same elapsed window in the preceding month where possible. Sample data is isolated inside the `/demo` routes. Spending insights in this phase are deterministic calculations, and the dashboard performs no external AI processing.

Express verifies the access token with Supabase Auth before returning the account. Supabase handles password storage and session issuance. The API logs request IDs, methods, status codes, and timings. It omits headers, query strings, and submitted bodies from request logs. Health is a lightweight liveness endpoint. The rate limiter is in-memory for the initial single-instance API. A multi-instance deployment can add a shared limiter when protected routes are introduced.

## Verify

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The server integration tests open temporary loopback ports. The production artifacts are `client/dist` and `server/dist`. Start the compiled API with `pnpm start`. To serve the client build for a local production smoke test, run `pnpm --filter @lumaledger/client preview` and open [port 4173](http://127.0.0.1:4173/).

## Configure account services

1. Set `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` to a dedicated project’s URL and publishable key in the ignored root environment file. Express provides this browser-safe configuration at `/api/auth/config`. Keep secret keys on the server.
2. Enable the email provider and email confirmation in Supabase Auth. Under URL Configuration, set Site URL to the main application origin. Add the exact `/auth/confirm` and `/auth/recovery` URLs for each environment. For local development these are `http://127.0.0.1:5174/auth/confirm` and `http://127.0.0.1:5174/auth/recovery`.
3. Set up [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) with your verified sender before opening signup to the public. Supabase’s built-in sender is intended for project team addresses. Save SMTP credentials directly in Supabase.
4. Standard Supabase templates use the email’s confirmation link with PKCE. Open these links in the same browser that requested them. To support opening email on another device, use the following links in the respective [email templates](https://supabase.com/docs/guides/auth/auth-email-templates) and test delivery with link tracking disabled.

```html
<!-- Confirm signup -->
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=email">Confirm your email</a>

<!-- Reset password -->
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&amp;type=recovery">Reset your password</a>
```

## Public deployment

The [Render blueprint](https://render.com/docs/infrastructure-as-code) builds both workspaces from this repository. Connect the repository in Render, select the free web service, and provide `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` when prompted. The service uses `SERVE_CLIENT=true` to serve the React bundle and API on one origin, including direct visits to account and callback routes.

After deployment, save the service’s HTTPS origin as the Supabase Site URL and allow its two callback URLs. Verify `/api/health`, then register using a test inbox outside the Supabase organization, confirm the address, sign in again, and request password recovery.

The dashboard still uses an isolated sample ledger. Persistent financial records, spending workflows for private accounts, and provider-backed AI remain later phases.
