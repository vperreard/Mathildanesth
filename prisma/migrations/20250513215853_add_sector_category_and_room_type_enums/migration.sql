/*
  Warnings:

  - The `type` column on the `OperatingRoom` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `category` column on the `OperatingSector` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "SectorCategory" AS ENUM ('STANDARD', 'HYPERASEPTIQUE', 'OPHTALMOLOGIE', 'ENDOSCOPIE');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('STANDARD', 'FIV', 'CONSULTATION');

-- AlterTable
ALTER TABLE "OperatingRoom" DROP COLUMN "type",
ADD COLUMN     "type" "RoomType" NOT NULL DEFAULT 'STANDARD';

-- AlterTable
ALTER TABLE "OperatingSector" DROP COLUMN "category",
ADD COLUMN     "category" "SectorCategory" NOT NULL DEFAULT 'STANDARD';
