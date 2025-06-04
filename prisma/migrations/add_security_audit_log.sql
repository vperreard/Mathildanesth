-- Create AuditSecurityLog table for security events tracking
CREATE TABLE IF NOT EXISTS "AuditSecurityLog" (
    "id" SERIAL PRIMARY KEY,
    "userId" INTEGER,
    "action" VARCHAR(255) NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "severity" VARCHAR(50) NOT NULL DEFAULT 'INFO',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" VARCHAR(255),
    "userAgent" TEXT,
    "success" BOOLEAN DEFAULT true,
    
    CONSTRAINT "AuditSecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes for performance
CREATE INDEX "AuditSecurityLog_userId_idx" ON "AuditSecurityLog"("userId");
CREATE INDEX "AuditSecurityLog_action_idx" ON "AuditSecurityLog"("action");
CREATE INDEX "AuditSecurityLog_timestamp_idx" ON "AuditSecurityLog"("timestamp");
CREATE INDEX "AuditSecurityLog_severity_idx" ON "AuditSecurityLog"("severity");

-- Add permissions column to User table if not exists
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];