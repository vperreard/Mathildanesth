-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "niveauAcces" TEXT NOT NULL,
    "configurationTravail" JSONB NOT NULL,
    "droitsConges" INTEGER NOT NULL,
    "specialites" JSONB,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "chirurgiens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "specialites" JSONB NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "reglesSpecifiques" JSONB
);

-- CreateTable
CREATE TABLE "salles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "codeCouleur" TEXT NOT NULL,
    "reglesSupervision" JSONB
);

-- CreateTable
CREATE TABLE "affectations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "demiJournee" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "specialite" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "situationExceptionnelle" BOOLEAN NOT NULL DEFAULT false,
    "utilisateurId" INTEGER NOT NULL,
    "salleId" INTEGER,
    "chirurgienId" INTEGER,
    "trameId" INTEGER,
    CONSTRAINT "affectations_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "affectations_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "affectations_chirurgienId_fkey" FOREIGN KEY ("chirurgienId") REFERENCES "chirurgiens" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "affectations_trameId_fkey" FOREIGN KEY ("trameId") REFERENCES "trames" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "commentaire" TEXT,
    "decompte" BOOLEAN NOT NULL DEFAULT true,
    "utilisateurId" INTEGER NOT NULL,
    CONSTRAINT "conges_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "compteurs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "annee" INTEGER NOT NULL,
    "congesPris" INTEGER NOT NULL DEFAULT 0,
    "congesRestants" INTEGER NOT NULL DEFAULT 0,
    "heuresSupplementaires" INTEGER NOT NULL DEFAULT 0,
    "statsSpecialites" JSONB,
    "statsGardes" JSONB,
    "utilisateurId" INTEGER NOT NULL,
    CONSTRAINT "compteurs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "trames" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nom" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "configuration" TEXT,
    "dateDebutValidite" DATETIME NOT NULL,
    "dateFinValidite" DATETIME,
    "details" JSONB NOT NULL
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lue" BOOLEAN NOT NULL DEFAULT false,
    "utilisateurId" INTEGER NOT NULL,
    CONSTRAINT "notifications_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "compteurs_utilisateurId_key" ON "compteurs"("utilisateurId");
