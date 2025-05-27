# Rapport de Migration vers Routes Françaises

## 📋 Résumé Exécutif

J'ai créé un plan complet de migration des routes anglaises vers des routes françaises pour l'application Mathildanesth, incluant :

1. **Documentation complète** : `docs/04_roadmap/FRENCH_ROUTES_MIGRATION.md`
2. **Script de migration automatique** : `scripts/migrate-to-french-routes.ts`
3. **Guide de traduction UI** : `TRADUCTIONS_UI_EN_FR.md`

## 🎯 Routes à Migrer

### Routes Principales Identifiées

| Route Actuelle | Route Française | Impact |
|----------------|-----------------|--------|
| `/leaves` | `/conges` | Élevé (8+ fichiers) |
| `/calendar` | `/calendrier` | Élevé (4+ fichiers) |
| `/auth/login` | `/auth/connexion` | Critique |
| `/admin/settings` | `/admin/parametres` | Moyen |
| `/admin/holidays` | `/admin/jours-feries` | Moyen |

### Routes API

| API Actuelle | API Française |
|--------------|---------------|
| `/api/leaves` | `/api/conges` |
| `/api/users` | `/api/utilisateurs` |
| `/api/assignments` | `/api/affectations` |
| `/api/public-holidays` | `/api/jours-feries` |

## 🛠️ Script de Migration

Le script `scripts/migrate-to-french-routes.ts` offre :

### Fonctionnalités
- **Mode Dry Run** : Test sans modification (par défaut)
- **Mode Exécution** : Application réelle avec `--execute`
- **Rapport détaillé** : Liste tous les changements effectués
- **Redirections automatiques** : Configuration Next.js générée

### Utilisation
```bash
# Mode test (dry run)
npx tsx scripts/migrate-to-french-routes.ts

# Mode exécution
npx tsx scripts/migrate-to-french-routes.ts --execute
```

### Ce que fait le script
1. **Remplace les routes** dans tous les fichiers (.ts, .tsx, .js, .jsx, .json, .md)
2. **Renomme les dossiers** (ex: `src/app/leaves` → `src/app/conges`)
3. **Crée les redirections** 301 dans next.config.js
4. **Génère un rapport** complet des modifications

## 📝 Traductions UI

Le fichier `TRADUCTIONS_UI_EN_FR.md` contient :
- **300+ termes** traduits
- **17 catégories** organisées
- **Contexte** pour chaque traduction
- **Termes spécifiques** à Mathildanesth (MAR, IADE, etc.)

## 🚀 Plan de Déploiement Recommandé

### Phase 1 (Semaine 1) - Routes Critiques
1. Activer les redirections dans next.config.js
2. Migrer `/leaves` → `/conges`
3. Migrer `/calendar` → `/calendrier`
4. Tester avec les utilisateurs clés

### Phase 2 (Semaine 2) - Authentification
1. Migrer `/auth/login` → `/auth/connexion`
2. Mettre à jour tous les liens de déconnexion
3. Tester les workflows d'authentification

### Phase 3 (Semaine 3) - API
1. Dupliquer les routes API (ancien + nouveau)
2. Migrer progressivement les clients
3. Ajouter des deprecation warnings

### Phase 4 (Semaine 4) - Finalisation
1. Migrer les routes admin restantes
2. Supprimer les anciennes routes API
3. Mettre à jour la documentation

## ⚠️ Points d'Attention

### Tests E2E à Mettre à Jour
- Tests Cypress : Toutes les références aux anciennes routes
- Tests Puppeteer : URLs dans `tests/e2e/`
- Tests d'intégration : Appels API

### Fichiers Configuration
- `src/utils/navigationConfig.ts` : Menu principal
- `src/config/api.ts` : Endpoints API
- `.env` files : Variables d'environnement

### Impact Utilisateur
- **Bookmarks** : Seront redirigés automatiquement
- **Liens partagés** : Fonctionneront avec redirections 301
- **SEO** : Impact minimal avec redirections permanentes

## ✅ Prochaines Étapes

1. **Révision** : Faire réviser le plan par l'équipe
2. **Test** : Exécuter le script en mode dry-run
3. **Backup** : Sauvegarder avant migration
4. **Exécution** : Appliquer les changements
5. **Validation** : Tester toutes les routes
6. **Communication** : Informer les utilisateurs

## 📊 Métriques Estimées

- **Fichiers impactés** : ~50-70 fichiers
- **Routes à migrer** : 15 routes principales
- **Temps de migration** : 2-3 heures avec le script
- **Temps de test** : 1 journée complète
- **Période de transition** : 1-2 mois avec redirections

---

**Note** : Le script de migration est prêt à l'emploi. Il est recommandé de commencer par un dry-run pour valider les changements avant l'exécution réelle.