-- CreateTable
CREATE TABLE "rules_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "rules" TEXT NOT NULL,
    "fatigueConfig" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rules_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "rules_templates_category_idx" ON "rules_templates"("category");

-- CreateIndex
CREATE INDEX "rules_templates_isDefault_idx" ON "rules_templates"("isDefault");