-- CreateEnum
CREATE TYPE "PsychotechnicalResult" AS ENUM ('FIT', 'FIT_WITH_OBSERVATIONS', 'UNFIT');
CREATE TYPE "MedicalLeaveStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "PsychotechnicalEvaluation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "result" "PsychotechnicalResult" NOT NULL,
    "issuedAt" DATE NOT NULL,
    "expiresAt" DATE,
    "observations" TEXT,
    "physicianCharacterId" TEXT,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychotechnicalEvaluation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PsychotechnicalEvaluation_patientId_issuedAt_idx" ON "PsychotechnicalEvaluation"("patientId", "issuedAt");
CREATE INDEX "PsychotechnicalEvaluation_result_expiresAt_idx" ON "PsychotechnicalEvaluation"("result", "expiresAt");
CREATE INDEX "PsychotechnicalEvaluation_physicianCharacterId_idx" ON "PsychotechnicalEvaluation"("physicianCharacterId");

CREATE TABLE "MedicalLeave" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "status" "MedicalLeaveStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" DATE NOT NULL,
    "endsAt" DATE,
    "reason" TEXT NOT NULL,
    "observations" TEXT,
    "physicianCharacterId" TEXT,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalLeave_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MedicalLeave_patientId_status_idx" ON "MedicalLeave"("patientId", "status");
CREATE INDEX "MedicalLeave_status_startsAt_idx" ON "MedicalLeave"("status", "startsAt");
CREATE INDEX "MedicalLeave_endsAt_idx" ON "MedicalLeave"("endsAt");
CREATE INDEX "MedicalLeave_physicianCharacterId_idx" ON "MedicalLeave"("physicianCharacterId");

-- ForeignKeys
ALTER TABLE "PsychotechnicalEvaluation" ADD CONSTRAINT "PsychotechnicalEvaluation_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PsychotechnicalEvaluation" ADD CONSTRAINT "PsychotechnicalEvaluation_physicianCharacterId_fkey"
  FOREIGN KEY ("physicianCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PsychotechnicalEvaluation" ADD CONSTRAINT "PsychotechnicalEvaluation_createdByCharacterId_fkey"
  FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MedicalLeave" ADD CONSTRAINT "MedicalLeave_patientId_fkey"
  FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MedicalLeave" ADD CONSTRAINT "MedicalLeave_physicianCharacterId_fkey"
  FOREIGN KEY ("physicianCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MedicalLeave" ADD CONSTRAINT "MedicalLeave_createdByCharacterId_fkey"
  FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
