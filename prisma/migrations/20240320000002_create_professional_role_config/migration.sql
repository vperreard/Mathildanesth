-- CreateTable
CREATE TABLE "ProfessionalRoleConfig" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayPreferences" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfessionalRoleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalRoleConfig_code_key" ON "ProfessionalRoleConfig"("code");

-- InsertData
INSERT INTO "ProfessionalRoleConfig" ("id", "code", "label", "description", "isActive", "createdAt", "updatedAt")
VALUES
    ('1', 'MAR', 'Médecin Anesthésiste Réanimateur', 'Médecin spécialisé en anesthésie-réanimation', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('2', 'IADE', 'Infirmier Anesthésiste', 'Infirmier spécialisé en anesthésie', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('3', 'SECRETAIRE', 'Secrétaire', 'Personnel administratif', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 