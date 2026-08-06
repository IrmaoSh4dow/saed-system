-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "StaffShift" (
    "id" TEXT NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "timezone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffShift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StaffShift_staffProfileId_status_idx" ON "StaffShift"("staffProfileId", "status");

-- CreateIndex
CREATE INDEX "StaffShift_staffProfileId_startedAt_idx" ON "StaffShift"("staffProfileId", "startedAt");

-- CreateIndex
CREATE INDEX "StaffShift_characterId_startedAt_idx" ON "StaffShift"("characterId", "startedAt");

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_staffProfileId_fkey" FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffShift" ADD CONSTRAINT "StaffShift_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
