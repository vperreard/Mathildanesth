# Soumission et Traitement des Requêtes Personnelles

## 1. Introduction

Mathildanesth permet aux utilisateurs de soumettre des requêtes personnelles, aussi appelées desiderata ou contraintes ponctuelles, afin d'exprimer des préférences ou des besoins spécifiques concernant leur planning. Le système offre un processus structuré pour la soumission, la prise en compte et le traitement de ces requêtes.

Le projet `MATHILDA` mentionne la gestion des "Requêtes spécifiques (validation, impact)". Le modèle `UserRequest` dans `prisma/schema.prisma` de `mathildanesth` fournit une base solide pour cette fonctionnalité.

## 2. Objectifs de la Gestion des Requêtes Personnelles

- **Prise en Compte des Préférences** : Offrir aux utilisateurs un moyen formalisé d'exprimer leurs souhaits ou contraintes, augmentant la satisfaction et la flexibilité perçue.
- **Amélioration de la Qualité des Plannings** : Si les requêtes pertinentes sont intégrées, cela peut mener à des plannings mieux acceptés.
- **Aide à la Décision pour les Planificateurs** : Fournir aux planificateurs une vue centralisée des requêtes à considérer lors de l'élaboration des plannings.
- **Traçabilité** : Conserver un historique des requêtes soumises et des décisions prises.

## 3. Modèles de Données : `UserRequest` et `RequestType`

Les modèles `UserRequest` et `RequestType` (`prisma/schema.prisma`) sont clés :

### Modèle `RequestType`

Ce modèle définit les différentes catégories de requêtes que les utilisateurs peuvent soumettre :
- `id` (String) : Identifiant unique du type de requête.
- `name` (String) : Nom unique du type (ex: "DESIDERATA_OFF", "CONTRAINTE_HORAIRE", "PREFERENCE_AFFECTATION_COLLEGUE", "PREFERENCE_AFFECTATION_TACHE", "AUTRE"). Ce champ sert de code métier.
- `description` (String, optionnel).
- `requiresAdminApproval` (Boolean) : Indique si ce type de requête nécessite une approbation admin.
- `isActive` (Boolean).

### Modèle `UserRequest`

Ce modèle stocke chaque instance de requête soumise :
- `id` (String) : Identifiant unique.
- `userId` (Int) : L'utilisateur soumettant la requête.
- `requestTypeId` (String) : Lie la requête à un `RequestType`.
- `title` (String) : Un titre court pour la requête (ex: "Absence mariage 05/06", "Préférence bloc jeudi").
- `description` (String) : Contenu détaillé de la requête, explication du souhait ou de la contrainte.
- `status` (Enum `UserRequestStatus`) : État de la requête (ex: `SUBMITTED`, `IN_PROGRESS`, `APPROVED`, `REJECTED`, `COMPLETED`, `CANCELLED_BY_USER`).
- `adminNotes` (String, optionnel) : Commentaires du planificateur/administrateur.
- `assignedToId` (Int, optionnel) : ID de l'utilisateur (admin/planificateur) à qui la requête est assignée pour traitement.
- `siteId` (String, optionnel) : Site concerné par la requête.
- `startDate` (DateTime, optionnel), `endDate` (DateTime, optionnel) : Période concernée par la requête.
- `details` (Json, optionnel) : Champ flexible pour stocker des données structurées spécifiques au `RequestType`. Par exemple :
    - Pour `PREFERENCE_AFFECTATION_COLLEGUE` : `{"colleagueUserId": 123, "preferenceType": "AVEC" ou "SANS"}`.
    - Pour `CONTRAINTE_HORAIRE` : `{"startTimeConstraint": "09:00", "endTimeConstraint": null}`.
- `createdAt`, `updatedAt`, `resolvedAt` (DateTime, optionnel).

## 4. Processus de Soumission et Traitement

### 4.1. Soumission par l'Utilisateur

1.  **Interface de Soumission** :
    - Un formulaire dédié permet à l'utilisateur de créer une nouvelle requête.
    - Accessible depuis son espace personnel ou directement depuis le planning.
2.  **Informations à Fournir** :
    - Sélection du `RequestType` (ex: "Demande de jour OFF", "Contrainte horaire spécifique").
    - Saisie d'un `title` et d'une `description` claire.
    - Spécification de la `startDate` et `endDate` si applicable.
    - Remplissage des `details` spécifiques au type de requête (ex: heure de début/fin pour contrainte, nom du collègue pour préférence).
3.  **Soumission** : La `UserRequest` est créée avec le statut `SUBMITTED`.

### 4.2. Notification et Prise en Compte par le Planificateur/Référent

1.  **Notification ou Tableau de Bord** : Le(s) planificateur(s), ou l'utilisateur `assignedToId` si spécifié, sont notifiés ou consultent un tableau de bord des requêtes `SUBMITTED` ou `IN_PROGRESS`.
2.  **Examen des Requêtes** :
    - Le planificateur consulte la requête (type, titre, description, dates, détails).
    - Il peut mettre à jour le statut en `IN_PROGRESS` pour indiquer que la requête est en cours d'évaluation.

### 4.3. Intégration dans le Processus de Planification

- **Prise en Compte par l'Algorithme** : L'algorithme de génération de planning (`../../03_Planning_Generation/02_Algorithme_Generation.md`) devrait pouvoir lire les `UserRequest` (surtout celles de type "DESIDERATA_OFF" ou "CONTRAINTE_HORAIRE" ayant un statut `APPROVED` ou `IN_PROGRESS` et jugées prioritaires) comme des contraintes.
- **Examen Manuel par le Planificateur** : Lors de l'élaboration ou de l'ajustement manuel du planning, le planificateur consulte les requêtes pertinentes pour la période et tente de les satisfaire au mieux.

### 4.4. Décision et Mise à Jour du Statut

Après l'élaboration du planning (ou pendant) :

1.  **Décision** : Le planificateur (ou `assignedToUser`) décide si la requête peut être satisfaite.
2.  **Mise à Jour du Statut** : Le statut de la `UserRequest` est mis à jour (`APPROVED`, `REJECTED`, `COMPLETED`).
    - `APPROVED` : La requête est acceptée et sera (ou a été) intégrée.
    - `COMPLETED` : La requête est acceptée et l'action résultante est terminée.
    - `REJECTED` : La requête n'a pas pu être satisfaite.
3.  **Notes Administrateur** : Le champ `adminNotes` est utilisé pour expliquer la décision.
4.  **Date de Résolution** : Le champ `resolvedAt` est mis à jour.

### 4.5. Notification à l'Utilisateur

- L'utilisateur est notifié de la décision concernant sa requête et des éventuelles notes du planificateur.
- Le planning publié reflète (ou non) la prise en compte de la requête.

## 5. Interface Utilisateur

- **Pour l'Utilisateur** :
  - Formulaire de soumission clair.
  - Liste de ses requêtes avec leur statut actuel.
  - Notifications sur les changements de statut.
- **Pour le Planificateur/Administrateur** :
  - Tableau de bord des requêtes (filtrable par date, statut, utilisateur, type).
  - Accès facile aux requêtes lors de la consultation/modification du planning.
  - Outils pour mettre à jour rapidement le statut des requêtes.

## 6. Types de Requêtes et Exemples (`RequestType.name`)

- **`DESIDERATA_OFF`** : Utilisateur souhaite un jour/créneau OFF. `details`: `{"reason": "RDV Médical"}`.
- **`CONTRAINTE_HORAIRE_DEBUT`** : Utilisateur ne peut pas commencer avant une certaine heure. `details`: `{"time": "09:00"}`.
- **`CONTRAINTE_HORAIRE_FIN`** : Utilisateur doit finir avant une certaine heure. `details`: `{"time": "17:00"}`.
- **`PREFERENCE_AFFECTATION_AVEC_COLLEGUE`** : Souhait d'être avec un collègue. `details`: `{"colleagueUserId": 45, "notes": "Formation nouveau protocole"}`.
- **`PREFERENCE_AFFECTATION_SANS_COLLEGUE`** : Souhait d'éviter d'être avec un collègue.
- **`PREFERENCE_TACHE`** : Préférence pour un type de salle/activité. `details`: `{"activityTypeCode": "BLOC_PEDIATRIE"}`.

## 7. Configuration

- Administrer les `RequestType` via une interface dédiée (création, modification, activation/désactivation).
- Configurer les workflows de notification et de validation.
- Paramétrer comment l'algorithme de planification tient compte des requêtes (poids, coût).

---

La gestion des requêtes personnelles est un moyen important d'humaniser le processus de planification et d'améliorer l'engagement du personnel. Un système transparent et réactif pour leur traitement est donc un atout pour Mathildanesth.
