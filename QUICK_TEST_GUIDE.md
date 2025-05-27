# 🚀 Guide Rapide - Tests & Monitoring

## 🎯 Tests Essentiels

### Lancer tous les tests
```bash
# Tests complets (recommandé)
npm run test:all:comprehensive

# Tests rapides critiques
npm run test:critical

# Tests d'intégration API
npm run test:integration:api
```

### Tests par type
```bash
# Tests unitaires
npm test

# Tests E2E Cypress
npm run cypress:run

# Tests de performance
npm run test:performance:new

# Tests de charge
npm run test:load
```

## 📊 Monitoring & Santé

### Health Check
```bash
# Vérification santé
npm run health:check

# Test monitoring ponctuel
npm run monitoring:test

# Démarrer surveillance continue
npm run monitoring:start

# Rapport dernières 24h
npm run monitoring:report
```

### Alertes en temps réel
```bash
# API monitoring
curl http://localhost:3000/api/health

# API alertes actives
curl http://localhost:3000/api/monitoring/alerts?type=active
```

## 🔍 Analyses & Rapports

### Couverture de tests
```bash
# Couverture globale
npm run test:coverage

# Voir rapport HTML
open coverage/lcov-report/index.html
```

### Audits qualité
```bash
# Audit performance
npm run performance:audit

# Audit qualité code
npm run quality:audit

# Audit sécurité
npm run test:security
```

## 🎨 Tests Spécialisés

### Tests E2E spécifiques
```bash
# Admin pages
cypress run --spec "cypress/e2e/admin/**/*.spec.ts"

# Simulation
cypress run --spec "cypress/e2e/simulation/**/*.spec.ts"

# Templates
cypress run --spec "cypress/e2e/templates/**/*.spec.ts"

# Performance
cypress run --spec "cypress/e2e/performance/**/*.spec.ts"
```

### Tests par module
```bash
# Module congés
npm run test -- --testPathPattern=leaves

# Module auth
npm run test -- --testPathPattern=auth

# Module planning
npm run test -- --testPathPattern=planning

# Services
npm run test:services
```

## 🚨 Surveillance Production

### Démarrage monitoring
```bash
# En arrière-plan
nohup npm run monitoring:start > monitoring.log 2>&1 &

# Avec PM2 (recommandé)
pm2 start scripts/monitoring-daemon.js --name mathilda-monitoring
```

### Vérifications régulières
```bash
# Santé application
curl -f http://localhost:3000/api/health

# Statut monitoring
pm2 status mathilda-monitoring

# Logs monitoring
pm2 logs mathilda-monitoring
```

## 📈 Métriques Temps Réel

### Endpoints monitoring
- **`GET /api/health`** - Santé globale
- **`GET /api/monitoring/alerts`** - Alertes actives
- **`GET /api/monitoring/alerts?type=stats`** - Statistiques

### Seuils d'alerte
- 🟢 **Healthy** : Score ≥ 90%
- 🟡 **Degraded** : Score 70-89%
- 🔴 **Unhealthy** : Score < 70%

## 🔧 Commandes Utiles

### Développement
```bash
# Tests en mode watch
npm run test:watch

# Tests spécifiques
npm test -- --testNamePattern="User"

# Tests avec debugger
npm test -- --runInBand --no-cache
```

### CI/CD
```bash
# Tests pour intégration continue
npm run test:ci

# Build + tests
npm run build && npm run test:all:comprehensive
```

### Nettoyage
```bash
# Nettoyer cache tests
npm test -- --clearCache

# Réinitialiser DB test
npm run cypress:reset-db
```

## 📊 Rapports Disponibles

- **`coverage/lcov-report/index.html`** - Couverture de tests
- **`cypress/reports/mocha/`** - Rapports E2E
- **`logs/monitoring.log`** - Logs monitoring
- **`logs/metrics.jsonl`** - Métriques temps réel
- **`performance-test-results.json`** - Résultats performance

## 🎯 Niveaux de Confiance

### 🟢 Production Ready (85% des modules)
- Authentication, Users, Leaves, Planning
- Site Management, Simulation, Templates
- Core Services, API Security

### 🟡 Surveillance Recommandée (15%)
- Reports, Configurations avancées

### 🔴 Attention Requise (0%)
- Aucun module ! Tous couverts ✅

---

**💡 Tip** : Utilisez `npm run test:all:comprehensive` pour un audit complet avant déploiement !