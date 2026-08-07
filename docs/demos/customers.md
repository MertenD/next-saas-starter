# Demo: Customers Table

**Route:** `/demo/customers` · **Feature module:** `src/features/demo/customers/`

## What this demonstrates

A fully server-driven data table: pagination, search, filtering and sorting are all resolved server-side against a validated input shape (not by filtering a client-side array), and the entire table state lives in the URL via [nuqs](https://nuqs.47ng.com/) - making it shareable, bookmarkable, and durable across a refresh or the browser back button, unlike a typical `useState`-driven table.

## Key files

| File | Role |
|---|---|
| `model/customer.ts` | `Customer` type + mock-data generator (137 rows) |
| `schema/customer-query-schema.ts` | Zod schema for valid table state (server-side input validation) |
| `params.ts` | nuqs parsers mirroring the same shape (client-side URL state) |
| `server/router.ts` | `customersRouter.getMany` - filter/sort/paginate |
| `hooks/use-customers-params.ts` | Wraps `useQueryStates` for URL read/write |
| `hooks/use-customers-search.ts` | Debounced search input → URL param |
| `hooks/use-customers.ts` | The actual data-fetching query |
| `components/*` | Table, toolbar, pagination |

## How it works

1. **One shape, two representations.** `params.ts` (nuqs parsers) and `customer-query-schema.ts` (Zod) describe the exact same fields - `page`, `pageSize`, `search`, `status`, `sortBy`, `sortOrder` - with matching defaults. The URL is the client-side source of truth; the Zod schema is what the server actually validates against. Keeping them in sync by hand is the tradeoff for not having a single shared runtime schema driving both nuqs and tRPC input.

2. **URL state, not component state.** `useCustomersParams()` wraps nuqs's `useQueryStates(customersParams)` - every read is the current URL query string, every write updates it (each param uses `clearOnDefault: true`, so the URL stays clean instead of accumulating `?page=1&sortOrder=desc` noise when a value matches its default).

3. **No layout jank on refetch.** `useCustomers()` passes `placeholderData: keepPreviousData` to `useQuery` - changing the sort column or page keeps showing the previous rows while the new page loads, instead of flashing back to a loading skeleton on every interaction.

4. **Debounced search without URL thrash.** `useCustomersSearch()` keeps every keystroke in local component state (so typing feels instant) and only commits to the nuqs `search` param - and resets to page 1 - after 400ms of no typing. Writing to the URL on every keystroke would spam browser history and refire the query constantly.

5. **Server-side resolution.** `customersRouter.getMany` filters, sorts, and paginates `MOCK_CUSTOMERS` entirely in memory - the same shape of work a real `WHERE` / `ORDER BY` / `LIMIT` SQL query would do:

   ```ts
   const SIMULATED_LATENCY_MS = 400
   // filter by status, filter by search (name/email substring)
   // sort by the chosen column and direction
   // slice to the requested page
   ```

   The mock dataset itself (`MOCK_CUSTOMERS`) is generated once, at module load, via a small `weightedPick()` helper over `Math.random()` - so it's a fresh random set of 137 rows on every server restart, but stable for the lifetime of that running process (not regenerated per request).

## Try it

Open `/demo/customers`, search, filter by status, sort a column, and change page - then copy the URL into a new tab. The table opens back up in the exact same state.

## Pattern to copy

This is the reference for any real paginated/filterable table you build against Prisma - swap the in-memory filter/sort/slice of `MOCK_CUSTOMERS` for a real `prisma.<model>.findMany({ where, orderBy, skip, take })` built from the same validated input shape; the nuqs/URL-state layer on the client doesn't change at all.

## Related docs

- [Frontend - State management](../frontend.md#state-management)
- [Architecture](../architecture.md) - tRPC request flow
