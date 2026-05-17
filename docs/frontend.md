# Frontend

## Component library

UI primitives come from [shadcn/ui](https://ui.shadcn.com) (Radix UI + Tailwind CSS v4), installed into `src/components/ui/`:

accordion, alert, alert-dialog, avatar, badge, breadcrumb, button, button-group, card, checkbox, collapsible, command, dialog, dropdown-menu, empty, field, form, input, input-group, item, kbd, label, pagination, popover, select, separator, sheet, sidebar, skeleton, sonner, spinner, switch, table, tabs, textarea, tooltip

Add more with `bunx shadcn@latest add <component>`.

Beyond `ui/`, `src/components/` also has: `app-shell.tsx` (the dashboard layout shell wrapping the sidebar), `app-sidebar.tsx` (sidebar nav content), `language-toggle.tsx` (i18n switcher), and the two confirm dialogs below.

## Design system

Colors, typography, spacing, radii, elevation, and component specs are defined in `DESIGN.md` at the repo root (outside this docs site) - it must be followed for every UI change (new components, layouts, styling edits) rather than inventing ad hoc values. It defines token references like `{colors.primary}`, `{typography.body-md}`, `{rounded.md}`, `{spacing.lg}`.

## UI states - every fetch needs all four

Every tRPC query/mutation and every component displaying fetched or user-generated content must implement:

1. **Content** - the normal populated state.
2. **Loading** - `Skeleton` (`@/components/ui/skeleton`) for structured content with a known layout (lists, cards, tables); `Spinner` (`@/components/ui/spinner`) for short/unstructured loads (buttons mid-submit, small inline widgets); `Progress bar` for long-running, determinate operations (uploads, multi-step background jobs) where percentage/step feedback is meaningful.
3. **Empty** - the request succeeded but returned nothing. Use `Empty`/`EmptyHeader`/`EmptyTitle`/`EmptyDescription`/`EmptyContent` from `@/components/ui/empty`, always with a call to action - never blank space or a bare "No data" string. See `/demo/inngest`'s run-history panel for a working example.
4. **Error** - the request failed. Explain what went wrong and give the user something actionable - a "Try again" button wired to `refetch()` when retrying makes sense, otherwise a concrete next step.

With TanStack Query hooks (`useQuery`/`useSuspenseQuery` via `useTRPC()`):

| Query state | UI state |
|---|---|
| `isPending` / `isLoading` | Loading |
| `isError` | Error (wire `refetch` as the retry action) |
| `data` is empty array/null | Empty |
| otherwise | Content |

## Confirm dialogs

Deleting anything must always be confirmed through a dialog - never wire a delete straight to a click.

**`ConfirmDialog`** (`@/components/confirm-dialog`) - the standard "Are you sure?" dialog for ordinary, low-stakes deletes:

```tsx
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

const [confirmOpen, setConfirmOpen] = useState(false);
const { mutate: deletePost, isPending } = useDeletePost();

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Delete post?"
  description="This can't be undone."
  variant="destructive"
  isLoading={isPending}
  onConfirm={() =>
    deletePost({ id: post.id }, { onSuccess: () => setConfirmOpen(false) })
  }
/>;
```

**`CriticalConfirmDialog`** (`@/components/critical-confirm-dialog`) - for destructive, hard-to-reverse actions (deleting an account, an organization, a production resource). The confirm button stays disabled until the user retypes `confirmationValue` exactly:

```tsx
<CriticalConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Delete organization?"
  description="All projects, members, and data will be permanently deleted."
  confirmationValue={organization.name}
  isLoading={isPending}
  onConfirm={() =>
    deleteOrg({ id: organization.id }, { onSuccess: () => setConfirmOpen(false) })
  }
/>
```

Both take `isLoading` (pass a mutation's `isPending`) and never auto-close - close them yourself, typically from the mutation's `onSuccess`. See `src/features/demo/posts/components/post-item.tsx` for a working example.

## State management

- **Zustand** - client-only UI state that doesn't need to survive a refresh or sync with the server. `src/stores/ui-store.ts` (sidebar collapsed/expanded) is the global example; features can have their own local store, like `demo/booking`'s wizard-step store.
- **TanStack Query** (via `useTRPC()`) - all server state. `src/trpc/client.tsx`'s `TRPCReactProvider` persists the query cache to IndexedDB with a 7-day retention, so data survives page reloads without a network round-trip.
- **nuqs** - URL search params as state, for anything that should be shareable/bookmarkable (filters, pagination, sort). See `demo/customers/params.ts`.

## Internationalization (next-intl)

Supported locales: `en`, `de`. The active locale is stored in the `ui-locale` cookie, set/cleared by server actions in `src/app/actions/set-locale.ts`, and read by `src/i18n/request.ts` (falls back to `en`).

Translation files: `messages/en.json`, `messages/de.json` - both share the same top-level namespace keys (`common`, `sidebar`, `auth`, `dashboard`, `posts`, `settings`, `customers`, `booking`, `demo`). Add new keys to both files.

Server component:

```typescript
import { getTranslations } from "next-intl/server";
const t = await getTranslations("myFeature");
```

Client component:

```typescript
import { useTranslations } from "next-intl";
const t = useTranslations("myFeature");
```
