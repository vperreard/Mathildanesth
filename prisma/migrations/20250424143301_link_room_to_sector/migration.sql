/*
  Warnings:

  - You are about to drop the `OperatingRoomConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "OperatingRoomConfig";

-- CreateTable
CREATE TABLE "OperatingRoom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sectorId" INTEGER NOT NULL,
    "colorCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supervisionRules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatingRoom_number_key" ON "OperatingRoom"("number");

-- CreateIndex
CREATE INDEX "OperatingRoom_sectorId_idx" ON "OperatingRoom"("sectorId");

-- AddForeignKey
ALTER TABLE "OperatingRoom" ADD CONSTRAINT "OperatingRoom_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "OperatingSector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
