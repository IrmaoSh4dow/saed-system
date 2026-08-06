-- CreateEnum
CREATE TYPE "MedicalReportAccessGrantStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "MedicalReportAccessReason" AS ENUM (
  'CRIMINAL_INVESTIGATION',
  'FORENSIC_CASE',
  'COURT_ORDER',
  'INTERNAL_INVESTIGATION',
  'PROSECUTOR_REQUEST',
  'OTHER'
);

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MEDICAL_REPORT_ACCESS_GRANTED';
ALTER TYPE "NotificationType" ADD VALUE 'MEDICAL_REPORT_ACCESS_REVOKED';
ALTER TYPE "NotificationType" ADD VALUE 'MEDICAL_REPORT_ACCESS_EXPIRING';

-- CreateTable
CREATE TABLE "MedicalReportAccessGrant" (
    "id" TEXT NOT NULL,
    "grantNumber" SERIAL NOT NULL,
    "reportId" TEXT NOT NULL,
    "recipientCharacterId" TEXT NOT NULL,
    "grantedByCharacterId" TEXT NOT NULL,
    "organization" TEXT NOT NULL DEFAULT 'LSPD',
    "reason" "MedicalReportAccessReason" NOT NULL,
    "reasonNotes" TEXT,
    "status" "MedicalReportAccessGrantStatus" NOT NULL DEFAULT 'ACTIVE',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revokedByCharacterId" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MedicalReportAccessGrant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MedicalReportAccessViewLog" (
    "id" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "viewerCharacterId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MedicalReportAccessViewLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MedicalReportAccessGrant_grantNumber_key" ON "MedicalReportAccessGrant"("grantNumber");
CREATE INDEX "MedicalReportAccessGrant_reportId_status_idx" ON "MedicalReportAccessGrant"("reportId", "status");
CREATE INDEX "MedicalReportAccessGrant_recipientCharacterId_status_expiresAt_idx" ON "MedicalReportAccessGrant"("recipientCharacterId", "status", "expiresAt");
CREATE INDEX "MedicalReportAccessGrant_grantedByCharacterId_idx" ON "MedicalReportAccessGrant"("grantedByCharacterId");
CREATE INDEX "MedicalReportAccessGrant_status_expiresAt_idx" ON "MedicalReportAccessGrant"("status", "expiresAt");
CREATE INDEX "MedicalReportAccessGrant_organization_createdAt_idx" ON "MedicalReportAccessGrant"("organization", "createdAt");
CREATE INDEX "MedicalReportAccessViewLog_grantId_viewedAt_idx" ON "MedicalReportAccessViewLog"("grantId", "viewedAt");
CREATE INDEX "MedicalReportAccessViewLog_viewerCharacterId_viewedAt_idx" ON "MedicalReportAccessViewLog"("viewerCharacterId", "viewedAt");

ALTER TABLE "MedicalReportAccessGrant" ADD CONSTRAINT "MedicalReportAccessGrant_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalReportAccessGrant" ADD CONSTRAINT "MedicalReportAccessGrant_recipientCharacterId_fkey" FOREIGN KEY ("recipientCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalReportAccessGrant" ADD CONSTRAINT "MedicalReportAccessGrant_grantedByCharacterId_fkey" FOREIGN KEY ("grantedByCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MedicalReportAccessGrant" ADD CONSTRAINT "MedicalReportAccessGrant_revokedByCharacterId_fkey" FOREIGN KEY ("revokedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MedicalReportAccessViewLog" ADD CONSTRAINT "MedicalReportAccessViewLog_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "MedicalReportAccessGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MedicalReportAccessViewLog" ADD CONSTRAINT "MedicalReportAccessViewLog_viewerCharacterId_fkey" FOREIGN KEY ("viewerCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
