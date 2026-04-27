-- Add googleSub for Google OAuth account linking.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleSub" TEXT;

-- Unique index allows multiple NULLs in Postgres.
CREATE UNIQUE INDEX IF NOT EXISTS "users_googleSub_key" ON "users"("googleSub");

