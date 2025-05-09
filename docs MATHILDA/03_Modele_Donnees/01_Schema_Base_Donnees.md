# Schéma de la Base de Données

Ce document définit la structure détaillée de la base de données PostgreSQL pour l'application MATHILDA. Il servira de référence pour la configuration de l'ORM Prisma.

## Légende

- **PK** : Clé Primaire (Primary Key)
- **FK** : Clé Étrangère (Foreign Key)
- **UQ** : Contrainte d'Unicité (Unique Constraint)
- **NN** : Non Null (Not Null Constraint)

## 1. Table `Utilisateurs` (`users`)

Stocke les informations sur tous les utilisateurs de l'application.

| Colonne            | Type          | Contraintes    | Description                                                                 |
|--------------------|---------------|----------------|-----------------------------------------------------------------------------|
| `id`               | SERIAL        | PK             | Identifiant unique de l'utilisateur (auto-incrémenté)                       |
| `username`         | VARCHAR(50)   | UQ, NN         | Nom d'utilisateur unique pour la connexion (ex: vperreard)                  |
| `email`            | VARCHAR(255)  | UQ, NN         | Adresse email unique de l'utilisateur (pour connexion et notifications)     |
| `password`         | VARCHAR(255)  | NN             | Mot de passe haché (bcrypt)                                                 |
| `firstName`        | VARCHAR(100)  | NN             | Prénom de l'utilisateur                                                     |
| `lastName`         | VARCHAR(100)  | NN             | Nom de l'utilisateur                                                        |
| `roleId`           | INTEGER       | FK (Roles), NN | Référence vers le rôle principal de l'utilisateur                           |
| `phoneNumber`      | VARCHAR(20)   |                | Numéro de téléphone (pour futures notifications SMS)                       |
| `googleSheetsAlias`| VARCHAR(255)  |                | Nom/Identifiant utilisé dans Google Sheets (pertinent pour les chirurgiens) |
| `isActive`         | BOOLEAN       | NN, DEFAULT true | Indique si le compte utilisateur est actif                                  |
| `workingTime`      | DECIMAL(3, 2) | NN, DEFAULT 1.00 | Pourcentage de temps de travail (ex: 0.8 pour 80%)                         |
| `createdAt`        | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de création de l'enregistrement                             |
| `updatedAt`        | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour                                   |

**Index :**
- Index sur `username`
- Index sur `email`
- Index sur `lastName`, `firstName`

## 2. Table `Roles` (`roles`)

Définit les différents rôles possibles dans l'application.

| Colonne     | Type         | Contraintes    | Description                                   |
|-------------|--------------|----------------|-----------------------------------------------|
| `id`        | SERIAL       | PK             | Identifiant unique du rôle                     |
| `name`      | VARCHAR(50)  | UQ, NN         | Nom unique du rôle (ex: `mar`, `iade`, `admin_mar`) |
| `description`| TEXT         |                | Description détaillée du rôle                 |
| `permissions`| JSONB        |                | Structure JSON définissant les permissions   |
| `createdAt` | TIMESTAMP    | NN, DEFAULT NOW() | Date et heure de création                   |
| `updatedAt` | TIMESTAMP    | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour     |

**Données initiales :** Pré-remplir avec les rôles définis (`admin_mar`, `admin_iade`, `mar`, `iade`, `chirurgien`, `secretaire`, `remplacant`, `super_admin`).

## 3. Table `Competences` (`skills`)

Liste les compétences techniques ou médicales pertinentes.

| Colonne     | Type         | Contraintes    | Description                                    |
|-------------|--------------|----------------|------------------------------------------------|
| `id`        | SERIAL       | PK             | Identifiant unique de la compétence             |
| `name`      | VARCHAR(100) | UQ, NN         | Nom unique de la compétence (ex: `Pédiatrie`, `ALR`) |
| `description`| TEXT         |                | Description de la compétence                   |
| `createdAt` | TIMESTAMP    | NN, DEFAULT NOW() | Date et heure de création                      |
| `updatedAt` | TIMESTAMP    | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour      |

## 4. Table `UtilisateurCompetences` (`user_skills`)

Table de liaison pour la relation N-N entre `Utilisateurs` et `Competences`.

| Colonne       | Type    | Contraintes                  | Description                                         |
|---------------|---------|------------------------------|-----------------------------------------------------|
| `utilisateurId`| INTEGER | PK, FK (Utilisateurs), NN    | Référence vers l'utilisateur                        |
| `competenceId` | INTEGER | PK, FK (Competences), NN     | Référence vers la compétence                         |
| `level`       | VARCHAR(50) |                          | Niveau de compétence (ex: `Junior`, `Senior`, `Expert`) |
| `preference`  | ENUM('preferred', 'forbidden', 'neutral') | NN, DEFAULT 'neutral' | Préférence/Interdit pour cette compétence |
| `assignedAt`  | TIMESTAMP | NN, DEFAULT NOW()        | Date d'assignation de la compétence à l'utilisateur |

**Clé Primaire Composite:** (`utilisateurId`, `competenceId`)

## 5. Table `Sites` (`sites`)

Représente les différents lieux physiques (cliniques, hôpitaux).

| Colonne     | Type          | Contraintes    | Description                         |
|-------------|---------------|----------------|-------------------------------------|
| `id`        | SERIAL        | PK             | Identifiant unique du site          |
| `name`      | VARCHAR(100)  | UQ, NN         | Nom du site                         |
| `address`   | TEXT          |                | Adresse du site                     |
| `contact`   | VARCHAR(100)  |                | Personne ou service de contact      |
| `isActive`  | BOOLEAN       | NN, DEFAULT true | Indique si le site est actif        |
| `createdAt` | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de création        |
| `updatedAt` | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour |

## 6. Table `Secteurs` (`sectors`)

Représente les divisions au sein d'un site (ex: Hyperaseptique, Ophtalmo).

| Colonne        | Type          | Contraintes         | Description                                    |
|----------------|---------------|---------------------|------------------------------------------------|
| `id`           | SERIAL        | PK                  | Identifiant unique du secteur                  |
| `siteId`       | INTEGER       | FK (Sites), NN      | Référence vers le site auquel appartient le secteur |
| `name`         | VARCHAR(100)  | NN                  | Nom du secteur                                 |
| `description`  | TEXT          |                     | Description du secteur                         |
| `activityType` | VARCHAR(50)   |                     | Type d'activité (standard, spécialisé)       |
| `defaultOpeningTime` | TIME    |                     | Heure d'ouverture par défaut                  |
| `defaultClosingTime` | TIME    |                     | Heure de fermeture par défaut                  |
| `displayOrder` | INTEGER       | NN, DEFAULT 0       | Ordre d'affichage du secteur dans son site     |
| `isActive`     | BOOLEAN       | NN, DEFAULT true    | Indique si le secteur est actif                |
| `createdAt`    | TIMESTAMP     | NN, DEFAULT NOW()  | Date et heure de création                   |
| `updatedAt`    | TIMESTAMP     | NN, DEFAULT NOW()  | Date et heure de la dernière mise à jour      |

**Contrainte d'Unicité:** (`siteId`, `name`)
**Index:** Index sur (`siteId`, `displayOrder`)

## 7. Table `Specialites` (`specialties`)

Liste les spécialités chirurgicales.

| Colonne     | Type          | Contraintes    | Description                                       |
|-------------|---------------|----------------|---------------------------------------------------|
| `id`        | SERIAL        | PK             | Identifiant unique de la spécialité               |
| `name`      | VARCHAR(100)  | UQ, NN         | Nom unique de la spécialité (ex: `Orthopédie`) |
| `description`| TEXT          |                | Description de la spécialité                      |
| `createdAt` | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de création                         |
| `updatedAt` | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour         |

## 8. Table `UtilisateurSpecialites` (`user_specialties`)

Table de liaison N-N entre `Utilisateurs` (Chirurgiens) et `Specialites`.

| Colonne         | Type    | Contraintes                  | Description                                    |
|-----------------|---------|------------------------------|------------------------------------------------|
| `utilisateurId` | INTEGER | PK, FK (Utilisateurs), NN    | Référence vers l'utilisateur (chirurgien)     |
| `specialiteId`  | INTEGER | PK, FK (Specialites), NN     | Référence vers la spécialité                  |
| `isPrimary`     | BOOLEAN | NN, DEFAULT false            | Indique si c'est la spécialité principale (max 1 par utilisateur) |
| `assignedAt`    | TIMESTAMP | NN, DEFAULT NOW()        | Date d'assignation de la spécialité           |

**Clé Primaire Composite:** (`utilisateurId`, `specialiteId`)
**Index :** Index sur `utilisateurId` pour retrouver facilement les spécialités d'un chirurgien.

## 9. Table `Salles` (`rooms`)

Représente les salles d'intervention au sein d'un secteur.

| Colonne          | Type          | Contraintes            | Description                                                       |
|------------------|---------------|------------------------|-------------------------------------------------------------------|
| `id`             | SERIAL        | PK                     | Identifiant unique de la salle                                    |
| `secteurId`      | INTEGER       | FK (Secteurs), NN      | Référence vers le secteur auquel appartient la salle             |
| `name`           | VARCHAR(50)   | NN                     | Nom/Numéro de la salle (ex: `Salle 1`, `Endo 2`)                 |
| `description`    | TEXT          |                        | Description ou note sur la salle                                  |
| `roomType`       | VARCHAR(50)   |                        | Type de salle (standard, spécialisée, urgence)                    |
| `specialiteId`   | INTEGER       | FK (Specialites)       | Spécialité chirurgicale associée (si salle dédiée)               |
| `equipment`      | TEXT          |                        | Équipement spécifique disponible                                 |
| `status`         | ENUM('active', 'inactive', 'reserved') | NN, DEFAULT 'active' | Statut de la salle                                                |
| `isEmergencyOnly`| BOOLEAN       | NN, DEFAULT false      | Indique si la salle est réservée aux urgences (ex: Salle 8 Césa) |
| `displayOrder` | INTEGER       | NN, DEFAULT 0       | Ordre d'affichage de la salle dans son secteur   |
| `isActive`       | BOOLEAN       | NN, DEFAULT true       | Indique si la salle est utilisable dans le système               |
| `createdAt`      | TIMESTAMP     | NN, DEFAULT NOW()     | Date et heure de création                                      |
| `updatedAt`      | TIMESTAMP     | NN, DEFAULT NOW()     | Date et heure de la dernière mise à jour                          |

**Contrainte d'Unicité:** (`secteurId`, `name`)
**Index:** Index sur (`secteurId`, `displayOrder`)

## 10. Table `TypesAffectation` (`assignment_types`)

Décrit les différents types d'activités planifiables.

| Colonne         | Type          | Contraintes | Description                                                                 |
|-----------------|---------------|-------------|-----------------------------------------------------------------------------|
| `id`            | SERIAL        | PK          | Identifiant unique du type d'affectation                                    |
| `code`          | VARCHAR(50)   | UQ, NN      | Code unique pour référence interne (ex: `GARDE_MAR`, `BLOC_AM`, `CONSULT_PM`) |
| `name`          | VARCHAR(100)  | NN          | Nom lisible du type d'affectation (ex: `Garde MAR`, `Bloc Matin`)        |
| `description`   | TEXT          |             | Description détaillée                                                       |
| `applicableRole`| ENUM('mar', 'iade', 'both') | NN       | Rôle concerné (MAR seul, IADE seul, ou les deux)                        |
| `isTimeBased`   | BOOLEAN       | NN, DEFAULT true | Est-ce une affectation temporelle (vs configuration) ?                     |
| `defaultColor`  | VARCHAR(7)    |             | Couleur par défaut pour affichage dans le planning (ex: `#FF0000`)           |
| `createdAt`     | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de création                                                   |
| `updatedAt`     | TIMESTAMP     | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour                                   |

**Données initiales:** Pré-remplir avec les types définis (Garde MAR, Astreinte MAR, Bloc Matin, Bloc Après-midi, Consultation Matin, Consultation Après-midi, OFF, etc.).

## 11. Table `Conges` (`leaves`)

Stocke les demandes de congés et les absences.

| Colonne         | Type           | Contraintes                   | Description                                                               |
|-----------------|----------------|-------------------------------|---------------------------------------------------------------------------|
| `id`            | SERIAL         | PK                            | Identifiant unique du congé/absence                                        |
| `utilisateurId` | INTEGER        | FK (Utilisateurs), NN         | Utilisateur demandant le congé ou concerné par l'absence                  |
| `startDate`     | DATE           | NN                            | Date de début du congé/absence                                           |
| `endDate`       | DATE           | NN                            | Date de fin du congé/absence (incluse)                                   |
| `startTime`     | TIME           |                               | Heure de début (optionnel, pour demi-journées)                           |
| `endTime`       | TIME           |                               | Heure de fin (optionnel, pour demi-journées)                             |
| `leaveType`     | VARCHAR(50)    | NN                            | Type de congé (ex: `annual`, `rtt`, `sick`, `unpaid`, `maternity`, `other`) |
| `status`        | ENUM('pending', 'approved', 'rejected') | NN, DEFAULT 'pending'   | Statut de la demande de congé                                            |
| `comment`       | TEXT           |                               | Commentaire du demandeur                                                   |
| `approverId`    | INTEGER        | FK (Utilisateurs)             | Utilisateur ayant approuvé/rejeté la demande (si applicable)             |
| `decisionDate`  | TIMESTAMP      |                               | Date et heure de la décision                                              |
| `approverComment`| TEXT           |                               | Commentaire de l'approbateur                                              |
| `createdAt`     | TIMESTAMP      | NN, DEFAULT NOW()             | Date et heure de la demande                                               |
| `updatedAt`     | TIMESTAMP      | NN, DEFAULT NOW()             | Date et heure de la dernière mise à jour                                  |

**Contraintes:**
- `endDate` >= `startDate`

## 12. Table `RequetesSpecifiques` (`specific_requests`)

Stocke les demandes spécifiques des utilisateurs pour le planning.

| Colonne         | Type        | Contraintes                   | Description                                                             |
|-----------------|-------------|-------------------------------|-------------------------------------------------------------------------|
| `id`            | SERIAL      | PK                            | Identifiant unique de la requête                                        |
| `utilisateurId` | INTEGER     | FK (Utilisateurs), NN         | Utilisateur faisant la requête                                          |
| `requestType`   | VARCHAR(50) | NN                            | Type de requête (ex: `assign_to_room`, `assign_to_date`, `work_with`) |
| `targetDate`    | DATE        |                               | Date cible de la requête (si applicable)                               |
| `targetTimeSlot`| ENUM('morning', 'afternoon', 'full_day') |       | Créneau horaire cible (si applicable)                                  |
| `targetRoomId`  | INTEGER     | FK (Salles)                   | Salle cible (si applicable)                                             |
| `targetUserId`  | INTEGER     | FK (Utilisateurs)             | Autre utilisateur cible (ex: travailler avec ce chirurgien)            |
| `description`   | TEXT        | NN                            | Description détaillée de la requête                                     |
| `status`        | ENUM('pending', 'approved', 'rejected', 'considered') | NN, DEFAULT 'pending' | Statut de la requête                                                |
| `priority`      | ENUM('normal', 'high') | NN, DEFAULT 'normal'      | Priorité de la requête (ex: validée par admin = high)                 |
| `createdAt`     | TIMESTAMP   | NN, DEFAULT NOW()             | Date et heure de la requête                                            |
| `updatedAt`     | TIMESTAMP   | NN, DEFAULT NOW()             | Date et heure de la dernière mise à jour                               |
| `resolverId`    | INTEGER     | FK (Utilisateurs)             | Utilisateur ayant traité la requête                                      |
| `resolutionDate`| TIMESTAMP   |                               | Date et heure de la résolution                                         |
| `resolverComment`| TEXT        |                               | Commentaire du résolveur                                                |

## 13. Table `TrameChirurgien` (`surgeon_schedule_entries`)

Stocke les informations sur l'occupation prévisionnelle des salles par les chirurgiens (importée ou saisie).

| Colonne         | Type          | Contraintes                   | Description                                                               |
|-----------------|---------------|-------------------------------|---------------------------------------------------------------------------|
| `id`            | SERIAL        | PK                            | Identifiant unique de l'entrée de trame                                   |
| `chirurgienId`  | INTEGER       | FK (Utilisateurs), NN         | Chirurgien concerné                                                      |
| `salleId`       | INTEGER       | FK (Salles), NN               | Salle occupée                                                             |
| `date`          | DATE          | NN                            | Jour concerné                                                             |
| `timeSlot`      | ENUM('morning', 'afternoon') | NN      | Créneau horaire concerné (matin ou après-midi)                           |
| `specialiteId`  | INTEGER       | FK (Specialites)              | Spécialité de l'intervention prévue (optionnel)                          |
| `weekType`      | ENUM('pair', 'impair', 'specific') | NN | Type de semaine (paire, impaire) ou date spécifique (pour exceptions) |
| `source`        | VARCHAR(50)   | NN, DEFAULT 'manual'        | Origine de l'entrée (manual, google_sheet)                               |
| `externalId`    | VARCHAR(255)  |                               | ID externe (ex: ID ligne Google Sheet pour synchro)                      |
| `createdAt`     | TIMESTAMP     | NN, DEFAULT NOW()             | Date et heure de création                                                |
| `updatedAt`     | TIMESTAMP     | NN, DEFAULT NOW()             | Date et heure de la dernière mise à jour                                  |

**Index:**
- Index sur (`date`, `salleId`, `timeSlot`) pour recherche rapide d'occupation.
- Index sur (`chirurgienId`, `date`).

## 14. Table `Affectations` (`assignments`)

Table centrale liant les utilisateurs aux activités planifiées (bloc, consultation, garde, etc.) ou aux statuts (OFF).
Une affectation de type BLOC lie un utilisateur (MAR ou IADE) à une salle pour une date et une période (startTime/endTime).
Le chirurgien et la spécialité opératoire pour cette affectation de bloc peuvent être déduits en consultant la table `TrameChirurgien` (`surgeon_schedule_entries`) pour la même salle, date et créneau horaire (`timeSlot`).

| Colonne            | Type         | Contraintes                   | Description                                                                 |
|--------------------|--------------|-------------------------------|-----------------------------------------------------------------------------|
| `id`               | SERIAL       | PK                            | Identifiant unique de l'affectation                                         |
| `utilisateurId`    | INTEGER      | FK (Utilisateurs), NN         | Utilisateur affecté (MAR ou IADE)                                          |
| `date`             | DATE         | NN                            | Jour de l'affectation                                                      |
| `typeAffectationId`| INTEGER      | FK (TypesAffectation), NN     | Type d'activité (garde, bloc, consult, OFF, etc.)                         |
| `salleId`          | INTEGER      | FK (Salles)                   | Salle concernée (si applicable, ex: bloc, consultation)                    |
| `secteurId`        | INTEGER      | FK (Secteurs)                 | Secteur concerné (peut être déduit de la salle, mais utile pour affectations hors salle comme Garde/Astreinte) |
| `startTime`        | TIMESTAMP    | NN                            | Date et heure de début précise de l'affectation                            |
| `endTime`          | TIMESTAMP    | NN                            | Date et heure de fin précise de l'affectation                             |
| `roleDansAffectation`| ENUM('anesthesia', 'supervision', 'consultation', 'on_call_duty', 'on_call_standby', 'off') | NN | Rôle spécifique de l'utilisateur dans cette affectation (Garde = on_call_duty, Astreinte = on_call_standby) |
| `superviseurId`    | INTEGER      | FK (Utilisateurs)             | MAR supervisant (si `roleDansAffectation` est 'anesthesia' pour un IADE en bloc) |
| `estVolant`        | BOOLEAN      | NN, DEFAULT false             | Indique si l'IADE est "volant" sur cette affectation                   |
| `estFermeture`     | BOOLEAN      | NN, DEFAULT false             | Indique si l'IADE est de "fermeture" sur cette affectation             |
| `planningVersionId`| INTEGER      | FK (PlanningVersions)         | Version du planning à laquelle cette affectation appartient (optionnel)   |
| `requeteId`        | INTEGER      | FK (RequetesSpecifiques)      | Requête spécifique ayant conduit à cette affectation (optionnel)          |
| `comment`          | TEXT         |                               | Commentaire spécifique à cette affectation (ex: 'Supervision Pédiatrique') |
| `createdAt`        | TIMESTAMP    | NN, DEFAULT NOW()             | Date et heure de création                                                |
| `updatedAt`        | TIMESTAMP    | NN, DEFAULT NOW()             | Date et heure de la dernière mise à jour                                   |

**Index:**
- Index sur (`utilisateurId`, `date`)
- Index sur (`date`, `salleId`)
- Index sur (`date`, `typeAffectationId`)
- Index sur `superviseurId`

**Contraintes:**
- `endTime` > `startTime`

## 15. Table `PlanningVersions` (`planning_versions`)

Historise les différentes versions publiées d'un planning pour une période donnée.

| Colonne        | Type        | Contraintes       | Description                                                             |
|----------------|-------------|-------------------|-------------------------------------------------------------------------|
| `id`           | SERIAL      | PK                | Identifiant unique de la version du planning                           |
| `startDate`    | DATE        | NN                | Date de début de la période couverte par cette version du planning    |
| `endDate`      | DATE        | NN                | Date de fin de la période couverte par cette version du planning      |
| `versionNumber`| INTEGER     | NN                | Numéro de version (incrémenté pour la même période)                     |
| `status`       | ENUM('draft', 'published', 'archived') | NN, DEFAULT 'draft' | Statut de la version (Brouillon, Publié, Archivé)                 |
| `publisherId`  | INTEGER     | FK (Utilisateurs) | Utilisateur ayant publié cette version (si `status` = 'published')    |
| `publishedAt`  | TIMESTAMP   |                   | Date et heure de publication                                           |
| `comment`      | TEXT        |                   | Commentaire sur cette version                                          |
| `createdAt`    | TIMESTAMP   | NN, DEFAULT NOW() | Date et heure de création de la version                                |

**Contrainte d'Unicité:** (`startDate`, `endDate`, `versionNumber`)

## 16. Table `CompteursUtilisateur` (`user_counters`)

Stocke les compteurs agrégés pour chaque utilisateur sur différentes périodes (pour équité).
La liste précise des `counterType` à implémenter est définie dans `docs/05_Regles_Metier/01_Regles_Planification.md` (sections 4.1 et 4.2).

| Colonne         | Type          | Contraintes                | Description                                                                        |
|-----------------|---------------|----------------------------|------------------------------------------------------------------------------------|
| `id`            | SERIAL        | PK                         | Identifiant unique de l'entrée de compteur                                         |
| `utilisateurId` | INTEGER       | FK (Utilisateurs), NN      | Utilisateur concerné                                                               |
| `counterType`   | VARCHAR(50)   | NN                         | Type de compteur (ex: `gardes_we`, `consultations_vendredi_aprem`, `fermetures_vendredi`, `dj_pedia_anest`, `score_penibilite`) |
| `periodType`    | ENUM('week', 'month', 'quarter', 'year', 'rolling_7_days') | NN | Période de calcul (Semaine, Mois, Trimestre, Année, 7 jours glissants pour pénibilité) |
| `periodStartDate`| DATE          | NN                         | Date de début de la période                                                        |
| `value`         | DECIMAL(10, 2)| NN                         | Valeur calculée brute du compteur pour la période                                  |
| `normalizedValue`| DECIMAL(10, 2)|                            | Valeur normalisée/pondérée au temps de travail (pour comparaison équité)         |
| `targetValue`   | DECIMAL(10, 2)|                            | Valeur cible (théorique) pour la période (si applicable)                           |
| `lastCalculated`| TIMESTAMP     | NN, DEFAULT NOW()          | Date et heure du dernier calcul                                                    |

**Contrainte d'Unicité:** (`utilisateurId`, `counterType`, `periodStartDate`)
**Index:**
- Index sur (`utilisateurId`, `counterType`, `periodStartDate`)

## 17. Table `DeclarationHeures` (`hour_declarations`)

Permet aux MARs de déclarer leurs heures (si fonctionnalité activée).

| Colonne           | Type         | Contraintes              | Description                                                               |
|-------------------|--------------|--------------------------|---------------------------------------------------------------------------|
| `id`              | SERIAL       | PK                       | Identifiant unique de la déclaration                                       |
| `utilisateurId`   | INTEGER      | FK (Utilisateurs), NN    | Utilisateur (MAR) déclarant les heures                                    |
| `affectationId`   | INTEGER      | FK (Affectations)        | Affectation concernée (si la déclaration est liée à une affectation)      |
| `date`            | DATE         | NN                       | Jour concerné par les heures déclarées                                    |
| `declaredHours`   | DECIMAL(4, 2)| NN                       | Nombre d'heures déclarées                                                  |
| `declarationType` | VARCHAR(50)  | NN, DEFAULT 'standard' | Type d'heures (Standard, Supplémentaire, Garde)                           |
| `status`          | ENUM('pending', 'approved', 'rejected') | NN, DEFAULT 'pending' | Statut de validation (si validation activée)                           |
| `validatorId`     | INTEGER      | FK (Utilisateurs)        | Administrateur ayant validé/rejeté                                        |
| `validationDate`  | TIMESTAMP    |                          | Date de validation/rejet                                                  |
| `validatorComment`| TEXT         |                          | Commentaire du validateur                                                 |
| `comment`         | TEXT         |                          | Commentaire du déclarant                                                  |
| `createdAt`       | TIMESTAMP    | NN, DEFAULT NOW()        | Date et heure de la déclaration                                           |
| `updatedAt`       | TIMESTAMP    | NN, DEFAULT NOW()        | Date et heure de la dernière mise à jour                                  |

## 18. Table `Configuration` (`config_settings`)

Stocke les paramètres de configuration généraux de l'application.

| Colonne     | Type      | Contraintes | Description                                                                      |
|-------------|-----------|-------------|----------------------------------------------------------------------------------|
| `key`       | VARCHAR(100)| PK          | Clé unique du paramètre de configuration (ex: `planning.generation_horizon_days`) |
| `value`     | TEXT      | NN          | Valeur du paramètre (stockée en texte, à parser selon le besoin)                |
| `description`| TEXT      |             | Description du paramètre                                                         |
| `type`      | VARCHAR(50)| NN          | Type de donnée (string, integer, boolean, json) pour validation/parsing         |
| `isEditable`| BOOLEAN   | NN, DEFAULT true | Peut être modifié via l'interface d'administration ?                            |
| `updatedAt` | TIMESTAMP | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour                                       |

## 19. Table `ConfigurationPenibilite` (`config_points_penibilite`)

Stocke la configuration spécifique des points de pénibilité.

| Colonne             | Type         | Contraintes       | Description                                                                           |
|---------------------|--------------|-------------------|---------------------------------------------------------------------------------------|
| `id`                | SERIAL       | PK                | Identifiant unique                                                                    |
| `activityCode`      | VARCHAR(50)  | UQ, NN            | Code de l'activité concernée (ex: `GARDE_WE`, `SUPERVISION_1`, `CONSULT_PM`, `REPOS_GARDE`) |
| `points`            | DECIMAL(4, 2)| NN                | Points attribués pour cette activité                                                  |
| `applicableRole`    | ENUM('mar', 'iade', 'both') | NN | Rôle concerné                                                                       |
| `description`       | TEXT         |                   | Description                                                                           |
| `updatedAt`         | TIMESTAMP    | NN, DEFAULT NOW() | Date et heure de la dernière mise à jour                                            |

## 20. Table `CommentairesJournaliers` (`daily_comments`)

Permet d'ajouter des commentaires libres pour une journée spécifique.

| Colonne         | Type        | Contraintes            | Description                                  |
|-----------------|-------------|------------------------|----------------------------------------------|
| `id`            | SERIAL      | PK                     | Identifiant unique du commentaire            |
| `date`          | DATE        | NN                     | Jour concerné par le commentaire             |
| `utilisateurId` | INTEGER     | FK (Utilisateurs), NN  | Utilisateur ayant posté le commentaire       |
| `comment`       | TEXT        | NN                     | Contenu du commentaire                       |
| `createdAt`     | TIMESTAMP   | NN, DEFAULT NOW()      | Date et heure de création                 |
| `updatedAt`     | TIMESTAMP   | NN, DEFAULT NOW()      | Date et heure de la dernière mise à jour  |

**Index:**
- Index sur `date`

## 21. Table `DisponibilitesRemplacant` (`substitute_availabilities`)

Permet aux remplaçants d'indiquer leurs disponibilités.

| Colonne         | Type      | Contraintes            | Description                                        |
|-----------------|-----------|------------------------|----------------------------------------------------|
| `id`            | SERIAL    | PK                     | Identifiant unique de la disponibilité           |
| `remplacantId`  | INTEGER   | FK (Utilisateurs), NN  | Utilisateur (avec rôle remplaçant) concerné      |
| `date`          | DATE      | NN                     | Jour de disponibilité                              |
| `timeSlot`      | ENUM('morning', 'afternoon', 'full_day', 'on_call') | NN | Créneau de disponibilité                        |
| `comment`       | TEXT      |                        | Commentaire éventuel                               |
| `createdAt`     | TIMESTAMP | NN, DEFAULT NOW()      | Date et heure de création                        |
| `updatedAt`     | TIMESTAMP | NN, DEFAULT NOW()      | Date et heure de la dernière mise à jour         |

**Contrainte d'Unicité:** (`remplacantId`, `date`, `timeSlot`)

## 22. Table `Notifications` (`notifications`)

Stocke les notifications générées par le système pour les utilisateurs.

| Colonne         | Type        | Contraintes            | Description                                                               |
|-----------------|-------------|------------------------|---------------------------------------------------------------------------|
| `id`            | SERIAL      | PK                     | Identifiant unique de la notification                                     |
| `utilisateurId` | INTEGER     | FK (Utilisateurs), NN  | Utilisateur destinataire                                                   |
| `type`          | VARCHAR(50) | NN                     | Type de notification (ex: `new_schedule`, `leave_approved`, `exchange_request`) |
| `message`       | TEXT        | NN                     | Contenu de la notification                                                |
| `relatedEntity` | VARCHAR(50) |                        | Type de l'entité liée (ex: `assignment`, `leave`)                        |
| `relatedEntityId`| INTEGER     |                        | ID de l'entité liée                                                       |
| `isRead`        | BOOLEAN     | NN, DEFAULT false      | Indique si la notification a été lue                                      |
| `readAt`        | TIMESTAMP   |                        | Date et heure de lecture                                                  |
| `createdAt`     | TIMESTAMP   | NN, DEFAULT NOW()      | Date et heure de création                                                |

**Index:**
- Index sur (`utilisateurId`, `isRead`, `createdAt`)

## 23. Table `HistoriqueAudit` (`audit_logs`)

Stocke l'historique des actions importantes effectuées dans l'application.

| Colonne          | Type        | Contraintes          | Description                                                               |
|------------------|-------------|----------------------|---------------------------------------------------------------------------|
| `id`             | BIGSERIAL   | PK                   | Identifiant unique de l'entrée de log                                     |
| `timestamp`      | TIMESTAMP   | NN, DEFAULT NOW()    | Date et heure exactes de l'événement                                       |
| `utilisateurId`  | INTEGER     | FK (Utilisateurs)    | Utilisateur ayant effectué l'action (NULL si action système)             |
| `actionType`     | VARCHAR(100)| NN                   | Type d'action effectuée (ex: `PLANNING_PUBLISHED`, `LEAVE_APPROVED`)       |
| `targetEntityType`| VARCHAR(50) |                      | Type de l'entité concernée (ex: `PlanningVersion`, `Leave`, `User`)       |
| `targetEntityId` | INTEGER     |                      | ID de l'entité spécifique concernée                                       |
| `details`        | JSONB       |                      | Détails supplémentaires (ex: valeurs avant/après pour modification)        |
| `ipAddress`      | VARCHAR(45) |                      | Adresse IP source de la requête (optionnel)                              |

**Index:**
- Index sur (`timestamp`)
- Index sur (`utilisateurId`)
- Index sur (`actionType`)
- Index sur (`targetEntityType`, `targetEntityId`)

---

Ce schéma couvre l'ensemble des fonctionnalités discutées. Il pourra être affiné lors de l'implémentation avec Prisma et l'ajout d'index spécifiques si nécessaire pour les performances. 