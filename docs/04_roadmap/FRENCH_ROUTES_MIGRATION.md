# Plan de Migration vers des Routes Françaises

## Vue d'ensemble

Ce document présente le plan complet de migration des routes anglaises vers des routes françaises pour l'application Mathildanesth.

## Tableau de Mapping des Routes

### Routes de Pages (src/app/)

| Route Actuelle | Route Française | État | Priorité |
|----------------|-----------------|------|----------|
| `/leaves` | `/conges` | À migrer | Haute |
| `/leaves/new` | `/conges/nouveau` | À migrer | Haute |
| `/leaves/recurring` | `/conges/recurrents` | À migrer | Moyenne |
| `/leaves/quotas` | `/conges/quotas` | À migrer | Moyenne |
| `/leaves/quotas/advanced` | `/conges/quotas/avances` | À migrer | Basse |
| `/calendar` | `/calendrier` | À migrer | Haute |
| `/calendar/settings` | `/calendrier/parametres` | À migrer | Moyenne |
| `/planning` | `/planning` | ✓ Déjà en français | - |
| `/planning/validation` | `/planning/validation` | ✓ Déjà en français | - |
| `/notifications` | `/notifications` | ✓ Déjà en français | - |
| `/profil` | `/profil` | ✓ Déjà en français | - |
| `/auth/login` | `/auth/connexion` | À migrer | Haute |
| `/admin/settings` | `/admin/parametres` | À migrer | Moyenne |
| `/admin/holidays` | `/admin/jours-feries` | À migrer | Moyenne |
| `/admin/leaves` | `/admin/conges` | À migrer | Moyenne |
| `/requetes` | `/demandes` | À considérer | Basse |
| `/parametres` | `/parametres` | ✓ Déjà en français | - |
| `/utilisateurs` | `/utilisateurs` | ✓ Déjà en français | - |
| `/bloc-operatoire` | `/bloc-operatoire` | ✓ Déjà en français | - |
| `/consultations` | `/consultations` | ✓ Déjà en français | - |
| `/statistiques` | `/statistiques` | ✓ Déjà en français | - |

### Routes API (src/app/api/)

| Route API Actuelle | Route API Française | État |
|--------------------|---------------------|------|
| `/api/leaves` | `/api/conges` | À migrer |
| `/api/users` | `/api/utilisateurs` | À migrer |
| `/api/assignments` | `/api/affectations` | À migrer |
| `/api/assignments/swap` | `/api/affectations/echange` | À migrer |
| `/api/public-holidays` | `/api/jours-feries` | À migrer |
| `/api/absences` | `/api/absences` | ✓ Déjà en français |
| `/api/auth/login` | `/api/auth/connexion` | À migrer |
| `/api/auth/logout` | `/api/auth/deconnexion` | À migrer |

## Fichiers Impactés par Route

### 1. Migration `/leaves` → `/conges`

**Fichiers avec références directes:**
- `src/app/leaves/page.tsx:91` - router.replace('/leaves')
- `src/app/leaves/recurring/page.tsx:41` - router.push('/leaves')
- `src/integration/navigation.test.tsx:10` - href="/leaves"
- `src/utils/prefetch.ts:91` - Route à précharger
- `src/utils/navigationConfig.ts:10` - Configuration navigation
- `src/modules/leaves/components/LeaveHeader.tsx:23` - Breadcrumb
- `src/modules/leaves/services/leaveService.ts:45` - BASE_URL
- `src/modules/calendar/components/CollectiveCalendar.tsx:245` - href="/leaves/new"

**Dossiers à renommer:**
- `src/app/leaves/` → `src/app/conges/`
- Tous les sous-dossiers (new, recurring, quotas)

### 2. Migration `/calendar` → `/calendrier`

**Fichiers avec références directes:**
- `src/integration/navigation.test.tsx:11` - href="/calendar"
- `src/components/Footer.tsx:39` - Link href="/calendar"
- `src/utils/prefetch.ts:89` - Route à précharger
- `src/utils/navigationConfig.ts:9` - Configuration navigation

**Dossiers à renommer:**
- `src/app/calendar/` → `src/app/calendrier/`
- Tous les sous-dossiers (settings, context, styles, components, hooks)

### 3. Migration `/auth/login` → `/auth/connexion`

**Fichiers potentiellement impactés:**
- Tous les fichiers d'authentification
- Tests E2E (Cypress et Puppeteer)
- Middlewares de redirection
- Configuration NextAuth

### 4. Migration API Routes

**Fichiers de services à mettre à jour:**
- Services appelant `/api/leaves`
- Services appelant `/api/users`
- Services appelant `/api/assignments`
- Configuration des endpoints API

## Ordre de Migration Recommandé

### Phase 1 - Routes Critiques (Semaine 1)
1. **Préparation**
   - Créer les redirections 301 pour l'ancien vers le nouveau
   - Mettre à jour la configuration Next.js

2. **Migration `/leaves` → `/conges`**
   - Impact le plus large
   - Module critique pour les utilisateurs
   - Inclut les sous-routes

3. **Migration `/calendar` → `/calendrier`**
   - Deuxième module le plus utilisé
   - Moins de sous-routes

### Phase 2 - Routes d'Authentification (Semaine 2)
1. **Migration `/auth/login` → `/auth/connexion`**
   - Impact sur tous les utilisateurs
   - Nécessite tests approfondis

2. **Migration API `/api/auth/*`**
   - Coordination avec le frontend

### Phase 3 - Routes API (Semaine 3)
1. **Migration progressive des API**
   - `/api/leaves` → `/api/conges`
   - `/api/users` → `/api/utilisateurs`
   - `/api/assignments` → `/api/affectations`

2. **Maintenir les anciennes routes avec deprecation warnings**

### Phase 4 - Routes Admin et Secondaires (Semaine 4)
1. **Routes admin**
   - `/admin/settings` → `/admin/parametres`
   - `/admin/holidays` → `/admin/jours-feries`

## Stratégie de Migration

### 1. Redirections
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/leaves',
        destination: '/conges',
        permanent: true,
      },
      {
        source: '/leaves/:path*',
        destination: '/conges/:path*',
        permanent: true,
      },
      {
        source: '/calendar',
        destination: '/calendrier',
        permanent: true,
      },
      // ... autres redirections
    ]
  },
}
```

### 2. Mise à jour Progressive
- Maintenir les anciennes routes pendant 1-2 mois
- Logger l'utilisation des anciennes routes
- Notifier les utilisateurs des changements

### 3. Tests
- Mettre à jour tous les tests E2E
- Tester les redirections
- Vérifier les bookmarks des utilisateurs

## Traductions UI Manquantes

### Navigation
- "Leaves" → "Congés" ✓
- "Calendar" → "Calendrier" ✓
- "Settings" → "Paramètres"
- "Users" → "Utilisateurs"
- "Assignments" → "Affectations"

### Boutons et Actions
- "Create Leave Request" → "Créer une demande de congé"
- "View Calendar" → "Voir le calendrier"
- "Manage Users" → "Gérer les utilisateurs"

### Messages
- Routes de succès/erreur à traduire
- Notifications à adapter

## Risques et Mitigation

### Risques Identifiés
1. **Bookmarks utilisateurs** - Les anciennes URLs ne fonctionneront plus
   - Mitigation: Redirections 301 permanentes

2. **SEO** - Perte potentielle de référencement
   - Mitigation: Redirections et sitemap mis à jour

3. **Intégrations externes** - APIs appelées par des systèmes tiers
   - Mitigation: Période de dépréciation avec double routing

4. **Cache navigateur** - Anciennes routes en cache
   - Mitigation: Headers de cache appropriés

## Métriques de Succès

- 100% des routes anglaises migrées
- 0 liens cassés après migration
- Temps de réponse identique ou meilleur
- Aucune interruption de service
- Adoption utilisateur > 95% en 1 mois

## Script de Migration

Un script automatisé sera créé pour effectuer les remplacements nécessaires : `scripts/migrate-to-french-routes.ts`