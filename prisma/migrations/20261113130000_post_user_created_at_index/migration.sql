-- Replace the single-column index with a composite one that also serves the
-- "newest posts of a user" query (WHERE userId = ? ORDER BY createdAt DESC).
-- DropIndex
DROP INDEX "post_userId_idx";

-- CreateIndex
CREATE INDEX "post_userId_createdAt_idx" ON "post"("userId", "createdAt");
