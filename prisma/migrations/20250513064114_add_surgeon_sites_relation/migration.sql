/*
  Warnings:

  - You are about to drop the column `description` on the `sites` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `sites` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "regular_assignments" ADD COLUMN     "siteId" TEXT;

-- AlterTable
ALTER TABLE "sites" DROP COLUMN "description",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "colorCode" TEXT DEFAULT '#007bff',
ALTER COLUMN "displayOrder" DROP NOT NULL;

-- CreateTable
CREATE TABLE "_SurgeonSites" (
    "A" TEXT NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SurgeonSites_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_SurgeonSites_B_index" ON "_SurgeonSites"("B");

-- CreateIndex
CREATE INDEX "regular_assignments_siteId_idx" ON "regular_assignments"("siteId");

-- CreateIndex
CREATE UNIQUE INDEX "sites_name_key" ON "sites"("name");

-- AddForeignKey
ALTER TABLE "regular_assignments" ADD CONSTRAINT "regular_assignments_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "sites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SurgeonSites" ADD CONSTRAINT "_SurgeonSites_A_fkey" FOREIGN KEY ("A") REFERENCES "sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SurgeonSites" ADD CONSTRAINT "_SurgeonSites_B_fkey" FOREIGN KEY ("B") REFERENCES "surgeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
