-- CreateTable
CREATE TABLE "ApplicationConfiguration" (
    "id" TEXT NOT NULL,
    "type" "AcademyApplicationType" NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openedByCharacterId" TEXT,
    "closedByCharacterId" TEXT,
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicationConfiguration_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "AcademyApplication" ADD COLUMN "discordUsername" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ApplicationConfiguration_type_key" ON "ApplicationConfiguration"("type");

-- CreateIndex
CREATE INDEX "ApplicationConfiguration_isOpen_idx" ON "ApplicationConfiguration"("isOpen");

-- AddForeignKey
ALTER TABLE "ApplicationConfiguration" ADD CONSTRAINT "ApplicationConfiguration_openedByCharacterId_fkey" FOREIGN KEY ("openedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationConfiguration" ADD CONSTRAINT "ApplicationConfiguration_closedByCharacterId_fkey" FOREIGN KEY ("closedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default closed configurations for known types
INSERT INTO "ApplicationConfiguration" ("id", "type", "isOpen", "createdAt", "updatedAt")
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'ACADEMY', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('a0000000-0000-4000-8000-000000000002', 'TRANSFER', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("type") DO NOTHING;
