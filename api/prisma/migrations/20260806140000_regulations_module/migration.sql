-- CreateEnum
CREATE TYPE "RegulationDocumentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "RegulationCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegulationCategory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationDocument" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "status" "RegulationDocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "authorCharacterId" TEXT,
    "lastEditorCharacterId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RegulationDocument_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationDocumentVersion" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "contentHtml" TEXT NOT NULL,
    "contentText" TEXT NOT NULL,
    "status" "RegulationDocumentStatus" NOT NULL,
    "changeSummary" TEXT,
    "createdByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegulationDocumentVersion_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RegulationAttachment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "uploadedByCharacterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RegulationAttachment_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "RegulationCategory_name_key" ON "RegulationCategory"("name");
CREATE UNIQUE INDEX "RegulationCategory_slug_key" ON "RegulationCategory"("slug");
CREATE INDEX "RegulationCategory_isActive_sortOrder_idx" ON "RegulationCategory"("isActive", "sortOrder");

CREATE UNIQUE INDEX "RegulationDocument_slug_key" ON "RegulationDocument"("slug");
CREATE INDEX "RegulationDocument_categoryId_status_idx" ON "RegulationDocument"("categoryId", "status");
CREATE INDEX "RegulationDocument_status_updatedAt_idx" ON "RegulationDocument"("status", "updatedAt");
CREATE INDEX "RegulationDocument_title_idx" ON "RegulationDocument"("title");
CREATE INDEX "RegulationDocument_authorCharacterId_idx" ON "RegulationDocument"("authorCharacterId");

CREATE UNIQUE INDEX "RegulationDocumentVersion_documentId_versionNumber_key" ON "RegulationDocumentVersion"("documentId", "versionNumber");
CREATE INDEX "RegulationDocumentVersion_documentId_createdAt_idx" ON "RegulationDocumentVersion"("documentId", "createdAt");

CREATE INDEX "RegulationAttachment_documentId_sortOrder_idx" ON "RegulationAttachment"("documentId", "sortOrder");

-- FKs
ALTER TABLE "RegulationDocument" ADD CONSTRAINT "RegulationDocument_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "RegulationCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RegulationDocument" ADD CONSTRAINT "RegulationDocument_authorCharacterId_fkey" FOREIGN KEY ("authorCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RegulationDocument" ADD CONSTRAINT "RegulationDocument_lastEditorCharacterId_fkey" FOREIGN KEY ("lastEditorCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RegulationDocumentVersion" ADD CONSTRAINT "RegulationDocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "RegulationDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegulationDocumentVersion" ADD CONSTRAINT "RegulationDocumentVersion_createdByCharacterId_fkey" FOREIGN KEY ("createdByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "RegulationAttachment" ADD CONSTRAINT "RegulationAttachment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "RegulationDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RegulationAttachment" ADD CONSTRAINT "RegulationAttachment_uploadedByCharacterId_fkey" FOREIGN KEY ("uploadedByCharacterId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed default categories
INSERT INTO "RegulationCategory" ("id", "name", "slug", "description", "sortOrder", "isActive", "createdAt", "updatedAt") VALUES
  ('b1000000-0000-4000-8000-000000000001', 'Reglamento General', 'reglamento-general', 'Normativa general del SAED', 10, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000002', 'Protocolos Médicos', 'protocolos-medicos', 'Protocolos clínicos institucionales', 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000003', 'Administración', 'administracion', 'Normativa administrativa', 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000004', 'Academia', 'academia', 'Documentación de academia y formación', 40, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000005', 'Trauma', 'trauma', 'Protocolos de trauma', 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000006', 'Cirugía', 'cirugia', 'Protocolos quirúrgicos', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000007', 'Cuidados Intensivos', 'cuidados-intensivos', 'Protocolos de UCI', 70, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000008', 'Recursos Humanos', 'recursos-humanos', 'Normativa de personal', 80, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('b1000000-0000-4000-8000-000000000009', 'Comunicados', 'comunicados', 'Comunicados oficiales', 90, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
