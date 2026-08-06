-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'MEDICAL_RECORD_ACCESS_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'MEDICAL_RECORD_ACCESS_STATUS';

-- CreateEnum
CREATE TYPE "MedicalRecordAccessStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED');

-- AlterTable PatientInvoice institutional billing snapshots
ALTER TABLE "PatientInvoice" ADD COLUMN "billingOrganization" TEXT;
ALTER TABLE "PatientInvoice" ADD COLUMN "billingEstablishmentId" TEXT;
ALTER TABLE "PatientInvoice" ADD COLUMN "billingEstablishmentSlug" TEXT;

CREATE INDEX "PatientInvoice_billingEstablishmentSlug_issuedAt_idx" ON "PatientInvoice"("billingEstablishmentSlug", "issuedAt");
CREATE INDEX "PatientInvoice_billingOrganization_issuedAt_idx" ON "PatientInvoice"("billingOrganization", "issuedAt");

-- Backfill historical invoices for patients linked to LSPD occupations (best-effort).
UPDATE "PatientInvoice" AS pi
SET
  "billingOrganization" = COALESCE(e.name, o.organization),
  "billingEstablishmentId" = o."establishmentId",
  "billingEstablishmentSlug" = e.slug
FROM "Patient" p
JOIN "Occupation" o ON o."characterId" = p."linkedCharacterId" AND o."isActive" = true
LEFT JOIN "Establishment" e ON e.id = o."establishmentId"
WHERE pi."patientId" = p.id
  AND pi."billingOrganization" IS NULL
  AND (
    e.slug = 'lspd'
    OR LOWER(o.organization) IN ('lspd', 'los santos police department', 'los santos pd')
  );

-- CreateTable
CREATE TABLE "MedicalRecordAccessRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "requesterCharacterId" TEXT NOT NULL,
    "requesterOrganization" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "MedicalRecordAccessStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedByCharacterId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "decisionNotes" TEXT,
    "approvedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecordAccessRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MedicalRecordAccessRequest_requestNumber_key" ON "MedicalRecordAccessRequest"("requestNumber");
CREATE INDEX "MedicalRecordAccessRequest_patientId_status_idx" ON "MedicalRecordAccessRequest"("patientId", "status");
CREATE INDEX "MedicalRecordAccessRequest_requesterCharacterId_status_idx" ON "MedicalRecordAccessRequest"("requesterCharacterId", "status");
CREATE INDEX "MedicalRecordAccessRequest_status_expiresAt_idx" ON "MedicalRecordAccessRequest"("status", "expiresAt");
CREATE INDEX "MedicalRecordAccessRequest_createdAt_idx" ON "MedicalRecordAccessRequest"("createdAt");

ALTER TABLE "MedicalRecordAccessRequest" ADD CONSTRAINT "MedicalRecordAccessRequest_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicalRecordAccessRequest" ADD CONSTRAINT "MedicalRecordAccessRequest_requesterCharacterId_fkey"
  FOREIGN KEY ("requesterCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicalRecordAccessRequest" ADD CONSTRAINT "MedicalRecordAccessRequest_reviewedByCharacterId_fkey"
  FOREIGN KEY ("reviewedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
