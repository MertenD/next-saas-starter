"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth.forgotPassword");
  const [submitted, setSubmitted] = useState(false);

  const forgotPasswordSchema = z.object({
    email: z.email(t("validation.emailInvalid")),
  });
  type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    await authClient.requestPasswordReset(
      { email: values.email, redirectTo: "/reset-password" },
      {
        onSuccess: () => setSubmitted(true),
        onError: (context) => {
          toast.error(context.error.message);
        },
      },
    );
  }

  const isPending = form.formState.isSubmitting;

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col gap-6 text-center">
              <div>
                <p className="font-medium">{t("successTitle")}</p>
                <p className="text-muted-foreground text-sm">
                  {t("successDescription")}
                </p>
              </div>
              <Link
                href="/login"
                className="text-sm underline underline-offset-4"
              >
                {t("backToLogin")}
              </Link>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("emailLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder={t("emailPlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isPending}>
                    {t("submitButton")}
                  </Button>
                  <div className="text-center text-sm">
                    <Link
                      href="/login"
                      className="underline underline-offset-4"
                    >
                      {t("backToLogin")}
                    </Link>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
