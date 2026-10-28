-- Tutor identity is a UUID. Phone and name are the account. Clinic tables and
-- the e-mail password reset flow leave with the old CPF key.

DROP TABLE IF EXISTS "pet_vaccine";
DROP TABLE IF EXISTS "vaccine";
DROP TABLE IF EXISTS "recipe";
DROP TABLE IF EXISTS "password_reset_token";

ALTER TABLE "appointment" DROP CONSTRAINT IF EXISTS "appointment_doctor_id_fkey";
ALTER TABLE "appointment" DROP CONSTRAINT IF EXISTS "appointment_specialty_id_fkey";
ALTER TABLE "appointment" DROP COLUMN IF EXISTS "doctor_id";
ALTER TABLE "appointment" DROP COLUMN IF EXISTS "specialty_id";
ALTER TABLE "appointment" DROP COLUMN IF EXISTS "appointment_date";

DROP TABLE IF EXISTS "doctor";
DROP TABLE IF EXISTS "specialty";

ALTER TABLE "pet" DROP COLUMN IF EXISTS "is_neutered";
ALTER TABLE "pet" DROP COLUMN IF EXISTS "is_vaccinated";

-- Active tutors must already have a phone. Soft-deleted rows without a phone
-- and without pets or bookings are removed; any leftover link stops the migration.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "client"
        WHERE "deleted_at" IS NULL AND "phone" IS NULL
    ) THEN
        RAISE EXCEPTION 'active clients without a phone; fill the number before this migration';
    END IF;
END $$;

-- These accounts are already out of the operation and cannot keep a required phone.
DELETE FROM "appointment" AS a
USING "client" AS c
WHERE a."client_cpf" = c."cpf"
  AND c."deleted_at" IS NOT NULL
  AND c."phone" IS NULL;

DELETE FROM "pet" AS p
USING "client" AS c
WHERE p."client_cpf" = c."cpf"
  AND c."deleted_at" IS NOT NULL
  AND c."phone" IS NULL;

DELETE FROM "client" AS c
WHERE c."deleted_at" IS NOT NULL
  AND c."phone" IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "client" WHERE "phone" IS NULL) THEN
        RAISE EXCEPTION 'clients without a phone remain after cleanup';
    END IF;
END $$;

ALTER TABLE "client" ADD COLUMN "client_id" UUID;
UPDATE "client" SET "client_id" = gen_random_uuid() WHERE "client_id" IS NULL;
ALTER TABLE "client" ALTER COLUMN "client_id" SET NOT NULL;
ALTER TABLE "client" ALTER COLUMN "client_id" SET DEFAULT gen_random_uuid();

ALTER TABLE "pet" ADD COLUMN "client_id" UUID;
UPDATE "pet" AS p
SET "client_id" = c."client_id"
FROM "client" AS c
WHERE p."client_cpf" = c."cpf";

ALTER TABLE "appointment" ADD COLUMN "client_id" UUID;
UPDATE "appointment" AS a
SET "client_id" = c."client_id"
FROM "client" AS c
WHERE a."client_cpf" = c."cpf";

ALTER TABLE "pet" DROP CONSTRAINT IF EXISTS "pet_client_cpf_fkey";
ALTER TABLE "appointment" DROP CONSTRAINT IF EXISTS "appointment_client_cpf_fkey";
DROP INDEX IF EXISTS "appointment_client_cpf_starts_at_idx";

ALTER TABLE "pet" DROP COLUMN "client_cpf";
ALTER TABLE "appointment" DROP COLUMN "client_cpf";

ALTER TABLE "client" DROP CONSTRAINT "client_pkey";
DROP INDEX IF EXISTS "client_email_key";
DROP INDEX IF EXISTS "client_phone_active_key";
ALTER TABLE "client" DROP COLUMN "cpf";
ALTER TABLE "client" DROP COLUMN "email";
ALTER TABLE "client" DROP COLUMN "password";
ALTER TABLE "client" DROP COLUMN "birth_date";
ALTER TABLE "client" ADD CONSTRAINT "client_pkey" PRIMARY KEY ("client_id");
ALTER TABLE "client" ALTER COLUMN "phone" SET NOT NULL;

CREATE UNIQUE INDEX "client_phone_active_key"
    ON "client" ("phone")
    WHERE "deleted_at" IS NULL;

ALTER TABLE "pet" ADD CONSTRAINT "pet_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "client"("client_id") ON DELETE CASCADE ON UPDATE NO ACTION;
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_client_id_fkey"
    FOREIGN KEY ("client_id") REFERENCES "client"("client_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE INDEX "appointment_client_id_starts_at_idx" ON "appointment"("client_id", "starts_at");

ALTER TABLE "appointment" DROP CONSTRAINT IF EXISTS "appointment_booking_shape_check";
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_booking_shape_check" CHECK (
    "service_id" IS NULL
    OR ("starts_at" IS NOT NULL AND "ends_at" > "starts_at" AND "station" >= 1 AND "status" IS NOT NULL AND "client_id" IS NOT NULL)
);

ALTER TABLE "species" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "species" ADD COLUMN "deleted_at" TIMESTAMPTZ(6);

ALTER TABLE "shop_settings" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "opening_hours" ADD COLUMN "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "opening_hours" ADD COLUMN "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;
