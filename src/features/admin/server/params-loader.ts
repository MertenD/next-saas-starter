import { createLoader } from "nuqs/server"
import { adminUsersParams } from "@/features/admin/params"

/** Parses the admin users page's `searchParams` on the server (same parsers as the client hook). */
export const adminUsersParamsLoader = createLoader(adminUsersParams)
