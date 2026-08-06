-- CreateEnum
CREATE TYPE "EstablishmentStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'EXPIRED');

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "status" "EstablishmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "defaultPosition" TEXT NOT NULL DEFAULT 'Empleado',
    "occupationType" "OccupationType" NOT NULL DEFAULT 'BUSINESS',
    "isSelectable" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Establishment_slug_key" ON "Establishment"("slug");
CREATE UNIQUE INDEX "Establishment_name_key" ON "Establishment"("name");
CREATE INDEX "Establishment_status_isSelectable_sortOrder_idx" ON "Establishment"("status", "isSelectable", "sortOrder");

-- CreateTable
CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "startsAt" DATE NOT NULL,
    "endsAt" DATE,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Agreement_establishmentId_status_idx" ON "Agreement"("establishmentId", "status");
CREATE INDEX "Agreement_status_startsAt_idx" ON "Agreement"("status", "startsAt");
CREATE INDEX "Agreement_endsAt_idx" ON "Agreement"("endsAt");

-- CreateTable
CREATE TABLE "AgreementHistory" (
    "id" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "previousPercent" DECIMAL(5,2),
    "newPercent" DECIMAL(5,2) NOT NULL,
    "previousStatus" "AgreementStatus",
    "newStatus" "AgreementStatus" NOT NULL,
    "previousEndsAt" DATE,
    "newEndsAt" DATE,
    "notes" TEXT,
    "changedByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgreementHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AgreementHistory_agreementId_createdAt_idx" ON "AgreementHistory"("agreementId", "createdAt");

-- AlterTable Occupation
ALTER TABLE "Occupation" ADD COLUMN "establishmentId" TEXT;
CREATE INDEX "Occupation_establishmentId_idx" ON "Occupation"("establishmentId");

-- AlterTable PatientInvoice (billing snapshots for future invoicing module)
ALTER TABLE "PatientInvoice" ADD COLUMN "originalAmount" DECIMAL(10,2);
ALTER TABLE "PatientInvoice" ADD COLUMN "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0;
ALTER TABLE "PatientInvoice" ADD COLUMN "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE "PatientInvoice" ADD COLUMN "agreementId" TEXT;
ALTER TABLE "PatientInvoice" ADD COLUMN "establishmentName" TEXT;

UPDATE "PatientInvoice" SET "originalAmount" = "amount" WHERE "originalAmount" IS NULL;
ALTER TABLE "PatientInvoice" ALTER COLUMN "originalAmount" SET NOT NULL;

CREATE INDEX "PatientInvoice_agreementId_idx" ON "PatientInvoice"("agreementId");

-- ForeignKeys
ALTER TABLE "Occupation" ADD CONSTRAINT "Occupation_establishmentId_fkey"
  FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_establishmentId_fkey"
  FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_createdByCharacterId_fkey"
  FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AgreementHistory" ADD CONSTRAINT "AgreementHistory_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AgreementHistory" ADD CONSTRAINT "AgreementHistory_changedByCharacterId_fkey"
  FOREIGN KEY ("changedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PatientInvoice" ADD CONSTRAINT "PatientInvoice_agreementId_fkey"
  FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
