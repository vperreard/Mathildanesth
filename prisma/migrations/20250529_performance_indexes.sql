-- Migration pour optimisations performance
-- Ajout des indexes manquants identifiés dans l'audit

-- Index sur User.email (identifié comme manquant)
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- Indexes pour requêtes fréquentes sur les affectations
CREATE INDEX IF NOT EXISTS "Assignment_userId_date_idx" ON "Assignment"("userId", "date");
CREATE INDEX IF NOT EXISTS "Assignment_siteId_date_idx" ON "Assignment"("siteId", "date");
CREATE INDEX IF NOT EXISTS "Assignment_date_idx" ON "Assignment"("date");
CREATE INDEX IF NOT EXISTS "Assignment_status_idx" ON "Assignment"("status");

-- Indexes pour requêtes de congés
CREATE INDEX IF NOT EXISTS "Leave_userId_status_idx" ON "Leave"("userId", "status");
CREATE INDEX IF NOT EXISTS "Leave_startDate_endDate_idx" ON "Leave"("startDate", "endDate");
CREATE INDEX IF NOT EXISTS "Leave_status_createdAt_idx" ON "Leave"("status", "createdAt");

-- Indexes pour authentification et sessions
CREATE INDEX IF NOT EXISTS "Session_userId_idx" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "Session_expires_idx" ON "Session"("expires");

-- Indexes pour audit et logs
CREATE INDEX IF NOT EXISTS "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- Indexes pour notifications
CREATE INDEX IF NOT EXISTS "Notification_userId_read_idx" ON "Notification"("userId", "read");
CREATE INDEX IF NOT EXISTS "Notification_createdAt_idx" ON "Notification"("createdAt");

-- Indexes pour violations de règles
CREATE INDEX IF NOT EXISTS "RuleViolation_resolved_createdAt_idx" ON "RuleViolation"("resolved", "createdAt");
CREATE INDEX IF NOT EXISTS "RuleViolation_severity_idx" ON "RuleViolation"("severity");

-- Indexes composites pour requêtes complexes de planning
CREATE INDEX IF NOT EXISTS "Assignment_complex_query_idx" 
ON "Assignment"("siteId", "date", "userId", "status");

-- Index partiel pour congés actifs seulement
CREATE INDEX IF NOT EXISTS "Leave_active_idx" 
ON "Leave"("userId", "startDate", "endDate") 
WHERE "status" IN ('APPROVED', 'PENDING');

-- Index pour recherche full-text des utilisateurs
CREATE INDEX IF NOT EXISTS "User_search_idx" 
ON "User"("nom", "prenom", "email") 
WHERE "actif" = true;

-- Indexes pour optimiser les jointures fréquentes
CREATE INDEX IF NOT EXISTS "UserSite_userId_idx" ON "UserSite"("userId");
CREATE INDEX IF NOT EXISTS "UserSite_siteId_idx" ON "UserSite"("siteId");

-- Optimisation des contraintes uniques composites
CREATE UNIQUE INDEX IF NOT EXISTS "Assignment_unique_user_date_room_idx" 
ON "Assignment"("userId", "date", "roomId") 
WHERE "status" = 'CONFIRMED';

-- Statistiques pour l'optimiseur de requêtes (PostgreSQL)
-- Ces commandes ne s'exécutent que si on est sur PostgreSQL
DO $$
BEGIN
    -- Mettre à jour les statistiques sur les tables importantes
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User') THEN
        ANALYZE "User";
        ANALYZE "Assignment";
        ANALYZE "Leave";
        ANALYZE "Site";
    END IF;
END $$;