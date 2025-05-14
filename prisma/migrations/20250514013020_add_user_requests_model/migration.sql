-- CreateEnum
CREATE TYPE "UserRequestStatus" AS ENUM ('SUBMITTED', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED', 'CANCELLED_BY_USER');

-- CreateTable
CREATE TABLE "request_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresAdminApproval" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "request_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_requests" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "UserRequestStatus" NOT NULL DEFAULT 'SUBMITTED',
    "adminNotes" TEXT,
    "userId" INTEGER NOT NULL,
    "requestTypeId" TEXT NOT NULL,
    "assignedToId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "user_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "request_types_name_key" ON "request_types"("name");

-- AddForeignKey
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_requestTypeId_fkey" FOREIGN KEY ("requestTypeId") REFERENCES "request_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_requests" ADD CONSTRAINT "user_requests_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
