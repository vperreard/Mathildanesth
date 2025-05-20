-- CreateTable
CREATE TABLE "notification_preferences" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "assignmentReminders" BOOLEAN NOT NULL DEFAULT true,
    "assignmentSwapRequests" BOOLEAN NOT NULL DEFAULT true,
    "assignmentSwapResponses" BOOLEAN NOT NULL DEFAULT true,
    "assignmentSwapAdminActions" BOOLEAN NOT NULL DEFAULT true,
    "contextualMessages" BOOLEAN NOT NULL DEFAULT true,
    "mentionsInMessages" BOOLEAN NOT NULL DEFAULT true,
    "planningUpdates" BOOLEAN NOT NULL DEFAULT true,
    "leaveRequestStatusChanges" BOOLEAN NOT NULL DEFAULT true,
    "openShifts" BOOLEAN NOT NULL DEFAULT false,
    "teamPlanningPublished" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "inAppEnabled" BOOLEAN NOT NULL DEFAULT true,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" TEXT DEFAULT '22:00',
    "quietHoursEnd" TEXT DEFAULT '08:00',
    "quietHoursDays" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_preferences_userId_key" ON "notification_preferences"("userId");

-- AddForeignKey
ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
