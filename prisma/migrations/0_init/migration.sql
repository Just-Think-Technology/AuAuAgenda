-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "admin" (
    "admin_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "admin_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "appointment" (
    "appointment_id" SERIAL NOT NULL,
    "pet_id" UUID,
    "appointment_date" TIMESTAMP(6) NOT NULL,
    "doctor_id" UUID,
    "specialty_id" UUID,
    "admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "appointment_pkey" PRIMARY KEY ("appointment_id")
);

-- CreateTable
CREATE TABLE "breed" (
    "breed_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "species_id" UUID,

    CONSTRAINT "breed_pkey" PRIMARY KEY ("breed_id")
);

-- CreateTable
CREATE TABLE "client" (
    "cpf" VARCHAR(15) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "birth_date" DATE NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "client_pkey" PRIMARY KEY ("cpf")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "reset_token_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "client_cpf" VARCHAR(15) NOT NULL,
    "token_hash" VARCHAR(64) NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "used_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("reset_token_id")
);

-- CreateTable
CREATE TABLE "doctor" (
    "doctor_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "cpf" VARCHAR(15) NOT NULL,
    "specialty_id" UUID,
    "admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "doctor_pkey" PRIMARY KEY ("doctor_id")
);

-- CreateTable
CREATE TABLE "pet" (
    "pet_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "birth_date" DATE,
    "client_cpf" VARCHAR(15),
    "breed_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "is_neutered" BOOLEAN DEFAULT false,
    "is_vaccinated" BOOLEAN DEFAULT false,
    "image_url" TEXT,
    "sex" VARCHAR(50),
    "species_id" UUID,

    CONSTRAINT "pet_pkey" PRIMARY KEY ("pet_id")
);

-- CreateTable
CREATE TABLE "recipe" (
    "recipe_id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "pet_id" UUID,
    "client_cpf" VARCHAR(15),
    "admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),
    "pdf_url" TEXT,
    "doctor_id" UUID,

    CONSTRAINT "recipe_pkey" PRIMARY KEY ("recipe_id")
);

-- CreateTable
CREATE TABLE "specialty" (
    "specialty_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "specialty_pkey" PRIMARY KEY ("specialty_id")
);

-- CreateTable
CREATE TABLE "pet_vaccine" (
    "pet_id" UUID NOT NULL,
    "vaccine_id" UUID NOT NULL,

    CONSTRAINT "pet_vaccine_pkey" PRIMARY KEY ("pet_id","vaccine_id")
);

-- CreateTable
CREATE TABLE "vaccine" (
    "vaccine_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "vaccine_pkey" PRIMARY KEY ("vaccine_id")
);

-- CreateTable
CREATE TABLE "species" (
    "species_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "species_pkey" PRIMARY KEY ("species_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_email_key" ON "admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "breed_name_key" ON "breed"("name");

-- CreateIndex
CREATE UNIQUE INDEX "client_email_key" ON "client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_hash_key" ON "password_reset_token"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_token_client_cpf_idx" ON "password_reset_token"("client_cpf");

-- CreateIndex
CREATE INDEX "password_reset_token_expires_at_idx" ON "password_reset_token"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "doctor_cpf_key" ON "doctor"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "specialty_name_key" ON "specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "vaccine_name_key" ON "vaccine"("name");

-- CreateIndex
CREATE UNIQUE INDEX "species_name_key" ON "species"("name");

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet"("pet_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialty"("specialty_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "breed" ADD CONSTRAINT "breed_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("species_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_client_cpf_fkey" FOREIGN KEY ("client_cpf") REFERENCES "client"("cpf") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "doctor" ADD CONSTRAINT "doctor_specialty_id_fkey" FOREIGN KEY ("specialty_id") REFERENCES "specialty"("specialty_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breed"("breed_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_client_cpf_fkey" FOREIGN KEY ("client_cpf") REFERENCES "client"("cpf") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet" ADD CONSTRAINT "pet_species_id_fkey" FOREIGN KEY ("species_id") REFERENCES "species"("species_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_client_cpf_fkey" FOREIGN KEY ("client_cpf") REFERENCES "client"("cpf") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctor"("doctor_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recipe" ADD CONSTRAINT "recipe_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet"("pet_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "specialty" ADD CONSTRAINT "specialty_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "admin"("admin_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet_vaccine" ADD CONSTRAINT "pet_vaccine_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pet"("pet_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pet_vaccine" ADD CONSTRAINT "pet_vaccine_vaccine_id_fkey" FOREIGN KEY ("vaccine_id") REFERENCES "vaccine"("vaccine_id") ON DELETE CASCADE ON UPDATE NO ACTION;

