-- CreateTable
CREATE TABLE "school_holiday_periods" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "school_holiday_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_request_alerts" (
    "id" SERIAL NOT NULL,
    "leaveId" TEXT NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "messageDetails" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "leave_request_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "leave_request_alerts_leaveId_idx" ON "leave_request_alerts"("leaveId");

-- AddForeignKey
ALTER TABLE "leave_request_alerts" ADD CONSTRAINT "leave_request_alerts_leaveId_fkey" FOREIGN KEY ("leaveId") REFERENCES "leaves"("id") ON DELETE CASCADE ON UPDATE CASCADE;
