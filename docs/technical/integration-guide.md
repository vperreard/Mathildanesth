# Guide d'intégration pour le module de congés

Ce guide explique comment intégrer de nouveaux modules avec le système de congés en utilisant l'architecture d'intégration basée sur le bus d'événements, le service d'audit et le service de permissions.

## Prérequis

Avant de commencer l'intégration, assurez-vous de comprendre :

1.  L'architecture d'intégration globale (voir `docs/technical/integration-architecture.md`)
2.  Le fonctionnement du `EventBusService` (bus d'événements central)
3.  Le fonctionnement du `LeavePermissionService` (gestion des permissions)
4.  Le fonctionnement du `AuditService` (journalisation des actions)

## Étapes d'intégration

### 1. Identifier les points d'intégration

Déterminez les interactions nécessaires entre votre module et le système centralisé :

- **Événements à écouter** : Quels `IntegrationEventType` publiés par d'autres modules (notamment `LeaveModule`) sont pertinents pour votre module ?
- **Événements à publier** : Quels événements votre module doit-il publier (via `EventBusService`) pour informer les autres modules (ex: une mise à jour du planning affectant un congé) ?
- **Permissions requises** : Votre module doit-il vérifier des permissions spécifiques via `LeavePermissionService` avant d'effectuer certaines actions ?
- **Actions à auditer** : Quelles actions de votre module doivent être journalisées via `AuditService` ?

### 2. Créer un service d'intégration (si nécessaire)

Pour les intégrations complexes, il peut être utile de créer un service dédié dans votre module pour encapsuler la logique d'interaction avec les services centraux (`EventBusService`, `AuditService`, `LeavePermissionService`).

```typescript
// src/modules/your-module/services/YourIntegrationService.ts
import { eventBus, IntegrationEventType, IntegrationEvent } from '@/modules/integration/services/EventBusService';
import { auditService, AuditActionType, AuditSeverity } from '@/modules/conges/services/AuditService';
import { leavePermissionService, LeavePermission } from '@/modules/conges/permissions/LeavePermissionService';
import { User } from '@/types/user'; // Assurez-vous d'importer les types nécessaires

export class YourIntegrationService {
    private static instance: YourIntegrationService;
    private readonly subscriptions: (() => void)[] = [];

    public static getInstance(): YourIntegrationService {
        if (!YourIntegrationService.instance) {
            YourIntegrationService.instance = new YourIntegrationService();
        }
        return YourIntegrationService.instance;
    }

    private constructor() {
        this.initializeEventSubscriptions();
        console.debug('[YourIntegrationService] Initialized');
    }

    private initializeEventSubscriptions(): void {
        // S'abonner aux événements pertinents
        this.subscriptions.push(
            eventBus.subscribe<any>(
                IntegrationEventType.LEAVE_APPROVED,
                this.handleLeaveApproved.bind(this)
            )
            // Ajoutez d'autres abonnements ici...
        );
        console.debug('[YourIntegrationService] Event subscriptions initialized');
    }

    // --- Gestionnaires d'événements entrants ---
    private async handleLeaveApproved(event: IntegrationEvent<any>): Promise<void> {
        const leave = event.payload;
        const userId = event.userId;
        console.debug(`[YourIntegrationService] Received LEAVE_APPROVED for leave ${leave.id}`);

        // Exemple : Vérifier une permission avant de traiter
        const currentUser = await this.getCurrentUser(); // Méthode à implémenter
        const canProcess = await leavePermissionService.hasPermission(LeavePermission.VIEW_TEAM_LEAVES, currentUser);

        if (canProcess) {
            // Logique métier spécifique à votre module
            console.log(`Processing approved leave ${leave.id} for user ${userId}`);
            // ... appeler les fonctions de votre module ...

            // Journaliser l'action si nécessaire
            await this.logAction(userId, 'Processed approved leave', { leaveId: leave.id });
        } else {
            console.warn(`[YourIntegrationService] Permission denied to process approved leave ${leave.id}`);
        }
    }

    // --- Publication d'événements sortants ---
    public async publishPlanningUpdate(updateData: any, actorUserId: string): Promise<void> {
        console.debug(`[YourIntegrationService] Publishing PLANNING_EVENT_UPDATED`);
        eventBus.publish({
            type: IntegrationEventType.PLANNING_EVENT_UPDATED,
            source: 'your-module',
            payload: updateData,
            userId: actorUserId
        });

        // Journaliser la publication
        await this.logAction(actorUserId, 'Published planning update', updateData);
    }

    // --- Interaction avec AuditService ---
    public async logAction(userId: string | undefined, description: string, metadata: Record<string, any>): Promise<void> {
        if (!userId) {
            console.warn('[YourIntegrationService] Cannot log action without userId');
            return;
        }
        console.debug(`[YourIntegrationService] Logging action: ${description}`);
        try {
            await auditService.createAuditEntry({
                actionType: AuditActionType.SYSTEM_ACCESS, // Utilisez un type plus spécifique si possible
                userId: userId,
                description: `[YourModule] ${description}`,
                severity: AuditSeverity.INFO,
                metadata: metadata
            });
        } catch (error) {
            console.error(`[YourIntegrationService] Failed to log audit entry:`, error);
        }
    }

    // --- Interaction avec LeavePermissionService ---
    public async checkPermission(permission: LeavePermission, user?: User): Promise<boolean> {
        const effectiveUser = user || await this.getCurrentUser();
        if (!effectiveUser) return false;

        console.debug(`[YourIntegrationService] Checking permission ${permission} for user ${effectiveUser.id}`);
        return leavePermissionService.hasPermission(permission, effectiveUser);
    }

    // --- Méthodes utilitaires (exemples) ---
    private async getCurrentUser(): Promise<User | null> {
        // Implémentez la logique pour obtenir l'utilisateur actuel
        // par exemple, via getSession() de next-auth
        try {
            const { getSession } = await import('next-auth/react');
            const session = await getSession();
            return session?.user || null;
        } catch (error) {
            console.error('[YourIntegrationService] Error fetching current user:', error);
            return null;
        }
    }

    // --- Nettoyage ---
    public dispose(): void {
        console.debug('[YourIntegrationService] Disposing subscriptions...');
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions.length = 0; // Vider le tableau
        console.debug('[YourIntegrationService] Disposed');
    }
}

// Exporter une instance singleton si approprié pour votre module
export const yourIntegrationService = YourIntegrationService.getInstance();
```

### 3. S'abonner aux événements (`eventBus.subscribe`)

Dans votre service d'intégration ou directement dans votre logique métier, abonnez-vous aux `IntegrationEventType` qui vous intéressent en fournissant un gestionnaire (callback).

```typescript
import { eventBus, IntegrationEventType, IntegrationEvent } from '@/modules/integration/services/EventBusService';

function handleLeaveCancelled(event: IntegrationEvent<any>) {
    const leaveData = event.payload;
    console.log(`Leave ${leaveData.id} cancelled for user ${event.userId}. Reason: ${leaveData.reason}`);
    // ... logique pour annuler une réservation de ressource, par exemple ...
}

const unsubscribeLeaveCancelled = eventBus.subscribe(
    IntegrationEventType.LEAVE_CANCELLED,
    handleLeaveCancelled
);

// N'oubliez pas d'appeler unsubscribeLeaveCancelled() lors du nettoyage.
```

### 4. Implémenter les gestionnaires d'événements

Vos gestionnaires doivent :
- Extraire les données pertinentes du `payload` de l'événement.
- Effectuer la logique métier nécessaire dans votre module.
- Gérer les erreurs potentielles (ex: `try...catch`).
- Éventuellement, vérifier les permissions (`LeavePermissionService`) avant d'agir.
- Éventuellement, journaliser l'action (`AuditService`).

### 5. Publier des événements (`eventBus.publish`)

Lorsque votre module effectue une action qui doit être connue des autres, publiez un événement sur le bus.

```typescript
import { eventBus, IntegrationEventType } from '@/modules/integration/services/EventBusService';

function publishResourceBookingUpdate(bookingDetails: any, actorUserId: string) {
    eventBus.publish({
        type: IntegrationEventType.PLANNING_EVENT_UPDATED, // Ou un type plus spécifique si défini
        source: 'resource-booking-module', // Identifiant de votre module
        payload: {
            bookingId: bookingDetails.id,
            resourceId: bookingDetails.resourceId,
            newStatus: bookingDetails.status,
            // ... autres détails pertinents
        },
        userId: actorUserId // L'ID de l'utilisateur qui a effectué l'action
    });
}
```

**Important** : Incluez toujours `source` et `userId` (si applicable) dans les événements publiés pour la traçabilité et le contrôle d'accès.

### 6. Gérer les permissions (`LeavePermissionService`)

Avant d'effectuer des actions basées sur des événements ou des requêtes API, vérifiez les permissions de l'utilisateur concerné.

```typescript
import { leavePermissionService, LeavePermission } from '@/modules/conges/permissions/LeavePermissionService';
import { User } from '@/types/user'; // Assurez-vous que le type User est correctement défini

async function canUserManageResourceBookings(user: User): Promise<boolean> {
    // Exemple : vérifier si l'utilisateur peut gérer les réservations de son équipe
    // (Suppose qu'une permission spécifique existe ou qu'on mappe à une permission existante)
    const hasTeamViewPermission = await leavePermissionService.hasPermission(LeavePermission.VIEW_TEAM_LEAVES, user);
    // Ajoutez d'autres vérifications si nécessaire
    return hasTeamViewPermission;
}

// Utilisation :
const currentUser = await getCurrentUser(); // Obtenir l'utilisateur actuel
if (currentUser && await canUserManageResourceBookings(currentUser)) {
    // ... permettre l'action
} else {
    // ... refuser l'action
}
```

### 7. Journaliser les actions (`AuditService`)

Utilisez `AuditService` pour tracer les actions importantes effectuées par votre module ou en réponse à des événements.

```typescript
import { auditService, AuditActionType, AuditSeverity } from '@/modules/conges/services/AuditService';

async function logResourceBookingCancellation(userId: string, bookingId: string, reason: string): Promise<void> {
    await auditService.createAuditEntry({
        actionType: AuditActionType.PLANNING_EVENT_DELETED, // Utilisez le type d'audit le plus approprié
        userId: userId,
        targetId: bookingId,
        targetType: 'resourceBooking',
        description: `Resource booking cancelled. Reason: ${reason}`,
        severity: AuditSeverity.LOW,
        metadata: { bookingId, reason }
    });
}
```

### 8. Initialisation et Nettoyage

- Assurez-vous que votre service d'intégration (si vous en avez un) est initialisé correctement (par exemple, au chargement du module).
- Implémentez une méthode `dispose` dans votre service pour vous désabonner de tous les événements (`unsubscribe()`) lorsque le module ou le composant est détruit, afin d'éviter les fuites de mémoire.

## Bonnes pratiques

1.  **Couplage Faible** : N'appelez pas directement les méthodes internes d'autres modules. Passez par le bus d'événements ou des API dédiées.
2.  **Idempotence** : Si possible, concevez vos gestionnaires d'événements pour qu'ils soient idempotents (les exécuter plusieurs fois avec le même événement produit le même résultat).
3.  **Gestion des erreurs** : Encapsulez la logique des gestionnaires dans des `try...catch` et journalisez les erreurs.
4.  **Performance** : Évitez les opérations longues et bloquantes dans les gestionnaires d'événements. Utilisez `async/await` et envisagez des traitements en arrière-plan si nécessaire.
5.  **Sécurité** : Vérifiez systématiquement les permissions (`LeavePermissionService`) avant d'agir sur des données ou d'exposer des fonctionnalités.
6.  **Audit** : Journalisez toutes les actions significatives (`AuditService`) pour la traçabilité.
7.  **Nettoyage** : Désabonnez-vous (`unsubscribe()`) des événements lorsque ce n'est plus nécessaire.

## Dépannage

- **Événement non reçu** : Vérifiez l'orthographe du `IntegrationEventType`, l'initialisation du service, et si l'événement est bien publié par la source.
- **Erreur de permission** : Utilisez `LeavePermissionService.getUserPermissions(userId)` pour déboguer les permissions effectives d'un utilisateur. Vérifiez les logs d'audit pour les changements de permissions.
- **Action non auditée** : Assurez-vous que `AuditService.createAuditEntry` est appelé aux bons endroits avec les bonnes informations. 