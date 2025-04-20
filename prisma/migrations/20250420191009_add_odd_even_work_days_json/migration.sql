/*
  Warnings:

  - You are about to drop the column `workFriday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workMonday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workOnWeekType` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workSaturday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workSunday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workThursday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workTuesday` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `workWednesday` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "workFriday",
DROP COLUMN "workMonday",
DROP COLUMN "workOnWeekType",
DROP COLUMN "workSaturday",
DROP COLUMN "workSunday",
DROP COLUMN "workThursday",
DROP COLUMN "workTuesday",
DROP COLUMN "workWednesday",
ADD COLUMN     "joursTravaillesSemaineImpaire" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "joursTravaillesSemainePaire" JSONB NOT NULL DEFAULT '[]';
