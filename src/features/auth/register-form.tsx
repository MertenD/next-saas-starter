"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { usePlausible } from "next-plausible"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { OAuthButtons } from "@/features/auth/oauth-buttons"
import { useErrorMessage } from "@/hooks/use-error-message"
import type { PlausibleEvents } from "@/lib/analytics"
import { authClient } from "@/lib/auth-client"
import type { OAuthProvider } from "@/lib/oauth-providers"

type RegisterFormProps = {
  oauthProviders: OAuthProvider[]
}

export default function RegisterForm({ oauthProviders }: RegisterFormProps) {
  const router = useRouter()
  const plausible = usePlausible<PlausibleEvents>()
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const t = useTranslations("auth.register")
  const tLegal = useTranslations("legal")
  const getErrorMessage = useErrorMessage()

  const registerSchema = z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    email: z.email(t("validation.emailInvalid")),
    password: z
      .string()
      .min(1, t("validation.passwordRequired"))
      .min(8, t("validation.passwordMinLength")),
  })
  type RegisterFormValues = z.infer<typeof registerSchema>

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  })

  async function onSubmit(values: RegisterFormValues) {
    await authClient.signUp.email(
      {
        name: values.name,
        email: values.email,
        password: values.password,
        callbackURL: "/dashboard",
      },
      {
        onSuccess: () => {
          plausible("Sign Up")
          router.push("/dashboard")
        },
        onError: (context) => {
          toast.error(getErrorMessage(context.error))
        },
      },
    )
  }

  async function signInWith(provider: OAuthProvider) {
    setOauthLoading(provider)
    plausible("Sign Up")
    await authClient.signIn.social(
      { provider, callbackURL: "/dashboard" },
      {
        onError: (ctx) => {
          toast.error(getErrorMessage(ctx.error))
          setOauthLoading(null)
        },
      },
    )
  }

  const isPending = form.formState.isSubmitting || oauthLoading !== null

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="text-center">
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="grid gap-6">
                <OAuthButtons
                  providers={oauthProviders}
                  loading={oauthLoading}
                  disabled={isPending}
                  onSignIn={signInWith}
                  namespace="auth.register"
                />
                <div className="grid gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("nameLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder={t("namePlaceholder")}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("passwordLabel")}</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder={t("passwordPlaceholder")}
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
                </div>
                <p className="text-center text-body-sm text-muted-foreground">
                  {tLegal("notice")}{" "}
                  <Link
                    href="/privacy"
                    className="underline underline-offset-4"
                  >
                    {tLegal("noticeLink")}
                  </Link>
                  .
                </p>
                <div className="text-center text-sm">
                  {t("alreadyHaveAccount")}{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    {t("loginLink")}
                  </Link>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
