import { parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server"
import { PAGINATION } from "@/config/constants"
import {
  CUSTOMER_SORT_BY_OPTIONS,
  CUSTOMER_STATUS_FILTER_OPTIONS,
  SORT_ORDER_OPTIONS,
} from "@/features/demo/customers/model/customer"

/**
 * nuqs parser definitions for the customers table's URL state (pagination,
 * search, filter, sort). This is the single source of truth for that
 * shape - consumed client-side via `useQueryStates` in
 * `useCustomersParams`, and mirrored server-side by the tRPC input schema
 * in `schema/customer-query-schema.ts` so the URL and the API stay in sync.
 * This is the general pattern to copy for any other URL-driven table/list.
 */
export const customersParams = {
  page: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE)
    .withOptions({ clearOnDefault: true }),
  pageSize: parseAsInteger
    .withDefault(PAGINATION.DEFAULT_PAGE_SIZE)
    .withOptions({ clearOnDefault: true }),
  search: parseAsString.withDefault("").withOptions({ clearOnDefault: true }),
  status: parseAsStringEnum([...CUSTOMER_STATUS_FILTER_OPTIONS])
    .withDefault("all")
    .withOptions({ clearOnDefault: true }),
  sortBy: parseAsStringEnum([...CUSTOMER_SORT_BY_OPTIONS])
    .withDefault("createdAt")
    .withOptions({ clearOnDefault: true }),
  sortOrder: parseAsStringEnum([...SORT_ORDER_OPTIONS])
    .withDefault("desc")
    .withOptions({ clearOnDefault: true }),
}
