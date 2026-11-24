import { parseAsInteger, parseAsString } from "nuqs/server"
import { PAGINATION } from "@/config/constants"

/**
 * nuqs parsers for the admin users table's URL state (pagination and search).
 * Mirrors `adminUsersQuerySchema` in `schema/admin-schema.ts`, same pattern as
 * `src/features/demo/pagination/params.ts`.
 */
export const adminUsersParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
}
