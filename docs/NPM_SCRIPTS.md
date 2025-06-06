# Guide des Scripts NPM

Ce document détaille tous les scripts NPM disponibles dans le projet Mathildanesth après optimisation.

**Nombre total de scripts : 58** (réduit de 179 à 58)

## 🚀 Scripts Essentiels

### Développement
- **`npm run dev`** - Lance le serveur de développement Next.js (port 3000)
- **`npm run dev:clean`** - Lance le serveur après nettoyage du cache navigateur
- **`npm run dev:debug`** - Lance le serveur en mode debug avec Node Inspector

### Build et Production
- **`npm run build`** - Compile l'application pour la production
- **`npm start`** - Lance le serveur de production (nécessite un build)
- **`npm run start:prod`** - Build + Start en une commande

### Qualité du Code
- **`npm run lint`** - Vérifie le code avec ESLint
- **`npm run lint:fix`** - Corrige automatiquement les erreurs ESLint
- **`npm run type-check`** - Vérifie les types TypeScript
- **`npm run format`** - Formate le code avec Prettier

## 🧪 Tests

### Tests Unitaires
- **`npm test`** - Lance tous les tests unitaires
- **`npm run test:watch`** - Tests en mode watch
- **`npm run test:coverage`** - Tests avec rapport de couverture
- **`npm run test:critical`** - Tests des modules critiques (auth, congés)
- **`npm run test:changed`** - Tests uniquement sur les fichiers modifiés
- **`npm run test:debug`** - Tests en mode debug

### Tests E2E
- **`npm run e2e`** - Ouvre Cypress en mode interactif
- **`npm run e2e:run`** - Lance tous les tests E2E
- **`npm run e2e:ci`** - Tests E2E pour CI (avec serveur auto)
- **`npm run e2e:debug`** - Cypress avec logs de debug
- **`npm run e2e:record`** - Tests E2E avec enregistrement

## 🗄️ Base de Données

- **`npm run db:migrate`** - Applique les migrations (dev)
- **`npm run db:migrate:prod`** - Applique les migrations (prod)
- **`npm run db:seed`** - Peuple la base avec des données de test
- **`npm run db:reset`** - Reset complet de la base
- **`npm run db:studio`** - Ouvre Prisma Studio (GUI)

### Seeds Spécifiques
- **`npm run seed:surgeons`** - Ajoute les chirurgiens
- **`npm run seed:specialties`** - Ajoute les spécialités
- **`npm run seed:rooms`** - Ajoute les salles d'opération
- **`npm run seed:rules`** - Ajoute les règles métier

## 📊 Performance et Monitoring

- **`npm run perf:analyze`** - Analyse du bundle Next.js
- **`npm run perf:audit`** - Audit de performance complet
- **`npm run perf:monitor`** - Lance le daemon de monitoring

## 🔍 Audits et Qualité

- **`npm run audit`** - Audit global du projet
- **`npm run audit:debt`** - Analyse de la dette technique
- **`npm run quality`** - Lint + Type-check
- **`npm run quality:full`** - Tests critiques + Audit performance
- **`npm run validate`** - Quality + Tests (validation complète)

## 🚚 CI/CD

- **`npm run ci:test`** - Suite de tests pour CI
- **`npm run ci:e2e`** - Tests E2E pour CI
- **`npm run ci:full`** - Pipeline CI complet

## 🛠️ Utilitaires

- **`npm run setup`** - Installation complète (install + migrate + seed)
- **`npm run clean`** - Nettoie .next et node_modules
- **`npm run export`** - Exporte l'état de la base
- **`npm run export:csv`** - Export en format CSV
- **`npm run check:surgeons`** - Vérifie les doublons de chirurgiens
- **`npm run health:check`** - Vérifie la santé de l'application
- **`npm run etape`** - Rapport d'étape du projet

## 🔧 Git Hooks

- **`npm run precommit`** - Hook pre-commit (lint-staged)
- **`npm run prepush`** - Hook pre-push (validation)
- **`npm run prepare`** - Configure Husky

## 📦 Workflows Composites

- **`npm run release`** - Prépare une release (validate + build)
- **`npm run update`** - Met à jour les dépendances et valide
- **`npm run test:security`** - Audit npm + tests critiques

## 📚 Documentation

- **`npm run storybook`** - Lance Storybook (port 6006)

## 🎯 Workflows Recommandés

### Développement Quotidien
```bash
npm run dev          # Lancer le serveur
npm run test:watch   # Tests en continu
npm run lint:fix     # Corriger le code
```

### Avant un Commit
```bash
npm run validate     # Vérification complète
npm run format       # Formater le code
```

### Avant une PR
```bash
npm run ci:full      # Pipeline complet
npm run audit        # Audit global
```

### Nouveau Développeur
```bash
npm run setup        # Installation complète
npm run dev          # Lancer l'app
npm run db:studio    # Explorer la DB
```

### Debug
```bash
npm run dev:debug    # Serveur en debug
npm run test:debug   # Tests en debug
npm run e2e:debug    # E2E en debug
```

## 🔄 Migration depuis l'Ancienne Structure

### Scripts Supprimés/Remplacés

| Ancien Script | Nouveau Script | Raison |
|--------------|----------------|---------|
| `test:bulletproof` | `test` | Unifié |
| `claude:*` | - | Temporairement désactivé |
| `test:manual` | `e2e` | Remplacé par E2E |
| `cypress:open` | `e2e` | Simplifié |
| `monitoring:*` | `perf:monitor` | Unifié |
| `test:autonomous` | - | Expérimental, supprimé |

### Scripts Consolidés

- **Tests Performance** : Tous unifiés sous `perf:*`
- **Tests E2E** : Cypress uniquement, Puppeteer supprimé
- **Database** : Préfixe unifié `db:*`
- **Seeds** : Regroupés sous `seed:*`
- **Exports** : Simplifié à 2 scripts

## 📝 Notes

- Les scripts avec `:` indiquent des catégories (ex: `test:*`, `db:*`)
- Les scripts CI sont optimisés pour la performance
- Tous les scripts de test supportent les patterns de fichiers
- Les scripts de production sont sécurisés avec des validations

## 🆘 Aide

Si vous cherchez un ancien script, consultez [NPM_SCRIPTS_ANALYSIS.md](./NPM_SCRIPTS_ANALYSIS.md) pour la correspondance complète.