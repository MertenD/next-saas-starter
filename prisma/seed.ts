import prisma from "../src/lib/db"

/**
 * Seeds example posts for the demo `posts` feature. Idempotent: users who
 * already have posts are left untouched.
 *
 * Sign up in the app first, then run `bun run db:seed`. Seeds the user with
 * the email in `SEED_USER_EMAIL`, or every existing user when it is unset.
 * Also runs automatically after `prisma migrate reset` (see
 * `migrations.seed` in `prisma.config.ts`).
 */
const DEMO_POSTS = [
  {
    title: "Welcome to the starter",
    content: "This post was created by the seed script. Edit or delete it.",
    published: true,
  },
  {
    title: "A draft post",
    content: "Drafts can be published in bulk with a Pro subscription.",
    published: false,
  },
  {
    title: "Server-side prefetching",
    content: "Prefetch queries in Server Components and hydrate them.",
    published: true,
  },
]

async function main() {
  const email = process.env.SEED_USER_EMAIL
  const users = await prisma.user.findMany({
    where: email ? { email } : undefined,
    select: { id: true, email: true, _count: { select: { posts: true } } },
  })

  if (users.length === 0) {
    console.log(
      email
        ? `No user with email ${email}. Sign up in the app first.`
        : "No users found. Sign up in the app first.",
    )
    return
  }

  for (const user of users) {
    if (user._count.posts > 0) {
      console.log(`Skipping ${user.email}: already has posts`)
      continue
    }
    await prisma.post.createMany({
      data: DEMO_POSTS.map((post) => ({ ...post, userId: user.id })),
    })
    console.log(`Seeded ${DEMO_POSTS.length} posts for ${user.email}`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
