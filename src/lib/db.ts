import { PrismaClient } from "@/generated/prisma/client"

// Next.js dev mode hot-reloads modules on every file change, which would
// otherwise create a new PrismaClient (and a new DB connection pool) per
// reload. Stashing the instance on `global` survives hot reloads so we
// reuse the same client/pool in development. In production each process
// only ever creates one client anyway, so the global isn't needed there.
const globalForPrisma = global as unknown as {
  prisma: PrismaClient
}

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}

/** Shared Prisma client. Import this everywhere instead of instantiating `new PrismaClient()`. */
export default prisma
