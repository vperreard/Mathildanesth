-- CreateEnum
CREATE TYPE "AssignmentSwapStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED');

-- CreateTable
CREATE TABLE "AssignmentSwapRequest" (
    "id" TEXT NOT NULL,
    "initiatorUserId" INTEGER NOT NULL,
    "proposedAssignmentId" TEXT NOT NULL,
    "targetUserId" INTEGER,
    "requestedAssignmentId" TEXT,
    "status" "AssignmentSwapStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "responseMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "AssignmentSwapRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skills" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_skills" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "skillId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" INTEGER,

    CONSTRAINT "user_skills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AssignmentSwapRequest_initiatorUserId_idx" ON "AssignmentSwapRequest"("initiatorUserId");

-- CreateIndex
CREATE INDEX "AssignmentSwapRequest_targetUserId_idx" ON "AssignmentSwapRequest"("targetUserId");

-- CreateIndex
CREATE INDEX "AssignmentSwapRequest_proposedAssignmentId_idx" ON "AssignmentSwapRequest"("proposedAssignmentId");

-- CreateIndex
CREATE INDEX "AssignmentSwapRequest_requestedAssignmentId_idx" ON "AssignmentSwapRequest"("requestedAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_skills_userId_skillId_key" ON "user_skills"("userId", "skillId");

-- AddForeignKey
ALTER TABLE "AssignmentSwapRequest" ADD CONSTRAINT "AssignmentSwapRequest_initiatorUserId_fkey" FOREIGN KEY ("initiatorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSwapRequest" ADD CONSTRAINT "AssignmentSwapRequest_proposedAssignmentId_fkey" FOREIGN KEY ("proposedAssignmentId") REFERENCES "assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSwapRequest" ADD CONSTRAINT "AssignmentSwapRequest_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentSwapRequest" ADD CONSTRAINT "AssignmentSwapRequest_requestedAssignmentId_fkey" FOREIGN KEY ("requestedAssignmentId") REFERENCES "assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_skills" ADD CONSTRAINT "user_skills_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
