-- AlterTable
ALTER TABLE "simulation_scenarios" ADD COLUMN     "templateId" TEXT;

-- CreateTable
CREATE TABLE "simulation_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "parametersJson" JSONB NOT NULL,
    "category" TEXT,

    CONSTRAINT "simulation_templates_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "simulation_templates" ADD CONSTRAINT "simulation_templates_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
