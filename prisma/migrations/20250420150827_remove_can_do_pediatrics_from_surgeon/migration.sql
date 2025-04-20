/*
  Warnings:

  - You are about to drop the `Surgeon` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Surgeon" DROP CONSTRAINT "Surgeon_userId_fkey";

-- DropForeignKey
ALTER TABLE "_SpecialtyToSurgeon" DROP CONSTRAINT "_SpecialtyToSurgeon_B_fkey";

-- DropTable
DROP TABLE "Surgeon";

-- CreateTable
CREATE TABLE "surgeons" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIF',
    "userId" INTEGER,

    CONSTRAINT "surgeons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "surgeonId" INTEGER NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "surgeons_email_key" ON "surgeons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "surgeons_userId_key" ON "surgeons"("userId");

-- AddForeignKey
ALTER TABLE "surgeons" ADD CONSTRAINT "surgeons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "surgeons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialtyToSurgeon" ADD CONSTRAINT "_SpecialtyToSurgeon_B_fkey" FOREIGN KEY ("B") REFERENCES "surgeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
