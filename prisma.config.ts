import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    // biome-ignore lint/style/noNonNullAssertion: required env var validated at startup
    url: process.env.DATABASE_URL!,
  },
});
