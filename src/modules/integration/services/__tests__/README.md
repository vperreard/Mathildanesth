# Tests d'intégration pour les services

Ce répertoire contient les tests pour les services d'intégration entre les différents modules de l'application.

## Structure des tests

Les tests sont organisés par service et fonctionnalité :

- `EventBusService.test.ts` : Tests pour le bus d'événements central
- `LeaveModuleIntegration.test.ts` : Tests d'intégration entre le module de congés et les autres modules
- `../../leaves/services/__tests__/AuditService.test.ts` : Tests pour le service d'audit
- `../../leaves/permissions/__tests__/LeavePermissionService.test.ts` : Tests pour le service de gestion des permissions (tests de base)
- `../../leaves/permissions/__tests__/LeavePermissionService.extended.test.ts` : Tests étendus pour le service de gestion des permissions (tests avancés)

## Exécution des tests

Pour exécuter les tests, utilisez la commande suivante :

```bash
# Exécuter tous les tests
npm test

# Exécuter uniquement les tests d'intégration
npm test -- -t "integration"

# Exécuter les tests pour un service spécifique
npm test -- -t "EventBusService"
npm test -- -t "AuditService"
npm test -- -t "LeavePermissionService"
```

## Couverture des tests

Les tests couvrent les fonctionnalités suivantes :

### EventBusService

- Pattern Singleton
- Abonnement et désabonnement aux événements
- Publication d'événements
- File d'attente d'événements à haute fréquence
- Gestion des dépassements de capacité
- Historique des événements
- Gestion des erreurs
- Statistiques
- Nettoyage des ressources

### AuditService

- Pattern Singleton
- Abonnement aux événements du bus
- Création d'entrées d'audit
- Gestion des événements de congé
- Gestion des événements de quota
- Gestion des événements d'audit génériques
- Recherche d'entrées d'audit
- Journalisation d'actions spécifiques (accès système, changements de rôle, permissions, etc.)

### LeavePermissionService

- Pattern Singleton
- Vérification des permissions par rôle
- Vérification des permissions personnalisées
- Gestion du cache de permissions
- Permissions relatives (équipe, département)
- Octroi et révocation de permissions
- Réinitialisation des permissions
- Invalidation du cache lors de changements de permissions

### Intégration entre modules

- Communication entre le module de congés et le planning
- Communication entre le module de congés et les notifications
- Communication entre le module de congés et le service d'audit
- Vérification des conflits entre congés et planning
- Mise à jour des quotas après approbation de congés

## Mocks et dépendances

Les tests utilisent des mocks pour simuler les dépendances externes :

- `jest.mock('axios')` : Pour simuler les requêtes HTTP
- `jest.mock('next-auth/react')` : Pour simuler l'authentification
- `jest.mock('../EventBusService')` : Pour simuler le bus d'événements
- Classes fictives (ex: `MockPlanningService`, `MockNotificationService`) : Pour simuler les services externes

## Extension des tests

Pour ajouter de nouveaux tests :

1. Identifiez le fichier de test approprié ou créez-en un nouveau
2. Suivez la structure existante (describe, it, expect)
3. Utilisez les mocks existants ou créez-en de nouveaux si nécessaire
4. Assurez-vous que les tests sont indépendants (utilisez beforeEach pour réinitialiser l'état)
5. Évitez les dépendances externes réelles (API, base de données)

### Exemple d'ajout d'un nouveau test

```typescript
// Exemple d'ajout d'un test pour une nouvelle fonctionnalité d'EventBusService
describe('Nouvelle fonctionnalité', () => {
  it('devrait se comporter comme prévu', () => {
    // Arrange
    const handler = jest.fn();
    eventBus.subscribe(IntegrationEventType.SOME_EVENT, handler);
    
    // Act
    eventBus.publish({
      type: IntegrationEventType.SOME_EVENT,
      payload: { data: 'test' },
      source: 'test'
    });
    
    // Assert
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: { data: 'test' }
      })
    );
  });
});
```

## Bonnes pratiques

- Testez les cas nominal et les cas d'erreur
- Utilisez des spies pour vérifier que les méthodes internes sont appelées correctement
- Simulez les événements pour tester les gestionnaires d'événements
- Nettoyez les ressources après chaque test (dispose, clearMocks)
- Utilisez des noms explicites pour les tests
- Structurez les tests en suivant le pattern Arrange-Act-Assert
- Testez l'intégration entre les services en vérifiant les événements publiés et les abonnements 