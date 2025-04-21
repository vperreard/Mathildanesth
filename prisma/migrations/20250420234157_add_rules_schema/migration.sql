-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('LEAVE', 'DUTY', 'SUPERVISION', 'ASSIGNMENT', 'ON_CALL');

-- CreateEnum
CREATE TYPE "RulePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RotationStrategy" AS ENUM ('ROUND_ROBIN', 'LEAST_RECENTLY_ASSIGNED', 'BALANCED_LOAD');

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RuleType" NOT NULL,
    "priority" "RulePriority" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleConflict" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'MEDIUM',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolutionDetails" TEXT,

    CONSTRAINT "RuleConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RuleToConflict" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RuleToConflict_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_RuleToConflict_B_index" ON "_RuleToConflict"("B");

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuleToConflict" ADD CONSTRAINT "_RuleToConflict_A_fkey" FOREIGN KEY ("A") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuleToConflict" ADD CONSTRAINT "_RuleToConflict_B_fkey" FOREIGN KEY ("B") REFERENCES "RuleConflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;
