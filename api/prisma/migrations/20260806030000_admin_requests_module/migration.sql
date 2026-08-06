-- CreateEnum
CREATE TYPE "AdminRequestType" AS ENUM ('ADMINISTRATIVE_APPOINTMENT', 'AGREEMENT_SIGNING', 'HIGH_COMMAND_MEETING', 'COMMERCIAL_REQUEST', 'OTHER');
CREATE TYPE "AdminRequestStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'IN_PROCESS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "AdminRequestPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "AdminRequestEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'ASSIGNEE_CHANGED', 'MESSAGE_SENT', 'INTERNAL_NOTE_ADDED', 'PRIORITY_CHANGED');

-- AlterEnum NotificationType
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_REQUEST_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_REQUEST_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_REQUEST_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_REQUEST_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE 'ADMIN_REQUEST_NOTE';

-- CreateTable
CREATE TABLE "AdminRequest" (
    "id" TEXT NOT NULL,
    "requestNumber" SERIAL NOT NULL,
    "type" "AdminRequestType" NOT NULL,
    "status" "AdminRequestStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "AdminRequestPriority" NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRequestMessage" (
    "id" TEXT NOT NULL,
    "adminRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRequestMessage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRequestInternalNote" (
    "id" TEXT NOT NULL,
    "adminRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRequestInternalNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRequestAssignment" (
    "id" TEXT NOT NULL,
    "adminRequestId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),

    CONSTRAINT "AdminRequestAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminRequestEvent" (
    "id" TEXT NOT NULL,
    "adminRequestId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "AdminRequestEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRequestEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRequest_requestNumber_key" ON "AdminRequest"("requestNumber");
CREATE INDEX "AdminRequest_requesterId_idx" ON "AdminRequest"("requesterId");
CREATE INDEX "AdminRequest_assigneeId_idx" ON "AdminRequest"("assigneeId");
CREATE INDEX "AdminRequest_status_idx" ON "AdminRequest"("status");
CREATE INDEX "AdminRequest_type_idx" ON "AdminRequest"("type");
CREATE INDEX "AdminRequest_priority_idx" ON "AdminRequest"("priority");
CREATE INDEX "AdminRequest_createdAt_idx" ON "AdminRequest"("createdAt");
CREATE INDEX "AdminRequestMessage_adminRequestId_createdAt_idx" ON "AdminRequestMessage"("adminRequestId", "createdAt");
CREATE INDEX "AdminRequestMessage_authorId_idx" ON "AdminRequestMessage"("authorId");
CREATE INDEX "AdminRequestInternalNote_adminRequestId_createdAt_idx" ON "AdminRequestInternalNote"("adminRequestId", "createdAt");
CREATE INDEX "AdminRequestInternalNote_authorId_idx" ON "AdminRequestInternalNote"("authorId");
CREATE UNIQUE INDEX "AdminRequestAssignment_adminRequestId_characterId_key" ON "AdminRequestAssignment"("adminRequestId", "characterId");
CREATE INDEX "AdminRequestAssignment_characterId_idx" ON "AdminRequestAssignment"("characterId");
CREATE INDEX "AdminRequestEvent_adminRequestId_createdAt_idx" ON "AdminRequestEvent"("adminRequestId", "createdAt");

ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminRequest" ADD CONSTRAINT "AdminRequest_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AdminRequestMessage" ADD CONSTRAINT "AdminRequestMessage_adminRequestId_fkey" FOREIGN KEY ("adminRequestId") REFERENCES "AdminRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequestMessage" ADD CONSTRAINT "AdminRequestMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminRequestInternalNote" ADD CONSTRAINT "AdminRequestInternalNote_adminRequestId_fkey" FOREIGN KEY ("adminRequestId") REFERENCES "AdminRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequestInternalNote" ADD CONSTRAINT "AdminRequestInternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AdminRequestAssignment" ADD CONSTRAINT "AdminRequestAssignment_adminRequestId_fkey" FOREIGN KEY ("adminRequestId") REFERENCES "AdminRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequestAssignment" ADD CONSTRAINT "AdminRequestAssignment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequestEvent" ADD CONSTRAINT "AdminRequestEvent_adminRequestId_fkey" FOREIGN KEY ("adminRequestId") REFERENCES "AdminRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AdminRequestEvent" ADD CONSTRAINT "AdminRequestEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
