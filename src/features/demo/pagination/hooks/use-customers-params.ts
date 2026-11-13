"use client"

import { useQueryStates } from "nuqs"
import { customersParams } from "@/features/demo/pagination/params"

/** Reads/writes the customers table's filter/sort/pagination state to and from the URL query string. */
export const useCustomersParams = () => useQueryStates(customersParams)
