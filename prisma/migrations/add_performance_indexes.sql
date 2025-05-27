-- Indexes pour améliorer les performances des requêtes fréquentes

-- Indexes pour BlocDayPlanning
CREATE INDEX IF NOT EXISTS idx_bloc_day_planning_site_date ON "BlocDayPlanning" ("siteId", "date");
CREATE INDEX IF NOT EXISTS idx_bloc_day_planning_status ON "BlocDayPlanning" ("status");

-- Indexes pour BlocRoomAssignment
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_planning ON "BlocRoomAssignment" ("blocDayPlanningId");
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_room_period ON "BlocRoomAssignment" ("operatingRoomId", "period");

-- Indexes pour BlocStaffAssignment
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_user ON "BlocStaffAssignment" ("userId");
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_room ON "BlocStaffAssignment" ("blocRoomAssignmentId");

-- Indexes pour Absence
CREATE INDEX IF NOT EXISTS idx_absence_user_dates ON "Absence" ("userId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_absence_surgeon_dates ON "Absence" ("chirurgienId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_absence_status ON "Absence" ("status");

-- Indexes pour Leave
CREATE INDEX IF NOT EXISTS idx_leave_user_dates ON "Leave" ("userId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_leave_status ON "Leave" ("status");
CREATE INDEX IF NOT EXISTS idx_leave_type ON "Leave" ("leaveTypeCode");

-- Indexes pour User
CREATE INDEX IF NOT EXISTS idx_user_login ON "User" ("login");
CREATE INDEX IF NOT EXISTS idx_user_email ON "User" ("email");
CREATE INDEX IF NOT EXISTS idx_user_role ON "User" ("role");
CREATE INDEX IF NOT EXISTS idx_user_professional_role ON "User" ("professionalRole");

-- Indexes pour OperatingRoom
CREATE INDEX IF NOT EXISTS idx_operating_room_site ON "OperatingRoom" ("siteId");
CREATE INDEX IF NOT EXISTS idx_operating_room_sector ON "OperatingRoom" ("operatingSectorId");

-- Indexes pour BlocTramePlanning
CREATE INDEX IF NOT EXISTS idx_bloc_trame_planning_active ON "BlocTramePlanning" ("isActive");

-- Indexes pour BlocAffectationHabituelle
CREATE INDEX IF NOT EXISTS idx_bloc_affectation_habituelle_trame ON "BlocAffectationHabituelle" ("blocTramePlanningId");
CREATE INDEX IF NOT EXISTS idx_bloc_affectation_habituelle_day_week ON "BlocAffectationHabituelle" ("jourSemaine", "typeSemaine");

-- Index composé pour les requêtes de planning complexes
CREATE INDEX IF NOT EXISTS idx_planning_complex_query ON "BlocDayPlanning" ("siteId", "date", "status");