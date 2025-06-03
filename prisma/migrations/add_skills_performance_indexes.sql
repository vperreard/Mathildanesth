-- Optimisation des performances pour l'API /api/skills
-- Index pour améliorer les requêtes de tri par nom
CREATE INDEX IF NOT EXISTS "idx_skills_name" ON "Skill" ("name");

-- Index composé pour les requêtes avec filtres
CREATE INDEX IF NOT EXISTS "idx_skills_active_name" ON "Skill" ("isActive", "name");

-- Index pour les requêtes par catégorie
CREATE INDEX IF NOT EXISTS "idx_skills_category" ON "Skill" ("category");

-- Index composé pour les filtres avancés
CREATE INDEX IF NOT EXISTS "idx_skills_category_active" ON "Skill" ("category", "isActive");