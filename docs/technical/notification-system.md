# Système de notifications pour le module de congés

Ce document décrit l'architecture et le fonctionnement du système de notifications implémenté pour le module de congés.

## Vue d'ensemble

Le système de notifications permet d'alerter les utilisateurs sur différents événements liés aux congés :
- Demandes de congés nécessitant une approbation
- Changements de statut des demandes (approuvée, refusée, etc.)
- Rappels pour les congés à venir
- Alertes pour les conflits potentiels entre congés
- Notifications de quotas de congés faibles

L'architecture est conçue pour être :
- **Extensible** : Facile à étendre avec de nouveaux types de notifications
- **Réutilisable** : Les composants peuvent être utilisés dans d'autres parties de l'application
- **Typée** : Utilisation intensive de TypeScript pour garantir la cohérence
- **Réactive** : Mise à jour en temps réel des notifications sans rechargement de page

## Architecture

### Composants principaux

1. **Types de données** (`src/modules/leaves/types/notification.ts`)
   - Définition des interfaces, types et énumérations pour les notifications
   - Types spécifiques pour différentes catégories de notifications

2. **Service de notification** (`src/modules/leaves/services/notificationService.ts`)
   - Gestion de l'envoi et réception des notifications
   - Fonctions pour marquer les notifications comme lues
   - Stockage et récupération des notifications

3. **Service d'événements** (`src/modules/leaves/services/notificationEventService.ts`)
   - Écoute les événements liés aux congés et déclenche les notifications appropriées
   - Gère les vérifications périodiques et les rappels automatiques

4. **Hook personnalisé** (`src/modules/leaves/hooks/useNotifications.ts`)
   - Interface entre les services et les composants React
   - Gestion de l'état local des notifications
   - Méthodes pour interagir avec les notifications

5. **Composant d'affichage** (`src/modules/leaves/components/LeaveNotificationCenter.tsx`)
   - Interface utilisateur pour afficher les notifications
   - Groupement et formatage des notifications
   - Indicateur de notifications non lues

### Diagramme de flux

```
┌─────────────────┐      ┌───────────────────────┐      ┌──────────────────┐
│ Événement congé │─────▶│ NotificationEventService │───▶│ NotificationService │
└─────────────────┘      └───────────────────────┘      └──────────────────┘
                                                               │
                                                               ▼
┌─────────────────┐      ┌───────────────────────┐      ┌──────────────────┐
│    Interface    │◀─────│  useLeaveNotifications  │◀─────│    API Backend    │
│  utilisateur    │      │                       │      │                  │
└─────────────────┘      └───────────────────────┘      └──────────────────┘
```

## Types de notifications

Le système prend en charge plusieurs types de notifications liés aux congés :

| Type | Description | Priorité |
|------|-------------|----------|
| `LEAVE_REQUEST` | Nouvelle demande de congé | MEDIUM |
| `LEAVE_STATUS_UPDATE` | Mise à jour du statut d'un congé | HIGH |
| `LEAVE_REMINDER` | Rappel de congé imminent | LOW |
| `LEAVE_APPROVAL_NEEDED` | Approbation nécessaire | MEDIUM |
| `LEAVE_CONFLICT` | Conflit détecté | HIGH |
| `QUOTA_LOW` | Quota de congés presque épuisé | MEDIUM |
| `QUOTA_UPDATE` | Mise à jour des quotas | LOW |

## Implémentation et utilisation

### Création d'une notification

```typescript
// Depuis un service ou un contrôleur
import { leaveNotificationService } from '../services/notificationService';

// Exemple : Notifier d'un changement de statut
leaveNotificationService.notifyLeaveStatusUpdate(leave, updatedByUser);
```

### Déclenchement d'un événement

```typescript
// Depuis un service ou un contrôleur
import { notificationEventService } from '../services/notificationEventService';

// Exemple : Traitement d'un événement
notificationEventService.processEvent({
  eventType: LeaveNotificationType.LEAVE_REQUEST,
  leave: newLeave,
  updatedBy: currentUser
});
```

### Utilisation du hook dans un composant

```typescript
// Dans un composant React
import { useLeaveNotifications } from '../hooks/useNotifications';

const MyComponent = () => {
  const { 
    notifications, 
    unreadCount,
    markAsRead 
  } = useLeaveNotifications({
    autoFetch: true,
    limit: 10
  });

  // Utilisation des données...
};
```

### Intégration du centre de notifications

```typescript
// Dans un composant d'en-tête
import { LeaveNotificationCenter } from '../components/LeaveNotificationCenter';

const Header = () => {
  return (
    <header>
      {/* Autres éléments */}
      <LeaveNotificationCenter 
        compact={true}
        onNotificationClick={(notification) => {
          // Gérer le clic sur une notification
        }}
      />
    </header>
  );
};
```

## Configuration

Le système de notifications peut être configuré via le service de notification :

```typescript
notificationEventService.updateConfig({
  reminderDays: [1, 3, 5], // Jours avant congé pour envoyer des rappels
  quotaThreshold: 15,       // Pourcentage de quotas restants pour alerter
  approvalReminder: 2       // Jours entre les rappels d'approbation
});
```

## Tests

Tous les composants du système de notifications doivent être testés de manière appropriée :

1. **Tests unitaires** pour les services et hooks
2. **Tests d'intégration** pour vérifier l'interaction entre les composants
3. **Tests de bout en bout** pour valider le flux complet

## Améliorations futures

- Personnalisation des préférences de notification par utilisateur
- Support de canaux supplémentaires (SMS, applications mobiles)
- Statistiques et rapports sur les notifications
- Filtrage avancé et recherche dans l'historique des notifications
- Intégration avec d'autres modules de l'application

## Conclusion

Le système de notifications offre une architecture flexible et robuste pour gérer les différents événements liés aux congés. Il améliore significativement l'expérience utilisateur en fournissant des informations en temps réel et des alertes proactives pour les événements importants. 