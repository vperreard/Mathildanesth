-- Indexes pour améliorer les performances des requêtes fréquentes

-- Indexes pour BlocDayPlanning
CREATE INDEX IF NOT EXISTS idx_bloc_day_planning_site_date ON "bloc_day_plannings" ("siteId", "date");
CREATE INDEX IF NOT EXISTS idx_bloc_day_planning_status ON "bloc_day_plannings" ("status");

-- Indexes pour BlocRoomAssignment
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_planning ON "bloc_room_assignments" ("blocDayPlanningId");
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_room_period ON "bloc_room_assignments" ("operatingRoomId", "period");

-- Indexes pour BlocStaffAssignment
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_user ON "bloc_staff_assignments" ("userId");
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_room ON "bloc_staff_assignments" ("blocRoomAssignmentId");

-- Indexes pour Absence
CREATE INDEX IF NOT EXISTS idx_absence_user_dates ON "absences" ("userId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_absence_surgeon_dates ON "absences" ("chirurgienId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_absence_status ON "absences" ("status");

-- Indexes pour Leave
CREATE INDEX IF NOT EXISTS idx_leave_user_dates ON "leaves" ("userId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_leave_status ON "leaves" ("status");
CREATE INDEX IF NOT EXISTS idx_leave_type ON "leaves" ("leaveTypeCode");

-- Indexes pour User
CREATE INDEX IF NOT EXISTS idx_user_login ON "users" ("login");
CREATE INDEX IF NOT EXISTS idx_user_email ON "users" ("email");
CREATE INDEX IF NOT EXISTS idx_user_role ON "users" ("role");
CREATE INDEX IF NOT EXISTS idx_user_professional_role ON "users" ("professionalRole");

-- Indexes pour OperatingRoom
CREATE INDEX IF NOT EXISTS idx_operating_room_site ON "operating_rooms" ("siteId");
CREATE INDEX IF NOT EXISTS idx_operating_room_sector ON "operating_rooms" ("operatingSectorId");

-- Indexes pour BlocTramePlanning
CREATE INDEX IF NOT EXISTS idx_bloc_trame_planning_active ON "bloc_trame_plannings" ("isActive");

-- Indexes pour BlocAffectationHabituelle
CREATE INDEX IF NOT EXISTS idx_bloc_affectation_habituelle_trame ON "bloc_affectations_habituelles" ("blocTramePlanningId");
CREATE INDEX IF NOT EXISTS idx_bloc_affectation_habituelle_day_week ON "bloc_affectations_habituelles" ("jourSemaine", "typeSemaine");

-- Index composé pour les requêtes de planning complexes
CREATE INDEX IF NOT EXISTS idx_planning_complex_query ON "bloc_day_plannings" ("siteId", "date", "status");