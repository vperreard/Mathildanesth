/*
  Warnings:

  - You are about to drop the column `generatedPlanningData` on the `simulation_results` table. All the data in the column will be lost.
  - You are about to drop the `simulation_scenarios` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "simulation_results" DROP CONSTRAINT "simulation_results_scenarioId_fkey";

-- DropForeignKey
ALTER TABLE "simulation_scenarios" DROP CONSTRAINT "simulation_scenarios_createdById_fkey";

-- AlterTable
ALTER TABLE "assignments" ADD COLUMN     "period" "Period";

-- AlterTable
ALTER TABLE "simulation_results" DROP COLUMN "generatedPlanningData",
ADD COLUMN     "executionTime" INTEGER,
ADD COLUMN     "metricsData" JSONB,
ADD COLUMN     "resultData" JSONB,
ALTER COLUMN "statisticsJson" DROP NOT NULL;

-- DropTable
DROP TABLE "simulation_scenarios";

-- CreateTable
CREATE TABLE "SimulationScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER,
    "parameters" JSONB,
    "status" TEXT DEFAULT 'created',
    "lastProgress" INTEGER DEFAULT 0,
    "lastProgressUpdatedAt" TIMESTAMP(3),
    "lastMessage" TEXT,

    CONSTRAINT "SimulationScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_intermediate_results" (
    "scenarioId" TEXT NOT NULL,
    "stepName" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_intermediate_results_pkey" PRIMARY KEY ("scenarioId","stepName")
);

-- AddForeignKey
ALTER TABLE "SimulationScenario" ADD CONSTRAINT "SimulationScenario_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_results" ADD CONSTRAINT "simulation_results_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_intermediate_results" ADD CONSTRAINT "simulation_intermediate_results_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "SimulationScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
