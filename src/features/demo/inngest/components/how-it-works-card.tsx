"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";

export function HowItWorksCard() {
  const t = useTranslations("demo.inngest");

  return (
    <Card className="border-dashed">
      <CardContent className="pt-6">
        <p className="text-muted-foreground text-sm">
          <strong>{t("howItWorksLabel")}</strong>{" "}
          {t.rich("howItWorksBody", {
            realtimeLink: (chunks) => (
              <a
                href="https://www.inngest.com/docs/features/realtime"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {chunks}
              </a>
            ),
            dashboardLink: (chunks) => (
              <a
                href="http://localhost:8288"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                {chunks}
              </a>
            ),
            code1: (chunks) => (
              <code className="rounded bg-muted px-1 font-mono text-xs">
                {chunks}
              </code>
            ),
            code2: (chunks) => (
              <code className="rounded bg-muted px-1 font-mono text-xs">
                {chunks}
              </code>
            ),
            code3: (chunks) => (
              <code className="rounded bg-muted px-1 font-mono text-xs">
                {chunks}
              </code>
            ),
            code4: (chunks) => (
              <code className="rounded bg-muted px-1 font-mono text-xs">
                {chunks}
              </code>
            ),
            code5: (chunks) => (
              <code className="rounded bg-muted px-1 font-mono text-xs">
                {chunks}
              </code>
            ),
          })}
        </p>
      </CardContent>
    </Card>
  );
}
