# Make It Yours

[Getting Started](./getting-started.md) runs the template as-is, demos included, so you can see everything working. This page is the separate, one-time checklist for the moment after that - turning the starter into *your* product: what to rip out, what to rename, what to configure, and what to double-check before you start building real features.

## 1. Rebrand

- **`src/config/constants.ts`** - `APP_NAME` and `APP_DESCRIPTION`. These feed the page `<title>`/description in `src/app/layout.tsx` and any emails sent via `src/lib/mailer.ts`.
- **`messages/en.json` / `messages/de.json`** - `auth.layout.brand` and any other hardcoded "SaaS Starter" strings.
- **`package.json`** - `name`, `version`, and add a `description` if you want one.
- **`src/app/favicon.ico`** - replace with your own icon.
- **Root `README.md`** - replace the template description/tech-stack table with your own project's, once it stops matching reality.
- **`docs/`** - don't feel obligated to rebrand it. If you don't need the doc site, just delete the whole `docs/` folder, the `vitepress` devDependency in `package.json`, the `docs:dev`/`docs:build`/`docs:preview` scripts, and `.github/workflows/docs.yml`. If you're keeping it, rebrand `title` and the `base` path in `docs/.vitepress/config.mts` instead (`base` must match your repo's name for GitHub Pages - see [Deployment](./deployment.md)).
- **Git remote** - point it at your own repository (`git remote set-url origin <your-repo-url>`) instead of pushing back to the template.

## 2. Remove the demo features

Everything under `/demo/*` exists to demonstrate a technique (see [Features](./features.md)) - none of it is meant to ship. Delete what you don't need, feature by feature, rather than all at once, since `demo/posts` in particular is the pattern to copy for your first real feature (full CRUD, ownership checks, all four UI states, delete confirmation, `premiumProcedure` usage) - see [Features](./features.md#demoposts---canonical-crud-reference). A reasonable order:

0. For `demo/pagination`: the entity components (`src/components/entity-components.tsx`, `src/hooks/use-entity-search.ts`) are reusable beyond the demo - keep them (and the `entity` i18n namespace) and only delete the feature module, page, router entry and docs page.
1. **Delete the feature module(s):** `src/features/demo/<name>/`.
2. **Delete the pages:** `src/app/(dashboard)/demo/<name>/`.
3. **Unregister the router** in `src/trpc/routers/_app.ts` (remove the import and the entry in the router object).
4. **Remove the sidebar entry** in `src/components/app-sidebar.tsx` - delete the item from `demoItems`, and once all demos are gone, remove the whole "Demo" section (`demoSection` in `messages/*.json`) and its `nav.*` translation keys.
5. **Delete the docs page** under `docs/demos/<name>.md` and its entry in `docs/README.md` and `docs/.vitepress/config.mts` (sidebar).

`demo/ai` also owns `src/app/api/chat/` and `src/lib/stream-context.ts` (Redis-backed resumable streams) - remove those too if you don't keep AI chat. `demo/posts` owns the `Post` model in `prisma/schema.prisma` - drop it (and migrate) once you've copied the pattern into your own feature and no longer need it as a live reference.

## 3. Decide what you're actually using, and remove the rest

Every integration in this template is opt-in and degrades gracefully when unconfigured, but half-configured integrations left lying around are a maintenance trap. For each one, either configure it properly (see [Environment Variables](./environment-variables.md)) or rip it out:

| Integration | Keep it by... | Remove it by... |
|---|---|---|
| **OAuth (Google/GitHub)** | Setting the client id/secret pair in `.env` (see [Auth & Billing](./auth-and-billing.md#oauth-providers)) | Deleting the unused provider block in `src/lib/auth.ts` and its buttons in the login/signup UI |
| **Polar billing** | Replacing `YOUR_PRODUCT_ID` in `src/lib/auth.ts` with your real product id and setting the three `POLAR_*` vars | Leaving all three `POLAR_*` vars unset - `isPolarEnabled` (`src/lib/polar.ts`) turns off the plugin and premium gating automatically, no code changes needed |
| **Resend (email)** | Setting `RESEND_API_KEY` + `EMAIL_FROM` | Leaving unset - emails log to the console instead, fine for a while but not for production |
| **AI / OpenRouter** | Setting `OPENROUTER_API_KEY` and keeping `demo/ai` (renamed into a real feature) | Deleting `demo/ai` per step 2 above |
| **Sentry** | Setting `NEXT_PUBLIC_SENTRY_DSN` (plus the source map vars for CI/Docker builds) | Leaving the DSN unset keeps it off. To remove the code: `bun remove @sentry/nextjs`, delete `sentry.*.config.ts`, `src/instrumentation.ts`, `src/instrumentation-client.ts`, `src/app/global-error.tsx` (or reduce it to a plain error page) and the `withSentryConfig` wrapper in `next.config.ts` |
| **PWA** | Replacing the placeholder icons (`src/app/api/pwa-icon/route.tsx`, `src/app/manifest.ts`) with your brand assets | Deleting `public/sw.js`, `src/components/pwa-register.tsx`, `src/lib/pwa.ts` (and its call on sign-out), `src/app/manifest.ts`, the icon route, and `appleWebApp` in `src/app/layout.tsx` |
| **Plausible analytics** | Setting `NEXT_PUBLIC_PLAUSIBLE_SRC` | Leaving unset - no tracking script is rendered, nothing further to clean up |

## 4. Re-check the required environment variables

`src/config/env.ts` fails fast at startup if a *required* variable is missing, but it can't catch values that are merely wrong for your setup. Before your first deploy, walk through [Environment Variables](./environment-variables.md) end to end and confirm:

- `BETTER_AUTH_SECRET` is a freshly generated secret (`openssl rand -base64 32`), not the one from `.env.example`.
- `BETTER_AUTH_URL` and `POLAR_SUCCESS_URL` point at your real domain, not `localhost`.
- `DATABASE_URL` / `REDIS_URL` point at your production instances, not the Docker Compose defaults.

## 5. i18n

The template ships `en` and `de` (see [Frontend](./frontend.md#internationalization-next-intl)). If you only need one locale, remove the other from `messages/`, the `locales` list in the next-intl config, and the language switcher UI - otherwise keep both `messages/*.json` files in sync as you add strings.

## 6. Design system

`DESIGN.md` at the repo root currently encodes an Airbnb-style design language (colors, type scale, spacing, component specs) as a starting point, not a mandate. If you're rebranding visually, rewrite `DESIGN.md` first with your own tokens, then bring the Tailwind theme (`src/app/globals.css`) and shadcn components in line with it - `AGENTS.md` and any AI coding agent working in this repo treat `DESIGN.md` as the source of truth for every UI change, so an out-of-date `DESIGN.md` will actively steer future work in the wrong direction.

## 7. Docs

If you kept `docs/` (see step 1), sweep it for template-specific language that no longer applies once you've trimmed the demos and configured your integrations - this page included, delete it once you're done with it, or leave it for the next person who forks *your* repo. [Quick Reference](./quick-reference.md) is worth keeping current as you add utilities - it's the fastest way for future contributors (human or AI) to avoid reinventing something that already exists.

## Checklist

- [ ] Renamed the app (`APP_NAME`, `package.json`, docs title, favicon)
- [ ] Removed unused demo features (module, page, router registration, sidebar entry, docs page)
- [ ] Configured or removed OAuth, Polar, Resend, AI, analytics, Sentry and PWA (replaced the placeholder icons)
- [ ] Generated a fresh `BETTER_AUTH_SECRET` and pointed URLs at your real domain
- [ ] Decided on one or two locales and cleaned up the rest
- [ ] Updated `DESIGN.md` to your own brand, or confirmed you're keeping the default
- [ ] Repointed the git remote and GitHub Pages `base` path at your own repo

Once this is done, move on to [Deployment](./deployment.md) to get it running in production.
