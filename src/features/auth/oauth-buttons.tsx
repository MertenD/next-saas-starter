"use client"

import Image from "next/image"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import type { OAuthProvider } from "@/lib/oauth-providers"

type OAuthButtonsProps = {
  providers: OAuthProvider[]
  /** Provider currently redirecting, shows the "Redirecting..." label on its button. */
  loading: OAuthProvider | null
  /** Disables all buttons (e.g. while the email form is submitting). */
  disabled: boolean
  onSignIn: (provider: OAuthProvider) => void
  /** i18n namespace holding `continueWithGithub`, `continueWithGoogle` and `redirecting`. */
  namespace: "auth.login" | "auth.register"
}

const PROVIDER_LOGOS: Record<OAuthProvider, { src: string; alt: string }> = {
  github: { src: "/logos/github.svg", alt: "GitHub" },
  google: { src: "/logos/google.svg", alt: "Google" },
}

/**
 * "Continue with GitHub/Google" buttons shared by the login and signup
 * forms. Renders nothing when no provider is configured.
 */
export function OAuthButtons({
  providers,
  loading,
  disabled,
  onSignIn,
  namespace,
}: OAuthButtonsProps) {
  const t = useTranslations(namespace)

  if (providers.length === 0) return null

  return (
    <div className="flex flex-col gap-4">
      {providers.map((provider) => (
        <Button
          key={provider}
          variant="outline"
          className="w-full"
          type="button"
          disabled={disabled}
          onClick={() => onSignIn(provider)}
        >
          <Image
            src={PROVIDER_LOGOS[provider].src}
            alt=""
            width={20}
            height={20}
            className={provider === "github" ? "dark:invert" : undefined}
          />
          {loading === provider
            ? t("redirecting")
            : t(
                provider === "github"
                  ? "continueWithGithub"
                  : "continueWithGoogle",
              )}
        </Button>
      ))}
    </div>
  )
}
