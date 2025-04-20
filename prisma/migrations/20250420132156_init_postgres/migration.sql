-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER');

-- CreateEnum
CREATE TYPE "ProfessionalRole" AS ENUM ('MAR', 'IADE', 'SECRETAIRE');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "login" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "professionalRole" "ProfessionalRole" NOT NULL,
    "tempsPartiel" BOOLEAN NOT NULL DEFAULT false,
    "pourcentageTempsPartiel" DOUBLE PRECISION,
    "joursTravailles" TEXT,
    "dateEntree" TIMESTAMP(3),
    "dateSortie" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Surgeon" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "specialties" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIF',
    "userId" INTEGER,

    CONSTRAINT "Surgeon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Surgeon_userId_key" ON "Surgeon"("userId");

-- CreateIndex
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");

-- AddForeignKey
ALTER TABLE "Surgeon" ADD CONSTRAINT "Surgeon_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
