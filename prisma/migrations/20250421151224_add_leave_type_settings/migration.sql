/*
  Warnings:

  - You are about to drop the `Leave` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Leave" DROP CONSTRAINT "Leave_userId_fkey";

-- DropTable
DROP TABLE "Leave";

-- CreateTable
CREATE TABLE "leave_type_settings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isUserSelectable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_type_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "typeCode" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "status" "LeaveStatus" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" TIMESTAMP(3),
    "approvedById" INTEGER,
    "countedDays" DOUBLE PRECISION NOT NULL,
    "calculationDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_settings_code_key" ON "leave_type_settings"("code");

-- CreateIndex
CREATE INDEX "leaves_userId_idx" ON "leaves"("userId");

-- CreateIndex
CREATE INDEX "leaves_startDate_endDate_idx" ON "leaves"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "leaves_typeCode_idx" ON "leaves"("typeCode");

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
