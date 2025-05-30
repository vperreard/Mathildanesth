# TESTS À CRÉER - MORATOIRE TESTING
*Généré le 30/05/2025*

## STATISTIQUES GLOBALES
- **Fichiers de production**: 1,178 fichiers (.ts/.tsx)
- **Fichiers de tests existants**: 262 fichiers
- **Ratio de couverture**: ~22% (très insuffisant)
- **Objectif**: 80% pour les modules critiques, 70% pour les autres

## MODULES CRITIQUES SANS TESTS (PRIORITÉ URGENTE)

### 🚨 API Routes (src/app/api/) - 0% de couverture
**Priorité: CRITIQUE** - Aucun test pour les routes API principales

#### Authentication & Authorization
- `src/app/api/auth/[...nextauth]/route.ts` - Configuration NextAuth
- `src/app/api/auth/change-password/route.ts` - Changement mot de passe
- `src/app/api/auth/logout/route.ts` - Déconnexion

#### Leaves Management (Module Congés)
- `src/app/api/leaves/route.ts` - CRUD congés principal
- `src/app/api/leaves/[leaveId]/approve/route.ts` - Approbation congés
- `src/app/api/leaves/[leaveId]/reject/route.ts` - Rejet congés
- `src/app/api/leaves/balance/route.ts` - Soldes congés
- `src/app/api/leaves/recurring/route.ts` - Congés récurrents
- `src/app/api/leaves/recurring/preview/route.ts` - Aperçu récurrents
- `src/app/api/leaves/quotas/dashboard/route.ts` - Tableau de bord quotas
- `src/app/api/leaves/quotas/transfers/route.ts` - Transferts quotas

#### Planning & Operating Rooms
- `src/app/api/planning/route.ts` - Planning principal
- `src/app/api/planning/generate/route.ts` - Génération planning
- `src/app/api/operating-rooms/route.ts` - Salles opératoires
- `src/app/api/sectors/route.ts` - Secteurs opératoires
- `src/app/api/bloc-operatoire/affectations/route.ts` - Affectations bloc
- `src/app/api/bloc-operatoire/trames/route.ts` - Trames bloc

#### User & Team Management
- `src/app/api/users/route.ts` - Gestion utilisateurs
- `src/app/api/chirurgiens/route.ts` - Gestion chirurgiens
- `src/app/api/admin/team-configurations/route.ts` - Configuration équipes

#### Rules & Validation
- `src/app/api/admin/rules/v2/route.ts` - Règles v2
- `src/app/api/admin/planning-rules/route.ts` - Règles planning
- `src/app/api/admin/conflict-rules/route.ts` - Règles conflits

### 🔥 Services Critiques Sans Tests

#### Core Services
- `src/services/activityTypeService.ts` - Types d'activités
- `src/services/blocPlanningService.ts` - Planning bloc opératoire  
- `src/services/operatingSectorService.ts` - Secteurs opératoires
- `src/services/rulesConfigService.ts` - Configuration règles
- `src/services/syncService.ts` - Synchronisation données

#### Planning Services
- `src/services/planningOptimizer.ts` - Optimisation planning
- `src/services/templateStatsService.ts` - Statistiques templates
- `src/services/teamService.ts` - Gestion équipes

### 🎯 Components UI Critiques

#### Navigation & Layout
- `src/components/Header.tsx` - En-tête principal
- `src/components/navigation/MedicalNavigation.tsx` - Navigation médicale
- `src/components/navigation/MedicalBreadcrumbs.tsx` - Fil d'Ariane médical

#### Planning Components
- `src/components/bloc-operatoire/components/SecteursOperatoireManager.tsx`
- `src/components/bloc-operatoire/components/ActivityTypesManager.tsx`
- `src/modules/planning/bloc-operatoire/components/BlocPlanningCalendar.tsx`

#### User Interface
- `src/components/user/UserProfile.tsx` - Profil utilisateur
- `src/components/notifications/NotificationBell.tsx` - Notifications
- `src/components/Modal.tsx` - Système modal

### 🏗️ Hooks & Utilities

#### Authentication Hooks
- `src/hooks/useAuth.ts` - Hook authentification
- `src/hooks/useServiceWorker.ts` - Service Worker
- `src/hooks/useTheme.ts` - Gestion thèmes

#### Performance & Metrics
- `src/hooks/usePerformanceMetrics.ts` - Métriques performance
- `src/hooks/usePerformanceTracking.ts` - Suivi performance

#### Planning Hooks
- `src/hooks/useOptimizedPlanning.ts` - Planning optimisé
- `src/hooks/usePlanningValidation.ts` - Validation planning

### 📦 Core Libraries

#### Authentication & Security
- `src/lib/auth-client-utils.ts` - Utils auth client
- `src/lib/auth-server-utils.ts` - Utils auth serveur
- `src/lib/optimized-prisma.ts` - Prisma optimisé
- `src/lib/redis-cache.ts` - Cache Redis

#### API & Database
- `src/lib/apiClient.ts` - Client API
- `src/lib/apiUtils.ts` - Utilitaires API
- `src/lib/database.ts` - Gestion base de données

## MODULES MOYENS SANS TESTS (PRIORITÉ NORMALE)

### Analytics & Reports
- `src/modules/analytics/components/LeaveDashboard.tsx`
- `src/modules/analytics/components/RoomUsageCharts.tsx`
- `src/services/analyticsService.ts`
- `src/services/reportService.ts`

### Templates & Configuration
- `src/modules/templates/services/templateStatsService.ts`
- `src/services/simulationTemplateService.ts`

### Notifications
- `src/modules/notifications/components/NotificationSettingsForm.tsx`
- `src/services/notificationService.ts`

## PAGES APPLICATIVES SANS TESTS

### Admin Pages
- `src/app/admin/page.tsx` - Dashboard admin
- `src/app/admin/conges/page.tsx` - Admin congés
- `src/app/admin/parametres/page.tsx` - Paramètres admin
- `src/app/admin/requetes/page.tsx` - Requêtes admin

### User Pages  
- `src/app/conges/page.tsx` - Page congés utilisateur
- `src/app/planning/equipe/page.tsx` - Planning équipe
- `src/app/parametres/page.tsx` - Paramètres utilisateur

### Specialized Pages
- `src/app/calendrier/page.tsx` - Calendrier principal
- `src/app/statistiques/page.tsx` - Statistiques
- `src/app/profil/page.tsx` - Profil utilisateur

## CONFIGURATION & TYPES

### Configuration Files
- `src/config/api.ts` - Configuration API
- `src/config/themes.ts` - Configuration thèmes
- `src/config/leaveAlertThresholds.ts` - Seuils alertes congés

### Type Definitions
- `src/types/activityTypes.ts` - Types activités
- `src/types/assignment.ts` - Types affectations
- `src/types/duty.ts` - Types gardes
- `src/types/leave.ts` - Types congés
- `src/types/user.ts` - Types utilisateurs

## UTILITAIRES SANS TESTS

### Core Utilities
- `src/utils/navigationConfig.ts` - Configuration navigation
- `src/utils/performanceLogger.ts` - Logger performance
- `src/utils/prefetch.ts` - Système prefetch
- `src/utils/dynamic-imports.ts` - Imports dynamiques

## PLAN D'ACTION RECOMMANDÉ

### Phase 1 - CRITIQUE (À faire immédiatement)
1. **API Routes Authentication** - Tests sécurité/auth
2. **API Routes Leaves** - Tests module congés complet
3. **Services Planning** - Tests logique métier planning
4. **Components Navigation** - Tests navigation médicale

### Phase 2 - IMPORTANT (Semaine suivante)
1. **Hooks Performance** - Tests métriques et suivi
2. **Services Core** - Tests services fondamentaux
3. **Components UI** - Tests composants utilisateur

### Phase 3 - NORMAL (Sprint suivant)
1. **Pages Applications** - Tests pages principales
2. **Analytics & Reports** - Tests rapports et stats
3. **Configuration & Types** - Tests validation types

## NOTES TECHNIQUES

### Patterns de Tests Manquants
- **Tests d'intégration API** - Aucun test bout-en-bout API
- **Tests de sécurité** - Validation autorizations/auth
- **Tests de performance** - Validation métriques réelles
- **Tests UI responsifs** - Tests navigation mobile
- **Tests d'accessibilité** - Validation WCAG

### Infrastructure Requise
- **Mocks Database** - Prisma mocks standardisés
- **Auth Mocks** - NextAuth mocks complets  
- **API Mocks** - MSW handlers pour toutes les routes
- **Performance Mocks** - Mocks métriques et monitoring

### Estimations Temps
- **API Routes**: ~40h (2 semaines)
- **Services Core**: ~30h (1.5 semaines)  
- **Components UI**: ~25h (1 semaine)
- **Hooks & Utils**: ~20h (1 semaine)
- **Pages**: ~15h (3 jours)
- **Config & Types**: ~10h (2 jours)

**TOTAL ESTIMÉ**: ~140h (7 semaines développeur)

---

**⚠️ RAPPEL MORATOIRE**: 
- NE PAS créer ces tests maintenant
- D'abord RÉPARER les tests existants
- Documenter et prioriser seulement
- Focus 100% sur stabilisation infrastructure tests existante