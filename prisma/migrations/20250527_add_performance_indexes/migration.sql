-- Performance Indexes Migration

-- User table indexes
CREATE INDEX "idx_user_login" ON "User"("login");
CREATE INDEX "idx_user_email" ON "User"("email");
CREATE INDEX "idx_user_role" ON "User"("role");
CREATE INDEX "idx_user_status" ON "User"("status");

-- Leave table indexes
CREATE INDEX "idx_leave_user_id" ON "Leave"("userId");
CREATE INDEX "idx_leave_status" ON "Leave"("status");
CREATE INDEX "idx_leave_dates" ON "Leave"("startDate", "endDate");
CREATE INDEX "idx_leave_type" ON "Leave"("type");
CREATE INDEX "idx_leave_user_status" ON "Leave"("userId", "status");
CREATE INDEX "idx_leave_date_range" ON "Leave"("startDate", "endDate", "userId");

-- BlocPlanning indexes
CREATE INDEX "idx_bloc_planning_site" ON "BlocPlanning"("siteId");
CREATE INDEX "idx_bloc_planning_date" ON "BlocPlanning"("date");
CREATE INDEX "idx_bloc_planning_status" ON "BlocPlanning"("status");
CREATE INDEX "idx_bloc_planning_week" ON "BlocPlanning"("siteId", "date", "weekType");

-- BlocDayPlanning indexes
CREATE INDEX "idx_bloc_day_planning_bloc" ON "BlocDayPlanning"("blocPlanningId");
CREATE INDEX "idx_bloc_day_planning_day" ON "BlocDayPlanning"("dayOfWeek", "period");

-- BlocRoomAssignment indexes
CREATE INDEX "idx_bloc_room_assignment_day" ON "BlocRoomAssignment"("blocDayPlanningId");
CREATE INDEX "idx_bloc_room_assignment_room" ON "BlocRoomAssignment"("operatingRoomId");
CREATE INDEX "idx_bloc_room_assignment_surgeon" ON "BlocRoomAssignment"("surgeonId");

-- BlocStaffAssignment indexes
CREATE INDEX "idx_bloc_staff_assignment_day" ON "BlocStaffAssignment"("blocDayPlanningId");
CREATE INDEX "idx_bloc_staff_assignment_user" ON "BlocStaffAssignment"("userId");
CREATE INDEX "idx_bloc_staff_assignment_role" ON "BlocStaffAssignment"("role");

-- Assignment indexes
CREATE INDEX "idx_assignment_user" ON "Assignment"("userId");
CREATE INDEX "idx_assignment_date" ON "Assignment"("date");
CREATE INDEX "idx_assignment_user_date" ON "Assignment"("userId", "date");

-- OperatingRoom indexes
CREATE INDEX "idx_operating_room_sector" ON "OperatingRoom"("sectorId");
CREATE INDEX "idx_operating_room_active" ON "OperatingRoom"("isActive");
CREATE INDEX "idx_operating_room_display" ON "OperatingRoom"("displayOrder");

-- OperatingSector indexes
CREATE INDEX "idx_operating_sector_active" ON "OperatingSector"("isActive");
CREATE INDEX "idx_operating_sector_category" ON "OperatingSector"("category");
CREATE INDEX "idx_operating_sector_display" ON "OperatingSector"("displayOrder");

-- Notification indexes
CREATE INDEX "idx_notification_user" ON "Notification"("userId");
CREATE INDEX "idx_notification_read" ON "Notification"("isRead");
CREATE INDEX "idx_notification_created" ON "Notification"("createdAt");
CREATE INDEX "idx_notification_user_unread" ON "Notification"("userId", "isRead");

-- LeaveBalance indexes
CREATE INDEX "idx_leave_balance_user" ON "LeaveBalance"("userId");
CREATE INDEX "idx_leave_balance_year" ON "LeaveBalance"("year");
CREATE INDEX "idx_leave_balance_type" ON "LeaveBalance"("leaveType");
CREATE INDEX "idx_leave_balance_user_year" ON "LeaveBalance"("userId", "year", "leaveType");