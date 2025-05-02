## Modules principaux

Le projet est organisé en modules fonctionnels:

### Module de gestion des congés (`/src/modules/leaves`)

Ce module gère tout ce qui concerne les congés des employés:

- **Demandes de congés**: Création, modification et suivi des demandes
- **Validation**: Vérification des contraintes et règles métier
- **Approbation**: Workflow d'approbation par les managers
- **Quotas**: Gestion des soldes de congés et droits
- **Détection de conflits**: Identification automatique des conflits potentiels entre demandes
- **Gestion des règles de conflit**: Interface d'administration pour configurer les règles de détection des conflits

#### Sous-composants clés:

- `LeaveRequestForm.tsx`: Formulaire de demande de congés
- `LeavesList.tsx`: Liste des congés avec filtrage et tri
- `QuotaManagement.tsx`: Gestion des quotas de congés
- `ConflictRulesManager.tsx`: Interface d'administration pour configurer les règles de détection de conflits

#### Hooks importants:

- `useLeave.ts`: Gestion complète des opérations sur les congés
- `useLeaveValidation.ts`: Validation des demandes de congés
- `useConflictDetection.ts`: Détection des conflits entre demandes
- `useConflictRules.ts`: Gestion des règles de détection de conflits

## Points d'extension

Le système a été conçu pour être facilement extensible dans plusieurs domaines:

### Règles de gestion personnalisables

- **Règles de validation**: Dans le hook `useLeaveValidation.ts`
- **Règles de workflow**: Dans le module `/src/modules/workflows`
- **Règles de détection de conflits**: Dans le hook `useConflictRules.ts` et configurable via l'interface d'administration

## API et services backend

### API REST

Les principales routes API sont:

- `/api/leaves`: Gestion des demandes de congés
- `/api/leaves/balance`: Consultation des soldes de congés
- `/api/leaves/check-conflicts`: Vérification des conflits potentiels
- `/api/admin/leave-types`: Administration des types de congés
- `/api/admin/conflict-rules`: Administration des règles de détection de conflits 