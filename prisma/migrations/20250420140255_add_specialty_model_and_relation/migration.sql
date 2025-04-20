/*
  Warnings:

  - You are about to drop the column `specialties` on the `Surgeon` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Surgeon" DROP COLUMN "specialties",
ADD COLUMN     "canDoPediatrics" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Specialty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SpecialtyToSurgeon" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SpecialtyToSurgeon_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE INDEX "_SpecialtyToSurgeon_B_index" ON "_SpecialtyToSurgeon"("B");

-- AddForeignKey
ALTER TABLE "_SpecialtyToSurgeon" ADD CONSTRAINT "_SpecialtyToSurgeon_A_fkey" FOREIGN KEY ("A") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialtyToSurgeon" ADD CONSTRAINT "_SpecialtyToSurgeon_B_fkey" FOREIGN KEY ("B") REFERENCES "Surgeon"("id") ON DELETE CASCADE ON UPDATE CASCADE;
