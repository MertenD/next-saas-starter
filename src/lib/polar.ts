import { Polar } from "@polar-sh/sdk";
import { env } from "@/config/env";

export const isPolarEnabled = !!(
  env.POLAR_ACCESS_TOKEN &&
  env.POLAR_SERVER &&
  env.POLAR_SUCCESS_URL
);

export const polarClient = isPolarEnabled
  ? new Polar({
      accessToken: env.POLAR_ACCESS_TOKEN,
      server: env.POLAR_SERVER,
    })
  : null;
