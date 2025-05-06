/*
  Warnings:

  - You are about to drop the column `assignmentType` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `endDate` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `priority` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `specialty` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `regular_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `regular_assignments` table. All the data in the column will be lost.
  - The `dayOfWeek` column on the `regular_assignments` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `trames` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `type` to the `regular_assignments` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `period` on the `regular_assignments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "regular_assignments" DROP CONSTRAINT "regular_assignments_trameId_fkey";

-- AlterTable
ALTER TABLE "leaves" ADD COLUMN     "isRecurring" BOOLEAN DEFAULT false,
ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "recurrencePattern" JSONB;

-- AlterTable
ALTER TABLE "regular_assignments" DROP COLUMN "assignmentType",
DROP COLUMN "createdAt",
DROP COLUMN "details",
DROP COLUMN "endDate",
DROP COLUMN "priority",
DROP COLUMN "specialty",
DROP COLUMN "startDate",
DROP COLUMN "updatedAt",
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "configuration" JSONB,
ADD COLUMN     "type" TEXT NOT NULL,
ALTER COLUMN "trameId" SET DATA TYPE TEXT,
DROP COLUMN "dayOfWeek",
ADD COLUMN     "dayOfWeek" INTEGER NOT NULL DEFAULT 1,
DROP COLUMN "period",
ADD COLUMN     "period" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "departmentId" TEXT;

-- DropTable
DROP TABLE "trames";

-- CreateTable
CREATE TABLE "TrameAffectation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrameAffectation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TramePeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trameId" TEXT NOT NULL,

    CONSTRAINT "TramePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrameAssignment" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "periodId" TEXT NOT NULL,

    CONSTRAINT "TrameAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TramePost" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "maxCount" INTEGER NOT NULL DEFAULT 1,
    "minCount" INTEGER NOT NULL DEFAULT 0,
    "assignmentId" TEXT NOT NULL,

    CONSTRAINT "TramePost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_balances" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "year" INTEGER NOT NULL,
    "initial" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pending" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remaining" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_transfer_rules" (
    "id" TEXT NOT NULL,
    "fromType" "LeaveType" NOT NULL,
    "toType" "LeaveType" NOT NULL,
    "conversionRate" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "maxTransferDays" DOUBLE PRECISION,
    "maxTransferPercentage" DOUBLE PRECISION,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "authorizedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quota_transfer_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_transfers" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "fromType" "LeaveType" NOT NULL,
    "toType" "LeaveType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "convertedAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" INTEGER,
    "approvalDate" TIMESTAMP(3),
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quota_transfers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_carry_over_rules" (
    "id" TEXT NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "ruleType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "value" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "maxCarryOverDays" DOUBLE PRECISION,
    "expirationDays" INTEGER,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "authorizedRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quota_carry_over_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quota_carry_overs" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "leaveType" "LeaveType" NOT NULL,
    "fromYear" INTEGER NOT NULL,
    "toYear" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'APPROVED',
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedById" INTEGER,
    "approvalDate" TIMESTAMP(3),
    "reason" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quota_carry_overs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "userId" INTEGER,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_holidays" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isNational" BOOLEAN NOT NULL DEFAULT true,
    "region" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "public_holidays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "departments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_balances_userId_leaveType_year_key" ON "leave_balances"("userId", "leaveType", "year");

-- CreateIndex
CREATE UNIQUE INDEX "quota_transfer_rules_fromType_toType_key" ON "quota_transfer_rules"("fromType", "toType");

-- CreateIndex
CREATE INDEX "quota_transfers_userId_fromType_toType_idx" ON "quota_transfers"("userId", "fromType", "toType");

-- CreateIndex
CREATE INDEX "quota_transfers_status_idx" ON "quota_transfers"("status");

-- CreateIndex
CREATE UNIQUE INDEX "quota_carry_over_rules_leaveType_key" ON "quota_carry_over_rules"("leaveType");

-- CreateIndex
CREATE INDEX "quota_carry_overs_userId_leaveType_idx" ON "quota_carry_overs"("userId", "leaveType");

-- CreateIndex
CREATE INDEX "quota_carry_overs_fromYear_toYear_idx" ON "quota_carry_overs"("fromYear", "toYear");

-- CreateIndex
CREATE INDEX "quota_carry_overs_status_idx" ON "quota_carry_overs"("status");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "public_holidays_date_idx" ON "public_holidays"("date");

-- CreateIndex
CREATE UNIQUE INDEX "public_holidays_date_region_key" ON "public_holidays"("date", "region");

-- CreateIndex
CREATE INDEX "leaves_parentId_idx" ON "leaves"("parentId");

-- CreateIndex
CREATE INDEX "regular_assignments_dayOfWeek_period_weekType_idx" ON "regular_assignments"("dayOfWeek", "period", "weekType");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "leaves"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_assignments" ADD CONSTRAINT "regular_assignments_trameId_fkey" FOREIGN KEY ("trameId") REFERENCES "TrameAffectation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrameAffectation" ADD CONSTRAINT "TrameAffectation_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TramePeriod" ADD CONSTRAINT "TramePeriod_trameId_fkey" FOREIGN KEY ("trameId") REFERENCES "TrameAffectation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrameAssignment" ADD CONSTRAINT "TrameAssignment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "TramePeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TramePost" ADD CONSTRAINT "TramePost_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "TrameAssignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leave_balances" ADD CONSTRAINT "leave_balances_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_transfers" ADD CONSTRAINT "quota_transfers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_transfers" ADD CONSTRAINT "quota_transfers_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_carry_overs" ADD CONSTRAINT "quota_carry_overs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quota_carry_overs" ADD CONSTRAINT "quota_carry_overs_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
