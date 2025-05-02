# Guide des Tests End-to-End avec Cypress

Ce document explique comment les tests end-to-end sont organisés et comment écrire de nouveaux tests pour l'application Mathildanesth.

## Table des matières

1. [Introduction](#introduction)
2. [Structure des tests](#structure-des-tests)
3. [Configuration](#configuration)
4. [Types de tests](#types-de-tests)
5. [Fixtures et données de test](#fixtures-et-données-de-test)
6. [Commandes personnalisées](#commandes-personnalisées)
7. [Tests d'accessibilité](#tests-daccessibilité)
8. [Tests de performance](#tests-de-performance)
9. [Tests de compatibilité responsive](#tests-de-compatibilité-responsive)
10. [Rapports de test](#rapports-de-test)
11. [Intégration continue](#intégration-continue)
12. [Bonnes pratiques](#bonnes-pratiques)
13. [Dépannage](#dépannage)

## Introduction

Les tests end-to-end (e2e) sont utilisés pour vérifier le fonctionnement complet de l'application comme si un utilisateur réel l'utilisait. Nous utilisons Cypress pour écrire et exécuter ces tests, avec des fonctionnalités supplémentaires pour l'accessibilité, la performance et la compatibilité responsive.

## Structure des tests

Les tests sont organisés dans les dossiers suivants:

```
cypress/
├── e2e/                       # Tests end-to-end
│   ├── auth/                  # Tests d'authentification
│   ├── leaves/                # Tests de gestion des congés
│   ├── calendar/              # Tests du calendrier
│   ├── planning/              # Tests de la planification
│   ├── edge-cases/            # Tests des cas limites et erreurs
│   ├── accessibility/         # Tests d'accessibilité
│   ├── performance/           # Tests de performance
│   └── compatibility/         # Tests de compatibilité responsive
├── fixtures/                  # Données de test statiques
├── support/                   # Fonctions et commandes de support
│   ├── commands.ts            # Commandes personnalisées
│   ├── e2e.ts                 # Configuration des tests e2e
│   └── component.ts           # Configuration des tests de composants
└── component/                 # Tests de composants isolés
```

## Configuration

La configuration principale se trouve dans `cypress.config.ts`. Elle définit:

- L'URL de base de l'application
- Les fichiers de support et patterns de tests
- Les tâches Cypress pour interagir avec la base de données
- Les configurations pour les audits de performance et d'accessibilité
- Les rapports et seuils de qualité

## Types de tests

### Tests fonctionnels standard

Ces tests vérifient les fonctionnalités principales de l'application:

- **Tests d'authentification**: connexion, déconnexion, gestion de session
- **Tests de gestion des congés**: création, approbation, rejet, modification
- **Tests de calendrier**: affichage, création, modification d'événements
- **Tests de planning**: génération, modification, validation
- **Tests de cas limites**: gestion des erreurs, validations, conflits

### Tests d'accessibilité

Vérifient la conformité aux normes d'accessibilité à l'aide de Axe et Pa11y.

### Tests de performance

Utilisent Lighthouse pour mesurer les performances techniques (vitesse de chargement, etc.).

### Tests de compatibilité responsive

Vérifient l'affichage correct sur différentes tailles d'écran (mobile, tablette, desktop, etc.).

## Fixtures et données de test

Les données de test sont définies dans le dossier `cypress/fixtures/`:

- `users.json`: utilisateurs de test
- `leaves.json`: demandes de congés
- `events.json`: événements du calendrier
- `quotas.json`: quotas de congés
- `surgeons.json`: chirurgiens
- `operatingRooms.json`: salles d'opération
- `specialties.json`: spécialités médicales

Ces données sont chargées dans la base de données de test avant chaque test via la tâche `seedTestData`.

## Commandes personnalisées

Nous avons défini des commandes personnalisées pour simplifier l'écriture des tests:

### Authentification

```typescript
// Connexion via l'interface utilisateur
cy.login('medecin@example.com', 'Test123!');

// Connexion directe via l'API (plus rapide)
cy.loginByApi('medecin@example.com', 'Test123!');

// Visiter une page en tant qu'utilisateur authentifié
cy.visitAsAuthenticatedUser('/planning');
```

### Sélection de dates

```typescript
// Sélectionner une date dans un sélecteur de date
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
cy.selectDate('[data-cy=start-date-input]', tomorrow);
```

### Vérification des notifications

```typescript
// Vérifier qu'une notification de succès s'affiche
cy.checkNotification('Demande de congés soumise avec succès', 'success');
```

### Tests d'accessibilité

```typescript
// Vérifier l'accessibilité d'une page
cy.checkAccessibility();

// Avec options personnalisées
cy.checkAccessibility({
    rules: {
        'color-contrast': { enabled: true },
        'label': { enabled: true }
    }
});
```

### Tests de performance

```typescript
// Exécuter un audit Lighthouse
cy.runLighthouseAudit();

// Exécuter un audit Pa11y
cy.runPa11yAudit();
```

### Tests responsive

```typescript
// Changer la taille de la fenêtre selon un device prédéfini
cy.viewportDevice('mobile'); // ou 'tablet', 'desktop', 'widescreen'
```

## Tests d'accessibilité

Les tests d'accessibilité vérifient la conformité aux normes WCAG (Web Content Accessibility Guidelines). Nous utilisons:

- **Cypress-axe**: pour les tests d'accessibilité basés sur axe-core
- **Pa11y**: pour des tests d'accessibilité plus complets

### Exemple de test d'accessibilité

```typescript
describe('Tests d\'accessibilité', () => {
    beforeEach(() => {
        cy.loginByApi('medecin@example.com', 'Test123!');
    });

    it('vérifie l\'accessibilité de la page d\'accueil', () => {
        cy.visitAsAuthenticatedUser('/dashboard');
        cy.checkAccessibility();
    });
});
```

Les rapports d'accessibilité sont générés dans `cypress/reports/a11y/`.

## Tests de performance

Les tests de performance mesurent et vérifient les performances techniques de l'application. Nous utilisons:

- **Lighthouse**: pour mesurer les performances, l'accessibilité, les bonnes pratiques et le SEO
- **Métriques personnalisées**: pour des mesures spécifiques à notre application

### Exemple de test de performance

```typescript
describe('Tests de performance', () => {
    beforeEach(() => {
        cy.loginByApi('medecin@example.com', 'Test123!');
    });

    it('vérifie les performances du calendrier', () => {
        cy.visitAsAuthenticatedUser('/calendar');
        cy.runLighthouseAudit();
    });
});
```

Les rapports de performance sont générés dans `cypress/reports/lighthouse/`.

## Tests de compatibilité responsive

Ces tests vérifient que l'application s'affiche correctement sur différents appareils et tailles d'écran. Nous testons:

- **Mobile**: 375 x 667px
- **Tablette**: 768 x 1024px
- **Desktop**: 1280 x 800px
- **Grand écran**: 1920 x 1080px

### Exemple de test responsive

```typescript
describe('Tests de compatibilité responsive', () => {
    describe('Tests sur mobile', () => {
        beforeEach(() => {
            cy.loginByApi('medecin@example.com', 'Test123!');
            cy.viewportDevice('mobile');
        });

        it('affiche correctement le menu de navigation', () => {
            cy.visitAsAuthenticatedUser('/dashboard');
            cy.get('[data-cy=mobile-menu-button]').should('be.visible');
        });
    });
});
```

## Rapports de test

Les rapports de test sont générés dans différents formats et emplacements:

- **Rapports Mochawesome**: `cypress/reports/mocha/`
- **Rapports d'accessibilité**: `cypress/reports/a11y/`
- **Rapports Lighthouse**: `cypress/reports/lighthouse/`
- **Screenshots (en cas d'échec)**: `cypress/screenshots/`
- **Vidéos**: `cypress/videos/`

Pour générer un rapport consolidé:

```bash
npm run cypress:reports
```

## Intégration continue

Les tests sont exécutés automatiquement dans notre pipeline CI (GitHub Actions). Le workflow est défini dans `.github/workflows/cypress.yml` et inclut:

- Exécution des tests e2e standards
- Exécution des tests d'accessibilité
- Exécution des tests de compatibilité responsive
- Exécution des tests de performance (uniquement sur la branche principale)
- Génération et téléversement des rapports

## Bonnes pratiques

### Principes généraux

1. **Un test, une assertion principale**: Chaque test devrait vérifier une chose spécifique.
2. **Indépendance des tests**: Chaque test doit être indépendant et ne pas dépendre d'autres tests.
3. **Réinitialisation de l'état**: Toujours réinitialiser l'état entre les tests (base de données, état local, etc.).
4. **Utiliser des sélecteurs dédiés**: Utiliser des attributs `data-cy` pour les sélecteurs plutôt que des classes ou des IDs.
5. **Éviter les attentes fixes**: Utiliser `.should()` au lieu de `cy.wait(millisecondes)`.
6. **Tests atomiques**: Préférer plusieurs petits tests plutôt qu'un gros test.

### Convention de nommage

- Les fichiers de test: `feature-name.spec.ts`
- Les sélecteurs: `data-cy=feature-element-action` (ex: `data-cy=leave-item-edit`)
- Les descriptions de test: utiliser le français et une description claire de l'action testée (ex: "permet de créer une nouvelle demande de congés")

### Structure recommandée

```typescript
describe('Fonctionnalité à tester', () => {
    // Configuration commune
    beforeEach(() => {
        // Préparer l'environnement de test
    });

    // Tests individuels
    it('action spécifique à tester', () => {
        // Arrangement (setup)
        // ...

        // Action
        // ...

        // Assertion
        // ...
    });
});
```

## Dépannage

### Problèmes courants et solutions

1. **Les tests échouent de manière aléatoire**
   - Vérifier la réinitialisation des données entre les tests
   - Ajouter des assertions d'attente plus robustes

2. **Les sélecteurs ne trouvent pas les éléments**
   - Vérifier que les attributs `data-cy` sont correctement définis
   - Utiliser `.debug()` pour inspecter l'état actuel

3. **Les tests d'accessibilité échouent**
   - Analyser le rapport d'accessibilité pour identifier les problèmes
   - Corriger les problèmes dans l'application ou ajuster les règles selon le contexte

4. **Les tests de performance échouent**
   - Vérifier quelles métriques échouent (LCP, FID, CLS, etc.)
   - Optimiser les ressources concernées (images, CSS, JavaScript)

5. **Tests qui fonctionnent localement mais échouent en CI**
   - Vérifier les différences d'environnement (versions, timeout, etc.)
   - Consulter les vidéos et screenshots générés en CI

### Journal des actions recommandées

Si un test échoue:

1. Exécuter le test isolément: `cypress run --spec "chemin/vers/test.spec.ts"`
2. Consulter les vidéos et screenshots d'échec
3. Utiliser `cy.debug()` au point de défaillance
4. Vérifier l'état de la base de données
5. Utiliser le mode interactif: `cypress open`

## Conclusion

Ce guide vous a présenté la structure et les fonctionnalités des tests end-to-end pour l'application Mathildanesth. Pour toute question ou clarification, contactez l'équipe de développement. 