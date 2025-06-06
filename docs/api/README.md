# API Documentation - Mathildanesth

## Vue d'ensemble

L'API Mathildanesth est construite avec Next.js 15 App Router, offrant des endpoints RESTful sécurisés pour la gestion des plannings médicaux.

## Base URL

```
Production: https://mathildanesth.example.com/api
Development: http://localhost:3000/api
```

## Authentification

### JWT Token Authentication

Tous les endpoints (sauf `/auth/login`) nécessitent un token JWT valide.

**Headers requis :**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Authentification :**
```typescript
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "success": true,
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "nom": "Dupont",
    "prenom": "Jean",
    "role": "MAR"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

## Structure des Réponses

### Format Standard
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}
```

### Codes de Statut HTTP
- `200` - Succès
- `201` - Créé
- `400` - Requête invalide
- `401` - Non authentifié
- `403` - Non autorisé
- `404` - Non trouvé
- `422` - Validation échouée
- `500` - Erreur serveur

## Endpoints Principaux

### 1. Authentification (`/api/auth/`)

#### POST /api/auth/login
Connexion utilisateur

**Body :**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response :**
```json
{
  "success": true,
  "user": {
    "id": "string",
    "email": "string",
    "nom": "string",
    "prenom": "string",
    "role": "MAR|IADE|ADMIN_TOTAL|ADMIN_PARTIEL|CHIRURGIEN|USER"
  },
  "token": "string"
}
```

#### POST /api/auth/logout
Déconnexion utilisateur

#### GET /api/auth/me
Informations utilisateur connecté

#### POST /api/auth/refresh
Renouvellement token JWT

### 2. Gestion des Congés (`/api/leaves/`)

#### GET /api/leaves
Liste des demandes de congés

**Query Parameters :**
- `page` - Numéro de page (défaut: 1)
- `limit` - Nombre d'éléments par page (défaut: 20)
- `status` - Filtrer par statut (PENDING|APPROVED|REJECTED)
- `userId` - Filtrer par utilisateur
- `startDate` - Date de début (format ISO)
- `endDate` - Date de fin (format ISO)

**Response :**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "userId": "string",
      "startDate": "2025-06-01T00:00:00Z",
      "endDate": "2025-06-05T00:00:00Z",
      "type": "ANNUAL",
      "status": "PENDING",
      "reason": "string",
      "quotaUsed": 5.0,
      "user": {
        "nom": "string",
        "prenom": "string"
      }
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### POST /api/leaves
Créer une demande de congé

**Body :**
```json
{
  "startDate": "2025-06-01T00:00:00Z",
  "endDate": "2025-06-05T00:00:00Z",
  "type": "ANNUAL",
  "reason": "Vacances été",
  "isRecurring": false,
  "recurringConfig": null
}
```

#### PUT /api/leaves/[id]
Modifier une demande de congé

#### DELETE /api/leaves/[id]
Supprimer une demande de congé

#### POST /api/leaves/[id]/approve
Approuver une demande (Admin seulement)

#### POST /api/leaves/[id]/reject
Rejeter une demande (Admin seulement)

#### GET /api/leaves/quotas
Consulter les quotas de congés

### 3. Planning Bloc Opératoire (`/api/bloc-operatoire/`)

#### GET /api/bloc-operatoire/planning
Planning des blocs opératoires

**Query Parameters :**
- `date` - Date spécifique (format YYYY-MM-DD)
- `siteId` - Filtrer par site
- `salleId` - Filtrer par salle

#### POST /api/bloc-operatoire/planning
Créer/Mettre à jour planning

**Body :**
```json
{
  "date": "2025-06-01",
  "siteId": "string",
  "assignments": [
    {
      "salleId": "string",
      "userId": "string",
      "startTime": "08:00",
      "endTime": "16:00",
      "role": "MAR"
    }
  ]
}
```

#### GET /api/bloc-operatoire/salles
Liste des salles d'opération

#### POST /api/bloc-operatoire/salles
Créer une salle (Admin seulement)

#### PUT /api/bloc-operatoire/salles/[id]
Modifier une salle (Admin seulement)

#### DELETE /api/bloc-operatoire/salles/[id]
Supprimer une salle (Admin seulement)

### 4. Administration (`/api/admin/`)

#### GET /api/admin/users
Liste des utilisateurs (Admin seulement)

**Query Parameters :**
- `role` - Filtrer par rôle
- `siteId` - Filtrer par site
- `isActive` - Filtrer par statut actif

#### POST /api/admin/users
Créer un utilisateur (Admin seulement)

**Body :**
```json
{
  "email": "string",
  "password": "string",
  "nom": "string",
  "prenom": "string",
  "role": "MAR|IADE|ADMIN_TOTAL|ADMIN_PARTIEL|CHIRURGIEN|USER",
  "siteIds": ["string"]
}
```

#### PUT /api/admin/users/[id]
Modifier un utilisateur (Admin seulement)

#### DELETE /api/admin/users/[id]
Supprimer un utilisateur (Admin seulement)

#### GET /api/admin/stats
Statistiques administratives

#### GET /api/admin/audit-logs
Logs d'audit (Admin seulement)

### 5. Planning Personnel (`/api/planning/`)

#### GET /api/planning/my-week
Planning de la semaine courante

**Query Parameters :**
- `date` - Date de référence (format YYYY-MM-DD)

#### GET /api/planning/team
Planning de l'équipe

#### POST /api/planning/swap-request
Demande d'échange de garde

**Body :**
```json
{
  "targetUserId": "string",
  "myAssignmentId": "string",
  "targetAssignmentId": "string",
  "reason": "string"
}
```

### 6. Notifications (`/api/notifications/`)

#### GET /api/notifications
Liste des notifications

#### PUT /api/notifications/[id]/read
Marquer comme lue

#### POST /api/notifications/mark-all-read
Marquer toutes comme lues

### 7. Règles de Gestion (`/api/rules/`)

#### GET /api/rules
Liste des règles actives

#### POST /api/rules/validate
Valider un planning contre les règles

**Body :**
```json
{
  "planningData": {
    "date": "2025-06-01",
    "assignments": [
      {
        "userId": "string",
        "salleId": "string",
        "startTime": "08:00",
        "endTime": "16:00"
      }
    ]
  }
}
```

**Response :**
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "violations": [
      {
        "ruleId": "string",
        "ruleName": "Supervision obligatoire",
        "severity": "ERROR",
        "message": "Aucun MAR superviseur affecté au secteur Cardio",
        "affectedAssignments": ["assignment_id"]
      }
    ]
  }
}
```

## WebSocket Events

### Connexion
```javascript
const socket = io('/api/ws', {
  auth: {
    token: 'jwt_token'
  }
});
```

### Événements Disponibles

#### planning:updated
Mise à jour de planning en temps réel
```javascript
socket.on('planning:updated', (data) => {
  console.log('Planning mis à jour:', data);
});
```

#### notification:new
Nouvelle notification
```javascript
socket.on('notification:new', (notification) => {
  console.log('Nouvelle notification:', notification);
});
```

#### leave:status:changed
Changement de statut de congé
```javascript
socket.on('leave:status:changed', (data) => {
  console.log('Statut congé modifié:', data);
});
```

## Rate Limiting

### Limites par Défaut
- **Général** : 100 requêtes/minute
- **Auth** : 5 tentatives/minute
- **Admin** : 200 requêtes/minute

### Headers de Réponse
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Validation des Données

### Schémas Zod
Tous les endpoints utilisent Zod pour la validation :

```typescript
// Exemple : Création d'un congé
const createLeaveSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  type: z.enum(['ANNUAL', 'SICK', 'TRAINING', 'SPECIAL', 'UNPAID']),
  reason: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringConfig: z.object({
    frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
    interval: z.number().min(1),
    endDate: z.string().datetime().optional()
  }).optional()
});
```

## Gestion des Erreurs

### Types d'Erreurs
```typescript
interface ApiError {
  message: string;
  code: string;
  details?: {
    field?: string;
    value?: any;
    constraint?: string;
  };
}
```

### Codes d'Erreur Communs
- `VALIDATION_ERROR` - Erreur de validation
- `UNAUTHORIZED` - Non autorisé
- `FORBIDDEN` - Accès interdit
- `NOT_FOUND` - Ressource non trouvée
- `CONFLICT` - Conflit de données
- `QUOTA_EXCEEDED` - Quota dépassé
- `RULE_VIOLATION` - Violation de règle métier

## Exemples d'Utilisation

### Client JavaScript
```javascript
class MathildanesthAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    return response.json();
  }

  // Méthodes spécifiques
  async getMyPlanning(date) {
    return this.request(`/planning/my-week?date=${date}`);
  }

  async createLeave(leaveData) {
    return this.request('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData)
    });
  }

  async validatePlanning(planningData) {
    return this.request('/rules/validate', {
      method: 'POST',
      body: JSON.stringify({ planningData })
    });
  }
}
```

### Client TypeScript
```typescript
import { ApiResponse, User, Leave, PlanningData } from './types';

class TypedMathildanesthAPI {
  private async request<T>(
    endpoint: string, 
    options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // Implementation similaire avec types
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    return this.request<User[]>('/admin/users');
  }

  async createLeave(leaveData: CreateLeaveRequest): Promise<ApiResponse<Leave>> {
    return this.request<Leave>('/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData)
    });
  }
}
```

## Performance et Cache

### Stratégies de Cache
- **ETags** pour les ressources statiques
- **Cache-Control** headers appropriés
- **Redis** pour les données fréquemment consultées
- **Query caching** avec React Query côté client

### Headers de Cache
```http
Cache-Control: private, max-age=300
ETag: "33a64df551425fcc55e4d42a148795d9f25f89d4"
Last-Modified: Wed, 21 Oct 2015 07:28:00 GMT
```

---

*Documentation API mise à jour : Juin 2025*