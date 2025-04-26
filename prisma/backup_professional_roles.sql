-- Sauvegarde des données de ProfessionalRoleConfig
INSERT INTO "ProfessionalRoleConfig" ("id", "code", "label", "description", "isActive", "createdAt", "updatedAt")
VALUES
    ('1', 'MAR', 'Médecin Anesthésiste Réanimateur', 'Médecin spécialisé en anesthésie-réanimation', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('2', 'IADE', 'Infirmier Anesthésiste', 'Infirmier spécialisé en anesthésie', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('3', 'SECRETAIRE', 'Secrétaire', 'Personnel administratif', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 