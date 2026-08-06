-- CreateEnum
CREATE TYPE "EmploymentChangeRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'CANCELLED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'EMPLOYMENT_CHANGE_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'EMPLOYMENT_CHANGE_STATUS';

-- CreateTable
CREATE TABLE "EmploymentChangeRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" SERIAL NOT NULL,
    "characterId" TEXT NOT NULL,
    "currentEstablishmentId" TEXT,
    "currentOrganizationName" TEXT,
    "requestedEstablishmentId" TEXT NOT NULL,
    "requestedOrganizationName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "EmploymentChangeRequestStatus" NOT NULL DEFAULT 'PENDING',
    "internalNotes" TEXT,
    "approvedByCharacterId" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedByCharacterId" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EmploymentChangeRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EmploymentChangeRequest_requestNumber_key" ON "EmploymentChangeRequest"("requestNumber");
CREATE INDEX "EmploymentChangeRequest_characterId_status_createdAt_idx" ON "EmploymentChangeRequest"("characterId", "status", "createdAt");
CREATE INDEX "EmploymentChangeRequest_status_createdAt_idx" ON "EmploymentChangeRequest"("status", "createdAt");
CREATE INDEX "EmploymentChangeRequest_requestedEstablishmentId_idx" ON "EmploymentChangeRequest"("requestedEstablishmentId");
CREATE INDEX "EmploymentChangeRequest_currentEstablishmentId_idx" ON "EmploymentChangeRequest"("currentEstablishmentId");

ALTER TABLE "EmploymentChangeRequest" ADD CONSTRAINT "EmploymentChangeRequest_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmploymentChangeRequest" ADD CONSTRAINT "EmploymentChangeRequest_currentEstablishmentId_fkey" FOREIGN KEY ("currentEstablishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmploymentChangeRequest" ADD CONSTRAINT "EmploymentChangeRequest_requestedEstablishmentId_fkey" FOREIGN KEY ("requestedEstablishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmploymentChangeRequest" ADD CONSTRAINT "EmploymentChangeRequest_approvedByCharacterId_fkey" FOREIGN KEY ("approvedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EmploymentChangeRequest" ADD CONSTRAINT "EmploymentChangeRequest_rejectedByCharacterId_fkey" FOREIGN KEY ("rejectedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
