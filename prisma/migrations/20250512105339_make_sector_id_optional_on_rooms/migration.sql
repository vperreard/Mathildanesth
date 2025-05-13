-- DropForeignKey
ALTER TABLE "OperatingRoom" DROP CONSTRAINT "OperatingRoom_sectorId_fkey";

-- AlterTable
ALTER TABLE "OperatingRoom" ALTER COLUMN "sectorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "OperatingSector" ALTER COLUMN "colorCode" DROP NOT NULL,
ALTER COLUMN "colorCode" DROP DEFAULT,
ALTER COLUMN "rules" DROP NOT NULL,
ALTER COLUMN "rules" DROP DEFAULT,
ALTER COLUMN "displayOrder" DROP NOT NULL,
ALTER COLUMN "displayOrder" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "OperatingRoom" ADD CONSTRAINT "OperatingRoom_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "OperatingSector"("id") ON DELETE SET NULL ON UPDATE CASCADE;
