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

- **Accès au Profil** : L'utilisateur connecté peut accéder à son propre profil via un menu utilisateur. Les administrateurs peuvent accéder aux profils des utilisateurs qu'ils gèrent.
- **Informations Modifiables (par l'utilisateur)** :
  - Mot de passe (avec confirmation de l'ancien).
  - Préférences d'affichage et de notification.
  - Alias, numéro de téléphone.
- **Informations Modifiables (par l'administrateur `ADMIN` ou un `PLANNER` avec droits étendus)** :
  - Toutes les informations de l'utilisateur, y compris le `role` système, `professionalRole`, statut (`actif`/`inactif`), les informations contractuelles (temps partiel, dates d'entrée/sortie, etc.).
  - Réinitialisation de mot de passe et option `mustChangePassword`.
  - Affectation aux sites.
  - Gestion des compétences et spécialités (pour les profils concernés).

## 4. Rôles Système (`Role` Enum) et Permissions Associées

Les rôles système définissent les capacités générales d'un utilisateur dans l'application. Ils sont complétés par le `ProfessionalRole` pour affiner la logique métier.

### 4.1. Rôles Système Définis (Exemples dans `prisma/schema.prisma`)

- **`ADMIN` (Administrateur Général / Administrateur MAR)** :
  - **Description** : Correspond à l'Administrateur MAR de la documentation MATHILDA. Dispose des droits les plus étendus.
  - **Permissions Clés** :
    - Configuration complète du système et des paramètres de l'application (sites, secteurs, salles, types d'absence, règles de planning, etc.).
    - Gestion de tous les utilisateurs (création, modification, désactivation, rôles, informations contractuelles), y compris la liste des chirurgiens et leurs informations.
    - Validation de toutes les requêtes (congés, échanges, demandes spécifiques) pour tous les corps de métier.
    - Génération manuelle et automatique des plannings pour tous.
    - Modification de tous les plannings (MARs, IADEs, etc.).
    - Accès à toutes les statistiques et compteurs (heures, gardes, congés) pour tous.
    - Gestion des règles d'affectation et des contraintes.
    - Supervision et gestion des logs d'audit.

- **`PLANNER` (Planificateur / Administrateur IADE)** :
  - **Description** : Peut correspondre à l'Administrateur IADE ou à un rôle de gestionnaire de planning pour un scope défini.
  - **Permissions Clés (Exemple pour un scope IADE)** :
    - Gestion des utilisateurs IADE (création, modification limitée, informations contractuelles).
    - Validation des congés des IADEs.
    - Gestion des requêtes spécifiques des IADEs.
    - Modification des affectations des IADEs (échanges, déplacements).
    - Accès aux statistiques relatives aux IADEs.
    - Peut avoir des droits sur la génération/modification des plannings IADE.
  - *Note : Le scope exact des permissions d'un `PLANNER` peut être affiné par des logiques additionnelles si un système de permissions granulaires est en place.*

- **`USER` (Utilisateur Standard)** :
  - **Description** : Rôle de base pour la majorité des utilisateurs (MAR, IADE, Chirurgien non-admin).
  - **Permissions Clés (variant légèrement selon `ProfessionalRole`)** :
    - Visualisation de son planning personnel et du planning général (selon configuration de visibilité).
    - Déclaration des heures effectuées (si applicable, ex: MARs).
    - Demandes de congés ou d'absences.
    - Saisie de requêtes spécifiques (préférences d'affectation).
    - Demandes d'échange d'affectation avec des pairs éligibles.
    - Consultation de son compteur horaire/congés personnel.
    - Mise à jour de certaines informations de profil (mot de passe, alias, etc.).

- **`VIEWER` (Observateur / Secrétaire Médicale)** :
  - **Description** : Rôle de consultation seule, potentiellement pour les secrétaires médicales ou cadres.
  - **Permissions Clés** :
    - Accès en lecture seule aux plannings publiés.
    - Consultation de certaines statistiques générales (non nominatives ou selon droits).
    - Potentiellement, génération de rapports et d'exports prédéfinis.
    - Aucune capacité de modification de données.

### 4.2. Rôles Conceptuels Additionnels (issus de la réflexion MATHILDA)

Bien que non directement mappés en tant que `Role` Enum distincts dans Prisma actuellement, les concepts suivants peuvent être gérés par une combinaison de `Role`, `ProfessionalRole`, et/ou des attributs spécifiques de l'utilisateur :

- **Cadre de Santé** : Pourrait être un `VIEWER` avec accès à des statistiques spécifiques.
- **Remplaçant (MAR ou IADE)** : Serait un `USER` avec un `ProfessionalRole` de `MAR` ou `IADE`, potentiellement avec un attribut `estRemplacant: true` pour l'exclure de certaines statistiques d'équité ou pour gérer des droits spécifiques sur la saisie de disponibilités.
- **Super Administrateur** : Si un besoin se fait sentir au-delà de l'`ADMIN`, cela pourrait être un utilisateur `ADMIN` spécifique avec des droits étendus gérés hors-bande ou via des permissions spéciales.

### 4.3. Gestion des Permissions Fines

- Les permissions sont typiquement vérifiées côté backend (API routes) avant d'autoriser une action, basées sur le `Role`, `ProfessionalRole`, et potentiellement l'appartenance à un site ou une équipe.
- L'interface utilisateur s'adapte dynamiquement pour afficher/masquer les fonctionnalités en fonction des permissions de l'utilisateur connecté.
- La roadmap (`documentation/roadmap-dev-updated.md`) mentionne un "système de permissions granulaires", ce qui suggère une logique d'autorisation plus poussée que les simples rôles de base. Cela pourrait impliquer une table de jonction `role_permissions` ou des vérifications de permissions spécifiques codées dans le backend.

## 5. Rôles Professionnels (`ProfessionalRole` Enum)

Indépendamment du rôle système, le rôle professionnel spécifie la fonction métier de l'utilisateur. Ceci est crucial pour la logique de planification, l'application des règles métier, et la structuration des équipes.

- **Exemples de Rôles Professionnels Définis (`prisma/schema.prisma`)** :
  - `MAR` (Médecin Anesthésiste-Réanimateur)
  - `IADE` (Infirmier Anesthésiste Diplômé d'État)
  - `CHIRURGIEN`
  - `AS` (Aide-Soignant) - *Utilisation et droits à préciser dans Mathildanesth.*
  - `IBODE` (Infirmier de Bloc Opératoire Diplômé d'État) - *Utilisation et droits à préciser dans Mathildanesth.*
  - `SECRETARIAT` (Secrétaire Médicale) - Typiquement associé au rôle système `VIEWER` ou `USER` avec des permissions limitées.
  - `AUTRE`

- **Utilisation** :
  - Filtrage des utilisateurs par compétence/profession pour la planification.
  - Application de règles de planning spécifiques (ex: un MAR doit superviser X salles, un IADE ne peut pas prendre de garde MAR).
  - Détermination des types d'affectations possibles et des tâches autorisées.
  - Définition des workflows de validation des congés et requêtes (ex: un IADE est validé par un `PLANNER` ou un `ADMIN` avec scope IADE).
  - Personnalisation de l'interface et des informations affichées.

## 6. Profil Spécifique : Chirurgien (`Surgeon` Model)

Les utilisateurs ayant le `professionalRole` de `CHIRURGIEN` peuvent avoir un profil étendu via le modèle `Surgeon` lié.

- **Informations Spécifiques au Chirurgien** :
  - `specialties` (Relation vers `Specialty[]`) : Spécialités chirurgicales du praticien.
  - `preferences` (Relation vers `SurgeonPreference[]`) : Préférences spécifiques (ex: types d'interventions préférées, jours d'opération souhaités).
  - `googleSheetName` (String, optionnel) : Potentiel identifiant pour des intégrations ou imports/exports.
  - `status` (Enum `UserStatus`) : Statut spécifique (ex: `ACTIF`, `INACTIF`, `EN_CONGE_LONGUE_DUREE`).

## 7. Sécurité et Audit

- **Changement de Mot de Passe** : Fonctionnalité pour changer son propre mot de passe et forcer le changement par un admin. Les mots de passe doivent respecter des politiques de complexité.
- **Logs de Connexion (`LoginLog`)** : Enregistrement des tentatives de connexion (succès, échec, adresse IP, user agent).
- **Journal d'Audit (`AuditLog`)** : Suivi des actions sensibles effectuées par les utilisateurs (création/modification/suppression de données critiques comme les utilisateurs, les plannings, les règles, les validations de congés importantes). Doit inclure qui a fait quoi, quand, et sur quelle donnée.

## 8. Restrictions d'Accès et Confidentialité

Des règles strictes de confidentialité et de séparation des droits doivent être appliquées :

- **Cloisonnement par Rôle et Scope** :
  - Chaque utilisateur ne voit et ne modifie que les informations et fonctionnalités autorisées par son `Role` système et son `ProfessionalRole`.
  - Les administrateurs (`ADMIN`, `PLANNER`) ont un scope d'action défini (ex: un `PLANNER` IADE ne gère que les IADE). L'`ADMIN` général a un scope global.
- **Confidentialité des Données Personnelles** :
  - Les compteurs horaires personnels, détails des demandes de congés (motifs, soldes) ne sont visibles que par la personne concernée et les administrateurs/planificateurs autorisés.
  - Les informations sensibles (ex: détails contractuels) sont protégées.
- **Principe du moindre privilège** : Les utilisateurs ne devraient avoir accès qu'aux données et fonctionnalités strictement nécessaires à l'accomplissement de leurs tâches.

## 9. Authentification

L'accès à l'application nécessite une authentification sécurisée :

- **Identifiants** : Utilisation du `login` (ou `email`) et `password`.
- **Mots de Passe Forts** : Politique de mots de passe robustes (longueur, complexité) appliquée lors de la création et du changement.
- **Stockage Sécurisé des Mots de Passe** : Utilisation de hachage fort (ex: Bcrypt, Argon2) pour les mots de passe stockés (champ `password` du modèle `User`).
- **Sessions Sécurisées** : Utilisation de mécanismes de session sécurisés (ex: JWT stockés dans des cookies `HttpOnly`, `Secure`, `SameSite`). Les sessions doivent avoir une durée de vie limitée.
- **Protection contre les Attaques Courantes** : Mesures contre le brute-force (limitation de tentatives), XSS, CSRF.
- **Déconnexion** : Fonctionnalité de déconnexion manuelle et potentiellement déconnexion automatique après une période d'inactivité configurable.

## 10. Gestion des Compétences et Spécialités

### 10.1. Spécialités Chirurgicales

- Les utilisateurs avec `ProfessionalRole = CHIRURGIEN` sont associés à une ou plusieurs spécialités via le modèle `Specialty`.
- Les spécialités sont gérées par les administrateurs (`ADMIN`).
- **Utilisation** :
  - Information pour la planification (savoir quel type de chirurgien opère où).
  - Potentiellement pour des statistiques d'activité.
  - Peut influencer l'affectation du personnel d'anesthésie si des règles spécifiques existent (ex: un MAR avec compétence "pédiatrie" pour une intervention pédiatrique).

### 10.2. Compétences MAR/IADE

- Les utilisateurs `MAR` et `IADE` peuvent se voir attribuer des compétences spécifiques (ex: Pédiatrie, Anesthésie Loco-Régionale (ALR), Thoracique, Cardiaque) via un modèle `Skill` ou similaire.
- Ces compétences sont gérées par les administrateurs (`ADMIN` ou `PLANNER` avec droits adéquats).
- **Utilisation** :
  - Peuvent être utilisées comme **préférences** ou **contraintes** lors de la génération du planning et des affectations manuelles.
    - Ex: Interdire l'affectation d'un personnel sans la compétence "Pédiatrie" à une salle pédiatrique identifiée comme telle.
    - Ex: Préférer un personnel avec la compétence "ALR" pour une salle où ce type d'anesthésie est fréquent.
  - Aider à l'équilibrage de l'exposition à certaines techniques ou types de patients.

---

Ce modèle utilisateur et la gestion des profils associés constituent la base de l'authentification, de l'autorisation et de la personnalisation de l'expérience dans Mathildanesth.
