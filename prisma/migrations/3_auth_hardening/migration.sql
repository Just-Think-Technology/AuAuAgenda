-- AlterTable
ALTER TABLE "admin" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "client" ADD COLUMN "session_version" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "phone_login_challenge" (
    "phone" VARCHAR(20) NOT NULL,
    "code_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_login_challenge_pkey" PRIMARY KEY ("phone")
);

-- CreateTable
CREATE TABLE "auth_rate_limit" (
    "bucket_key" VARCHAR(255) NOT NULL,
    "count" INTEGER NOT NULL,
    "reset_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "auth_rate_limit_pkey" PRIMARY KEY ("bucket_key")
);

-- CreateIndex
CREATE INDEX "phone_login_challenge_expires_at_idx" ON "phone_login_challenge"("expires_at");

-- CreateIndex
CREATE INDEX "auth_rate_limit_reset_at_idx" ON "auth_rate_limit"("reset_at");
