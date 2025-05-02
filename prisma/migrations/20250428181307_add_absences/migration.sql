/*
  Warnings:

  - The values [MEDIUM] on the enum `RulePriority` will be removed. If these variants are still used in the database, this will fail.
  - The values [LOW,MEDIUM,HIGH] on the enum `RuleSeverity` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "RulePriority_new" AS ENUM ('LOW', 'WARNING', 'HIGH', 'CRITICAL');
ALTER TABLE "Rule" ALTER COLUMN "priority" DROP DEFAULT;
ALTER TABLE "Rule" ALTER COLUMN "priority" TYPE "RulePriority_new" USING ("priority"::text::"RulePriority_new");
ALTER TYPE "RulePriority" RENAME TO "RulePriority_old";
ALTER TYPE "RulePriority_new" RENAME TO "RulePriority";
DROP TYPE "RulePriority_old";
ALTER TABLE "Rule" ALTER COLUMN "priority" SET DEFAULT 'WARNING';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "RuleSeverity_new" AS ENUM ('ERROR', 'WARNING', 'INFO');
ALTER TABLE "RuleConflict" ALTER COLUMN "severity" DROP DEFAULT;
ALTER TABLE "RuleConflict" ALTER COLUMN "severity" TYPE "RuleSeverity_new" USING ("severity"::text::"RuleSeverity_new");
ALTER TYPE "RuleSeverity" RENAME TO "RuleSeverity_old";
ALTER TYPE "RuleSeverity_new" RENAME TO "RuleSeverity";
DROP TYPE "RuleSeverity_old";
ALTER TABLE "RuleConflict" ALTER COLUMN "severity" SET DEFAULT 'WARNING';
COMMIT;

-- AlterTable
ALTER TABLE "Rule" ALTER COLUMN "priority" SET DEFAULT 'WARNING';

-- AlterTable
ALTER TABLE "RuleConflict" ALTER COLUMN "severity" SET DEFAULT 'WARNING';
