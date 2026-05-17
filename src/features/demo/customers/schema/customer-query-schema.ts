import { z } from "zod";
import { PAGINATION } from "@/config/constants";
import {
  CUSTOMER_SORT_BY_OPTIONS,
  CUSTOMER_STATUS_FILTER_OPTIONS,
  SORT_ORDER_OPTIONS,
} from "@/features/demo/customers/model/customer";

export const customersQuerySchema = z.object({
  page: z.number().min(1).default(PAGINATION.DEFAULT_PAGE),
  pageSize: z
    .number()
    .min(PAGINATION.MIN_PAGE_SIZE)
    .max(PAGINATION.MAX_PAGE_SIZE)
    .default(PAGINATION.DEFAULT_PAGE_SIZE),
  search: z.string().default(""),
  status: z.enum(CUSTOMER_STATUS_FILTER_OPTIONS).default("all"),
  sortBy: z.enum(CUSTOMER_SORT_BY_OPTIONS).default("createdAt"),
  sortOrder: z.enum(SORT_ORDER_OPTIONS).default("desc"),
});

export type CustomersQueryInput = z.infer<typeof customersQuerySchema>;
