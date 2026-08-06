-- CreateTable
CREATE TABLE "Treatment" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientInvoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" SERIAL NOT NULL,
    "patientId" TEXT NOT NULL,
    "treatmentId" TEXT NOT NULL,
    "treatmentName" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "issuedAt" DATE NOT NULL,
    "notes" TEXT,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Treatment_name_key" ON "Treatment"("name");

-- CreateIndex
CREATE INDEX "Treatment_isActive_sortOrder_idx" ON "Treatment"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PatientInvoice_invoiceNumber_key" ON "PatientInvoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "PatientInvoice_patientId_issuedAt_idx" ON "PatientInvoice"("patientId", "issuedAt");

-- CreateIndex
CREATE INDEX "PatientInvoice_treatmentId_idx" ON "PatientInvoice"("treatmentId");

-- CreateIndex
CREATE INDEX "PatientInvoice_createdByCharacterId_idx" ON "PatientInvoice"("createdByCharacterId");

-- AddForeignKey
ALTER TABLE "PatientInvoice" ADD CONSTRAINT "PatientInvoice_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInvoice" ADD CONSTRAINT "PatientInvoice_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientInvoice" ADD CONSTRAINT "PatientInvoice_createdByCharacterId_fkey" FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
