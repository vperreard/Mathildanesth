# Interfaces d'API du module de congés

Ce document détaille les interfaces d'API exposées par le module de congés pour permettre l'intégration avec d'autres modules de l'application.

## Vue d'ensemble

Le module de congés expose plusieurs interfaces d'API qui permettent aux autres modules d'interagir avec les fonctionnalités liées aux congés. Ces interfaces comprennent :

1. **API REST** : Endpoints HTTP pour la gestion des congés et des quotas
2. **Bus d'événements** : Communication asynchrone via des événements
3. **Services partagés** : Services utilisables directement par d'autres modules
4. **Hooks React** : Composants réutilisables pour l'interface utilisateur

## API REST

### Base URL

```
/api/leaves
```

### Endpoints - Gestion des congés

| Méthode | Endpoint | Description | Permissions requises |
|---------|----------|-------------|----------------------|
| GET | `/api/leaves` | Récupérer la liste des congés | `VIEW_OWN_LEAVES`, `VIEW_TEAM_LEAVES`, `VIEW_ALL_LEAVES` |
| GET | `/api/leaves/:id` | Récupérer un congé spécifique | `VIEW_OWN_LEAVES`, `VIEW_TEAM_LEAVES`, `VIEW_ALL_LEAVES` |
| POST | `/api/leaves` | Créer une demande de congé | `REQUEST_LEAVE` |
| PUT | `/api/leaves/:id` | Mettre à jour un congé | `REQUEST_LEAVE` |
| DELETE | `/api/leaves/:id` | Supprimer un congé | `DELETE_LEAVE` |
| POST | `/api/leaves/:id/approve` | Approuver un congé | `APPROVE_TEAM_LEAVES`, `APPROVE_ALL_LEAVES` |
| POST | `/api/leaves/:id/reject` | Rejeter un congé | `APPROVE_TEAM_LEAVES`, `APPROVE_ALL_LEAVES` |
| POST | `/api/leaves/:id/cancel` | Annuler un congé | `CANCEL_OWN_LEAVE`, `CANCEL_ANY_LEAVE` |

#### Exemple de requête pour créer un congé

```http
POST /api/leaves
Content-Type: application/json

{
  "userId": "user123",
  "type": "ANNUAL",
  "startDate": "2023-07-15",
  "endDate": "2023-07-20",
  "comment": "Vacances d'été",
  "isRecurring": false,
  "halfDay": false
}
```

#### Exemple de réponse

```json
{
  "id": "leave456",
  "userId": "user123",
  "type": "ANNUAL",
  "startDate": "2023-07-15",
  "endDate": "2023-07-20",
  "comment": "Vacances d'été",
  "status": "PENDING",
  "isRecurring": false,
  "halfDay": false,
  "countedDays": 4,
  "createdAt": "2023-06-10T14:30:00Z",
  "updatedAt": "2023-06-10T14:30:00Z"
}
```

### Endpoints - Gestion des quotas

| Méthode | Endpoint | Description | Permissions requises |
|---------|----------|-------------|----------------------|
| GET | `/api/leaves/quotas` | Récupérer les quotas de l'utilisateur courant | `VIEW_OWN_LEAVES` |
| GET | `/api/leaves/quotas/:userId` | Récupérer les quotas d'un utilisateur spécifique | `VIEW_TEAM_LEAVES`, `VIEW_ALL_LEAVES` |
| PUT | `/api/leaves/quotas/:userId` | Mettre à jour les quotas d'un utilisateur | `MANAGE_QUOTAS` |
| POST | `/api/leaves/quotas/transfer` | Transférer des quotas | `TRANSFER_QUOTAS` |
| POST | `/api/leaves/quotas/carryover` | Reporter des quotas | `CARRY_OVER_QUOTAS` |

#### Exemple de requête pour transférer des quotas

```http
POST /api/leaves/quotas/transfer
Content-Type: application/json

{
  "userId": "user123",
  "fromType": "RECOVERY",
  "toType": "ANNUAL",
  "amount": 2,
  "reason": "Conversion des jours de récupération"
}
```

### Endpoints - Rapports et statistiques

| Méthode | Endpoint | Description | Permissions requises |
|---------|----------|-------------|----------------------|
| GET | `/api/leaves/reports/leave_usage` | Rapport d'utilisation des congés | `VIEW_REPORTS` |
| GET | `/api/leaves/reports/leave_balance` | Rapport des soldes de congés | `VIEW_REPORTS` |
| GET | `/api/leaves/reports/leave_distribution` | Rapport de distribution des congés | `VIEW_REPORTS` |
| POST | `/api/leaves/reports/:type/export` | Exporter un rapport | `EXPORT_REPORTS` |
| GET | `/api/leaves/reports/export/:id/status` | Vérifier le statut d'une exportation | `EXPORT_REPORTS` |
| GET | `/api/leaves/reports/export/:id/download` | Télécharger un rapport exporté | `EXPORT_REPORTS` |

### Endpoints - Gestion des permissions

| Méthode | Endpoint | Description | Permissions requises |
|---------|----------|-------------|----------------------|
| GET | `/api/leaves/permissions` | Récupérer toutes les permissions personnalisées | `MANAGE_LEAVE_RULES` |
| GET | `/api/leaves/permissions/:userId` | Récupérer les permissions d'un utilisateur | `MANAGE_LEAVE_RULES` |
| PUT | `/api/leaves/permissions/:userId` | Mettre à jour les permissions d'un utilisateur | `MANAGE_LEAVE_RULES` |
| DELETE | `/api/leaves/permissions/:userId` | Réinitialiser les permissions d'un utilisateur | `MANAGE_LEAVE_RULES` |

### Endpoints - Audit

| Méthode | Endpoint | Description | Permissions requises |
|---------|----------|-------------|----------------------|
| GET | `/api/audit/entries` | Rechercher des entrées d'audit | `VIEW_AUDIT_LOGS` |
| GET | `/api/audit/entries/:id` | Récupérer une entrée d'audit spécifique | `VIEW_AUDIT_LOGS` |
| POST | `/api/audit/entries` | Créer une entrée d'audit | Authentification requise |

## Bus d'événements

Le module de congés publie et consomme des événements via le bus d'événements central (`EventBusService`).

### Types d'événements publiés

| Type d'événement | Payload | Description |
|------------------|---------|-------------|
| `LEAVE_CREATED` | `Leave` | Un congé a été créé |
| `LEAVE_UPDATED` | `Leave` | Un congé a été mis à jour |
| `LEAVE_APPROVED` | `Leave` | Un congé a été approuvé |
| `LEAVE_REJECTED` | `Leave` | Un congé a été rejeté |
| `LEAVE_CANCELLED` | `Leave` | Un congé a été annulé |
| `LEAVE_DELETED` | `Leave` | Un congé a été supprimé |
| `QUOTA_UPDATED` | `QuotaUpdate` | Les quotas d'un utilisateur ont été mis à jour |
| `QUOTA_TRANSFERRED` | `QuotaTransfer` | Des quotas ont été transférés |
| `QUOTA_CARRIED_OVER` | `QuotaCarryOver` | Des quotas ont été reportés |
| `AUDIT_ACTION` | `AuditEntry` | Une action d'audit a été enregistrée |

### Exemple d'abonnement aux événements

```typescript
import { eventBus, IntegrationEventType } from '../../integration/services/EventBusService';

// S'abonner aux événements d'approbation de congés
const unsubscribe = eventBus.subscribe(
  IntegrationEventType.LEAVE_APPROVED,
  (event) => {
    const leave = event.payload;
    console.log(`Congé approuvé: ${leave.id}`);
    // Traiter l'événement
  }
);

// Se désabonner lorsque ce n'est plus nécessaire
unsubscribe();
```

### Exemple de publication d'événement

```typescript
import { eventBus, IntegrationEventType } from '../../integration/services/EventBusService';

// Publier un événement
eventBus.publish({
  type: IntegrationEventType.LEAVE_CREATED,
  source: 'leave-module',
  payload: leaveData,
  userId: leaveData.userId
});
```

## Services partagés

Le module de congés expose plusieurs services qui peuvent être directement utilisés par d'autres modules.

### LeavePermissionService

Service pour vérifier les permissions liées aux congés.

```typescript
import { leavePermissionService, LeavePermission } from '../../leaves/permissions/LeavePermissionService';

// Vérifier si un utilisateur a une permission spécifique
const canViewAllLeaves = await leavePermissionService.hasPermission(
  LeavePermission.VIEW_ALL_LEAVES,
  currentUser
);

// Vérifier plusieurs permissions à la fois
const canManageQuotas = await leavePermissionService.hasPermissions(
  [LeavePermission.MANAGE_QUOTAS, LeavePermission.TRANSFER_QUOTAS],
  true,  // require all permissions (AND)
  currentUser
);
```

### AuditService

Service pour journaliser les actions importantes.

```typescript
import { auditService, AuditActionType, AuditSeverity } from '../../leaves/services/AuditService';

// Créer une entrée d'audit
await auditService.createAuditEntry({
  actionType: AuditActionType.SYSTEM_ACCESS,
  userId: currentUser.id,
  description: "Accès au module de planning",
  severity: AuditSeverity.INFO,
  metadata: { section: "planning" }
});
```

### LeaveReportApi

API pour accéder aux données de rapports de congés.

```typescript
import { leaveReportApi, ReportType } from '../../leaves/api/leaveReportApi';

// Obtenir un rapport d'utilisation des congés
const leaveUsageReport = await leaveReportApi.getLeaveUsageReport({
  startDate: new Date('2023-01-01'),
  endDate: new Date('2023-12-31'),
  departmentIds: ['dept123']
});

// Exporter un rapport
const exportTaskId = await leaveReportApi.exportReport(
  ReportType.LEAVE_BALANCE,
  { userIds: ['user123', 'user456'] },
  { format: 'excel', fileName: 'leave-balances.xlsx' }
);
```

## Hooks React

Le module de congés fournit plusieurs hooks React pour faciliter l'intégration au niveau de l'interface utilisateur.

### useLeaveData

Hook pour accéder aux données de congés.

```typescript
import { useLeaveData } from '../../leaves/hooks/useLeaveData';

function MyComponent() {
  const { 
    leaves, 
    loading, 
    error, 
    fetchLeaves,
    fetchLeaveById
  } = useLeaveData();

  useEffect(() => {
    // Charger les congés au montage du composant
    fetchLeaves({ startDate: '2023-01-01', endDate: '2023-12-31' });
  }, [fetchLeaves]);

  return (
    <div>
      {loading && <p>Chargement des congés...</p>}
      {error && <p>Erreur: {error.message}</p>}
      <ul>
        {leaves.map(leave => (
          <li key={leave.id}>{leave.type}: {leave.startDate} - {leave.endDate}</li>
        ))}
      </ul>
    </div>
  );
}
```

### useLeaveValidation

Hook pour valider les demandes de congés.

```typescript
import { useLeaveValidation } from '../../leaves/hooks/useLeaveValidation';

function LeaveRequestForm() {
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  
  const { 
    validate, 
    errors, 
    isValid 
  } = useLeaveValidation();

  const handleSubmit = () => {
    // Valider la demande de congé
    const validationResult = validate({
      startDate,
      endDate,
      type: 'ANNUAL',
      userId: currentUser.id
    });

    if (validationResult.isValid) {
      // Soumettez la demande
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Champs du formulaire */}
      {errors.length > 0 && (
        <div className="errors">
          {errors.map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
      <button type="submit" disabled={!isValid}>
        Soumettre
      </button>
    </form>
  );
}
```

### useLeaveNotifications

Hook pour gérer les notifications liées aux congés.

```typescript
import { useLeaveNotifications } from '../../leaves/hooks/useLeaveNotifications';

function NotificationCenter() {
  const { 
    notifications, 
    markAsRead, 
    hasUnread, 
    unreadCount 
  } = useLeaveNotifications();

  return (
    <div>
      <h3>Notifications {unreadCount > 0 && `(${unreadCount})`}</h3>
      <ul>
        {notifications.map(notification => (
          <li 
            key={notification.id}
            className={notification.read ? 'read' : 'unread'}
            onClick={() => markAsRead(notification.id)}
          >
            {notification.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Types de données

### Leave

```typescript
interface Leave {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;  // Format ISO
  endDate: string;    // Format ISO
  status: LeaveStatus;
  comment?: string;
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  occurrences?: Leave[];
  halfDay: boolean;
  halfDayPeriod?: 'AM' | 'PM';
  countedDays: number;
  createdAt: string;  // Format ISO
  updatedAt: string;  // Format ISO
  createdBy?: string;
  updatedBy?: string;
  approvedBy?: string;
  approvedAt?: string; // Format ISO
  rejectedBy?: string;
  rejectedAt?: string; // Format ISO
  cancellationReason?: string;
}
```

### LeaveType

```typescript
enum LeaveType {
  ANNUAL = 'ANNUAL',           // Congé annuel
  RECOVERY = 'RECOVERY',       // Récupération
  SICK = 'SICK',               // Maladie
  UNPAID = 'UNPAID',           // Sans solde
  SPECIAL = 'SPECIAL',         // Congé spécial
  MATERNITY = 'MATERNITY',     // Maternité
  PATERNITY = 'PATERNITY',     // Paternité
  TRAINING = 'TRAINING'        // Formation
}
```

### LeaveStatus

```typescript
enum LeaveStatus {
  PENDING = 'PENDING',     // En attente
  APPROVED = 'APPROVED',   // Approuvé
  REJECTED = 'REJECTED',   // Rejeté
  CANCELLED = 'CANCELLED'  // Annulé
}
```

### QuotaUpdate

```typescript
interface QuotaUpdate {
  userId: string;
  leaveType: LeaveType;
  amount: number;
  year: number;
  reason?: string;
  updatedBy: string;
}
```

### QuotaTransfer

```typescript
interface QuotaTransfer {
  id: string;
  userId: string;
  fromType: LeaveType;
  toType: LeaveType;
  amount: number;
  reason?: string;
  createdAt: string;  // Format ISO
  createdBy: string;
}
```

### AuditEntry

```typescript
interface AuditEntry {
  id?: string;
  timestamp?: Date;
  actionType: AuditActionType;
  userId: string;
  userRole?: string;
  targetId?: string;
  targetType?: string;
  description: string;
  severity: AuditSeverity;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}
```

## Codes d'erreur

| Code | Description |
|------|-------------|
| `LEAVE_001` | Dates invalides (la date de fin doit être postérieure à la date de début) |
| `LEAVE_002` | Chevauchement avec un congé existant |
| `LEAVE_003` | Quota insuffisant |
| `LEAVE_004` | Congé déjà approuvé/rejeté/annulé |
| `LEAVE_005` | Permission refusée |
| `LEAVE_006` | Utilisateur non trouvé |
| `LEAVE_007` | Période de congé non modifiable (trop proche) |
| `LEAVE_008` | Jours fériés ou week-ends inclus |
| `LEAVE_009` | Format de date invalide |
| `LEAVE_010` | Type de congé invalide |
| `QUOTA_001` | Quota négatif non autorisé |
| `QUOTA_002` | Type de congé non transférable |
| `QUOTA_003` | Montant du transfert supérieur au quota disponible |
| `AUDIT_001` | Erreur lors de la création d'une entrée d'audit |
| `AUTH_001` | Authentification requise |
| `AUTH_002` | Permission insuffisante |

## Versions de l'API

L'API actuelle est en version `v1`. Toutes les routes commencent par `/api/v1/leaves`. Pour des raisons de compatibilité, l'URL `/api/leaves` redirige vers la dernière version.

### Gestion des changements

- Les changements mineurs (ajout de nouveaux champs optionnels) sont effectués sans changement de version
- Les changements majeurs (modifications de structure, suppression de champs) entraînent un changement de version
- Les anciennes versions restent disponibles pendant au moins 6 mois après l'introduction d'une nouvelle version

## Sécurité

- Toutes les requêtes nécessitent une authentification via JWT
- Les permissions sont vérifiées pour chaque opération
- Les actions sensibles sont enregistrées dans le journal d'audit
- Les données sensibles sont masquées dans les journaux

## Module de Gestion des Compétences

Ce module permet de gérer un référentiel de compétences et de les assigner aux utilisateurs.

### Base URL pour les compétences

```
/api/skills
/api/users
/api/me
```

### Endpoints - Gestion du référentiel des Compétences (Admin)

| Méthode | Endpoint              | Description                                   | Permissions requises |
|---------|-----------------------|-----------------------------------------------|----------------------|
| GET     | `/api/skills`         | Lister toutes les compétences                 | Admin                |
| POST    | `/api/skills`         | Créer une nouvelle compétence                 | Admin                |
| GET     | `/api/skills/:skillId`| Récupérer une compétence spécifique           | Admin                |
| PUT     | `/api/skills/:skillId`| Mettre à jour une compétence                  | Admin                |
| DELETE  | `/api/skills/:skillId`| Supprimer une compétence (et ses assignations)| Admin                |

#### Exemple de payload pour POST /api/skills

```json
{
  "name": "Intubation Difficile",
  "description": "Maîtrise des techniques d'intubation en cas de difficulté prévue ou imprévue."
}
```

#### Exemple de réponse pour GET /api/skills

```json
[
  {
    "id": "clxmq3w6d000008l3gq2h4v8k",
    "name": "Intubation Difficile",
    "description": "Maîtrise des techniques d'intubation en cas de difficulté prévue ou imprévue.",
    "createdAt": "2024-05-15T10:00:00.000Z",
    "updatedAt": "2024-05-15T10:00:00.000Z"
  },
  {
    "id": "clxmq4x9z000108l3bksj2c1f",
    "name": "Anesthésie Loco-Régionale Échoguidée",
    "description": "Compétence en ALR sous guidage échographique.",
    "createdAt": "2024-05-15T10:05:00.000Z",
    "updatedAt": "2024-05-15T10:05:00.000Z"
  }
]
```

### Endpoints - Gestion des Compétences Utilisateur

| Méthode | Endpoint                          | Description                                       | Permissions requises |
|---------|-----------------------------------|---------------------------------------------------|----------------------|
| GET     | `/api/users/:userId/skills`       | Lister les compétences assignées à un utilisateur | Admin                |
| POST    | `/api/users/:userId/skills`       | Assigner une compétence à un utilisateur          | Admin                |
| DELETE  | `/api/users/:userId/skills/:skillId`| Retirer une compétence d'un utilisateur         | Admin                |
| GET     | `/api/me/skills`                  | Lister les propres compétences de l'utilisateur connecté | Utilisateur Connecté |

#### Exemple de payload pour POST /api/users/:userId/skills

```json
{
  "skillId": "clxmq3w6d000008l3gq2h4v8k"
}
```

#### Exemple de réponse pour GET /api/users/:userId/skills et GET /api/me/skills

```json
[
  {
    "id": "clxmr6t0p000208l3c9fn0z7v", // ID de l'enregistrement UserSkill
    "userId": "user_admin_id_or_target_user_id",
    "skillId": "clxmq3w6d000008l3gq2h4v8k",
    "assignedAt": "2024-05-15T11:00:00.000Z",
    "assignedBy": "user_admin_id",
    "skill": {
      "id": "clxmq3w6d000008l3gq2h4v8k",
      "name": "Intubation Difficile",
      "description": "Maîtrise des techniques d'intubation en cas de difficulté prévue ou imprévue.",
      "createdAt": "2024-05-15T10:00:00.000Z",
      "updatedAt": "2024-05-15T10:00:00.000Z"
    }
  }
]
``` 