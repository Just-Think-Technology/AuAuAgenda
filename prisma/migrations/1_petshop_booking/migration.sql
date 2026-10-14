-- Additive migration: pet shop booking. Legacy clinic tables and columns are kept untouched.

-- CreateEnum
CREATE TYPE "pet_size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE');

-- CreateEnum
CREATE TYPE "appointment_status" AS ENUM ('SCHEDULED', 'CONFIRMED', 'IN_SERVICE', 'COMPLETED', 'CANCELED', 'NO_SHOW');

-- AlterTable
ALTER TABLE "appointment" ADD COLUMN     "client_cpf" VARCHAR(15),
ADD COLUMN     "ends_at" TIMESTAMPTZ(6),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "service_id" UUID,
ADD COLUMN     "starts_at" TIMESTAMPTZ(6),
ADD COLUMN     "station" INTEGER,
ADD COLUMN     "status" "appointment_status",
ADD COLUMN     "status_updated_at" TIMESTAMPTZ(6);

-- AlterTable
ALTER TABLE "client" ADD COLUMN     "phone" VARCHAR(20);

-- AlterTable
ALTER TABLE "pet" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "size" "pet_size";

-- CreateTable
CREATE TABLE "service" (
    "service_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "duration_minutes" INTEGER NOT NULL,
    "price_cents" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sizes" "pet_size"[],
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "service_pkey" PRIMARY KEY ("service_id")
);

-- CreateTable
CREATE TABLE "service_species" (
    "service_id" UUID NOT NULL,
    "species_id" UUID NOT NULL,

    CONSTRAINT "service_species_pkey" PRIMARY KEY ("service_id","species_id")
);

-- CreateTable
CREATE TABLE "shop_settings" (
    "shop_settings_id" INTEGER NOT NULL DEFAULT 1,
    "name" VARCHAR(120) NOT NULL,
    "time_zone" VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "slot_interval_minutes" INTEGER NOT NULL DEFAULT 30,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_settings_pkey" PRIMARY KEY ("shop_settings_id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "weekday" INTEGER NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "open_minute" INTEGER,
    "close_minute" INTEGER,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("weekday")
);

-- CreateIndex
CREATE INDEX "appointment_starts_at_idx" ON "appointment"("starts_at");

-- CreateIndex
CREATE INDEX "appointment_client_cpf_starts_at_idx" ON "appointment"("client_cpf", "starts_at");

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("service_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_client_cpf_fkey" FOREIGN KEY ("client_cpf") REFERENCES "client"("cpf") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_species" ADD CONSTRAINT "service_species_service_id_fkey" FOREIGN KEY ("service_id") REFERENCES "service"("service_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "service_species" ADD CONSTRAINT "service_species_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("species_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Integrity rules Prisma cannot express.
ALTER TABLE "service" ADD CONSTRAINT "service_duration_check" CHECK ("duration_minutes" BETWEEN 5 AND 720);
ALTER TABLE "service" ADD CONSTRAINT "service_price_check" CHECK ("price_cents" IS NULL OR "price_cents" >= 0);
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_singleton_check" CHECK ("shop_settings_id" = 1);
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_capacity_check" CHECK ("capacity" BETWEEN 1 AND 50);
ALTER TABLE "shop_settings" ADD CONSTRAINT "shop_settings_interval_check" CHECK ("slot_interval_minutes" IN (10, 15, 20, 30, 60));
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_weekday_check" CHECK ("weekday" BETWEEN 0 AND 6);
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_range_check" CHECK (
    ("is_closed" AND "open_minute" IS NULL AND "close_minute" IS NULL)
    OR (NOT "is_closed" AND "open_minute" >= 0 AND "close_minute" <= 1440 AND "open_minute" < "close_minute")
);
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_booking_shape_check" CHECK (
    "service_id" IS NULL
    OR ("starts_at" IS NOT NULL AND "ends_at" > "starts_at" AND "station" >= 1 AND "status" IS NOT NULL AND "client_cpf" IS NOT NULL)
);

-- Two active bookings can never share a station in overlapping [starts_at, ends_at) intervals.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_station_no_overlap"
    EXCLUDE USING gist ("station" WITH =, tstzrange("starts_at", "ends_at", '[)') WITH &&)
    WHERE ("service_id" IS NOT NULL AND "deleted_at" IS NULL AND "status" <> 'CANCELED');

-- Initial configuration; the shop adjusts it in the management area.
INSERT INTO "shop_settings" ("shop_settings_id", "name") VALUES (1, 'AuAu Agenda') ON CONFLICT DO NOTHING;
INSERT INTO "opening_hours" ("weekday", "is_closed", "open_minute", "close_minute") VALUES
    (0, true, NULL, NULL),
    (1, false, 540, 1080),
    (2, false, 540, 1080),
    (3, false, 540, 1080),
    (4, false, 540, 1080),
    (5, false, 540, 1080),
    (6, false, 540, 960)
ON CONFLICT DO NOTHING;
