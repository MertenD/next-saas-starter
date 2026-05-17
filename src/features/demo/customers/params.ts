import { parseAsInteger, parseAsString, parseAsStringEnum } from "nuqs/server";
import { PAGINATION } from "@/config/constants";
import {
  CUSTOMER_SORT_BY_OPTIONS,
  CUSTOMER_STATUS_FILTER_OPTIONS,
  SORT_ORDER_OPTIONS,
} from "@/features/demo/customers/model/customer";

// Single source of truth for the customers table's URL state, shared between
// the client hook (useQueryStates) and the tRPC input schema.
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
};
