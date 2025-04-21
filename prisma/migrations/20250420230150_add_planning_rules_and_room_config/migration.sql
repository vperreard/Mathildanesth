-- CreateTable
CREATE TABLE "PlanningRule" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "conditionJSON" JSONB NOT NULL,
    "parameterJSON" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingRoomConfig" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "colorCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supervisionRules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingRoomConfig_pkey" PRIMARY KEY ("id")
);
