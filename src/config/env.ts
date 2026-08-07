import { z } from "zod"

/**
 * Runtime-validated environment variables. Import `env` from this module
 * instead of reading `process.env` directly anywhere else in the codebase -
 * that gets you parsing (e.g. `AI_MODEL` defaults, `POLAR_SERVER` enum
 * validation) and a single fail-fast startup error listing every missing/
 * invalid variable, instead of scattered runtime `undefined` bugs. See
 * `docs/environment-variables.md` for what each variable does and which
 * ones are optional.
 */
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // Better Auth
  BETTER_AUTH_SECRET: z.string().min(1),
  BETTER_AUTH_URL: z.string().min(1),

  // OAuth (optional - remove unused providers from src/lib/auth.ts)
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),

  // Inngest
  INNGEST_APP_ID: z.string().min(1),

  // AI (optional)
  OPENROUTER_API_KEY: z.string().optional(),
  AI_MODEL: z.string().default("google/gemini-2.5-flash"),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // Polar (optional - leave unset to disable payments and mock premium access locally)
  POLAR_ACCESS_TOKEN: z.string().optional(),
  POLAR_SUCCESS_URL: z.string().optional(),
  POLAR_SERVER: z.enum(["sandbox", "production"]).optional(),

  // Resend (optional - leave unset to log emails to the console instead of sending them)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
})

// Set SKIP_ENV_VALIDATION=1 to bypass validation (e.g. during docker build)
const parsed =
  process.env.SKIP_ENV_VALIDATION === "1"
    ? envSchema.parse({
        DATABASE_URL: "postgresql://skip:skip@skip:5432/skip",
        BETTER_AUTH_SECRET: "skip",
        BETTER_AUTH_URL: "http://skip",
        INNGEST_APP_ID: "skip",
      })
    : (() => {
        const result = envSchema.safeParse(process.env)
        if (!result.success) {
          console.error("❌ Invalid environment variables:\n")
          for (const [key, errors] of Object.entries(
            result.error.flatten().fieldErrors,
          )) {
            console.error(`  ${key}: ${errors?.join(", ")}`)
          }
          throw new Error(
            "Invalid environment variables - check the output above.",
          )
        }
        return result.data
      })()

export const env = parsed
