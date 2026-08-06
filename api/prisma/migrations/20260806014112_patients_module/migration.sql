-- CreateEnum
CREATE TYPE "BloodType" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "PatientStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DECEASED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "Patient" (
    "id" TEXT NOT NULL,
    "recordNumber" SERIAL NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "middleName" TEXT,
    "birthDate" DATE,
    "sex" "CharacterSex",
    "nationality" TEXT,
    "phone" TEXT,
    "identityDocument" TEXT,
    "bloodType" "BloodType" NOT NULL DEFAULT 'UNKNOWN',
    "allergies" TEXT,
    "chronicConditions" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "notes" TEXT,
    "avatarUrl" TEXT,
    "status" "PatientStatus" NOT NULL DEFAULT 'ACTIVE',
    "linkedCharacterId" TEXT,
    "searchKey" TEXT NOT NULL,
    "createdByCharacterId" TEXT,
    "updatedByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_recordNumber_key" ON "Patient"("recordNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_identityDocument_key" ON "Patient"("identityDocument");

-- CreateIndex
CREATE UNIQUE INDEX "Patient_linkedCharacterId_key" ON "Patient"("linkedCharacterId");

-- CreateIndex
CREATE INDEX "Patient_searchKey_idx" ON "Patient"("searchKey");

-- CreateIndex
CREATE INDEX "Patient_lastName_firstName_idx" ON "Patient"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Patient_birthDate_idx" ON "Patient"("birthDate");

-- CreateIndex
CREATE INDEX "Patient_phone_idx" ON "Patient"("phone");

-- CreateIndex
CREATE INDEX "Patient_identityDocument_idx" ON "Patient"("identityDocument");

-- CreateIndex
CREATE INDEX "Patient_status_idx" ON "Patient"("status");

-- CreateIndex
CREATE INDEX "Patient_createdAt_idx" ON "Patient"("createdAt");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_linkedCharacterId_fkey" FOREIGN KEY ("linkedCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_createdByCharacterId_fkey" FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_updatedByCharacterId_fkey" FOREIGN KEY ("updatedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
