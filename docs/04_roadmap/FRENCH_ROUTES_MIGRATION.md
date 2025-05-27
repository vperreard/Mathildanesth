# Plan de Migration vers des Routes Françaises

## Vue d'ensemble

Ce document présente le plan complet de migration des routes anglaises vers des routes françaises pour l'application Mathildanesth.

## Tableau de Mapping des Routes

### Routes de Pages (src/app/)

| Route Actuelle | Route Française | État | Priorité |
|----------------|-----------------|------|----------|
| `/conges` | `/conges` | À migrer | Haute |
| `/conges/nouveau` | `/conges/nouveau` | À migrer | Haute |
| `/conges/recurrents` | `/conges/recurrents` | À migrer | Moyenne |
| `/conges/quotas` | `/conges/quotas` | À migrer | Moyenne |
| `/conges/quotas/avances` | `/conges/quotas/avances` | À migrer | Basse |
| `/calendrier` | `/calendrier` | À migrer | Haute |
| `/calendrier/parametres` | `/calendrier/parametres` | À migrer | Moyenne |
| `/planning` | `/planning` | ✓ Déjà en français | - |
| `/planning/validation` | `/planning/validation` | ✓ Déjà en français | - |
| `/notifications` | `/notifications` | ✓ Déjà en français | - |
| `/profil` | `/profil` | ✓ Déjà en français | - |
| `/auth/connexion` | `/auth/connexion` | À migrer | Haute |
| `/admin/parametres` | `/admin/parametres` | À migrer | Moyenne |
| `/admin/jours-feries` | `/admin/jours-feries` | À migrer | Moyenne |
| `/admin/conges` | `/admin/conges` | À migrer | Moyenne |
| `/requetes` | `/demandes` | À considérer | Basse |
| `/parametres` | `/parametres` | ✓ Déjà en français | - |
| `/utilisateurs` | `/utilisateurs` | ✓ Déjà en français | - |
| `/bloc-operatoire` | `/bloc-operatoire` | ✓ Déjà en français | - |
| `/consultations` | `/consultations` | ✓ Déjà en français | - |
| `/statistiques` | `/statistiques` | ✓ Déjà en français | - |

### Routes API (src/app/api/)

| Route API Actuelle | Route API Française | État |
|--------------------|---------------------|------|
| `/api/conges` | `/api/conges` | À migrer |
| `/api/utilisateurs` | `/api/utilisateurs` | À migrer |
| `/api/affectations` | `/api/affectations` | À migrer |
| `/api/affectations/echange` | `/api/affectations/echange` | À migrer |
| `/api/jours-feries` | `/api/jours-feries` | À migrer |
| `/api/absences` | `/api/absences` | ✓ Déjà en français |
| `/api/auth/connexion` | `/api/auth/connexion` | À migrer |
| `/api/auth/deconnexion` | `/api/auth/deconnexion` | À migrer |

## Fichiers Impactés par Route

### 1. Migration `/conges` → `/conges`

**Fichiers avec références directes:**
- `src/app/conges/page.tsx:91` - router.replace('/conges')
- `src/app/conges/recurrents/page.tsx:41` - router.push('/conges')
- `src/integration/navigation.test.tsx:10` - href="/conges"
- `src/utils/prefetch.ts:91` - Route à précharger
- `src/utils/navigationConfig.ts:10` - Configuration navigation
- `src/modules/conges/components/LeaveHeader.tsx:23` - Breadcrumb
- `src/modules/conges/services/leaveService.ts:45` - BASE_URL
- `src/modules/calendrier/components/CollectiveCalendar.tsx:245` - href="/conges/nouveau"

**Dossiers à renommer:**
- `src/app/conges/` → `src/app/conges/`
- Tous les sous-dossiers (new, recurring, quotas)

### 2. Migration `/calendrier` → `/calendrier`

**Fichiers avec références directes:**
- `src/integration/navigation.test.tsx:11` - href="/calendrier"
- `src/components/Footer.tsx:39` - Link href="/calendrier"
- `src/utils/prefetch.ts:89` - Route à précharger
- `src/utils/navigationConfig.ts:9` - Configuration navigation

**Dossiers à renommer:**
- `src/app/calendrier/` → `src/app/calendrier/`
- Tous les sous-dossiers (settings, context, styles, components, hooks)

### 3. Migration `/auth/connexion` → `/auth/connexion`

**Fichiers potentiellement impactés:**
- Tous les fichiers d'authentification
- Tests E2E (Cypress et Puppeteer)
- Middlewares de redirection
- Configuration NextAuth

### 4. Migration API Routes

**Fichiers de services à mettre à jour:**
- Services appelant `/api/conges`
- Services appelant `/api/utilisateurs`
- Services appelant `/api/affectations`
- Configuration des endpoints API

## Ordre de Migration Recommandé

### Phase 1 - Routes Critiques (Semaine 1)
1. **Préparation**
   - Créer les redirections 301 pour l'ancien vers le nouveau
   - Mettre à jour la configuration Next.js

2. **Migration `/conges` → `/conges`**
   - Impact le plus large
   - Module critique pour les utilisateurs
   - Inclut les sous-routes

3. **Migration `/calendrier` → `/calendrier`**
   - Deuxième module le plus utilisé
   - Moins de sous-routes

### Phase 2 - Routes d'Authentification (Semaine 2)
1. **Migration `/auth/connexion` → `/auth/connexion`**
   - Impact sur tous les utilisateurs
   - Nécessite tests approfondis

2. **Migration API `/api/auth/*`**
   - Coordination avec le frontend

### Phase 3 - Routes API (Semaine 3)
1. **Migration progressive des API**
   - `/api/conges` → `/api/conges`
   - `/api/utilisateurs` → `/api/utilisateurs`
   - `/api/affectations` → `/api/affectations`

2. **Maintenir les anciennes routes avec deprecation warnings**

### Phase 4 - Routes Admin et Secondaires (Semaine 4)
1. **Routes admin**
   - `/admin/parametres` → `/admin/parametres`
   - `/admin/jours-feries` → `/admin/jours-feries`

## Stratégie de Migration

### 1. Redirections
```typescript
// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: '/conges',
        destination: '/conges',
        permanent: true,
      },
      {
        source: '/conges/:path*',
        destination: '/conges/:path*',
        permanent: true,
      },
      {
        source: '/calendrier',
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