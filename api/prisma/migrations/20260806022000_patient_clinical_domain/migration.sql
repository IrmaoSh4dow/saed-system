-- CreateEnum
CREATE TYPE "MedicalRecordStatus" AS ENUM ('OPEN', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "HospitalizationStatus" AS ENUM ('ADMITTED', 'DISCHARGED', 'TRANSFERRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SurgeryStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- Clinical stub tables (Patient-centric)
CREATE TABLE "MedicalRecord" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "status" "MedicalRecordStatus" NOT NULL DEFAULT 'OPEN',
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Hospitalization" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "status" "HospitalizationStatus" NOT NULL DEFAULT 'ADMITTED',
    "admittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dischargedAt" TIMESTAMP(3),
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hospitalization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Diagnosis" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "diagnosedAt" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Diagnosis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Surgery" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    "status" "SurgeryStatus" NOT NULL DEFAULT 'SCHEDULED',
    "performedAt" DATE,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Surgery_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MedicalRecord_patientId_createdAt_idx" ON "MedicalRecord"("patientId", "createdAt");
CREATE INDEX "MedicalRecord_status_idx" ON "MedicalRecord"("status");
CREATE INDEX "Hospitalization_patientId_admittedAt_idx" ON "Hospitalization"("patientId", "admittedAt");
CREATE INDEX "Hospitalization_status_idx" ON "Hospitalization"("status");
CREATE INDEX "Diagnosis_patientId_diagnosedAt_idx" ON "Diagnosis"("patientId", "diagnosedAt");
CREATE INDEX "Surgery_patientId_performedAt_idx" ON "Surgery"("patientId", "performedAt");
CREATE INDEX "Surgery_status_idx" ON "Surgery"("status");

ALTER TABLE "MedicalRecord" ADD CONSTRAINT "MedicalRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Hospitalization" ADD CONSTRAINT "Hospitalization_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Diagnosis" ADD CONSTRAINT "Diagnosis_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Surgery" ADD CONSTRAINT "Surgery_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Legacy reports without Patient cannot satisfy the new clinical invariant.
DELETE FROM "ReportEvidence";
DELETE FROM "ReportParticipant";
DELETE FROM "ReportTransfer";
DELETE FROM "Report";

-- AlterTable
ALTER TABLE "Report" ADD COLUMN "patientId" TEXT NOT NULL;

CREATE INDEX "Report_patientId_createdAt_idx" ON "Report"("patientId", "createdAt");

ALTER TABLE "Report" ADD CONSTRAINT "Report_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
