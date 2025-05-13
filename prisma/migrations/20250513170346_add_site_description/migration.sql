/*
  Warnings:

  - You are about to drop the `Assignment` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "IncompatibilityType" AS ENUM ('BLOQUANT', 'PREFERENTIEL');

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_locationId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_regularAssignmentId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_specialtyId_fkey";

-- DropForeignKey
ALTER TABLE "Assignment" DROP CONSTRAINT "Assignment_userId_fkey";

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "description" TEXT,
ALTER COLUMN "displayOrder" DROP DEFAULT;

-- DropTable
DROP TABLE "Assignment";

-- CreateTable
CREATE TABLE "assignments" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER,
    "chirurgien" TEXT,
    "salle" TEXT,
    "type" TEXT NOT NULL,
    "statut" TEXT,
    "heureDebut" TEXT,
    "heureFin" TEXT,
    "notes" TEXT,
    "specialtyId" INTEGER,
    "siteId" TEXT,
    "operatingRoomId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "blocDayPlanningId" TEXT,
    "surgeonId" INTEGER,
    "regularAssignmentId" INTEGER,
    "locationId" INTEGER,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_incompatibilities" (
    "id" TEXT NOT NULL,
    "user1Id" INTEGER,
    "surgeon1Id" INTEGER,
    "user2Id" INTEGER,
    "surgeon2Id" INTEGER,
    "type" "IncompatibilityType" NOT NULL,
    "reason" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,

    CONSTRAINT "personnel_incompatibilities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "assignments_date_idx" ON "assignments"("date");

-- CreateIndex
CREATE INDEX "assignments_userId_date_idx" ON "assignments"("userId", "date");

-- CreateIndex
CREATE INDEX "assignments_siteId_date_idx" ON "assignments"("siteId", "date");

-- CreateIndex
CREATE INDEX "personnel_incompatibilities_user1Id_user2Id_type_startDate__idx" ON "personnel_incompatibilities"("user1Id", "user2Id", "type", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "personnel_incompatibilities_surgeon1Id_surgeon2Id_type_star_idx" ON "personnel_incompatibilities"("surgeon1Id", "surgeon2Id", "type", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "personnel_incompatibilities_user1Id_surgeon2Id_type_startDa_idx" ON "personnel_incompatibilities"("user1Id", "surgeon2Id", "type", "startDate", "endDate");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_operatingRoomId_fkey" FOREIGN KEY ("operatingRoomId") REFERENCES "OperatingRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "surgeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_regularAssignmentId_fkey" FOREIGN KEY ("regularAssignmentId") REFERENCES "regular_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_incompatibilities" ADD CONSTRAINT "personnel_incompatibilities_user1Id_fkey" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_incompatibilities" ADD CONSTRAINT "personnel_incompatibilities_surgeon1Id_fkey" FOREIGN KEY ("surgeon1Id") REFERENCES "surgeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_incompatibilities" ADD CONSTRAINT "personnel_incompatibilities_user2Id_fkey" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_incompatibilities" ADD CONSTRAINT "personnel_incompatibilities_surgeon2Id_fkey" FOREIGN KEY ("surgeon2Id") REFERENCES "surgeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_incompatibilities" ADD CONSTRAINT "personnel_incompatibilities_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
