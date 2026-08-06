-- Staff quality ratings after completed administrative appointments

ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STAFF_RATING_CREATED';

CREATE TABLE "StaffRating" (
    "id" TEXT NOT NULL,
    "ratingNumber" SERIAL NOT NULL,
    "staffProfileId" TEXT NOT NULL,
    "reviewerCharacterId" TEXT NOT NULL,
    "adminRequestId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffRating_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffRating_ratingNumber_key" ON "StaffRating"("ratingNumber");
CREATE UNIQUE INDEX "StaffRating_adminRequestId_key" ON "StaffRating"("adminRequestId");
CREATE INDEX "StaffRating_staffProfileId_createdAt_idx" ON "StaffRating"("staffProfileId", "createdAt");
CREATE INDEX "StaffRating_reviewerCharacterId_idx" ON "StaffRating"("reviewerCharacterId");
CREATE INDEX "StaffRating_score_idx" ON "StaffRating"("score");
CREATE INDEX "StaffRating_createdAt_idx" ON "StaffRating"("createdAt");

ALTER TABLE "StaffRating" ADD CONSTRAINT "StaffRating_staffProfileId_fkey"
  FOREIGN KEY ("staffProfileId") REFERENCES "StaffProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffRating" ADD CONSTRAINT "StaffRating_reviewerCharacterId_fkey"
  FOREIGN KEY ("reviewerCharacterId") REFERENCES "Character"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StaffRating" ADD CONSTRAINT "StaffRating_adminRequestId_fkey"
  FOREIGN KEY ("adminRequestId") REFERENCES "AdminRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
