-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('MEDICAL', 'PSYCHOTECHNICAL_CIVIL', 'PSYCHOTECHNICAL_LSPD');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_CITIZEN', 'COMPLETED', 'CANCELLED', 'REJECTED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "AppointmentEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'STAFF_ASSIGNED', 'STAFF_REMOVED', 'DEPARTMENT_TRANSFERRED', 'MESSAGE_SENT', 'INTERNAL_NOTE_ADDED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_CREATED';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_STATUS';
ALTER TYPE "NotificationType" ADD VALUE 'APPOINTMENT_ASSIGNED';

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "caseNumber" SERIAL NOT NULL,
    "type" "AppointmentType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "preferredDate" DATE,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "requesterId" TEXT NOT NULL,
    "departmentId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentMessage" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentInternalNote" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentInternalNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentAssignment" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "characterId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassignedAt" TIMESTAMP(3),

    CONSTRAINT "AppointmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentEvent" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "AppointmentEventType" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Appointment_caseNumber_key" ON "Appointment"("caseNumber");

-- CreateIndex
CREATE INDEX "Appointment_requesterId_idx" ON "Appointment"("requesterId");

-- CreateIndex
CREATE INDEX "Appointment_departmentId_idx" ON "Appointment"("departmentId");

-- CreateIndex
CREATE INDEX "Appointment_status_idx" ON "Appointment"("status");

-- CreateIndex
CREATE INDEX "Appointment_createdAt_idx" ON "Appointment"("createdAt");

-- CreateIndex
CREATE INDEX "AppointmentMessage_appointmentId_createdAt_idx" ON "AppointmentMessage"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentMessage_authorId_idx" ON "AppointmentMessage"("authorId");

-- CreateIndex
CREATE INDEX "AppointmentInternalNote_appointmentId_createdAt_idx" ON "AppointmentInternalNote"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentInternalNote_authorId_idx" ON "AppointmentInternalNote"("authorId");

-- CreateIndex
CREATE INDEX "AppointmentAssignment_characterId_idx" ON "AppointmentAssignment"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentAssignment_appointmentId_characterId_key" ON "AppointmentAssignment"("appointmentId", "characterId");

-- CreateIndex
CREATE INDEX "AppointmentEvent_appointmentId_createdAt_idx" ON "AppointmentEvent"("appointmentId", "createdAt");

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentMessage" ADD CONSTRAINT "AppointmentMessage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentMessage" ADD CONSTRAINT "AppointmentMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentInternalNote" ADD CONSTRAINT "AppointmentInternalNote_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentInternalNote" ADD CONSTRAINT "AppointmentInternalNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAssignment" ADD CONSTRAINT "AppointmentAssignment_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentAssignment" ADD CONSTRAINT "AppointmentAssignment_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentEvent" ADD CONSTRAINT "AppointmentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Character"("id") ON DELETE SET NULL ON UPDATE CASCADE;
