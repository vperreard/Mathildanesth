# Tests E2E pour les Notifications

Ce répertoire contient les tests end-to-end (E2E) pour les fonctionnalités de notifications de Mathilda.

## Configuration

Les tests utilisent Cypress pour simuler les interactions utilisateur et vérifier le comportement de l'application.

### Fichiers de tests

- `notifications.spec.ts` : Tests généraux des fonctionnalités de notifications
- `assignment-swap-notifications.spec.ts` : Tests spécifiques à l'intégration entre les échanges d'affectations et les notifications

### Structure des données de test

Les données de test sont définies dans des fichiers JSON dans le répertoire `cypress/fixtures/`.

## Mode Simulation

Les tests d'échanges d'affectations incluent un mode simulation (`SIMULATION_MODE = true` dans le fichier `assignment-swap-notifications.spec.ts`), qui permet de tester la logique des tests sans nécessiter l'intégration complète avec l'interface utilisateur réelle.

En mode simulation :
- Les tests n'interagissent pas réellement avec l'UI
- Des logs sont générés pour simuler les actions
- Les assertions sont simplifiées pour permettre aux tests de passer

Pour activer/désactiver le mode simulation, modifiez la constante `SIMULATION_MODE` dans le fichier de test :

```typescript
// Mode simulation pour les tests (à utiliser si les éléments UI réels ne sont pas disponibles)
const SIMULATION_MODE = true; // Mettre à false pour utiliser l'UI réelle
```

## Exécution des tests

Pour exécuter uniquement les tests de notifications :

```bash
npm run test:notifications
```

Pour exécuter spécifiquement les tests d'échanges d'affectations :

```bash
npm run test:swap-notifications
```

## Scripts d'aide

Des utilitaires ont été créés pour faciliter la préparation de l'environnement de test :

- `setup-swap-notification-tests.js` : Configure l'environnement pour les tests d'échanges d'affectations

## Endpoints API spéciaux

Les tests utilisent des endpoints API spéciaux qui ne sont disponibles qu'en environnement de test :

- `/api/test/ping` : Vérifie si l'API est disponible
- `/api/test/ensure-user-exists` : S'assure qu'un utilisateur de test existe
- `/api/test/ensure-assignment-exists` : S'assure qu'une affectation de test existe
- `/api/test/clean-swap-requests` : Nettoie les demandes d'échange entre des utilisateurs spécifiques

## Scénarios testés

### Notifications générales
1. Affichage du compteur de notifications
2. Ouverture du panneau de notifications
3. Marquage des notifications comme lues
4. Navigation vers les détails depuis une notification
5. Marquage de toutes les notifications comme lues
6. Mise à jour en temps réel

### Notifications d'échanges d'affectations
1. Notification lors de la création d'une demande d'échange
2. Notification lors de l'acceptation d'une demande
3. Notification lors du refus d'une demande
4. Notification lors de l'annulation d'une demande
5. Marquage comme lues lors de la consultation
6. Respect des préférences utilisateur

## Prochaines étapes

Pour compléter l'intégration des tests E2E avec l'interface réelle, les actions suivantes seront nécessaires :

1. Ajouter les attributs `data-cy` appropriés aux composants d'interface utilisateur :
   - `[data-cy=notification-bell]` pour l'icône de notification
   - `[data-cy=notification-panel]` pour le panneau de notifications
   - `[data-cy=notification-item]` pour chaque élément de notification
   - `[data-cy=assignment-item]` pour les éléments d'affectation dans le planning
   - etc.

2. Implémenter l'UI pour les échanges d'affectations :
   - Page `/planning/echanges` pour lister les demandes d'échange
   - Dialogue d'échange d'affectations
   - Boutons d'action (accepter, refuser, annuler)

3. Désactiver le mode simulation une fois l'interface complète :
   - Mettre `SIMULATION_MODE = false` dans le fichier de test 