-- Performance Indexes for Mathildanesth Database
-- These indexes will significantly improve query performance

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_user_login ON "User"(login);
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);
CREATE INDEX IF NOT EXISTS idx_user_role ON "User"(role);
CREATE INDEX IF NOT EXISTS idx_user_status ON "User"(status);

-- Leave table indexes
CREATE INDEX IF NOT EXISTS idx_leave_user_id ON "Leave"(userId);
CREATE INDEX IF NOT EXISTS idx_leave_status ON "Leave"(status);
CREATE INDEX IF NOT EXISTS idx_leave_dates ON "Leave"(startDate, endDate);
CREATE INDEX IF NOT EXISTS idx_leave_type ON "Leave"(type);
CREATE INDEX IF NOT EXISTS idx_leave_user_status ON "Leave"(userId, status);
CREATE INDEX IF NOT EXISTS idx_leave_date_range ON "Leave"(startDate, endDate, userId);

-- BlocPlanning indexes
CREATE INDEX IF NOT EXISTS idx_bloc_planning_site ON "BlocPlanning"(siteId);
CREATE INDEX IF NOT EXISTS idx_bloc_planning_date ON "BlocPlanning"(date);
CREATE INDEX IF NOT EXISTS idx_bloc_planning_status ON "BlocPlanning"(status);
CREATE INDEX IF NOT EXISTS idx_bloc_planning_week ON "BlocPlanning"(siteId, date, weekType);

-- BlocDayPlanning indexes
CREATE INDEX IF NOT EXISTS idx_bloc_day_planning_bloc ON "BlocDayPlanning"(blocPlanningId);
CREATE INDEX IF NOT EXISTS idx_bloc_day_planning_day ON "BlocDayPlanning"(dayOfWeek, period);

-- BlocRoomAssignment indexes
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_day ON "BlocRoomAssignment"(blocDayPlanningId);
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_room ON "BlocRoomAssignment"(operatingRoomId);
CREATE INDEX IF NOT EXISTS idx_bloc_room_assignment_surgeon ON "BlocRoomAssignment"(surgeonId);

-- BlocStaffAssignment indexes
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_day ON "BlocStaffAssignment"(blocDayPlanningId);
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_user ON "BlocStaffAssignment"(userId);
CREATE INDEX IF NOT EXISTS idx_bloc_staff_assignment_role ON "BlocStaffAssignment"(role);

-- Assignment indexes
CREATE INDEX IF NOT EXISTS idx_assignment_user ON "Assignment"(userId);
CREATE INDEX IF NOT EXISTS idx_assignment_date ON "Assignment"(date);
CREATE INDEX IF NOT EXISTS idx_assignment_user_date ON "Assignment"(userId, date);

-- OperatingRoom indexes
CREATE INDEX IF NOT EXISTS idx_operating_room_sector ON "OperatingRoom"(sectorId);
CREATE INDEX IF NOT EXISTS idx_operating_room_active ON "OperatingRoom"(isActive);
CREATE INDEX IF NOT EXISTS idx_operating_room_display ON "OperatingRoom"(displayOrder);

-- OperatingSector indexes
CREATE INDEX IF NOT EXISTS idx_operating_sector_active ON "OperatingSector"(isActive);
CREATE INDEX IF NOT EXISTS idx_operating_sector_category ON "OperatingSector"(category);
CREATE INDEX IF NOT EXISTS idx_operating_sector_display ON "OperatingSector"(displayOrder);

-- Notification indexes
CREATE INDEX IF NOT EXISTS idx_notification_user ON "Notification"(userId);
CREATE INDEX IF NOT EXISTS idx_notification_read ON "Notification"(isRead);
CREATE INDEX IF NOT EXISTS idx_notification_created ON "Notification"(createdAt);
CREATE INDEX IF NOT EXISTS idx_notification_user_unread ON "Notification"(userId, isRead) WHERE isRead = false;

-- LeaveBalance indexes
CREATE INDEX IF NOT EXISTS idx_leave_balance_user ON "LeaveBalance"(userId);
CREATE INDEX IF NOT EXISTS idx_leave_balance_year ON "LeaveBalance"(year);
CREATE INDEX IF NOT EXISTS idx_leave_balance_type ON "LeaveBalance"(leaveType);
CREATE INDEX IF NOT EXISTS idx_leave_balance_user_year ON "LeaveBalance"(userId, year, leaveType);

-- PublicHoliday indexes (if table exists)
CREATE INDEX IF NOT EXISTS idx_public_holiday_date ON "PublicHoliday"(date);
CREATE INDEX IF NOT EXISTS idx_public_holiday_year ON "PublicHoliday"(EXTRACT(YEAR FROM date));

-- Composite indexes for common join queries
CREATE INDEX IF NOT EXISTS idx_bloc_planning_full ON "BlocPlanning"(siteId, date, status, weekType);
CREATE INDEX IF NOT EXISTS idx_leave_search ON "Leave"(userId, type, status, startDate, endDate);

-- Analyze tables to update statistics
ANALYZE "User";
ANALYZE "Leave";
ANALYZE "BlocPlanning";
ANALYZE "BlocDayPlanning";
ANALYZE "BlocRoomAssignment";
ANALYZE "BlocStaffAssignment";
ANALYZE "Assignment";
ANALYZE "OperatingRoom";
ANALYZE "OperatingSector";
ANALYZE "Notification";
ANALYZE "LeaveBalance";