import { withSentryConfig } from "@sentry/nextjs/config"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

/**
 * Response headers sent with every page and API response. This is a
 * deliberately conservative set that cannot break scripts or styles:
 * clickjacking and MIME-sniffing protection, a referrer policy, a locked-down
 * Permissions-Policy and the non-script CSP directives. A full
 * `script-src`/`style-src` CSP needs per-request nonces (a proxy) and is not
 * part of the template, see docs/deployment.md. HSTS is only sent in
 * production (browsers ignore it over plain HTTP anyway).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
    : []),
]

const nextConfig: NextConfig = {
  output: "standalone",
  // Don't advertise the framework in an `X-Powered-By` header.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }]
  },
  // React Compiler: memoizes components and hooks automatically at build time,
  // so no manual useMemo/useCallback is needed for render performance.
  // Requires `babel-plugin-react-compiler`. See docs/frontend.md.
  reactCompiler: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/dashboard",
        permanent: false,
      },
    ]
  },
  devIndicators: false,
  // The Inngest dev server syncs with `/api/inngest` every few seconds, keep
  // those lines out of the dev console. Job runs carry a query string, so they
  // still show up. The app's own access lines: `src/lib/logging/request-logging.ts`.
  logging: {
    incomingRequests: { ignore: [/^\/api\/inngest$/] },
  },
}

const config = withNextIntl(nextConfig)

// Sentry is optional: only wrap the config (source-map upload, tunnel route)
// when a DSN is set. Runtime init lives in `src/instrumentation*.ts` and is
// a no-op without a DSN. See docs/integrations.md.
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(config, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      // Source maps are only uploaded when SENTRY_AUTH_TOKEN is set.
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: !process.env.CI,
      widenClientFileUpload: true,
      // Routes browser events through the app to get around ad-blockers.
      tunnelRoute: "/monitoring",
    })
  : config
