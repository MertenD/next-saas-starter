import { Polar } from "@polar-sh/sdk";
import { env } from "@/config/env";

/**
 * Whether Polar billing is configured for this deployment. Billing is
 * optional, so every consumer of `polarClient` (auth plugin, premium gating
 * in `src/lib/auth-utils.ts`, the subscription hook, ...) must check this
 * flag first and fall back to a non-billing behavior when it's `false`.
 */
export const isPolarEnabled = !!(
  env.POLAR_ACCESS_TOKEN &&
  env.POLAR_SERVER &&
  env.POLAR_SUCCESS_URL
);

/** The Polar SDK client, or `null` when billing isn't configured (see {@link isPolarEnabled}). */
export const polarClient = isPolarEnabled
  ? new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    })
  : null;
