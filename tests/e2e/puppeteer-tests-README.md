# Tests E2E Puppeteer

Cette suite de tests E2E utilise Puppeteer pour tester des scénarios complexes, la performance et l'accessibilité de l'application Mathildanesth.

## Structure des tests

```
tests/e2e/
├── workflows/           # Tests de workflows multi-utilisateurs
├── performance/         # Tests de charge et métriques de performance
├── accessibility/       # Tests de conformité WCAG 2.1
├── regression/         # Tests de régression pour bugs critiques
├── notifications/      # Tests des notifications temps réel
├── config/            # Configuration des tests
├── helpers/           # Utilitaires de test
└── README.md
```

## Installation

```bash
# Installation des dépendances (déjà incluses dans le projet)
npm install
```

## Exécution des tests

### Tous les tests E2E Puppeteer
```bash
npm run test:e2e:puppeteer
```

### Tests spécifiques par catégorie

```bash
# Tests de workflows multi-utilisateurs
npm run test:e2e:workflows

# Tests de performance
npm run test:e2e:performance

# Tests d'accessibilité WCAG 2.1
npm run test:e2e:accessibility

# Tests de régression
npm run test:e2e:regression
```

### Mode interactif (navigateur visible)
```bash
HEADLESS=false npm run test:e2e:puppeteer
```

### Mode lent pour débugger
```bash
SLOW_MO=100 npm run test:e2e:puppeteer
```

## Configuration

Les tests utilisent les variables d'environnement suivantes :

- `TEST_BASE_URL` : URL de base de l'application (défaut: http://localhost:3000)
- `TEST_WS_URL` : URL WebSocket (défaut: ws://localhost:3001)
- `HEADLESS` : Mode headless (défaut: true)
- `SLOW_MO` : Ralentir les actions en ms (défaut: 0)
- `DEVTOOLS` : Ouvrir les DevTools (défaut: false)

## Tests de workflows multi-utilisateurs

### Échanges de gardes
- Test complet du workflow d'échange entre praticiens
- Notifications temps réel
- Validation par l'administrateur
- Gestion des rejets et conflits

### Exemples de tests
```typescript
// Assignment swap workflow
- Création d'une demande d'échange
- Réception de notification par le destinataire
- Acceptation/rejet de l'échange
- Validation administrative
- Mise à jour du calendrier
```

## Tests de performance

### Métriques mesurées
- **FCP** (First Contentful Paint) < 1.5s
- **LCP** (Largest Contentful Paint) < 2.5s
- **TTI** (Time to Interactive) < 3.5s
- **TBT** (Total Blocking Time) < 300ms
- **CLS** (Cumulative Layout Shift) < 0.1
- **TTFB** (Time to First Byte) < 600ms

### Tests de charge
- 50+ utilisateurs simultanés
- Connexions concurrentes
- Accès simultané au calendrier
- Stress test des API (100 requêtes simultanées)
- Détection de fuites mémoire

### Rapport de performance
Les résultats sont sauvegardés dans `performance-metrics-results.json`

## Tests d'accessibilité WCAG 2.1

### Conformité testée
- Niveau AA de WCAG 2.1
- Navigation au clavier
- Compatibilité lecteurs d'écran
- Contraste des couleurs
- Indicateurs de focus
- Textes alternatifs
- Structure des titres
- ARIA landmarks

### Rapport d'accessibilité
Les résultats sont sauvegardés dans `accessibility-reports.json`

## Tests de régression

### Bugs critiques testés
- **Bug #301** : Problèmes de sélection de dates dans le calendrier
- **Bug #245** : Validation des quotas de congés
- **Bug #189** : Persistance du drag & drop
- **Bug #156** : Conflits de modifications concurrentes
- **Bug #134** : Gestion de l'expiration de session
- **Bug #112** : Validation des formulaires (XSS, entrées longues)

## Structure des helpers

### test-helpers.ts
- `createTestUser()` : Création d'utilisateurs de test
- `cleanupTestData()` : Nettoyage des données
- `measurePerformance()` : Mesure de performance
- `simulateNetworkConditions()` : Simulation réseau

### auth-helpers.ts
- `loginAs()` : Connexion automatique
- `logout()` : Déconnexion
- `waitForNotification()` : Attente de notifications
- `getAuthToken()` : Récupération du token

## Bonnes pratiques

### 1. Isolation des tests
- Chaque test crée ses propres données
- Nettoyage systématique après chaque test
- Pas de dépendance entre tests

### 2. Attentes et timeouts
- Utiliser `waitForSelector()` plutôt que `waitForTimeout()`
- Timeouts adaptés selon l'action (30s pour navigation, 10s pour éléments)
- Gestion des erreurs avec try/catch

### 3. Performance
- Tests en parallèle quand possible
- Réutilisation des contextes de navigateur
- Nettoyage des ressources

### 4. Debugging
```bash
# Mode visible avec DevTools
HEADLESS=false DEVTOOLS=true npm run test:e2e:puppeteer

# Mode lent pour voir les actions
SLOW_MO=250 npm run test:e2e:puppeteer

# Test spécifique
npm run test:e2e:puppeteer -- -t "Assignment swap workflow"
```

## CI/CD Integration

Les tests sont configurés pour s'exécuter dans la CI avec :
- Mode headless activé
- Exécution séquentielle (`--runInBand`)
- Rapports HTML générés
- Seuils de performance stricts

## Maintenance

### Ajout de nouveaux tests
1. Créer le fichier dans le bon dossier (workflows/, performance/, etc.)
2. Utiliser les helpers existants
3. Suivre les patterns établis
4. Documenter les cas de test

### Mise à jour des seuils
Les seuils de performance sont dans `config/test-config.ts`

### Debugging des échecs
1. Vérifier les screenshots dans `tests/e2e/screenshots/`
2. Consulter les logs de console
3. Exécuter en mode visible
4. Utiliser les DevTools Puppeteer