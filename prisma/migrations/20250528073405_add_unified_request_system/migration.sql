/*
  Warnings:

  - The primary key for the `PlanningRule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `createdBy` to the `PlanningRule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedBy` to the `PlanningRule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PlanningRule" DROP CONSTRAINT "PlanningRule_pkey",
ADD COLUMN     "actions" JSONB,
ADD COLUMN     "conditionGroups" JSONB,
ADD COLUMN     "conditions" JSONB,
ADD COLUMN     "conflictsWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "contexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "createdBy" TEXT NOT NULL,
ADD COLUMN     "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "effectiveDate" TIMESTAMP(3),
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'draft',
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "type" TEXT,
ADD COLUMN     "updatedBy" TEXT NOT NULL,
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "PlanningRule_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "PlanningRule_id_seq";

-- CreateTable
CREATE TABLE "rule_versions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "rule_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_metrics" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "evaluationCount" INTEGER NOT NULL DEFAULT 0,
    "averageExecutionTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "successRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),
    "impactedUsersCount" INTEGER NOT NULL DEFAULT 0,
    "violationCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_config" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "rules" JSONB NOT NULL,
    "fatigueConfig" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnifiedRequest" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "requesterId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "data" JSONB NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'draft',
    "workflowHistory" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "siteId" TEXT,
    "auditLog" JSONB NOT NULL DEFAULT '[]',
    "legacyType" TEXT,
    "legacyId" TEXT,

    CONSTRAINT "UnifiedRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnifiedRequestNotification" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "recipientId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UnifiedRequestNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rule_versions_ruleId_idx" ON "rule_versions"("ruleId");

-- CreateIndex
CREATE INDEX "rule_versions_createdAt_idx" ON "rule_versions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "rule_versions_ruleId_version_key" ON "rule_versions"("ruleId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "rule_metrics_ruleId_key" ON "rule_metrics"("ruleId");

-- CreateIndex
CREATE INDEX "rule_metrics_ruleId_idx" ON "rule_metrics"("ruleId");

-- CreateIndex
CREATE INDEX "rule_metrics_lastEvaluatedAt_idx" ON "rule_metrics"("lastEvaluatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "system_config_key_key" ON "system_config"("key");

-- CreateIndex
CREATE INDEX "activity_logs_userId_idx" ON "activity_logs"("userId");

-- CreateIndex
CREATE INDEX "activity_logs_action_idx" ON "activity_logs"("action");

-- CreateIndex
CREATE INDEX "activity_logs_createdAt_idx" ON "activity_logs"("createdAt");

-- CreateIndex
CREATE INDEX "rules_templates_category_idx" ON "rules_templates"("category");

-- CreateIndex
CREATE INDEX "rules_templates_isDefault_idx" ON "rules_templates"("isDefault");

-- CreateIndex
CREATE UNIQUE INDEX "rules_templates_name_isDefault_key" ON "rules_templates"("name", "isDefault");

-- CreateIndex
CREATE INDEX "UnifiedRequest_type_idx" ON "UnifiedRequest"("type");

-- CreateIndex
CREATE INDEX "UnifiedRequest_status_idx" ON "UnifiedRequest"("status");

-- CreateIndex
CREATE INDEX "UnifiedRequest_priority_idx" ON "UnifiedRequest"("priority");

-- CreateIndex
CREATE INDEX "UnifiedRequest_requesterId_idx" ON "UnifiedRequest"("requesterId");

-- CreateIndex
CREATE INDEX "UnifiedRequest_assignedToId_idx" ON "UnifiedRequest"("assignedToId");

-- CreateIndex
CREATE INDEX "UnifiedRequest_createdAt_idx" ON "UnifiedRequest"("createdAt");

-- CreateIndex
CREATE INDEX "UnifiedRequest_siteId_idx" ON "UnifiedRequest"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "UnifiedRequest_legacyType_legacyId_key" ON "UnifiedRequest"("legacyType", "legacyId");

-- CreateIndex
CREATE INDEX "UnifiedRequestNotification_requestId_idx" ON "UnifiedRequestNotification"("requestId");

-- CreateIndex
CREATE INDEX "UnifiedRequestNotification_recipientId_idx" ON "UnifiedRequestNotification"("recipientId");

-- CreateIndex
CREATE INDEX "UnifiedRequestNotification_status_idx" ON "UnifiedRequestNotification"("status");

-- CreateIndex
CREATE INDEX "PlanningRule_type_idx" ON "PlanningRule"("type");

-- CreateIndex
CREATE INDEX "PlanningRule_status_idx" ON "PlanningRule"("status");

-- CreateIndex
CREATE INDEX "PlanningRule_enabled_idx" ON "PlanningRule"("enabled");

-- CreateIndex
CREATE INDEX "PlanningRule_priority_idx" ON "PlanningRule"("priority");

-- CreateIndex
CREATE INDEX "PlanningRule_effectiveDate_idx" ON "PlanningRule"("effectiveDate");

-- CreateIndex
CREATE INDEX "PlanningRule_tags_idx" ON "PlanningRule"("tags");

-- CreateIndex
CREATE INDEX "PlanningRule_contexts_idx" ON "PlanningRule"("contexts");

-- AddForeignKey
ALTER TABLE "rule_versions" ADD CONSTRAINT "rule_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PlanningRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_metrics" ADD CONSTRAINT "rule_metrics_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PlanningRule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_config" ADD CONSTRAINT "system_config_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules_templates" ADD CONSTRAINT "rules_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedRequest" ADD CONSTRAINT "UnifiedRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedRequest" ADD CONSTRAINT "UnifiedRequest_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedRequest" ADD CONSTRAINT "UnifiedRequest_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedRequestNotification" ADD CONSTRAINT "UnifiedRequestNotification_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "UnifiedRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UnifiedRequestNotification" ADD CONSTRAINT "UnifiedRequestNotification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
