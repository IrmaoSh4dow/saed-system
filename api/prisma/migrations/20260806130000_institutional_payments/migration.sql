-- CreateEnum
CREATE TYPE "InstitutionalPaymentStatus" AS ENUM ('ACTIVE', 'VOID');

-- CreateTable
CREATE TABLE "InstitutionalPayment" (
    "id" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "organizationName" TEXT NOT NULL,
    "establishmentSlug" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" DATE NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "notes" TEXT,
    "status" "InstitutionalPaymentStatus" NOT NULL DEFAULT 'ACTIVE',
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "voidedByCharacterId" TEXT,
    "createdByCharacterId" TEXT,
    "updatedByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionalPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionalPaymentAllocation" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalPaymentAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InstitutionalPayment_establishmentId_paymentDate_idx" ON "InstitutionalPayment"("establishmentId", "paymentDate");
CREATE INDEX "InstitutionalPayment_status_paymentDate_idx" ON "InstitutionalPayment"("status", "paymentDate");
CREATE INDEX "InstitutionalPayment_periodStart_periodEnd_idx" ON "InstitutionalPayment"("periodStart", "periodEnd");
CREATE INDEX "InstitutionalPayment_createdByCharacterId_idx" ON "InstitutionalPayment"("createdByCharacterId");

-- CreateIndex
CREATE INDEX "InstitutionalPaymentAllocation_invoiceId_idx" ON "InstitutionalPaymentAllocation"("invoiceId");
CREATE UNIQUE INDEX "InstitutionalPaymentAllocation_paymentId_invoiceId_key" ON "InstitutionalPaymentAllocation"("paymentId", "invoiceId");

-- AddForeignKey
ALTER TABLE "InstitutionalPayment" ADD CONSTRAINT "InstitutionalPayment_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InstitutionalPayment" ADD CONSTRAINT "InstitutionalPayment_voidedByCharacterId_fkey" FOREIGN KEY ("voidedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InstitutionalPayment" ADD CONSTRAINT "InstitutionalPayment_createdByCharacterId_fkey" FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InstitutionalPayment" ADD CONSTRAINT "InstitutionalPayment_updatedByCharacterId_fkey" FOREIGN KEY ("updatedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "InstitutionalPaymentAllocation" ADD CONSTRAINT "InstitutionalPaymentAllocation_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "InstitutionalPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InstitutionalPaymentAllocation" ADD CONSTRAINT "InstitutionalPaymentAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "PatientInvoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
