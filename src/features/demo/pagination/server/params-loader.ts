import { createLoader } from "nuqs/server"
import { customersParams } from "@/features/demo/pagination/params"

/** Parses the page's `searchParams` on the server into typed values (same parsers as the client hook). */
export const customersParamsLoader = createLoader(customersParams)
