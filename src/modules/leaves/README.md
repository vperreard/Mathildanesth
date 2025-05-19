# Module de Gestion des Congés

Ce module gère l'ensemble du processus de demande, validation et suivi des congés dans l'application Mathildanesth.

## Fonctionnalités

- **Demande de congés**: Interface utilisateur pour créer des demandes avec gestion des demi-journées
- **Calcul automatique**: Déduction intelligente des jours décomptés en tenant compte des jours fériés et weekends
- **Gestion des quotas**: Suivi des allocations, reports et transferts par type de congé
- **Détection de conflits**: Empêche la création de congés qui se chevauchent
- **Visualisation des soldes**: Affichage détaillé des soldes par type de congé

## Composants principaux

### LeaveForm.tsx

Formulaire de création/modification des demandes de congés avec:
- Sélection du type de congé
- Sélection des dates (début/fin)
- Gestion des demi-journées (matin/après-midi)
- Calcul automatique des jours décomptés
- Validation des données via Zod

### UserLeaveBalance.tsx (à implémenter)

Composant d'affichage des soldes de congés pour un utilisateur avec:
- Solde disponible par type de congé
- Jours pris, en attente, et à venir
- Reports de l'année précédente
- Transferts entre types de congés

## Hooks personnalisés

### useLeaveCalculation.ts

Hook qui gère le calcul des jours de congés en fonction des dates sélectionnées:
- Prend en compte le planning de travail de l'utilisateur
- Exclut les jours fériés
- Gère les options de demi-journées
- Fournit des détails sur les jours comptabilisés

## API Endpoints

### GET /api/leaves/balance

Retourne les soldes de congés d'un utilisateur.

**Paramètres**:
- `userId`: ID de l'utilisateur (obligatoire)
- `year`: Année concernée (optionnel, défaut = année courante)

**Réponse**:
```json
[
  {
    "typeCode": "ANNUAL",
    "typeName": "Congé Annuel",
    "balance": 15.5,
    "allowance": 25,
    "carryOver": 2.5,
    "taken": 12,
    "pending": 1,
    "transferred": 0
  },
  {
    "typeCode": "RTT",
    "typeName": "RTT",
    "balance": 5,
    "allowance": 10,
    "carryOver": 0,
    "taken": 5,
    "pending": 0,
    "transferred": 0
  }
]
```

### POST /api/leaves/batch

Crée une ou plusieurs demandes de congés.

**Payload**:
```json
[
  {
    "userId": 123,
    "typeCode": "ANNUAL",
    "startDate": "2024-08-01",
    "endDate": "2024-08-15",
    "reason": "Vacances d'été",
    "isHalfDay": false
  }
]
```

**Codes de réponse**:
- `200 OK`: Demande(s) créée(s) avec succès
- `400 Bad Request`: Données invalides
- `409 Conflict`: Conflit avec un congé existant

## Modèles de données

Le module s'appuie sur les modèles Prisma suivants:
- `Leave`: Demande de congé
- `LeaveTypeSetting`: Configuration des types de congés
- `LeaveBalance`: Suivi des soldes par utilisateur et type
- `QuotaTransfer`: Transferts entre types de congés
- `QuotaCarryOver`: Reports d'une année à l'autre

## Tests

Les tests pour ce module sont organisés en:
- **Tests unitaires**: `useLeaveCalculation.test.ts`, `LeaveForm.test.tsx`
- **Tests d'intégration**: Vérification des API `/api/leaves/balance`, détection de conflits, mise à jour des soldes

## Utilisation des assertions personnalisées

Pour contourner les erreurs de typage avec Jest et React Testing Library, nous avons créé des utilitaires d'assertion personnalisés dans `src/tests/utils/assertions.ts`:

```typescript
import { expectToBeInDocument, expectToHaveBeenCalled } from '@/tests/utils/assertions';

// Au lieu de:
expect(element).toBeInTheDocument();
// Utilisez:
expectToBeInDocument(element);
``` 