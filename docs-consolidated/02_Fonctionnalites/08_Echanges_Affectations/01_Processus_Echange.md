# Processus d'Échange d'Affectations

## 1. Introduction

Pour offrir de la flexibilité au personnel tout en maintenant une couverture de service adéquate, Mathildanesth propose un système d'échange d'affectations. Ce processus permet à deux utilisateurs de s'échanger des gardes, des vacations ou d'autres types d'affectations, sous réserve de validation par le système et/ou un administrateur.

La roadmap (`documentation/roadmap-dev-updated.md`, Phase 3) mentionne les "Échanges d'affectations facilités (validation)". Le modèle `SwapRequest` dans `prisma/schema.prisma` fournit la structure de données pour gérer ces demandes.

## 2. Objectifs du Module d'Échange

- **Flexibilité pour les Utilisateurs** : Permettre aux employés de s'organiser entre eux pour des contraintes personnelles, tout en respectant les règles.
- **Maintien de la Couverture** : S'assurer que l'échange ne compromet pas les besoins du service (compétences, effectifs).
- **Respect des Règles** : Vérifier que l'échange est conforme aux règles de planification (temps de travail, repos, compétences).
- **Traçabilité** : Garder un historique des demandes d'échange et des décisions.
- **Processus de Validation Structuré** : Impliquer les bonnes personnes (utilisateurs concernés, administrateurs) dans le processus.

## 3. Modèle de Données : `SwapRequest`

Le modèle `SwapRequest` (`prisma/schema.prisma`) est central :

- **`id`** : Identifiant unique de la demande.
- **`assignmentId`** : L'affectation que le demandeur (`requesterId`) souhaite céder.
- **`requesterId`** : L'utilisateur qui initie la demande d'échange.
- **`requestedUserId`** : L'utilisateur à qui l'échange est proposé (le "répondant").
- **`proposedAssignmentId`** (optionnel) : L'affectation que le répondant propose en contrepartie. Si nul, le demandeur cherche simplement quelqu'un pour prendre son affectation sans proposer un échange direct d'une de ses propres affectations.
- **`status`** : État de la demande (ex: `PENDING`, `ACCEPTED_BY_USER`, `REJECTED_BY_USER`, `PENDING_ADMIN_APPROVAL`, `APPROVED`, `REJECTED_BY_ADMIN`, `CANCELED`).
- **`requesterMessage`**, **`requestedUserMessage`**, **`adminMessage`** : Messages pour la communication.
- `createdAt`, `updatedAt`.

## 4. Processus Type d'un Échange

Le processus peut varier légèrement selon que l'échange est direct (affectation contre affectation) ou une simple reprise d'affectation.

### 4.1. Initiation de la Demande par l'Utilisateur A (Demandeur)

1.  **Sélection de l'Affectation à Échanger** : L'utilisateur A sélectionne une de ses affectations futures dans son planning (ex: une garde).
2.  **Choix de l'Utilisateur B (Répondant)** : L'utilisateur A identifie un collègue B avec qui il souhaite échanger.
    - Le système pourrait suggérer des collègues éligibles (même rôle, compétences compatibles, etc.).
3.  **Proposition d'une Affectation en Retour (Optionnel)** : Si l'utilisateur A souhaite un échange direct, il peut sélectionner une des affectations de B qu'il serait prêt à prendre en retour.
    - Alternativement, A peut simplement demander à B de prendre son affectation, et B pourrait alors proposer une de ses affectations en échange (ou juste accepter de prendre celle de A).
4.  **Ajout d'un Message (Optionnel)** : L'utilisateur A peut ajouter un message à l'attention de B.
5.  **Soumission de la Demande** : Une `SwapRequest` est créée avec le statut `PENDING`.

### 4.2. Notification et Réponse de l'Utilisateur B (Répondant)

1.  **Notification** : L'utilisateur B est notifié de la demande d'échange.
2.  **Examen de la Demande** : B consulte les détails (affectation de A, et son affectation proposée si applicable).
3.  **Actions Possibles pour B** :
    - **Accepter l'Échange Tel Quel** : Si B est d'accord avec la proposition. La `SwapRequest` passe à `ACCEPTED_BY_USER` (ou directement à `PENDING_ADMIN_APPROVAL` si une validation admin est toujours requise).
    - **Proposer une Contrepartie / Modifier la Proposition** : Si B veut prendre l'affectation de A mais proposer une autre de ses affectations en échange, ou si A n'avait rien proposé en retour et B veut le faire.
    - **Refuser l'Échange** : La `SwapRequest` passe à `REJECTED_BY_USER`.
    - **Ajouter un Message**.

### 4.3. Validation par le Système

À chaque étape clé (initiation, acceptation par B), le système doit effectuer des vérifications automatiques :

- **Respect des Règles de Planification** : Le [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) vérifie si l'échange (si accepté) violerait des règles pour A ou B (temps de travail, repos, enchaînements, compétences requises pour les affectations échangées).
- **Éligibilité des Utilisateurs** : Les deux utilisateurs ont-ils les rôles/compétences requis pour les affectations finales ?
- Si une règle bloquante est violée, l'échange ne peut pas procéder ou nécessite une dérogation.

### 4.4. Validation par un Administrateur (Si Nécessaire)

Selon la configuration du service, certains échanges peuvent nécessiter une approbation finale par un administrateur/planificateur, même si les deux utilisateurs sont d'accord et que le système n'a pas détecté de violation majeure.

- La `SwapRequest` passe à `PENDING_ADMIN_APPROVAL`.
- L'administrateur est notifié.
- L'administrateur examine l'échange, les validations système, et peut :
  - **Approuver** : La `SwapRequest` passe à `APPROVED`. Les affectations sont effectivement échangées dans le planning.
  - **Rejeter** (avec motif) : La `SwapRequest` passe à `REJECTED_BY_ADMIN`.

### 4.5. Finalisation et Notification

- Une fois l'échange approuvé (par les utilisateurs et/ou l'admin), les `Assignment` concernées sont mises à jour dans la base de données (les `userId` sont échangés).
- Les utilisateurs A et B sont notifiés du résultat final.

### 4.6. Annulation

- Le demandeur (A) peut généralement annuler sa demande tant qu'elle n'est pas finalisée (`CANCELED`).

## 5. Interface Utilisateur

- **Depuis le Planning Personnel** : Clic sur une affectation pour initier un échange.
- **Section "Mes Demandes d'Échange"** : Pour suivre le statut des demandes envoyées et reçues.
- **Interface Administrateur** : Tableau de bord des demandes d'échange en attente d'approbation.
- Notifications claires à chaque étape.

## 6. Configuration

- Définir quels types d'affectations sont échangeables.
- Configurer le niveau de validation requis (automatique par le système, validation par les pairs, validation admin obligatoire).
- Paramétrer les règles de compatibilité pour les échanges.

---

Un système d'échange d'affectations bien conçu et encadré par des règles claires et des validations robustes peut significativement améliorer la satisfaction du personnel tout en préservant l'intégrité de la planification.
