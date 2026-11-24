"use client"

import { useQueryStates } from "nuqs"
import { adminUsersParams } from "@/features/admin/params"

/** Reads/writes the admin users table's pagination and search state to and from the URL query string. */
export const useAdminUsersParams = () => useQueryStates(adminUsersParams)
