"use client"

import { useTranslations } from "next-intl"
import { EntitySearch } from "@/components/entity-components"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCustomersParams } from "@/features/demo/pagination/hooks/use-customers-params"
import { CUSTOMER_STATUS_FILTER_OPTIONS } from "@/features/demo/pagination/model/customer"
import { useEntitySearch } from "@/hooks/use-entity-search"

export function CustomersToolbar() {
  const t = useTranslations("pagination")
  const [params, setParams] = useCustomersParams()
  const { searchValue, onSearchChange } = useEntitySearch({
    params,
    setParams: (next) => setParams(next),
  })

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <EntitySearch
        value={searchValue}
        onChange={onSearchChange}
        placeholder={t("searchPlaceholder")}
      />
      <Select
        value={params.status}
        onValueChange={(value) =>
          setParams({
            status: value as (typeof CUSTOMER_STATUS_FILTER_OPTIONS)[number],
            page: 1,
          })
        }
      >
        <SelectTrigger className="w-full sm:w-44">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CUSTOMER_STATUS_FILTER_OPTIONS.map((option) => (
            <SelectItem key={option} value={option}>
              {t(`status.${option}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
