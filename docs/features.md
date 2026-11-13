# Features

## The feature-module pattern

Every domain feature lives under `src/features/<feature>/`. Each module typically contains a subset of:

- `components/` - React components (All client Components need `"use client"`)
- `hooks/` - TanStack Query hooks wrapping tRPC calls and regular React hooks that are feature-specific
- `server/` - tRPC router (server-only, never import in Client Components)
- `schema/` - Zod validation schemas (shared between client and server)
- `model/` - TypeScript types, constants, enums

Server routers are registered centrally in `src/trpc/routers/_app.ts` (see [`architecture.md`](./architecture.md)).

## Existing features

### `auth/`

Login/register/logout UI, forgot/reset-password forms, and a user-info card, backed by Better Auth (`authClient`). No `server/` - Better Auth's own catch-all route (`/api/auth/[...all]`) handles the backend. See [`auth-and-billing.md`](./auth-and-billing.md).

- `login-form.tsx`, `register-form.tsx`, `logout-button.tsx`, `user-info-card.tsx`, `forgot-password-form.tsx`, `reset-password-form.tsx`
- `oauth-buttons.tsx` - the "Continue with GitHub/Google" buttons (with brand logos from `public/logos/`) shared by login and signup. The pages pass in only the providers that are actually configured (`getEnabledOAuthProviders()` in `src/lib/oauth-providers.ts`), so unconfigured providers never render a button.

### `demo/ai/` - streaming + resumable AI chat

Streaming AI chat demo using the Vercel AI SDK against OpenRouter. What it's specifically built to show off: **resumable streams** - refresh the page mid-response and it keeps going instead of restarting or losing the reply.

**Full walkthrough: [demos/ai.md](./demos/ai.md)**

### `demo/booking/` - multi-step wizard with client-only state

A multi-step, Airbnb-style booking wizard: dates → guests → payment → review. What it's specifically built to show off: a feature-scoped, `sessionStorage`-persisted Zustand store (separate from the global `src/stores/ui-store.ts`), per-step Zod validation, and a deliberately flaky backend that forces real error/retry handling.

**Full walkthrough: [demos/booking.md](./demos/booking.md)**

### `demo/pagination/` - fully server-driven data table

A searchable, filterable, sortable, paginated data table - no database involved, backed by a randomly generated mock dataset (137 rows). What it's specifically built to show off: every bit of table state (page, search, filter, sort) resolved server-side and mirrored in the URL via nuqs, so the table survives a refresh or a shared link instead of being client-side `useState`. It is built from the reusable entity components (`src/components/entity-components.tsx`, `src/hooks/use-entity-search.ts`) and prefetches its first page on the server.

**Full walkthrough: [demos/pagination.md](./demos/pagination.md)**

### `demo/inngest/` - background jobs with live status

Triggers a real background job from the UI and streams its progress live via Inngest Realtime. What it's specifically built to show off: durable multi-step execution (survives a server restart mid-job) and per-run scoped Realtime subscriptions instead of polling.

**Full walkthrough: [demos/inngest.md](./demos/inngest.md)**

### `demo/posts/` - canonical CRUD reference

A plain CRUD example against a real Prisma model (`Post`), plus a premium-gated bulk action. What it's specifically built to show off: this is the module to copy when building your own feature - full ownership-checked CRUD, cache invalidation, all four required UI states, delete confirmation, and a `premiumProcedure` reference example.

**Full walkthrough: [demos/posts.md](./demos/posts.md)**

### `subscriptions/`

`hooks/use-subscription.ts` exposes `useSubscription()` (raw Polar customer state) and `useHasActiveSubscription()` (the one to actually use - treats everyone as premium when Polar isn't configured). See [`auth-and-billing.md`](./auth-and-billing.md).

### `user/`

`server/router.ts` exposes `user.me` (current user's id/name/email/image/emailVerified/createdAt) and `user.isPolarEnabled` (a public procedure exposing the billing-configured flag to the client). `hooks/use-user.ts` wraps `user.me` as `useCurrentUser()`. `hooks/use-update-profile.ts`, `hooks/use-change-password.ts`, and `hooks/use-resend-verification-email.ts` wrap the corresponding `authClient` calls (`updateUser`, `changePassword`, `sendVerificationEmail`) with toasts and `user.me` cache invalidation - no custom tRPC mutations needed since Better Auth's client already exposes these directly.

### `settings/`

The UI for `/settings` - a `Tabs`-based shell (`components/settings-tabs.tsx`) with the active tab synced to a `?tab=` URL param via `nuqs`, so links (e.g. the post-email-verification redirect) can deep-link to a specific category. Currently three categories: `account-settings.tsx` (profile form, email verification badge, change-password form - composes `user/`'s hooks), `subscription-settings.tsx` (current plan, renewal date, upgrade/billing-portal button; explains mock mode when Polar isn't configured) and `general-settings.tsx` (the interface language toggle). To add another category later: add one more `TabsTrigger`/`TabsContent` pair in `settings-tabs.tsx` and a new component file alongside the existing ones.

## Adding a new feature

Use `demo/posts` as your reference implementation (see [demos/posts.md](./demos/posts.md)). A new feature you build should live under `src/features/<feature>/`. Example: adding a `projects` feature.

**1. Schema** - `src/features/projects/schema/project-schema.ts`

```typescript
import { z } from "zod";
export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});
```

**2. Prisma model** - add to `prisma/schema.prisma`

```prisma
model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId])
  @@map("project")
}
```

Then run `bun run prisma:migrate && bun run prisma:generate` (see [`database.md`](./database.md)).

**3. Router** - `src/features/projects/server/router.ts`

```typescript
import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import prisma from "@/lib/db";
import { createProjectSchema } from "@/features/projects/schema/project-schema";

export const projectsRouter = createTRPCRouter({
  getMany: protectedProcedure.query(async ({ ctx }) => {
    return prisma.project.findMany({ where: { userId: ctx.auth.user.id } });
  }),
  create: protectedProcedure.input(createProjectSchema).mutation(async ({ ctx, input }) => {
    return prisma.project.create({ data: { ...input, userId: ctx.auth.user.id } });
  }),
});
```

**4. Register** - add to `src/trpc/routers/_app.ts`

```typescript
import { projectsRouter } from "@/features/projects/server/router";
export const appRouter = createTRPCRouter({
  // ...existing routers
  projects: projectsRouter,
});
```

**5. Hooks** - `src/features/projects/hooks/use-projects.ts`

```typescript
import { useTRPC } from "@/trpc/client";
import { useQuery } from "@tanstack/react-query";
export const useProjects = () => {
  const trpc = useTRPC();
  return useQuery(trpc.projects.getMany.queryOptions());
};
```

**6. Components** - `src/features/projects/components/projects-container.tsx`

Every fetch needs all four UI states - see [Frontend - UI states](./frontend.md#ui-states---every-fetch-needs-all-four). This is the minimum a real container component implements:

```tsx
"use client";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/features/projects/hooks/use-projects";

export function ProjectsContainer() {
  const { data: projects, isLoading, isError, refetch } = useProjects();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {["a", "b", "c"].map((key) => (
          <Skeleton key={key} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/50 p-4 text-sm text-destructive">
        Failed to load projects.
        <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No projects yet</EmptyTitle>
          <EmptyDescription>Create your first project to get started.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button>New Project</Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <ul className="space-y-2">
      {projects.map((project) => (
        <li key={project.id} className="rounded-lg border p-4">
          <p className="font-medium text-sm">{project.name}</p>
        </li>
      ))}
    </ul>
  );
}
```

Wire up create/delete the same way `demo/posts` does - a dialog for creating (`post-create-dialog.tsx`), and `ConfirmDialog` for deleting (see [Frontend - Confirm dialogs](./frontend.md#confirm-dialogs)).

**7. Page** - `src/app/(dashboard)/projects/page.tsx`

```tsx
import { ProjectsContainer } from "@/features/projects/components/projects-container";

export default function ProjectsPage() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <h1 className="font-bold text-2xl">Projects</h1>
      <ProjectsContainer />
    </main>
  );
}
```

The `(dashboard)` route group's `layout.tsx` already calls `requireAuth()` and wraps every page in `AppShell` - a new page under `src/app/(dashboard)/<feature>/page.tsx` gets auth protection and the sidebar shell for free, no extra wiring needed. Add the page's copy to `messages/en.json` and `messages/de.json` per [Frontend - Internationalization](./frontend.md#internationalization-next-intl) rather than hardcoding English strings.
