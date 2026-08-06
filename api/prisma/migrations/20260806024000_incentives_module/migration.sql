-- CreateTable
CREATE TABLE "IncentiveConfiguration" (
    "id" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncentiveConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncentivePayment" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "paidByCharacterId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "rankId" TEXT NOT NULL,
    "rankName" TEXT NOT NULL,
    "rankSlug" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextEligibleAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IncentivePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "IncentiveConfiguration_rankId_key" ON "IncentiveConfiguration"("rankId");
CREATE INDEX "IncentiveConfiguration_isActive_idx" ON "IncentiveConfiguration"("isActive");
CREATE INDEX "IncentivePayment_staffProfileId_paidAt_idx" ON "IncentivePayment"("staffProfileId", "paidAt");
CREATE INDEX "IncentivePayment_paidByCharacterId_paidAt_idx" ON "IncentivePayment"("paidByCharacterId", "paidAt");
CREATE INDEX "IncentivePayment_rankId_idx" ON "IncentivePayment"("rankId");
CREATE INDEX "IncentivePayment_paidAt_idx" ON "IncentivePayment"("paidAt");
CREATE INDEX "IncentivePayment_nextEligibleAt_idx" ON "IncentivePayment"("nextEligibleAt");

-- AddForeignKey
ALTER TABLE "IncentiveConfiguration" ADD CONSTRAINT "IncentiveConfiguration_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IncentiveConfiguration" ADD CONSTRAINT "IncentiveConfiguration_updatedByCharacterId_fkey" FOREIGN KEY ("updatedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "IncentivePayment" ADD CONSTRAINT "IncentivePayment_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncentivePayment" ADD CONSTRAINT "IncentivePayment_paidByCharacterId_fkey" FOREIGN KEY ("paidByCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IncentivePayment" ADD CONSTRAINT "IncentivePayment_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
