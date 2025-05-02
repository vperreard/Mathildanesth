# Architecture du système de détection de conflits

## Aperçu

Le système de détection de conflits est conçu pour identifier les situations problématiques lorsqu'un utilisateur demande un congé, en prenant en compte différents facteurs comme les autres congés, les gardes, les astreintes et d'autres contraintes métier.

La nouvelle architecture implémente un modèle de Façade avec un système de communication par événements, facilitant l'intégration de différents types de conflits à travers tous les modules de l'application.

## Composants principaux

### Façade de détection de conflits

La façade (`ConflictDetectionFacade`) sert de point d'entrée unique pour toutes les opérations de vérification de conflits. Elle :

- Enregistre et gère les différents services de détection
- Centralise les appels à ces services
- Agrège les résultats obtenus
- Expose une interface unifiée pour les clients

```typescript
// Exemple d'utilisation de la façade
import { conflictDetectionFacade } from '@/services/conflictDetection';

const result = await conflictDetectionFacade.checkConflicts(
  startDate, 
  endDate, 
  { 
    userId,
    includeLeaveConflicts: true,
    includeShiftConflicts: true
  }
);
```

### Services de détection spécialisés

Chaque type de détection de conflit est implémenté dans un service spécialisé conformément à l'interface `ConflictDetectionService`. Ces services :

- Se concentrent sur un domaine spécifique (congés, gardes, réunions, etc.)
- Implémentent une logique métier propre à leur domaine
- Sont enregistrés auprès de la façade
- Peuvent être activés/désactivés individuellement

Services actuellement implémentés :
- `LeaveConflictDetectionService` : Conflits liés aux congés
- `ShiftConflictDetectionService` : Conflits liés aux gardes et astreintes

### Bus d'événements

Le bus d'événements (`ConflictEventBus`) permet une communication découplée entre les différents composants du système. Il :

- Émet des événements lorsque des conflits sont détectés ou résolus
- Permet aux différents modules de s'abonner à ces événements
- Conserve un historique des événements récents
- Facilite l'extension du système

Types d'événements supportés :
- `CONFLICT_DETECTED` : Émis lorsqu'un conflit est détecté
- `CONFLICT_RESOLVED` : Émis lorsqu'un conflit est résolu
- `CONFLICT_RULES_UPDATED` : Émis lorsque les règles de conflit sont mises à jour
- `CONFLICT_CHECK_REQUESTED` : Émis lorsqu'une vérification est demandée
- `CONFLICT_CHECK_COMPLETED` : Émis lorsqu'une vérification est terminée

### Hook React global

Le hook `useGlobalConflictDetection` fournit une interface simple pour les composants React :

- Encapsule l'utilisation de la façade
- Gère l'état de chargement et les erreurs
- Fournit des méthodes utilitaires pour filtrer les conflits
- Permet une intégration simple dans les composants d'interface utilisateur

```typescript
// Exemple d'utilisation du hook
const {
  checkConflicts,
  globalResult,
  loading,
  getBlockingConflicts
} = useGlobalConflictDetection({ userId });

// Vérifier les conflits pour une période
await checkConflicts(startDate, endDate);

// Récupérer les conflits bloquants
const blockingConflicts = getBlockingConflicts();
```

## Flux de détection de conflits

1. Un client (composant UI, service, etc.) demande une vérification de conflits via la façade ou le hook
2. La façade émet un événement `CONFLICT_CHECK_REQUESTED`
3. La façade appelle tous les services de détection enregistrés
4. Chaque service vérifie les conflits dans son domaine
5. La façade agrège les résultats des différents services
6. La façade émet un événement `CONFLICT_CHECK_COMPLETED`
7. Pour chaque conflit détecté, la façade émet un événement `CONFLICT_DETECTED`
8. Le client reçoit le résultat agrégé

## Extension du système

### Ajout d'un nouveau type de conflit

Pour ajouter un nouveau type de conflit :

1. Ajouter un nouveau type dans l'énumération `ConflictType`
2. Créer un nouveau service de détection implémentant l'interface `ConflictDetectionService`
3. Enregistrer ce service auprès de la façade

### Ajout d'une nouvelle règle métier

Pour ajouter une nouvelle règle métier dans un service existant :

1. Identifier le service concerné
2. Ajouter la logique de vérification dans la méthode `checkConflicts` du service
3. Mettre à jour la documentation et les tests

## Bonnes pratiques

- Toujours utiliser la façade ou le hook pour les vérifications de conflits
- S'abonner aux événements pertinents pour réagir aux conflits
- Maintenir les services de détection indépendants les uns des autres
- Assurer que les services ne causent pas d'effets de bord
- Utiliser une gestion d'erreurs appropriée

## Diagramme d'architecture

```
┌───────────────────┐     ┌───────────────────┐
│                   │     │                   │
│ React Components  │     │     Services      │
│                   │     │                   │
└─────────┬─────────┘     └────────┬──────────┘
          │                        │
          ▼                        ▼
┌────────────────────────────────────────────┐
│                                            │
│        useGlobalConflictDetection          │
│                                            │
└─────────────────────┬──────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────┐
│                                            │
│          ConflictDetectionFacade           │
│                                            │
└───┬───────────────────────────────────┬────┘
    │                                   │
    ▼                                   ▼
┌──────────────────┐         ┌─────────────────────┐
│                  │         │                     │
│ LeaveConflict    │         │ ShiftConflict       │
│ DetectionService │◄────────► DetectionService    │
│                  │         │                     │
└────────┬─────────┘         └───────────┬─────────┘
         │                               │
         │         ┌─────────────┐       │
         └────────►│             │◄──────┘
                   │ ConflictBus │
                   │             │
                   └─────────────┘
```

## Cas d'utilisation avancés

### Détection de conflits cross-modules

Le système permet de détecter des conflits qui impliquent plusieurs modules, comme :

- Congés pendant une période de garde
- Congés pendant des réunions importantes
- Congés près de dates limites de projets

### Résolution de conflits

Lorsqu'un conflit est détecté, le système permet plusieurs stratégies de résolution :

1. **Automatique** : Pour les conflits non bloquants
2. **Par un manager** : Pour les conflits d'importance moyenne
3. **Refus automatique** : Pour les conflits critiques

### Alertes et notifications

Le bus d'événements permet de connecter le système à des mécanismes d'alerte :

- Notification par email
- Alerte dans l'interface utilisateur
- Notification push
- Journal d'audit

## Conclusion

Cette architecture modulaire et extensible permet d'ajouter facilement de nouveaux types de conflits et règles métier tout en maintenant une séparation claire des responsabilités. Le système d'événements facilite l'intégration avec d'autres modules de l'application et permet une communication efficace entre les différentes parties du système. 