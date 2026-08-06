-- AlterTable
ALTER TABLE "Patient" ADD COLUMN "establishmentId" TEXT;
ALTER TABLE "Patient" ADD COLUMN "badgeNumber" TEXT;

-- CreateIndex
CREATE INDEX "Patient_establishmentId_idx" ON "Patient"("establishmentId");
CREATE INDEX "Patient_badgeNumber_idx" ON "Patient"("badgeNumber");

-- AddForeignKey
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill workplace from the linked character's primary active occupation when present.
UPDATE "Patient" AS p
SET "establishmentId" = sub."establishmentId"
FROM (
  SELECT DISTINCT ON (o."characterId")
    o."characterId",
    o."establishmentId"
  FROM "Occupation" AS o
  WHERE o."isActive" = true
    AND o."establishmentId" IS NOT NULL
  ORDER BY o."characterId", o."isPrimary" DESC, o."createdAt" DESC
) AS sub
WHERE p."linkedCharacterId" = sub."characterId"
  AND p."establishmentId" IS NULL;
