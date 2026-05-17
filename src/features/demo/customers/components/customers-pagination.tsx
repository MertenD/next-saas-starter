"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useCustomers } from "@/features/demo/customers/hooks/use-customers";
import { useCustomersParams } from "@/features/demo/customers/hooks/use-customers-params";

export function CustomersPagination() {
  const t = useTranslations("customers");
  const { data, isFetching } = useCustomers();
  const [params, setParams] = useCustomersParams();

  if (!data || data.totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-body-sm text-muted-foreground">
        {t("resultsCount", { count: data.totalCount })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasPreviousPage || isFetching}
          onClick={() => setParams({ page: params.page - 1 })}
        >
          <ChevronLeftIcon />
          {t("previous")}
        </Button>
        <span className="px-2 text-body-sm text-muted-foreground">
          {t("pageOf", { page: data.page, totalPages: data.totalPages })}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasNextPage || isFetching}
          onClick={() => setParams({ page: params.page + 1 })}
        >
          {t("next")}
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
