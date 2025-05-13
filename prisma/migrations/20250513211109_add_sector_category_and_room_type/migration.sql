-- This is an empty migration.

-- Ajout du champ category à la table OperatingSector
ALTER TABLE "OperatingSector" ADD COLUMN "category" TEXT;

-- Ajout du champ type à la table OperatingRoom
ALTER TABLE "OperatingRoom" ADD COLUMN "type" TEXT;