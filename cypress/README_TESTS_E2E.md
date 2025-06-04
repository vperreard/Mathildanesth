# Tests E2E Cypress - Guide d'utilisation

## Vue d'ensemble

Ce guide explique comment utiliser et maintenir les tests E2E Cypress pour le projet Mathildanesth.

## Structure des tests

```
cypress/
├── e2e/                      # Tests E2E
│   ├── auth/                 # Tests d'authentification
│   ├── bloc-operatoire/      # Tests du bloc opératoire
│   ├── leaves/               # Tests de gestion des congés
│   ├── rules/                # Tests de validation des règles métier
│   └── performance/          # Tests de performance
├── fixtures/                 # Données de test
├── support/                  # Commands et helpers
├── downloads/                # Fichiers téléchargés pendant les tests
└── screenshots/              # Captures d'écran des tests échoués
```

## Installation et configuration

### 1. Installer les dépendances

```bash
npm install --save-dev cypress
```

### 2. Variables d'environnement

Créer un fichier `.env.test` :

```env
TEST_DATABASE_URL=postgresql://user:password@localhost:5433/mathildanesth_test
API_URL=http://localhost:3000/api
NODE_ENV=test
```

### 3. Base de données de test

Créer une base de données dédiée aux tests :

```bash
# Créer la base de données
createdb mathildanesth_test

# Appliquer les migrations
DATABASE_URL=$TEST_DATABASE_URL npx prisma migrate deploy
```

## Lancer les tests

### Mode interactif (recommandé pour le développement)

```bash
npm run cypress:open
```

Cela ouvre l'interface Cypress où vous pouvez :
- Sélectionner et exécuter des tests individuellement
- Voir les tests s'exécuter en temps réel
- Déboguer avec les DevTools

### Mode headless (pour CI/CD)

```bash
npm run cypress:run
```

Exécute tous les tests en mode headless et génère des rapports.

### Tests spécifiques

```bash
# Tester uniquement l'authentification
npm run cypress:run -- --spec "cypress/e2e/auth/**/*"

# Tester uniquement les congés
npm run cypress:run -- --spec "cypress/e2e/conges/**/*"

# Tester uniquement le bloc opératoire
npm run cypress:run -- --spec "cypress/e2e/bloc-operatoire/**/*"
```

## Écriture de tests

### Structure d'un test

```typescript
describe('Fonctionnalité à tester', () => {
    beforeEach(() => {
        // Préparation avant chaque test
        cy.task('resetTestDatabase');
        cy.task('seedTestData', { fixtures: ['users'] });
        cy.loginByApi('user@example.com', 'password');
    });

    it('devrait faire quelque chose', () => {
        // Naviguer vers une page
        cy.visit('/page');
        
        // Interagir avec les éléments
        cy.get('[data-testid=button]').click();
        
        // Vérifier le résultat
        cy.get('[data-testid=result]').should('contain', 'Succès');
    });
});
```

### Sélecteurs recommandés

Toujours utiliser `data-testid` pour les sélecteurs :

```html
<button data-testid="submit-button">Soumettre</button>
```

```typescript
cy.get('[data-testid=submit-button]').click();
```

### Commands personnalisées

Les commands disponibles :

```typescript
// Se connecter
cy.login('email', 'password');
cy.loginByApi('email', 'password');

// Créer des données
cy.createLeave({ type: 'Congé annuel', startDate: '2025-06-01', endDate: '2025-06-07' });
cy.createAffectation({ surgeon: 'Dr Dupont', room: 'Salle 1', slot: 'monday-morning' });

// Vérifications
cy.checkNotification('Message de succès', 'success');
cy.checkRuleViolation('Temps de repos insuffisant');
cy.checkLeaveQuota('Congé annuel', 20);

// Drag and drop
cy.dragAndDrop('[data-testid=source]', '[data-testid=target]');
```

## Fixtures

Les fixtures contiennent les données de test :

```json
// cypress/fixtures/utilisateurs.json
[
  {
    "email": "admin@example.com",
    "password": "Test123!",
    "name": "Admin",
    "role": "ADMIN"
  },
  {
    "email": "medecin@example.com", 
    "password": "Test123!",
    "name": "Dr Martin",
    "role": "USER"
  }
]
```

## Débogage

### Captures d'écran

Les captures d'écran des tests échoués sont dans `cypress/screenshots/`.

### Logs de performance

Les métriques de performance sont enregistrées dans `results/performance.json`.

### Console Cypress

Dans l'interface Cypress, utilisez la console pour :
- Voir les commandes exécutées
- Inspecter les éléments DOM
- Déboguer avec `cy.pause()` ou `cy.debug()`

## Bonnes pratiques

### 1. Isolation des tests

Chaque test doit être indépendant :

```typescript
beforeEach(() => {
    cy.task('resetTestDatabase');
    // État initial propre
});
```

### 2. Attentes explicites

Éviter les `cy.wait()` arbitraires :

```typescript
// ❌ Mauvais
cy.wait(2000);

// ✅ Bon
cy.get('[data-testid=loading]').should('not.exist');
cy.get('[data-testid=content]').should('be.visible');
```

### 3. Réutilisation

Utiliser les commands personnalisées pour la réutilisation :

```typescript
// Au lieu de répéter ce code
cy.get('[data-testid=create-leave-button]').click();
cy.get('[data-testid=leave-type-select]').select('Congé annuel');
// ...

// Utiliser
cy.createLeave({ type: 'Congé annuel', ... });
```

### 4. Tests de régression

Ajouter un test pour chaque bug corrigé :

```typescript
it('devrait gérer correctement les dates invalides (fix #123)', () => {
    // Test spécifique pour le bug
});
```

## Intégration CI/CD

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Setup database
        run: |
          npx prisma migrate deploy
          npm run db:seed:test
          
      - name: Run E2E tests
        run: npm run cypress:run
        
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
```

## Maintenance

### Mise à jour des sélecteurs

Si l'UI change, mettre à jour les sélecteurs :

1. Identifier les tests échoués
2. Mettre à jour les `data-testid` dans le code
3. Mettre à jour les sélecteurs dans les tests
4. Vérifier que tous les tests passent

### Ajout de nouveaux tests

Pour chaque nouvelle fonctionnalité :

1. Créer un nouveau fichier de test dans le bon dossier
2. Ajouter les fixtures nécessaires
3. Écrire les tests en suivant les patterns existants
4. Documenter les cas de test complexes

### Performance

Surveiller les temps d'exécution :

```bash
# Générer un rapport de performance
npm run cypress:run -- --reporter json > cypress-results.json
```

## Troubleshooting

### Problèmes courants

**1. Tests qui échouent aléatoirement**
- Ajouter des attentes explicites
- Vérifier les conditions de course
- Augmenter les timeouts si nécessaire

**2. Base de données non réinitialisée**
- Vérifier les permissions de la base
- S'assurer que les migrations sont à jour
- Vérifier la connexion à la base de test

**3. Éléments non trouvés**
- Vérifier que les `data-testid` existent
- Attendre que l'élément soit visible
- Vérifier que la page est chargée

### Support

Pour toute question ou problème :
- Consulter la documentation Cypress : https://docs.cypress.io
- Ouvrir une issue sur GitHub
- Contacter l'équipe de développement