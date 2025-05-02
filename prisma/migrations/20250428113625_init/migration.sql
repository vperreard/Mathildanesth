-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN_TOTAL', 'ADMIN_PARTIEL', 'USER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIF', 'INACTIF');

-- CreateEnum
CREATE TYPE "ProfessionalRole" AS ENUM ('MAR', 'IADE', 'SECRETAIRE');

-- CreateEnum
CREATE TYPE "WorkPatternType" AS ENUM ('FULL_TIME', 'ALTERNATING_WEEKS', 'ALTERNATING_MONTHS', 'SPECIFIC_DAYS');

-- CreateEnum
CREATE TYPE "WeekType" AS ENUM ('EVEN', 'ODD', 'ALL');

-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('LEAVE', 'DUTY', 'SUPERVISION', 'ASSIGNMENT', 'ON_CALL');

-- CreateEnum
CREATE TYPE "RulePriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "RuleSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "RotationStrategy" AS ENUM ('ROUND_ROBIN', 'LEAST_RECENTLY_ASSIGNED', 'BALANCED_LOAD');

-- CreateEnum
CREATE TYPE "LeaveType" AS ENUM ('ANNUAL', 'RECOVERY', 'TRAINING', 'SICK', 'MATERNITY', 'SPECIAL', 'UNPAID', 'OTHER');

-- CreateEnum
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "DayPeriod" AS ENUM ('MORNING', 'AFTERNOON');

-- CreateEnum
CREATE TYPE "TrameType" AS ENUM ('BLOCK', 'CONSULTATION', 'DUTY', 'ON_CALL');

-- CreateEnum
CREATE TYPE "AbsenceType" AS ENUM ('LEAVE', 'ILLNESS', 'TRAINING', 'OTHER');

-- CreateEnum
CREATE TYPE "AbsenceStatus" AS ENUM ('REQUESTED', 'VALIDATED', 'REJECTED');

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
    "dateEntree" TIMESTAMP(3),
    "dateSortie" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "phoneNumber" TEXT,
    "alias" TEXT,
    "workOnMonthType" "WeekType",
    "workPattern" "WorkPatternType" NOT NULL DEFAULT 'FULL_TIME',
    "joursTravaillesSemaineImpaire" JSONB NOT NULL DEFAULT '[]',
    "joursTravaillesSemainePaire" JSONB NOT NULL DEFAULT '[]',
    "displayPreferences" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specialty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "isPediatric" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Specialty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surgeons" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT,
    "phoneNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIF',
    "userId" INTEGER,
    "googleSheetName" TEXT,

    CONSTRAINT "surgeons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preferences" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "surgeonId" INTEGER NOT NULL,

    CONSTRAINT "preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginLog" (
    "id" SERIAL NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "LoginLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanningRule" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "conditionJSON" JSONB NOT NULL,
    "parameterJSON" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanningRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingRoom" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "sectorId" INTEGER NOT NULL,
    "colorCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "supervisionRules" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "RuleType" NOT NULL,
    "priority" "RulePriority" NOT NULL DEFAULT 'MEDIUM',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "configuration" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "updatedBy" INTEGER,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleConflict" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "RuleSeverity" NOT NULL DEFAULT 'MEDIUM',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "resolutionDetails" TEXT,

    CONSTRAINT "RuleConflict_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sector" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leave_type_settings" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isUserSelectable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leave_type_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leaves" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "typeCode" TEXT NOT NULL,
    "type" "LeaveType" NOT NULL,
    "status" "LeaveStatus" NOT NULL,
    "reason" TEXT,
    "comment" TEXT,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvalDate" TIMESTAMP(3),
    "approvedById" INTEGER,
    "countedDays" DOUBLE PRECISION NOT NULL,
    "calculationDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leaves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Duty" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Duty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnCall" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "locationId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnCall_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT,
    "locationId" INTEGER,
    "specialtyId" INTEGER,
    "regularAssignmentId" INTEGER,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatingSector" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL DEFAULT '#000000',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "rules" JSONB NOT NULL DEFAULT '{"maxRoomsPerSupervisor": 2}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatingSector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_calendar_settings" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "defaultView" TEXT NOT NULL DEFAULT 'month',
    "showWeekends" BOOLEAN NOT NULL DEFAULT true,
    "showHolidays" BOOLEAN NOT NULL DEFAULT true,
    "showRejectedLeaves" BOOLEAN NOT NULL DEFAULT false,
    "colorScheme" TEXT NOT NULL DEFAULT 'default',
    "startWeekOn" TEXT NOT NULL DEFAULT 'monday',
    "timeFormat" TEXT NOT NULL DEFAULT '24h',
    "notifications" JSONB NOT NULL DEFAULT '{"email": true, "sound": false, "browser": true}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_calendar_settings_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "team_configurations" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "gardes" JSONB NOT NULL,
    "consultations" JSONB NOT NULL,
    "bloc" JSONB NOT NULL,
    "conges" JSONB NOT NULL,
    "fatigue" JSONB,
    "tempsPartiel" JSONB,
    "iades" JSONB,
    "remplacants" JSONB,
    "preferences" JSONB,
    "statistiques" JSONB,
    "horaires" JSONB,
    "affectations" JSONB,
    "transitions" JSONB,
    "equite" JSONB,
    "alertes" JSONB,
    "algorithme" JSONB,
    "rapports" JSONB,
    "audit" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regular_assignments" (
    "id" SERIAL NOT NULL,
    "trameId" INTEGER,
    "userId" INTEGER,
    "surgeonId" INTEGER,
    "locationId" INTEGER,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "period" "DayPeriod" NOT NULL,
    "weekType" "WeekType" NOT NULL DEFAULT 'ALL',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "assignmentType" TEXT NOT NULL,
    "specialty" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "details" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "regular_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trames" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "TrameType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trames_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planned_absences" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "surgeonId" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "type" "AbsenceType" NOT NULL,
    "typeDetail" TEXT,
    "impactPlanning" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT,
    "status" "AbsenceStatus" NOT NULL,
    "validatedById" INTEGER,
    "notify" BOOLEAN NOT NULL DEFAULT false,
    "importSource" TEXT,
    "documents" JSONB DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "planned_absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_SpecialtyToSurgeon" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_SpecialtyToSurgeon_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_RuleToConflict" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RuleToConflict_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Specialty_name_key" ON "Specialty"("name");

-- CreateIndex
CREATE UNIQUE INDEX "surgeons_email_key" ON "surgeons"("email");

-- CreateIndex
CREATE UNIQUE INDEX "surgeons_userId_key" ON "surgeons"("userId");

-- CreateIndex
CREATE INDEX "LoginLog_userId_idx" ON "LoginLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingRoom_number_key" ON "OperatingRoom"("number");

-- CreateIndex
CREATE INDEX "OperatingRoom_sectorId_idx" ON "OperatingRoom"("sectorId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_name_key" ON "Location"("name");

-- CreateIndex
CREATE UNIQUE INDEX "leave_type_settings_code_key" ON "leave_type_settings"("code");

-- CreateIndex
CREATE INDEX "leaves_userId_idx" ON "leaves"("userId");

-- CreateIndex
CREATE INDEX "leaves_startDate_endDate_idx" ON "leaves"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "leaves_typeCode_idx" ON "leaves"("typeCode");

-- CreateIndex
CREATE INDEX "Duty_userId_idx" ON "Duty"("userId");

-- CreateIndex
CREATE INDEX "Duty_date_idx" ON "Duty"("date");

-- CreateIndex
CREATE INDEX "Duty_locationId_idx" ON "Duty"("locationId");

-- CreateIndex
CREATE INDEX "OnCall_userId_idx" ON "OnCall"("userId");

-- CreateIndex
CREATE INDEX "OnCall_startDate_idx" ON "OnCall"("startDate");

-- CreateIndex
CREATE INDEX "OnCall_endDate_idx" ON "OnCall"("endDate");

-- CreateIndex
CREATE INDEX "OnCall_locationId_idx" ON "OnCall"("locationId");

-- CreateIndex
CREATE INDEX "Assignment_userId_idx" ON "Assignment"("userId");

-- CreateIndex
CREATE INDEX "Assignment_date_idx" ON "Assignment"("date");

-- CreateIndex
CREATE INDEX "Assignment_locationId_idx" ON "Assignment"("locationId");

-- CreateIndex
CREATE INDEX "Assignment_type_idx" ON "Assignment"("type");

-- CreateIndex
CREATE INDEX "Assignment_regularAssignmentId_idx" ON "Assignment"("regularAssignmentId");

-- CreateIndex
CREATE UNIQUE INDEX "OperatingSector_name_key" ON "OperatingSector"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_calendar_settings_userId_key" ON "user_calendar_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalRoleConfig_code_key" ON "ProfessionalRoleConfig"("code");

-- CreateIndex
CREATE INDEX "regular_assignments_userId_idx" ON "regular_assignments"("userId");

-- CreateIndex
CREATE INDEX "regular_assignments_surgeonId_idx" ON "regular_assignments"("surgeonId");

-- CreateIndex
CREATE INDEX "regular_assignments_trameId_idx" ON "regular_assignments"("trameId");

-- CreateIndex
CREATE INDEX "regular_assignments_dayOfWeek_period_weekType_idx" ON "regular_assignments"("dayOfWeek", "period", "weekType");

-- CreateIndex
CREATE INDEX "planned_absences_userId_idx" ON "planned_absences"("userId");

-- CreateIndex
CREATE INDEX "planned_absences_surgeonId_idx" ON "planned_absences"("surgeonId");

-- CreateIndex
CREATE INDEX "planned_absences_startDate_endDate_idx" ON "planned_absences"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "planned_absences_type_status_idx" ON "planned_absences"("type", "status");

-- CreateIndex
CREATE INDEX "_SpecialtyToSurgeon_B_index" ON "_SpecialtyToSurgeon"("B");

-- CreateIndex
CREATE INDEX "_RuleToConflict_B_index" ON "_RuleToConflict"("B");

-- AddForeignKey
ALTER TABLE "surgeons" ADD CONSTRAINT "surgeons_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "surgeons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginLog" ADD CONSTRAINT "LoginLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatingRoom" ADD CONSTRAINT "OperatingRoom_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "OperatingSector"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leaves" ADD CONSTRAINT "leaves_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duty" ADD CONSTRAINT "Duty_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Duty" ADD CONSTRAINT "Duty_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCall" ADD CONSTRAINT "OnCall_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnCall" ADD CONSTRAINT "OnCall_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "Specialty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_regularAssignmentId_fkey" FOREIGN KEY ("regularAssignmentId") REFERENCES "regular_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_calendar_settings" ADD CONSTRAINT "user_calendar_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_assignments" ADD CONSTRAINT "regular_assignments_trameId_fkey" FOREIGN KEY ("trameId") REFERENCES "trames"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_assignments" ADD CONSTRAINT "regular_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_assignments" ADD CONSTRAINT "regular_assignments_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "surgeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regular_assignments" ADD CONSTRAINT "regular_assignments_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_absences" ADD CONSTRAINT "planned_absences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_absences" ADD CONSTRAINT "planned_absences_surgeonId_fkey" FOREIGN KEY ("surgeonId") REFERENCES "surgeons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planned_absences" ADD CONSTRAINT "planned_absences_validatedById_fkey" FOREIGN KEY ("validatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialtyToSurgeon" ADD CONSTRAINT "_SpecialtyToSurgeon_A_fkey" FOREIGN KEY ("A") REFERENCES "Specialty"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SpecialtyToSurgeon" ADD CONSTRAINT "_SpecialtyToSurgeon_B_fkey" FOREIGN KEY ("B") REFERENCES "surgeons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuleToConflict" ADD CONSTRAINT "_RuleToConflict_A_fkey" FOREIGN KEY ("A") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RuleToConflict" ADD CONSTRAINT "_RuleToConflict_B_fkey" FOREIGN KEY ("B") REFERENCES "RuleConflict"("id") ON DELETE CASCADE ON UPDATE CASCADE;
