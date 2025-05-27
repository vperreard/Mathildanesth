-- Add new fields to PlanningRule table for v2
ALTER TABLE "PlanningRule" 
ADD COLUMN IF NOT EXISTS "type" TEXT,
ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "version" INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
ADD COLUMN IF NOT EXISTS "updatedBy" TEXT,
ADD COLUMN IF NOT EXISTS "effectiveDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "expirationDate" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "conditions" JSONB,
ADD COLUMN IF NOT EXISTS "actions" JSONB,
ADD COLUMN IF NOT EXISTS "conditionGroups" JSONB,
ADD COLUMN IF NOT EXISTS "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "contexts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "metadata" JSONB,
ADD COLUMN IF NOT EXISTS "conflictsWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS "dependencies" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Update existing columns
ALTER TABLE "PlanningRule" 
ALTER COLUMN "id" TYPE TEXT,
ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

-- Create RuleVersion table
CREATE TABLE IF NOT EXISTS "RuleVersion" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" JSONB,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "message" TEXT,
    "snapshot" JSONB NOT NULL,

    CONSTRAINT "RuleVersion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RuleVersion_ruleId_version_key" UNIQUE ("ruleId", "version")
);

-- Create RuleMetrics table
CREATE TABLE IF NOT EXISTS "RuleMetrics" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "evaluationCount" INTEGER DEFAULT 0,
    "averageExecutionTime" DOUBLE PRECISION DEFAULT 0,
    "successRate" DOUBLE PRECISION DEFAULT 0,
    "lastEvaluatedAt" TIMESTAMP(3),
    "impactedUsersCount" INTEGER DEFAULT 0,
    "violationCount" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RuleMetrics_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "RuleMetrics_ruleId_key" UNIQUE ("ruleId")
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "PlanningRule_type_idx" ON "PlanningRule"("type");
CREATE INDEX IF NOT EXISTS "PlanningRule_status_idx" ON "PlanningRule"("status");
CREATE INDEX IF NOT EXISTS "PlanningRule_enabled_idx" ON "PlanningRule"("enabled");
CREATE INDEX IF NOT EXISTS "PlanningRule_priority_idx" ON "PlanningRule"("priority");
CREATE INDEX IF NOT EXISTS "PlanningRule_effectiveDate_idx" ON "PlanningRule"("effectiveDate");
CREATE INDEX IF NOT EXISTS "PlanningRule_tags_idx" ON "PlanningRule" USING GIN("tags");
CREATE INDEX IF NOT EXISTS "PlanningRule_contexts_idx" ON "PlanningRule" USING GIN("contexts");

CREATE INDEX IF NOT EXISTS "RuleVersion_ruleId_idx" ON "RuleVersion"("ruleId");
CREATE INDEX IF NOT EXISTS "RuleVersion_createdAt_idx" ON "RuleVersion"("createdAt");

CREATE INDEX IF NOT EXISTS "RuleMetrics_ruleId_idx" ON "RuleMetrics"("ruleId");
CREATE INDEX IF NOT EXISTS "RuleMetrics_lastEvaluatedAt_idx" ON "RuleMetrics"("lastEvaluatedAt");

-- Add foreign key constraints if needed
-- ALTER TABLE "RuleVersion" ADD CONSTRAINT "RuleVersion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PlanningRule"("id") ON DELETE CASCADE;
-- ALTER TABLE "RuleMetrics" ADD CONSTRAINT "RuleMetrics_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "PlanningRule"("id") ON DELETE CASCADE;