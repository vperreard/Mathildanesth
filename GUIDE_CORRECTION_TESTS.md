# 🔧 GUIDE PRATIQUE - CORRIGER LES TESTS AVEC L'INFRASTRUCTURE BULLETPROOF

## 🎯 **UTILISATION RAPIDE (TL;DR)**

```bash
# 1. Corriger automatiquement les problèmes détectés
node scripts/fix-tests-workflow.js fix-all

# 2. Démarrer l'environnement de test
./scripts/start-test-environment.sh

# 3. Lancer les tests
npm run cypress:run --spec "cypress/e2e/auth/authentication.spec.ts"
```

## 🔍 **DIAGNOSTIC AUTOMATIQUE DES PROBLÈMES**

### 1. Identifier les erreurs courantes

```bash
# Analyser les erreurs de test
npm run cypress:run --headless 2>&1 | grep -E "(Error|Failed|Timeout)"

# Monitoring performance en parallèle
npm run performance:budget:watch
```

### 2. Types d'erreurs détectées automatiquement

| ❌ **Erreur** | 🔍 **Symptôme** | ✅ **Correction Auto** |
|---------------|-----------------|------------------------|
| **Serveur non démarré** | `ESOCKETTIMEDOUT` | `./scripts/start-test-environment.sh` |
| **Mauvais port** | `localhost:3001` | Corrigé → `localhost:3000` |
| **Pages manquantes** | `404 Page not found` | Pages créées automatiquement |
| **Sélecteurs obsolètes** | `Timed out retrying` | Migration vers `data-cy` |
| **APIs manquantes** | `Request failed` | Routes API créées |

## 🚀 **WORKFLOW DE CORRECTION STEP-BY-STEP**

### Étape 1: Diagnostic Rapide

```bash
# Vérifier l'état global de l'infrastructure
node scripts/bulletproof-verification.js

# Résultat attendu: 🎉 SCORE GLOBAL: 100%
```

### Étape 2: Corrections Automatiques

```bash
# Correction automatique de tous les problèmes détectés
node scripts/fix-tests-workflow.js fix-all

# OU corrections individuelles:
node scripts/fix-tests-workflow.js fix-port      # Corriger le port
node scripts/fix-tests-workflow.js fix-pages     # Créer pages manquantes  
node scripts/fix-tests-workflow.js fix-selectors # Mettre à jour sélecteurs
```

### Étape 3: Démarrage Environnement

```bash
# Démarrer le serveur pour les tests
./scripts/start-test-environment.sh

# Avec seeding de la base de données
./scripts/start-test-environment.sh --seed
```

### Étape 4: Test et Validation

```bash
# Test spécifique d'authentification
npm run cypress:run --spec "cypress/e2e/auth/authentication.spec.ts"

# Test de performance
npm run performance:budget

# Tests complets
npm run cypress:e2e
```

## 🎯 **CORRECTIONS SPÉCIFIQUES PAR TYPE D'ERREUR**

### 🔴 **Erreur: Server Connection**

**Symptôme:** `ESOCKETTIMEDOUT`, `failed trying to load`

**Solution:**
```bash
# 1. Vérifier que le serveur tourne
curl http://localhost:3000

# 2. Si non, démarrer avec notre script
./scripts/start-test-environment.sh

# 3. Vérifier la configuration Cypress
grep "baseUrl" cypress.config.js  # Doit être localhost:3000
```

### 🟡 **Erreur: Missing Pages**

**Symptôme:** `404`, `Page not found`, `Cannot GET`

**Solution automatique:**
```bash
# Créer toutes les pages manquantes
node scripts/fix-tests-workflow.js fix-pages
```

**Solution manuelle:**
```bash
# Créer la page spécifique manquante
mkdir -p src/app/auth/reset-password
echo 'export default function Page() { return <div>Reset Password</div>; }' > src/app/auth/reset-password/page.tsx
```

### 🟠 **Erreur: Selectors Not Found**

**Symptôme:** `Timed out retrying`, `expected to find element`

**Solution:**
```bash
# Mise à jour automatique vers data-cy
node scripts/fix-tests-workflow.js fix-selectors
```

**Ajout manuel des attributs data-cy:**
```tsx
// Dans vos composants React
<input data-cy="email-input" type="email" />
<button data-cy="login-submit">Connexion</button>
```

### 🔵 **Erreur: API Routes Missing**

**Symptôme:** `Request failed`, `API not found`, `500 error`

**Solution:**
```bash
# Vérifier les routes API existantes
ls -la src/app/api/

# Tester une route API spécifique
curl http://localhost:3000/api/auth/me
```

## 📊 **MONITORING & SURVEILLANCE CONTINUE**

### Dashboard Performance en Temps Réel

```bash
# Surveillance continue des performances
npm run performance:budget:watch

# Résultats automatiques avec alertes
npm run performance:budget:ci
```

### Surveillance E2E Continue

```bash
# Tests E2E en boucle
watch -n 300 "npm run cypress:run --spec 'cypress/e2e/auth/*.spec.ts'"

# Monitoring avec rapports
npm run cypress:run --record --key YOUR_KEY
```

## 🛠️ **OUTILS DE DEBUG AVANCÉS**

### 1. Mode Debug Cypress

```bash
# Cypress en mode visuel pour debug
npm run cypress:open

# Avec logs détaillés
DEBUG=cypress:* npm run cypress:run
```

### 2. Performance Profiling

```bash
# Audit complet performance
npm run performance:audit

# Analyse bundle détaillée
npm run performance:analyze
```

### 3. Logs Détaillés

```bash
# Logs serveur en temps réel
npm run dev 2>&1 | tee server.log

# Logs tests avec timestamps
npm run cypress:run 2>&1 | ts '[%Y-%m-%d %H:%M:%S]' | tee test.log
```

## 🎯 **RÉSULTATS ATTENDUS**

### Tests Fonctionnels ✅

```
✅ Authentification: Login/Logout
✅ Navigation: Pages principales  
✅ Performance: < 2s chargement
✅ Accessibilité: WCAG 2.1 AA
✅ Responsive: Mobile/Desktop
```

### Performances ✅

```
✅ Bundle JS: < 250KB par chunk
✅ API Response: < 300ms
✅ Core Web Vitals: LCP < 2.5s
✅ Cache Hit Rate: > 80%
```

## 🚨 **TROUBLESHOOTING AVANCÉ**

### Problème: Tests qui timeout systématiquement

```bash
# Augmenter les timeouts temporairement
export CYPRESS_defaultCommandTimeout=10000
npm run cypress:run
```

### Problème: Base de données corrompue

```bash
# Reset complet de la DB de test
npm run prisma:migrate:reset
npm run seed
```

### Problème: Cache corrompu

```bash
# Clear tous les caches
rm -rf .next node_modules/.cache cypress/cache
npm install
```

## 🎉 **SUCCÈS ! INFRASTRUCTURE BULLETPROOF OPÉRATIONNELLE**

Une fois tous les tests au vert:

```bash
# Validation finale
node scripts/bulletproof-verification.js

# Déploiement CI/CD
npm run performance:budget:ci && npm run cypress:e2e:headless
```

🎯 **Votre infrastructure E2E et Performance est maintenant bulletproof et prête pour la production !**