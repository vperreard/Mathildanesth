# Modèle Utilisateur et Gestion des Profils

## 1. Introduction

Au cœur de Mathildanesth se trouve le modèle `User`, qui représente toute personne interagissant avec le système. Ce document détaille la structure de ce modèle, les informations de profil associées, ainsi que la gestion des rôles et des droits.

## 2. Modèle de Données `User`

Le modèle `User` (défini dans `prisma/schema.prisma`) stocke les informations essentielles pour chaque utilisateur.

### 2.1. Champs Principaux

- **`id`** (Int) : Identifiant unique auto-incrémenté.
- **`nom`** (String) : Nom de famille de l'utilisateur.
- **`prenom`** (String) : Prénom de l'utilisateur.
- **`login`** (String) : Identifiant de connexion unique.
- **`email`** (String) : Adresse e-mail unique de l'utilisateur, utilisée pour la communication et potentiellement la connexion.
- **`password`** (String) : Mot de passe hashé de l'utilisateur.
- **`role`** (Enum `Role`) : Rôle principal de l'utilisateur dans le système (ex: `USER`, `ADMIN`, `PLANNER`). Détermine les permissions de base.
- **`professionalRole`** (Enum `ProfessionalRole`) : Rôle professionnel spécifique (ex: `MAR`, `IADE`, `CHIRURGIEN`, `IBODE`, `AS`). Utilisé pour la logique métier liée aux compétences et affectations.
- **`actif`** (Boolean) : Indique si le compte utilisateur est actif (par défaut `true`). Un utilisateur inactif ne peut généralement pas se connecter.
- **`mustChangePassword`** (Boolean) : Indicateur forçant l'utilisateur à changer son mot de passe à la prochaine connexion (par défaut `false`).
- **`phoneNumber`** (String, optionnel) : Numéro de téléphone.
- **`alias`** (String, optionnel) : Un pseudonyme ou nom d'affichage court.
- **`createdAt`** (DateTime) : Date et heure de création du compte.
- **`updatedAt` (DateTime)** : Date et heure de la dernière modification du compte.
- **`lastLogin`** (DateTime, optionnel) : Date et heure de la dernière connexion.

### 2.2. Informations Professionnelles et Contractuelles

- **`tempsPartiel`** (Boolean) : Indique si l'utilisateur travaille à temps partiel (par défaut `false`).
- **`pourcentageTempsPartiel`** (Float, optionnel) : Si `tempsPartiel` est `true`, ce champ stocke le pourcentage du temps de travail (ex: 0.8 pour 80%).
- **`dateEntree`** (DateTime, optionnel) : Date d'entrée de l'utilisateur dans l'organisation/service.
- **`dateSortie`** (DateTime, optionnel) : Date de sortie de l'utilisateur.
- **`workPattern`** (Enum `WorkPatternType`) : Type de modèle de travail (ex: `FULL_TIME`, `PART_TIME_FIXED_DAYS`, `PART_TIME_VARIABLE_DAYS`). Par défaut `FULL_TIME`.
- **`joursTravaillesSemaineImpaire`** (Json) : Si temps partiel avec jours fixes, stocke les jours travaillés pour les semaines impaires (ex: `["LUNDI", "MARDI", "MERCREDI"]`).
- **`joursTravaillesSemainePaire`** (Json) : Si temps partiel avec jours fixes, stocke les jours travaillés pour les semaines paires.
- **`departmentId`** (String, optionnel) : Lien vers l'entité `Department`.
- **`sites`** (Relation vers `Site[]`) : Sites auxquels l'utilisateur est rattaché.

### 2.3. Préférences et Configuration

- **`displayPreferences`** (Json, optionnel) : Stocke les préférences d'affichage de l'utilisateur pour l'interface (ex: filtres par défaut, vues de calendrier préférées).
- **`calendarSettings`** (Relation vers `UserCalendarSettings`) : Paramètres spécifiques à l'affichage du calendrier pour l'utilisateur.
- **`workOnMonthType`** (Enum `WeekType`, optionnel) : Peut indiquer une préférence ou une règle de travail sur le type de semaine (paire/impaire) pour certains calculs.

### 2.4. Relations Clés

Le modèle `User` est lié à de nombreuses autres entités pour refléter ses activités et ses droits :

- `Absence` : Absences enregistrées pour l'utilisateur.
- `Assignment` : Affectations de l'utilisateur sur le planning.
- `Leave` : Demandes de congés (créées par ou pour l'utilisateur, et celles qu'il a approuvées).
- `Notification` : Notifications créées par l'utilisateur ou le concernant.
- `Surgeon` : Profil chirurgien si l'utilisateur est un chirurgien.
- `AuditLog` : Actions de l'utilisateur enregistrées à des fins d'audit.
- `LeaveBalance`: Soldes de congés de l'utilisateur.

## 3. Gestion des Profils

Chaque utilisateur dispose d'un profil qui peut être consulté et, dans une certaine mesure, modifié.

- **Accès au Profil** : L'utilisateur connecté peut accéder à son propre profil via un menu utilisateur.
- **Informations Modifiables (par l'utilisateur)** :
  - Mot de passe (avec confirmation de l'ancien).
  - Préférences d'affichage et de notification.
  - Peut-être certaines informations de contact (téléphone, alias).
- **Informations Modifiables (par l'administrateur)** :
  - Toutes les informations de l'utilisateur, y compris le rôle, le statut (actif/inactif), les informations contractuelles.
  - Réinitialisation de mot de passe.

## 4. Rôles et Permissions (`Role` Enum)

Les rôles définissent les capacités générales d'un utilisateur dans l'application. Les permissions plus fines peuvent ensuite être gérées par une combinaison du rôle et potentiellement d'autres attributs.

- **Exemples de Rôles Définis (`prisma/schema.prisma`)** :

  - `USER` : Rôle de base avec accès à ses propres informations, planning, et demandes de congés.
  - `PLANNER` : Peut avoir des droits étendus sur la gestion des plannings, la validation des congés, etc.
  - `ADMIN` : Accès complet à toutes les fonctionnalités d'administration, y compris la gestion des utilisateurs, des rôles, des règles métier, et des paramètres système.
  - `VIEWER` : Rôle de consultation seule.

- **Gestion des Permissions** :
  - Les permissions sont typiquement vérifiées côté backend (API routes) avant d'autoriser une action.
  - L'interface utilisateur s'adapte dynamiquement pour afficher/masquer les fonctionnalités en fonction des permissions de l'utilisateur connecté.
  - La roadmap (`documentation/roadmap-dev-updated.md`) mentionne un "système de permissions granulaires" comme étant complété, suggérant une logique au-delà des simples rôles de base.

## 5. Rôles Professionnels (`ProfessionalRole` Enum)

Indépendamment du rôle système, le rôle professionnel spécifie la fonction métier de l'utilisateur. Ceci est crucial pour la logique de planification.

- **Exemples de Rôles Professionnels (`prisma/schema.prisma`)** :

  - `MAR` (Médecin Anesthésiste-Réanimateur)
  - `IADE` (Infirmier Anesthésiste Diplômé d'État)
  - `CHIRURGIEN`
  - `AS` (Aide-Soignant)
  - `IBODE` (Infirmier de Bloc Opératoire Diplômé d'État)
  - `SECRETARIAT`
  - `AUTRE`

- **Utilisation** :
  - Filtrage des utilisateurs par compétence/profession.
  - Application de règles de planning spécifiques (ex: un MAR doit superviser X salles).
  - Détermination des types d'affectations possibles.

## 6. Profil Spécifique : Chirurgien (`Surgeon` Model)

Les utilisateurs ayant le `professionalRole` de `CHIRURGIEN` peuvent avoir un profil étendu via le modèle `Surgeon` lié.

- **Informations Spécifiques au Chirurgien** :
  - `specialties` (Relation vers `Specialty[]`) : Spécialités chirurgicales du praticien.
  - `preferences` (Relation vers `SurgeonPreference[]`) : Préférences spécifiques (ex: types d'interventions préférées, jours d'opération souhaités).
  - `googleSheetName` (String, optionnel) : Potentiel identifiant pour des intégrations ou imports/exports.
  - `status` (Enum `UserStatus`) : Statut spécifique (ex: `ACTIF`, `INACTIF`, `EN_CONGE_LONGUE_DUREE`).

## 7. Sécurité et Audit

- **Changement de Mot de Passe** : Fonctionnalité pour changer son propre mot de passe et forcer le changement par un admin.
- **Logs de Connexion (`LoginLog`)** : Enregistrement des tentatives de connexion.
- **Journal d'Audit (`AuditLog`)** : Suivi des actions sensibles effectuées par les utilisateurs (création/modification/suppression de données critiques).

---

Ce modèle utilisateur et la gestion des profils associés constituent la base de l'authentification, de l'autorisation et de la personnalisation de l'expérience dans Mathildanesth.
