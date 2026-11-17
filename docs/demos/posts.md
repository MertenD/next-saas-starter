# Demo: Posts CRUD

**Route:** `/demo/posts` · **Feature module:** `src/features/demo/posts/`

## What this demonstrates

The canonical full CRUD reference implementation against a real Prisma-backed model - not mock data, unlike the customers demo. This is the module to actually copy when building your first real feature (see [Adding a new feature](../features.md#adding-a-new-feature)). It also holds the reference example of gating a tRPC procedure behind an active Polar subscription.

## Key files

| File | Role |
|---|---|
| `schema/post-schema.ts` | `createPostSchema`, `updatePostSchema` |
| `server/router.ts` | Full CRUD router + one premium-gated procedure |
| `hooks/use-posts.ts` | Query + mutation hooks, cache invalidation |
| `components/posts-container.tsx` | All four UI states (loading/empty/error/content) |
| `components/post-item.tsx` | Delete via `ConfirmDialog` |
| `components/post-create-dialog.tsx` | Create form |

## How it works

1. **Ownership checks, in the query itself.** `postsRouter` exposes `getMany`, `getOne`, `create`, `update`, `delete` - all `protectedProcedure`. Prisma has no per-request row-level security, so `getOne`, `update`, and `delete` put `userId: ctx.auth.user.id` into the `where` of the query that reads or mutates the row, which keeps the ownership check and the write in a single database round trip. A foreign or missing post throws `NOT_FOUND`:

   ```ts
   // update / delete: Prisma raises P2025 when nothing matches id AND userId
   await prisma.post.delete({ where: { id: input.id, userId: ctx.auth.user.id } })
   ```

   `getMany` is capped at `MAX_POSTS` (100) rows and served by the composite index `@@index([userId, createdAt])`. The page prefetches the list on the server (`prefetch()` + `HydrateClient`), so the list is in the first HTML.

2. **Cache invalidation, the simple way.** Every mutation hook in `use-posts.ts` follows the same shape on success: show a toast, then `queryClient.invalidateQueries(trpc.posts.getMany.queryFilter())` in `onSettled`. After a create/update it just refetches - the correct default until you have a specific reason (e.g. a very expensive query) to optimize further. Delete is the one optimistic example: `onMutate` cancels in-flight list fetches and removes the post from the cached list immediately, `onError` restores the previous list, and the refetch in `onSettled` makes the cache converge on the server state either way. Errors are shown as the generic translated message (`common.errors.generic`), not as raw server text.

3. **All four UI states, for real.** `PostsContainer` implements the loading/empty/error/content rule from [Frontend](../frontend.md#ui-states---every-fetch-needs-all-four) directly: `Skeleton` rows while `isLoading`, the shared `ErrorView` with a retry button on `isError`, the `Empty` component with a "New Post" call to action when the list is empty, and the populated list otherwise (post dates are formatted with `useFormatter()`, the delete button has an `aria-label`, the published badge is the `Badge` component) - nothing here only handles the happy path.

4. **Delete confirmation.** `PostItem`'s delete button never deletes on click - it opens `ConfirmDialog`, wires the dialog's `isLoading` to the delete mutation's `isPending`, and closes the dialog from the mutation's `onSuccess`. This is the exact pattern documented in [Frontend - Confirm dialogs](../frontend.md#confirm-dialogs).

5. **Premium gating, unwired on purpose.** `bulkPublish` is a `premiumProcedure` that flips every unpublished post owned by the current user to published:

   ```ts
   bulkPublish: premiumProcedure.mutation(async ({ ctx }) => {
     return prisma.post.updateMany({
       where: { userId: ctx.auth.user.id, published: false },
       data: { published: true },
     })
   }),
   ```

   There's deliberately no button for it in the UI - it exists purely as a copy-paste reference for gating a procedure behind an active subscription. Call it directly (e.g. from a tRPC panel) to see a `FORBIDDEN` error without an active subscription, or note it succeeds for everyone when Polar isn't configured at all (mock mode - see [Auth & Billing](../auth-and-billing.md)).

## Try it

Open `/demo/posts`, create a post, then delete one and note the confirm dialog. Refresh the page - unlike the other demos, this one actually persists to Postgres.

## Related docs

- [Features - Adding a new feature](../features.md#adding-a-new-feature) - this demo is the template that walkthrough is built from
- [Auth & Billing - Premium feature gating](../auth-and-billing.md) - the `premiumProcedure` pattern used by `bulkPublish`
