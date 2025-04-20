/*
  Warnings:

  - You are about to drop the column `joursTravailles` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "WorkPatternType" AS ENUM ('FULL_TIME', 'ALTERNATING_WEEKS', 'ALTERNATING_MONTHS', 'SPECIFIC_DAYS');

-- CreateEnum
CREATE TYPE "WeekType" AS ENUM ('EVEN', 'ODD', 'ALL');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "joursTravailles",
ADD COLUMN     "workFriday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workMonday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workOnMonthType" "WeekType",
ADD COLUMN     "workOnWeekType" "WeekType",
ADD COLUMN     "workPattern" "WorkPatternType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "workSaturday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workSunday" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workThursday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workTuesday" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "workWednesday" BOOLEAN NOT NULL DEFAULT true;
