-- Indexes pour améliorer les performances des requêtes fréquentes
-- Script adapté aux tables existantes

-- Indexes pour Leave
CREATE INDEX IF NOT EXISTS idx_leave_user_dates ON public."Leave" ("userId", "startDate", "endDate");
CREATE INDEX IF NOT EXISTS idx_leave_status ON public."Leave" ("status");
CREATE INDEX IF NOT EXISTS idx_leave_type ON public."Leave" ("leaveTypeCode");

-- Indexes pour User
CREATE INDEX IF NOT EXISTS idx_user_login ON public."User" ("login");
CREATE INDEX IF NOT EXISTS idx_user_email ON public."User" ("email");
CREATE INDEX IF NOT EXISTS idx_user_role ON public."User" ("role");
CREATE INDEX IF NOT EXISTS idx_user_professional_role ON public."User" ("professionalRole");

-- Indexes pour OperatingRoom
CREATE INDEX IF NOT EXISTS idx_operating_room_site ON public."OperatingRoom" ("siteId");
CREATE INDEX IF NOT EXISTS idx_operating_room_sector ON public."OperatingRoom" ("operatingSectorId");

-- Indexes pour Assignment (si utilisé pour le planning)
CREATE INDEX IF NOT EXISTS idx_assignment_user_date ON public."Assignment" ("userId", "date");
CREATE INDEX IF NOT EXISTS idx_assignment_operating_room ON public."Assignment" ("operatingRoomId", "date");

-- Indexes pour PlannedAbsence
CREATE INDEX IF NOT EXISTS idx_planned_absence_user ON public."PlannedAbsence" ("userId", "date");

-- Indexes pour Site
CREATE INDEX IF NOT EXISTS idx_site_active ON public."Site" ("isActive");

-- Indexes pour AuditLog (pour performance monitoring)
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_date ON public."AuditLog" ("entityType", "createdAt");
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public."AuditLog" ("userId");

-- Indexes pour Notification
CREATE INDEX IF NOT EXISTS idx_notification_user_read ON public."Notification" ("userId", "isRead");
CREATE INDEX IF NOT EXISTS idx_notification_created ON public."Notification" ("createdAt");