/*
  Warnings:

  - You are about to drop the `Notification` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ActivityTypeToSite` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[name]` on the table `team_configurations` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `rules` to the `team_configurations` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('NEW_CONTEXTUAL_MESSAGE', 'MENTION_IN_MESSAGE', 'NEW_PLANNING_COMMENT', 'ASSIGNMENT_SWAP_REQUEST_RECEIVED', 'ASSIGNMENT_SWAP_REQUEST_ACCEPTED', 'ASSIGNMENT_SWAP_REQUEST_REJECTED', 'ASSIGNMENT_SWAP_REQUEST_APPROVED_ADMIN', 'ASSIGNMENT_SWAP_REQUEST_CANCELLED', 'ASSIGNMENT_REMINDER', 'PLANNING_UPDATED_IMPACTING_YOU', 'LEAVE_REQUEST_STATUS_CHANGED', 'NEW_OPEN_SHIFT_AVAILABLE', 'TEAM_PLANNING_PUBLISHED', 'RULE_CONFLICT_DETECTED_ADMIN', 'GENERAL_INFO', 'SYSTEM_ALERT');

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_userId_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityTypeToSite" DROP CONSTRAINT "_ActivityTypeToSite_A_fkey";

-- DropForeignKey
ALTER TABLE "_ActivityTypeToSite" DROP CONSTRAINT "_ActivityTypeToSite_B_fkey";

-- AlterTable
ALTER TABLE "activity_types" ADD COLUMN     "site_id" TEXT;

-- AlterTable
ALTER TABLE "leaves" ADD COLUMN     "halfDayPeriod" TEXT,
ADD COLUMN     "isHalfDay" BOOLEAN;

-- AlterTable
ALTER TABLE "team_configurations" ADD COLUMN     "configuration" JSONB,
ADD COLUMN     "leaveQuotas" JSONB,
ADD COLUMN     "rules" JSONB NOT NULL,
ADD COLUMN     "siteId" TEXT,
ADD COLUMN     "skillsNeeded" JSONB,
ADD COLUMN     "workingHours" JSONB;

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "_ActivityTypeToSite";

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "NotificationType" NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "triggeredByUserId" INTEGER,
    "relatedAssignmentId" TEXT,
    "relatedRequestId" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" INTEGER NOT NULL,
    "parametersJson" JSONB NOT NULL,

    CONSTRAINT "simulation_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_results" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedPlanningData" JSONB NOT NULL,
    "statisticsJson" JSONB NOT NULL,
    "conflictAlertsJson" JSONB,
    "comparisonDataJson" JSONB,
    "status" "SimulationStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,

    CONSTRAINT "simulation_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contextual_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" INTEGER NOT NULL,
    "assignmentId" TEXT,
    "contextDate" DATE,
    "requestId" TEXT,
    "parentId" TEXT,

    CONSTRAINT "contextual_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_TeamMembers" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeamMembers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TeamResponsibles" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_TeamResponsibles_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "contextual_messages_assignmentId_idx" ON "contextual_messages"("assignmentId");

-- CreateIndex
CREATE INDEX "contextual_messages_contextDate_idx" ON "contextual_messages"("contextDate");

-- CreateIndex
CREATE INDEX "contextual_messages_requestId_idx" ON "contextual_messages"("requestId");

-- CreateIndex
CREATE INDEX "contextual_messages_authorId_idx" ON "contextual_messages"("authorId");

-- CreateIndex
CREATE INDEX "_TeamMembers_B_index" ON "_TeamMembers"("B");

-- CreateIndex
CREATE INDEX "_TeamResponsibles_B_index" ON "_TeamResponsibles"("B");

-- CreateIndex
CREATE UNIQUE INDEX "team_configurations_name_key" ON "team_configurations"("name");

-- AddForeignKey
ALTER TABLE "team_configurations" ADD CONSTRAINT "team_configurations_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_triggeredByUserId_fkey" FOREIGN KEY ("triggeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_relatedAssignmentId_fkey" FOREIGN KEY ("relatedAssignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_relatedRequestId_fkey" FOREIGN KEY ("relatedRequestId") REFERENCES "user_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_types" ADD CONSTRAINT "activity_types_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_scenarios" ADD CONSTRAINT "simulation_scenarios_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "simulation_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contextual_messages" ADD CONSTRAINT "contextual_messages_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contextual_messages" ADD CONSTRAINT "contextual_messages_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contextual_messages" ADD CONSTRAINT "contextual_messages_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "user_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contextual_messages" ADD CONSTRAINT "contextual_messages_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "contextual_messages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_A_fkey" FOREIGN KEY ("A") REFERENCES "team_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamMembers" ADD CONSTRAINT "_TeamMembers_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamResponsibles" ADD CONSTRAINT "_TeamResponsibles_A_fkey" FOREIGN KEY ("A") REFERENCES "team_configurations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TeamResponsibles" ADD CONSTRAINT "_TeamResponsibles_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
