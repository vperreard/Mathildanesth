/*
  Warnings:

  - The primary key for the `Absence` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `Absence` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Absence` table. All the data in the column will be lost.
  - Changed the type of `type` on the `Absence` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Absence` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Period" AS ENUM ('MATIN', 'APRES_MIDI', 'JOURNEE_ENTIERE');

-- CreateEnum
CREATE TYPE "BlocPlanningStatus" AS ENUM ('DRAFT', 'VALIDATION_REQUESTED', 'VALIDATED', 'MODIFIED_AFTER_VALIDATION', 'LOCKED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "BlocStaffRole" AS ENUM ('MAR', 'IADE');

-- CreateEnum
CREATE TYPE "ConflictSeverity" AS ENUM ('WARNING', 'ERROR');

-- DropForeignKey
ALTER TABLE "Absence" DROP CONSTRAINT "Absence_userId_fkey";

-- AlterTable
ALTER TABLE "Absence" DROP CONSTRAINT "Absence_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "approvalDate" TIMESTAMP(3),
ADD COLUMN     "approvedById" INTEGER,
ADD COLUMN     "chirurgienId" INTEGER,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" DROP NOT NULL,
DROP COLUMN "type",
ADD COLUMN     "type" "LeaveType" NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "LeaveStatus" NOT NULL,
ALTER COLUMN "reason" DROP NOT NULL,
ADD CONSTRAINT "Absence_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Absence_id_seq";

-- AlterTable
ALTER TABLE "OperatingRoom" ADD COLUMN     "allowedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "canSuperviseEndo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "canSuperviseOphtalmo" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "bloc_trame_plannings" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "siteId" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_trame_plannings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_affectation_habituelles" (
    "id" SERIAL NOT NULL,
    "blocTramePlanningId" INTEGER NOT NULL,
    "userId" INTEGER,
    "chirurgienId" INTEGER,
    "jourSemaine" "DayOfWeek" NOT NULL,
    "periode" "Period" NOT NULL,
    "typeSemaine" "WeekType" NOT NULL,
    "typeAffectation" TEXT NOT NULL,
    "roleInAffectation" TEXT,
    "operatingRoomId" INTEGER,
    "specialiteChir" TEXT,
    "priorite" INTEGER NOT NULL DEFAULT 5,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_affectation_habituelles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_day_plannings" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,
    "status" "BlocPlanningStatus" NOT NULL DEFAULT 'DRAFT',
    "lockedAt" TIMESTAMP(3),
    "lockedByUserId" INTEGER,
    "validatedAt" TIMESTAMP(3),
    "validatedByUserId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_day_plannings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_room_assignments" (
    "id" TEXT NOT NULL,
    "blocDayPlanningId" TEXT NOT NULL,
    "operatingRoomId" INTEGER NOT NULL,
    "period" "Period" NOT NULL,
    "chirurgienId" INTEGER,
    "expectedSpecialty" TEXT,
    "sourceBlocTrameAffectationId" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_room_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_staff_assignments" (
    "id" TEXT NOT NULL,
    "blocRoomAssignmentId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "BlocStaffRole" NOT NULL,
    "isPrimaryAnesthetist" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_staff_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloc_planning_conflicts" (
    "id" TEXT NOT NULL,
    "blocDayPlanningId" TEXT NOT NULL,
    "relatedRoomAssignmentId" TEXT,
    "relatedStaffAssignmentId" TEXT,
    "relatedUserId" INTEGER,
    "relatedSurgeonId" INTEGER,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" "ConflictSeverity" NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" TIMESTAMP(3),
    "resolvedByUserId" INTEGER,
    "resolutionNotes" TEXT,
    "isForceResolved" BOOLEAN NOT NULL DEFAULT false,
    "forceResolvedAt" TIMESTAMP(3),
    "forceResolvedByUserId" INTEGER,
    "forceResolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bloc_planning_conflicts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bloc_trame_plannings_name_key" ON "bloc_trame_plannings"("name");

-- CreateIndex
CREATE UNIQUE INDEX "bloc_day_plannings_siteId_date_key" ON "bloc_day_plannings"("siteId", "date");

-- AddForeignKey
ALTER TABLE "bloc_affectation_habituelles" ADD CONSTRAINT "bloc_affectation_habituelles_blocTramePlanningId_fkey" FOREIGN KEY ("blocTramePlanningId") REFERENCES "bloc_trame_plannings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_affectation_habituelles" ADD CONSTRAINT "bloc_affectation_habituelles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_affectation_habituelles" ADD CONSTRAINT "bloc_affectation_habituelles_chirurgienId_fkey" FOREIGN KEY ("chirurgienId") REFERENCES "surgeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_day_plannings" ADD CONSTRAINT "bloc_day_plannings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_room_assignments" ADD CONSTRAINT "bloc_room_assignments_blocDayPlanningId_fkey" FOREIGN KEY ("blocDayPlanningId") REFERENCES "bloc_day_plannings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_room_assignments" ADD CONSTRAINT "bloc_room_assignments_operatingRoomId_fkey" FOREIGN KEY ("operatingRoomId") REFERENCES "OperatingRoom"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_room_assignments" ADD CONSTRAINT "bloc_room_assignments_chirurgienId_fkey" FOREIGN KEY ("chirurgienId") REFERENCES "surgeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_staff_assignments" ADD CONSTRAINT "bloc_staff_assignments_blocRoomAssignmentId_fkey" FOREIGN KEY ("blocRoomAssignmentId") REFERENCES "bloc_room_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_staff_assignments" ADD CONSTRAINT "bloc_staff_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_planning_conflicts" ADD CONSTRAINT "bloc_planning_conflicts_blocDayPlanningId_fkey" FOREIGN KEY ("blocDayPlanningId") REFERENCES "bloc_day_plannings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_planning_conflicts" ADD CONSTRAINT "bloc_planning_conflicts_resolvedByUserId_fkey" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_planning_conflicts" ADD CONSTRAINT "bloc_planning_conflicts_forceResolvedByUserId_fkey" FOREIGN KEY ("forceResolvedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_chirurgienId_fkey" FOREIGN KEY ("chirurgienId") REFERENCES "surgeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
