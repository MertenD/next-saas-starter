import { useEffect, useEffectEvent, useState } from "react"
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
 * It does not need to be a stable function: the commit runs through
 * `useEffectEvent`, so a new `setParams` identity per render does not restart
 * the debounce timer. The local input also follows the URL when `params.search`
 * changes from elsewhere (e.g. a "clear filters" button).
 */
export function useEntitySearch<T extends { search: string; page: number }>({
  params,
  setParams,
  debounceMs = 400,
}: UseEntitySearchProps<T>) {
  const [localSearch, setLocalSearch] = useState(params.search)
  const [lastUrlSearch, setLastUrlSearch] = useState(params.search)

  // Follow the URL when it changes from outside: adjusting state during
  // render instead of mirroring it in an effect avoids a render with stale text.
  if (params.search !== lastUrlSearch) {
    setLastUrlSearch(params.search)
    setLocalSearch(params.search)
  }

  const commit = useEffectEvent((search: string) => {
    setParams({ ...params, search, page: PAGINATION.DEFAULT_PAGE })
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: `commit` is a useEffectEvent and must not be listed as a dependency
  useEffect(() => {
    if (localSearch === params.search) return

    // Clearing the input commits immediately, everything else is debounced
    if (localSearch === "") {
      commit("")
      return
    }

    const timer = setTimeout(() => commit(localSearch), debounceMs)
    return () => clearTimeout(timer)
  }, [localSearch, params.search, debounceMs])

  return { searchValue: localSearch, onSearchChange: setLocalSearch }
}
