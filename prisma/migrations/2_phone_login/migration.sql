-- Phone is the customer login key. A new account may omit e-mail, password and birth date.
-- The partial unique index is not represented in schema.prisma.

-- Store a canonical national number so "(11) 91234-5678" and "5511912345678" match.
UPDATE "client"
SET "phone" = NULLIF(regexp_replace("phone", '\D', '', 'g'), '')
WHERE "phone" IS NOT NULL;

UPDATE "client"
SET "phone" = substring("phone" FROM 3)
WHERE "phone" ~ '^55[0-9]{10,11}$';

-- Do not guess which account keeps a shared number.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM "client"
        WHERE "deleted_at" IS NULL AND "phone" IS NOT NULL
        GROUP BY "phone"
        HAVING COUNT(*) > 1
    ) THEN
        RAISE EXCEPTION 'active clients share a phone; resolve the duplicates before adding client_phone_active_key';
    END IF;
END $$;

ALTER TABLE "client" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "client" ALTER COLUMN "password" DROP NOT NULL;
ALTER TABLE "client" ALTER COLUMN "birth_date" DROP NOT NULL;

CREATE UNIQUE INDEX "client_phone_active_key"
    ON "client" ("phone")
    WHERE "deleted_at" IS NULL AND "phone" IS NOT NULL;
