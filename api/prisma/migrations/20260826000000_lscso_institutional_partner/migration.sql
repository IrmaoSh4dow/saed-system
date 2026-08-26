-- AlterEnum: psychotechnical appointments for the Sheriff's Office
ALTER TYPE "AppointmentType" ADD VALUE IF NOT EXISTS 'PSYCHOTECHNICAL_LSCSO';

-- Seed the LSCSO establishment so linked patients and invoices can reference it.
INSERT INTO "Establishment" (
  "id", "slug", "name", "status", "defaultPosition",
  "occupationType", "isSelectable", "sortOrder", "createdAt", "updatedAt"
)
VALUES (
  'b7f1c4d2-9a3e-4c58-8f61-2d0a7e5b3c91', 'lscso', 'LSCSO', 'ACTIVE', 'Deputy',
  'DEPARTMENT', true, 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
)
ON CONFLICT DO NOTHING;

-- Attach legacy free-text occupations to the new establishment.
UPDATE "Occupation" AS o
SET "establishmentId" = e.id
FROM "Establishment" e
WHERE e.slug = 'lscso'
  AND o."establishmentId" IS NULL
  AND LOWER(o.organization) IN (
    'lscso',
    'los santos county sheriff''s office',
    'los santos county sheriff',
    'sheriff'
  );

-- Backfill institutional billing snapshots for historical LSCSO invoices (best-effort).
UPDATE "PatientInvoice" AS pi
SET
  "billingOrganization" = COALESCE(e.name, o.organization),
  "billingEstablishmentId" = o."establishmentId",
  "billingEstablishmentSlug" = e.slug
FROM "Patient" p
JOIN "Occupation" o ON o."characterId" = p."linkedCharacterId" AND o."isActive" = true
LEFT JOIN "Establishment" e ON e.id = o."establishmentId"
WHERE pi."patientId" = p.id
  AND pi."billingOrganization" IS NULL
  AND (
    e.slug = 'lscso'
    OR LOWER(o.organization) IN (
      'lscso',
      'los santos county sheriff''s office',
      'los santos county sheriff',
      'sheriff'
    )
  );
