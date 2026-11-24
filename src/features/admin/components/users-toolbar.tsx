"use client"

import { useTranslations } from "next-intl"
import { EntitySearch } from "@/components/entity-components"
import { useAdminUsersParams } from "@/features/admin/hooks/use-admin-users-params"
import { useEntitySearch } from "@/hooks/use-entity-search"

export function UsersToolbar() {
  const t = useTranslations("admin.users")
  const [params, setParams] = useAdminUsersParams()
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams: (next) => setParams(next),
  })

  return (
    <EntitySearch
      value={searchValue}
      onChange={onSearchChange}
      placeholder={t("searchPlaceholder")}
    />
  )
}
