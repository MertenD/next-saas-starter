import { withSentryConfig } from "@sentry/nextjs/config"
import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

const nextConfig: NextConfig = {
  output: "standalone",
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
