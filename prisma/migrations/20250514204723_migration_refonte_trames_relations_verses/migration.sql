/*
  Warnings:

  - You are about to drop the `bloc_affectation_habituelles` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `bloc_trame_plannings` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[code]` on the table `activity_types` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `activity_types` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurrenceTypeTrame" AS ENUM ('AUCUNE', 'HEBDOMADAIRE');

-- CreateEnum
CREATE TYPE "TypeSemaineTrame" AS ENUM ('TOUTES', 'PAIRES', 'IMPAIRES');

-- DropForeignKey
ALTER TABLE "bloc_affectation_habituelles" DROP CONSTRAINT "bloc_affectation_habituelles_blocTramePlanningId_fkey";

-- DropForeignKey
ALTER TABLE "bloc_affectation_habituelles" DROP CONSTRAINT "bloc_affectation_habituelles_chirurgienId_fkey";

-- DropForeignKey
ALTER TABLE "bloc_affectation_habituelles" DROP CONSTRAINT "bloc_affectation_habituelles_userId_fkey";

-- DropForeignKey
ALTER TABLE "bloc_trame_plannings" DROP CONSTRAINT "bloc_trame_plannings_siteId_fkey";

-- AlterTable
ALTER TABLE "activity_types" ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "defaultDurationHours" DOUBLE PRECISION,
ADD COLUMN     "defaultPeriod" "Period";

-- DropTable
DROP TABLE "bloc_affectation_habituelles";

-- DropTable
DROP TABLE "bloc_trame_plannings";

-- CreateTable
CREATE TABLE "trame_modeles" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "siteId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "dateDebutEffet" TIMESTAMP(3) NOT NULL,
    "dateFinEffet" TIMESTAMP(3),
    "recurrenceType" "RecurrenceTypeTrame" NOT NULL DEFAULT 'HEBDOMADAIRE',
    "joursSemaineActifs" INTEGER[],
    "typeSemaine" "TypeSemaineTrame" NOT NULL DEFAULT 'TOUTES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trame_modeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "affectation_modeles" (
    "id" SERIAL NOT NULL,
    "trameModeleId" INTEGER NOT NULL,
    "activityTypeId" TEXT NOT NULL,
    "jourSemaine" "DayOfWeek" NOT NULL,
    "periode" "Period" NOT NULL,
    "typeSemaine" "TypeSemaineTrame" NOT NULL,
    "operatingRoomId" INTEGER,
    "locationId" INTEGER,
    "priorite" INTEGER NOT NULL DEFAULT 5,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "affectation_modeles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel_requis_modeles" (
    "id" SERIAL NOT NULL,
    "affectationModeleId" INTEGER NOT NULL,
    "roleGenerique" TEXT NOT NULL,
    "professionalRoleId" TEXT,
    "specialtyId" INTEGER,
    "nombreRequis" INTEGER NOT NULL DEFAULT 1,
    "personnelHabituelUserId" INTEGER,
    "personnelHabituelSurgeonId" INTEGER,
    "personnelHabituelNomExterne" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_requis_modeles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trame_modeles_name_key" ON "trame_modeles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_code_key" ON "activity_types"("code");

-- AddForeignKey
ALTER TABLE "trame_modeles" ADD CONSTRAINT "trame_modeles_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectation_modeles" ADD CONSTRAINT "affectation_modeles_trameModeleId_fkey" FOREIGN KEY ("trameModeleId") REFERENCES "trame_modeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectation_modeles" ADD CONSTRAINT "affectation_modeles_activityTypeId_fkey" FOREIGN KEY ("activityTypeId") REFERENCES "activity_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "affectation_modeles" ADD CONSTRAINT "affectation_modeles_operatingRoomId_fkey" FOREIGN KEY ("operatingRoomId") REFERENCES "operating_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_requis_modeles" ADD CONSTRAINT "personnel_requis_modeles_affectationModeleId_fkey" FOREIGN KEY ("affectationModeleId") REFERENCES "affectation_modeles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_requis_modeles" ADD CONSTRAINT "personnel_requis_modeles_professionalRoleId_fkey" FOREIGN KEY ("professionalRoleId") REFERENCES "ProfessionalRoleConfig"("code") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_requis_modeles" ADD CONSTRAINT "personnel_requis_modeles_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_requis_modeles" ADD CONSTRAINT "personnel_requis_modeles_personnelHabituelUserId_fkey" FOREIGN KEY ("personnelHabituelUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel_requis_modeles" ADD CONSTRAINT "personnel_requis_modeles_personnelHabituelSurgeonId_fkey" FOREIGN KEY ("personnelHabituelSurgeonId") REFERENCES "surgeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
