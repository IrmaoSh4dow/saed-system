-- Allow ratings for completed medical appointments (in addition to admin-request appointments).
-- Rename system administrator rank display label to "Directiva".

ALTER TABLE "StaffRating" ALTER COLUMN "adminRequestId" DROP NOT NULL;

ALTER TABLE "StaffRating" ADD COLUMN "appointmentId" TEXT;

CREATE UNIQUE INDEX "StaffRating_appointmentId_key" ON "StaffRating"("appointmentId");

ALTER TABLE "StaffRating" ADD CONSTRAINT "StaffRating_appointmentId_fkey"
  FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffRating" ADD CONSTRAINT "StaffRating_source_xor"
  CHECK (
    ("adminRequestId" IS NOT NULL AND "appointmentId" IS NULL)
    OR ("adminRequestId" IS NULL AND "appointmentId" IS NOT NULL)
  );

UPDATE "Rank"
SET "name" = 'Directiva',
    "description" = 'High command / system directive hierarchy label'
WHERE "slug" = 'administrator';
