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

type LoginFormProps = {
  oauthProviders: OAuthProvider[]
}

export default function LoginForm({ oauthProviders }: LoginFormProps) {
  const router = useRouter()
  const plausible = usePlausible<PlausibleEvents>()
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)
  const t = useTranslations("auth.login")
  const getErrorMessage = useErrorMessage()

  const loginSchema = z.object({
    email: z.email(t("validation.emailInvalid")),
    password: z.string().min(1, t("validation.passwordRequired")),
  })
  type LoginFormValues = z.infer<typeof loginSchema>

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function signInWith(provider: OAuthProvider) {
    setOauthLoading(provider)
    plausible("Login")
    await authClient.signIn.social(
      { provider, callbackURL: "/" },
      {
        onError: (ctx) => {
          toast.error(getErrorMessage(ctx.error))
          setOauthLoading(null)
        },
      },
    )
  }

  async function onSubmit(values: LoginFormValues) {
    await authClient.signIn.email(
      { email: values.email, password: values.password, callbackURL: "/" },
      {
        onSuccess: () => {
          plausible("Login")
          router.push("/")
        },
        onError: (context) => {
          toast.error(getErrorMessage(context.error))
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
                  namespace="auth.login"
                />
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
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{t("passwordLabel")}</FormLabel>
                          <Link
                            href="/forgot-password"
                            className="text-sm underline underline-offset-4"
                          >
                            {t("forgotPasswordLink")}
                          </Link>
                        </div>
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
                <div className="text-center text-sm">
                  {t("noAccount")}{" "}
                  <Link href="/signup" className="underline underline-offset-4">
                    {t("signUpLink")}
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
