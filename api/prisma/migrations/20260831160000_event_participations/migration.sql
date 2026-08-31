-- Event participation records for SAED staff attendance at external events.
CREATE TABLE "EventParticipation" (
    "id" TEXT NOT NULL,
    "eventDate" DATE NOT NULL,
    "organizers" TEXT NOT NULL,
    "payerFullName" TEXT NOT NULL,
    "authorizingOfficerName" TEXT NOT NULL,
    "saedLeadName" TEXT NOT NULL,
    "submittedByCharacterId" TEXT NOT NULL,
    "discordDelivered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventParticipation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EventParticipationParticipant" (
    "id" TEXT NOT NULL,
    "eventParticipationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "characterId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "EventParticipationParticipant_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EventParticipation_eventDate_idx" ON "EventParticipation"("eventDate");
CREATE INDEX "EventParticipation_submittedByCharacterId_idx" ON "EventParticipation"("submittedByCharacterId");
CREATE INDEX "EventParticipation_createdAt_idx" ON "EventParticipation"("createdAt");
CREATE INDEX "EventParticipationParticipant_eventParticipationId_idx" ON "EventParticipationParticipant"("eventParticipationId");
CREATE INDEX "EventParticipationParticipant_characterId_idx" ON "EventParticipationParticipant"("characterId");

ALTER TABLE "EventParticipation"
    ADD CONSTRAINT "EventParticipation_submittedByCharacterId_fkey"
    FOREIGN KEY ("submittedByCharacterId") REFERENCES "Character"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "EventParticipationParticipant"
    ADD CONSTRAINT "EventParticipationParticipant_eventParticipationId_fkey"
    FOREIGN KEY ("eventParticipationId") REFERENCES "EventParticipation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EventParticipationParticipant"
    ADD CONSTRAINT "EventParticipationParticipant_characterId_fkey"
    FOREIGN KEY ("characterId") REFERENCES "Character"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "Permission" ("id", "key", "description", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid(), 'event-participations.read', 'View SAED event participation records', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'event-participations.create', 'Register SAED event participation', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid(), 'event-participations.manage', 'Manage all SAED event participation records', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "assignedAt")
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.slug IN (
    'intern',
    'resident',
    'doctor',
    'specialist',
    'department-chief',
    'deputy-medical-director',
    'medical-director'
)
AND p.key IN ('event-participations.read', 'event-participations.create')
ON CONFLICT DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId", "assignedAt")
SELECT r.id, p.id, CURRENT_TIMESTAMP
FROM "Role" r
CROSS JOIN "Permission" p
WHERE r.slug IN ('deputy-medical-director', 'medical-director')
AND p.key = 'event-participations.manage'
ON CONFLICT DO NOTHING;
