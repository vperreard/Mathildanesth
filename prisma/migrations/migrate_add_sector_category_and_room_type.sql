-- Migration: add_sector_category_and_room_type

-- Ajout des colonnes
ALTER TABLE "OperatingSector" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "OperatingRoom" ADD COLUMN IF NOT EXISTS "type" TEXT;

-- Mise à jour des données existantes basée sur les noms
UPDATE "OperatingSector" SET "category" = 'HYPERASEPTIQUE' WHERE LOWER("name") LIKE '%hyperaseptique%';
UPDATE "OperatingSector" SET "category" = 'OPHTALMOLOGIE' WHERE LOWER("name") LIKE '%ophtalmo%';
UPDATE "OperatingSector" SET "category" = 'ENDOSCOPIE' WHERE LOWER("name") LIKE '%endo%';
UPDATE "OperatingSector" SET "category" = 'STANDARD' WHERE "category" IS NULL;

UPDATE "OperatingRoom" SET "type" = 'FIV' WHERE LOWER("name") LIKE '%fiv%';
UPDATE "OperatingRoom" SET "type" = 'CONSULTATION' WHERE LOWER("name") LIKE '%consult%';
UPDATE "OperatingRoom" SET "type" = 'STANDARD' WHERE "type" IS NULL;

-- Mise à jour du schéma Prisma (à ajouter manuellement au schema.prisma)
-- model OperatingSector {
--   // ... champs existants
--   category String?
-- }
--
-- model OperatingRoom {
--   // ... champs existants
--   type String?
-- } 