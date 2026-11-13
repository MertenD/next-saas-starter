import { useEffect, useState } from "react"
import { PAGINATION } from "@/config/constants"

type UseEntitySearchProps<T extends { search: string; page: number }> = {
  params: T
  setParams: (newParams: T) => void
  debounceMs?: number
}

/**
 * Generic debounced search input state for any URL-driven list. Keeps every
 * keystroke in local state (no URL churn / refetch per keystroke) and commits
 * to the `search` URL param after `debounceMs` of inactivity, resetting
 * pagination to page 1 whenever the committed value changes. Clearing the
 * input commits immediately. Pair it with `EntitySearch`
 * (`@/components/entity-components`).
 *
 * `setParams` must accept the *whole* params object (spread of the current
 * params plus the changes) - wrap a nuqs `useQueryStates` setter if needed.
 */
export function useEntitySearch<T extends { search: string; page: number }>({
  params,
  setParams,
  debounceMs = 400,
}: UseEntitySearchProps<T>) {
  const [localSearch, setLocalSearch] = useState(params.search)

  useEffect(() => {
    if (localSearch === "" && params.search !== "") {
      setParams({ ...params, search: "", page: PAGINATION.DEFAULT_PAGE })
      return
    }

    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        setParams({
          ...params,
          search: localSearch,
          page: PAGINATION.DEFAULT_PAGE,
        })
      }
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localSearch, params, setParams, debounceMs])

  useEffect(() => {
    setLocalSearch(params.search)
  }, [params.search])

  return { searchValue: localSearch, onSearchChange: setLocalSearch }
}
