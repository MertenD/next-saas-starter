"use client";

import { useEffect, useState } from "react";
import { PAGINATION } from "@/config/constants";
import { useCustomersParams } from "@/features/demo/customers/hooks/use-customers-params";

const DEBOUNCE_MS = 400;

// Keeps every keystroke local (no URL thrash) and commits to the nuqs-backed
// `search` param after a short debounce, resetting to page 1 on change.
export const useCustomersSearch = () => {
  const [params, setParams] = useCustomersParams();
  const [localSearch, setLocalSearch] = useState(params.search);

  useEffect(() => {
    if (localSearch === "" && params.search !== "") {
      setParams({ search: "", page: PAGINATION.DEFAULT_PAGE });
      return;
    }

    const timer = setTimeout(() => {
      if (localSearch !== params.search) {
        setParams({ search: localSearch, page: PAGINATION.DEFAULT_PAGE });
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [localSearch, params, setParams]);

  useEffect(() => {
    setLocalSearch(params.search);
  }, [params.search]);

  return { searchValue: localSearch, onSearchChange: setLocalSearch };
};
