# Modèles de Données Principaux de Mathildanesth

## 1. Introduction

Ce document fournit une vue d'ensemble conceptuelle des principaux modèles de données utilisés dans Mathildanesth, tels que définis dans le fichier `prisma/schema.prisma`. L'objectif n'est pas de reproduire l'intégralité du schéma, mais de mettre en lumière les entités clés et leurs relations pour comprendre la structure de l'information gérée par l'application.

## 2. Modèles Transversaux et Fondamentaux

### 2.1. `User`
- **Rôle** : Représente un utilisateur du système. Contient les informations d'identification, le rôle applicatif (`Role` enum), le rôle professionnel (`ProfessionalRole` enum), les informations de temps partiel, et les liens vers ses affectations, congés, etc.
- **Relations Clés** :
    - `Assignment[]` (affectations générales)
    - `BlocStaffAssignment[]` (affectations au bloc)
    - `Leave[]` (congés)
    - `UserSkill[]` (compétences)
    - `LoginLog[]` (logs de connexion)
    - `Notification[]` (notifications reçues)
    - `UserRequest[]` (demandes personnelles)
    - `AssignmentSwapRequest[]` (demandes d'échange)
    - `Site[]` (sites auxquels l'utilisateur est rattaché, via `UsersOnSites`)

### 2.2. `Site`
- **Rôle** : Représente un site hospitalier ou une localisation géographique principale.
- **Relations Clés** :
    - `OperatingSector[]` (secteurs opératoires du site)
    - `OperatingRoom[]` (salles d'opération du site)
    - `Department[]` (départements/services du site)
    - `User[]` (utilisateurs rattachés au site, via `UsersOnSites`)
    - `TrameModele[]` (modèles de trames pour ce site)
    - `BlocDayPlanning[]` (plannings journaliers de bloc pour ce site)

### 2.3. `AuditLog`
- **Rôle** : Enregistre les actions importantes effectuées dans le système pour la traçabilité et l'audit.
- **Champs Principaux** : `timestamp`, `userId`, `action`, `entityType`, `entityId`, `details` (JSON).

## 3. Gestion des Utilisateurs et des Accès

- **`Role` (Enum)** : Définit les rôles applicatifs (ADMIN, USER, PLANNER, etc.).
- **`ProfessionalRole` (Enum)** : Définit les rôles métiers (MAR, IADE, CHIRURGIEN, etc.).
- **`ProfessionalRoleConfig`** : Permet de configurer des aspects spécifiques pour chaque rôle professionnel (ex: couleur d'affichage).
- **`LoginLog`** : Historique des connexions des utilisateurs.
- **`Skill` et `UserSkill`** : Gestion des compétences des utilisateurs.
    - `Skill` : Définit une compétence (ex: "ALR membre supérieur").
    - `UserSkill` : Table de liaison entre `User` et `Skill`.
- **`Specialty`** : Principalement pour les chirurgiens, définit les spécialités médicales (ex: "Orthopédie").
- **`Surgeon`** : Profil spécifique pour les chirurgiens, lié à un `User` et à des `Specialty`.

## 4. Planning Général et Affectations

- **`Assignment`** : Représente une affectation générale d'un utilisateur à une activité pour une date et une période données. Peut être liée à un `ActivityType`, une `Location`, une `Specialty`.
- **`ActivityType`** : Définit les types d'activités planifiables (ex: Garde, Consultation, Réunion). Lié à `ActivityCategory` (Enum).
- **`Location`** : Lieu physique spécifique pour une affectation (ex: Salle de consultation A).
- **`RecurrenceTypeTrame` et `TypeSemaineTrame` (Enums)** : Utilisés pour la récurrence des modèles de trames.
- **`TrameModele`** : Modèle de trame de planning (ex: trame hebdomadaire type pour un service).
    - **`AffectationModele`** : Décrit une affectation type au sein d'un `TrameModele`.
        - **`PersonnelRequisModele`** : Définit le personnel nécessaire (rôle, spécialité, nombre) pour une `AffectationModele`.

## 5. Gestion des Congés et Absences

- **`LeaveType` (Enum)** : Types de congés (Annuel, Maladie, Formation, etc.).
- **`LeaveStatus` (Enum)** : Statuts d'une demande de congé (PENDING, APPROVED, REJECTED, CANCELLED).
- **`Leave`** : Enregistrement d'un congé pour un utilisateur, avec dates, type, statut.
- **`LeaveBalance`** : Solde de congés d'un utilisateur pour un type de congé donné et une période.
- **`LeaveTypeSetting`** : Paramètres de configuration pour chaque type de congé (ex: quota annuel par défaut).
- **`PublicHoliday`** : Jours fériés.
- **`Absence`** : Utilisé pour les absences imprévues ou non planifiées (similaire à `Leave` mais peut avoir un workflow différent).
- **`PlannedAbsence`** : Représente les indisponibilités planifiées récurrentes ou ponctuelles (ex: un MAR non disponible tous les mercredis après-midi).

## 6. Gestion du Bloc Opératoire

- **`OperatingSector`** : Secteur opératoire au sein d'un site (ex: Bloc Orthopédie, Ambulatoire). Peut avoir une `SectorCategory` (Enum).
- **`OperatingRoom`** : Salle d'opération, liée à un `OperatingSector`. Peut avoir un `RoomType` (Enum).
- **`BlocDayPlanning`** : Planning journalier pour le bloc d'un site donné, avec un statut (`BlocPlanningStatus` Enum).
    - **`BlocRoomAssignment`** : Affectation d'une salle (`OperatingRoom`) pour une période (`Period` Enum) dans un `BlocDayPlanning`. Spécifie le `Surgeon` et la `expectedSpecialty`.
        - **`BlocStaffAssignment`** : Affectation du personnel anesthésie (`User` avec `BlocStaffRole` Enum MAR/IADE) à une `BlocRoomAssignment`.
    - **`BlocPlanningConflict`** : Enregistre les conflits détectés dans un `BlocDayPlanning`.

## 7. Règles et Configuration

- **`PlanningRule`** : Règles de planification configurables par les administrateurs (ex: temps de repos minimum, nombre max de gardes). Peut être spécifique à un `Site`.
- **`Rule`** (potentiellement ancien ou différent de `PlanningRule`, à clarifier) : Autre modèle de règle.
- **`RuleConflict`** : Conflits détectés par rapport aux règles.
- **`TeamConfiguration`** : Configuration spécifique d'une équipe ou d'un service.
- **`UserCalendarSettings`** : Préférences d'affichage du calendrier pour un utilisateur.
- **`ConfigValue` (non listé dans l'extrait mais souvent présent)** : Modèle générique pour stocker des paires clé-valeur de configuration.

## 8. Demandes et Notifications

- **`RequestType`** : Types de demandes que les utilisateurs peuvent faire (ex: demande de changement d'horaire, demande de formation).
- **`UserRequest`** : Demande faite par un utilisateur, avec un type, un statut (`UserRequestStatus` Enum) et des détails.
- **`AssignmentSwapRequest`** : Demande d'échange d'affectation entre deux utilisateurs, avec un statut (`AssignmentSwapStatus` Enum).
- **`Notification`** : Système de notification pour informer les utilisateurs des événements importants.

## 9. Autres Modèles Pertinents

- **`Department`** : Représente un service ou département au sein d'un `Site`.
- **`PersonnelIncompatibility`** : Permet de définir des incompatibilités entre membres du personnel pour la planification.

Cette vue d'ensemble n'est pas exhaustive mais vise à cartographier les principales entités et leurs interconnexions pour faciliter la compréhension de l'architecture des données de Mathildanesth. Pour tous les détails, se référer à `prisma/schema.prisma`. 