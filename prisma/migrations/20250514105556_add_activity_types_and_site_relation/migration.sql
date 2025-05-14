/*
  Warnings:

  - You are about to drop the `OperatingRoom` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ActivityCategory" AS ENUM ('BLOC_OPERATOIRE', 'CONSULTATION', 'GARDE', 'ASTREINTE', 'REUNION', 'FORMATION', 'ADMINISTRATIF', 'AUTRE');

-- DropForeignKey
ALTER TABLE "OperatingRoom" DROP CONSTRAINT "OperatingRoom_sectorId_fkey";

-- DropForeignKey
ALTER TABLE "assignments" DROP CONSTRAINT "assignments_operatingRoomId_fkey";

-- DropForeignKey
ALTER TABLE "bloc_room_assignments" DROP CONSTRAINT "bloc_room_assignments_operatingRoomId_fkey";

-- AlterTable
ALTER TABLE "sites" ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
ALTER COLUMN "colorCode" DROP DEFAULT;

-- AlterTable
ALTER TABLE "user_requests" ADD COLUMN     "details" JSONB,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "siteId" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3);

-- DropTable
DROP TABLE "OperatingRoom";

-- CreateTable
CREATE TABLE "operating_rooms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "description" TEXT,
    "roomType" "RoomType" NOT NULL DEFAULT 'STANDARD',
    "capacity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "colorCode" TEXT,
    "supervisionRules" JSONB,
    "allowedSpecialties" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "siteId" TEXT NOT NULL,
    "operatingSectorId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operating_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "ActivityCategory" NOT NULL DEFAULT 'AUTRE',
    "color" TEXT,
    "icon" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ActivityTypeToSite" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ActivityTypeToSite_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "operating_rooms_number_key" ON "operating_rooms"("number");

-- CreateIndex
CREATE INDEX "operating_rooms_siteId_idx" ON "operating_rooms"("siteId");

-- CreateIndex
CREATE INDEX "operating_rooms_operatingSectorId_idx" ON "operating_rooms"("operatingSectorId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_name_key" ON "activity_types"("name");

-- CreateIndex
CREATE INDEX "_ActivityTypeToSite_B_index" ON "_ActivityTypeToSite"("B");

-- CreateIndex
CREATE INDEX "user_requests_userId_status_idx" ON "user_requests"("userId", "status");

-- CreateIndex
CREATE INDEX "user_requests_requestTypeId_status_idx" ON "user_requests"("requestTypeId", "status");

-- CreateIndex
CREATE INDEX "user_requests_assignedToId_status_idx" ON "user_requests"("assignedToId", "status");

-- AddForeignKey
ALTER TABLE "bloc_trame_plannings" ADD CONSTRAINT "bloc_trame_plannings_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloc_room_assignments" ADD CONSTRAINT "bloc_room_assignments_operatingRoomId_fkey" FOREIGN KEY ("operatingRoomId") REFERENCES "operating_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_rooms" ADD CONSTRAINT "operating_rooms_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "operating_rooms" ADD CONSTRAINT "operating_rooms_operatingSectorId_fkey" FOREIGN KEY ("operatingSectorId") REFERENCES "OperatingSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_operatingRoomId_fkey" FOREIGN KEY ("operatingRoomId") REFERENCES "operating_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityTypeToSite" ADD CONSTRAINT "_ActivityTypeToSite_A_fkey" FOREIGN KEY ("A") REFERENCES "activity_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ActivityTypeToSite" ADD CONSTRAINT "_ActivityTypeToSite_B_fkey" FOREIGN KEY ("B") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
