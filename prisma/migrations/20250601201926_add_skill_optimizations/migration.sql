-- AlterTable
ALTER TABLE "skills" ADD COLUMN     "category" TEXT DEFAULT 'general',
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "skills_name_idx" ON "skills"("name");

-- CreateIndex
CREATE INDEX "skills_isActive_name_idx" ON "skills"("isActive", "name");

-- CreateIndex
CREATE INDEX "skills_category_idx" ON "skills"("category");

-- CreateIndex
CREATE INDEX "skills_category_isActive_idx" ON "skills"("category", "isActive");
