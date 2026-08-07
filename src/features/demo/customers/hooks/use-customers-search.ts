"use client"

import { useEffect, useState } from "react"
import { PAGINATION } from "@/config/constants"
import { useCustomersParams } from "@/features/demo/customers/hooks/use-customers-params"

const DEBOUNCE_MS = 400

/**
 * Debounced search input for the customers table. Keeps every keystroke in
 * local state (no URL churn / no query refetch per keystroke) and commits
 * to the nuqs-backed `search` URL param after {@link DEBOUNCE_MS}ms of
 * inactivity, resetting pagination to page 1 whenever the committed search
 * value changes. Reusable pattern for any debounced-search-plus-URL-state input.
 */
export const useCustomersSearch = () => {
  const [params, setParams] = useCustomersParams()
  const [localSearch, setLocalSearch] = useState(params.search)

  useEffect(() => {
    if (localSearch === "" && params.search !== "") {
      setParams({ search: "", page: PAGINATION.DEFAULT_PAGE })
      return
    }

    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        setParams({ search: localSearch, page: PAGINATION.DEFAULT_PAGE })
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [localSearch, params, setParams])

  useEffect(() => {
    setLocalSearch(params.search)
  }, [params.search])

  return { searchValue: localSearch, onSearchChange: setLocalSearch }
}
