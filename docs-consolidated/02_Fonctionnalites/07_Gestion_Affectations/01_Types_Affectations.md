# Types d'Affectations et Leurs Propriétés

## 1. Introduction

Mathildanesth gère une variété de types d'affectations pour représenter les différentes activités et responsabilités du personnel. Chaque type d'affectation possède des propriétés spécifiques qui influencent la planification, le décompte du temps de travail, et l'application des règles métier. Ce document détaille les principaux types d'affectations et leur configuration.

## 2. Concept de Type d'Affectation

Un "type d'affectation" définit la nature d'une période de travail ou d'une tâche assignée à un utilisateur. Le système s'appuie sur le modèle `ActivityType` pour une configuration flexible et détaillée de ces types.

Le modèle `ActivityType` (`prisma/schema.prisma`) permet de définir chaque type d'activité avec les propriétés suivantes :

- **`id`** (String) : Identifiant unique du type d'activité.
- **`name`** (String) : Nom descriptif (ex: "Garde Anesthésie Pontoise", "Consultation Dr. Durand").
- **`code`** (String) : Code unique pour identification métier (ex: "GARDE_MAR_NUIT", "CONSULT_PREOP"). C'est probablement cette valeur qui est utilisée dans le champ `type` du modèle `Assignment`.
- **`description`** (String, optionnel).
- **`category`** (Enum `ActivityCategory`) : Catégorise l'activité (ex: `GARDE`, `ASTREINTE`, `BLOC_OPERATOIRE`, `CONSULTATION`, `FORMATION`, etc.).
- **`color`** (String, optionnel) : Couleur pour l'affichage dans le planning.
- **`icon`** (String, optionnel) : Icône pour l'affichage.
- **`isActive`** (Boolean) : Permet de désactiver un type sans le supprimer.
- **`defaultDurationHours`** (Float, optionnel) : Durée par défaut en heures.
- **`defaultPeriod`** (Enum `Period`, optionnel) : Période par défaut (`MATIN`, `APRES_MIDI`, `JOURNEE_ENTIERE`).
- Relations avec `Site` et `AffectationModele`.

L'enum `ActivityCategory` comprend des valeurs comme : `GARDE`, `ASTREINTE`, `BLOC_OPERATOIRE`, `CONSULTATION`, `REUNION`, `FORMATION`, `ADMINISTRATIF`, `HORS_POSTE_SOINS`, `MISSION_EXTERIEURE`, `AUTRE`.

Les éléments configurables pour chaque type d'affectation, via le modèle `ActivityType`, incluent donc son code, libellé, description, catégorie, couleur, durée par défaut, etc. Les rôles professionnels concernés ou les compétences requises peuvent être gérés par des règles métier ou des logiques applicatives associées à ces `ActivityType`.

## 3. Principaux Types d'Affectations Gérés (Exemples basés sur `ActivityCategory` et `ActivityType`)

### 3.1. Gardes

- **Description** : Périodes de présence obligatoire sur site pour assurer la continuité des soins, souvent en dehors des heures normales de service.
- **Sous-Types Possibles** :
  - Garde de Nuit
  - Garde de Jour (Week-end/Férié)
  - Garde de 24h
- **Propriétés** :
  - Heures de début et de fin précises.
  - Lieu/Service concerné.
  - Rôle (ex: MAR de garde, IADE de garde).
  - Décompte spécifique en termes de temps de travail et de repos compensateur.
  - Souvent associées à des règles strictes (nombre maximum par période, repos post-garde).

### 3.2. Astreintes

- **Description** : Périodes pendant lesquelles l'utilisateur doit rester joignable et disponible pour intervenir en cas de besoin, sans être nécessairement sur site.
- **Sous-Types Possibles** :
  - Astreinte Opérationnelle (avec déplacement fréquent)
  - Astreinte de Sécurité (déplacement rare)
- **Propriétés** :
  - Décompte spécifique (différent du temps de travail effectif si pas de déplacement).
  - Règles sur le délai d'intervention.

### 3.3. Vacations de Bloc Opératoire

- **Description** : Affectations aux salles d'opération pour la prise en charge anesthésique des interventions.
- **Sous-Types Possibles** (peuvent être implicites via la salle/heure) :
  - Vacation Matin
  - Vacation Après-Midi
  - Vacation Journée Complète
- **Propriétés** :
  - Salle d'opération assignée.
  - Secteur du bloc.
  - Peut être lié à une spécialité chirurgicale ou un type d'intervention.
  - Application des [Règles de Supervision](../04_Bloc_Operatoire/02_Regles_Supervision.md).

### 3.4. Consultations

- **Description** : Périodes dédiées aux consultations d'anesthésie préopératoire ou de suivi.
- **Propriétés** :
  - Lieu de consultation.
  - Type de consultation (si pertinent).

### 3.5. Activités Hors Bloc / Hors Garde

- **Description** : Travail clinique ou non-clinique en journée.
- **Exemples** :
  - Visite pré-anesthésique en service.
  - Staff / Réunion de service.
  - Formation (en tant que participant ou formateur).
  - Activité de recherche.
  - Tâches administratives.
- **Propriétés** : Variables selon l'activité.

### 3.6. Absences Planifiées (Congés, Formation)

- Bien que gérées par le module des [Congés et Absences](../02_Gestion_Conges_Absences/01_Processus_Gestion_Conges_Absences.md), les absences approuvées apparaissent comme des "affectations" d'indisponibilité dans le planning.

## 4. Modèle `Assignment` (`prisma/schema.prisma`)

Le modèle `Assignment` stocke les instances d'affectations. Champs pertinents en lien avec le type :

- `id` (String)
- `userId` (Int) : L'utilisateur assigné.
- `date` (DateTime) : Souvent la date de début.
- `startDate` (DateTime)
- `endDate` (DateTime)
- **`type` (String)** : Champ texte stockant le code du type d'affectation, faisant probablement référence au champ `code` d'un enregistrement `ActivityType`. Exemples donnés dans le schéma Prisma pour `Assignment.type`: "BLOC_OPERATION", "CONSULTATION", "GARDE_JOUR", "GARDE_NUIT", "ASTREINTE", "REPOS_GARDE", "FORMATION", etc. Ces chaînes devraient correspondre aux `ActivityType.code` configurés.
- `role` (String, optionnel) : Rôle spécifique pour cette affectation (ex: "MAR Sénior de Garde").
- `locationId` (Int, optionnel) : Lien vers une `Location` (salle, service).
- `operatingRoomId` (Int, optionnel) : Spécifique pour le bloc.
- `specialtyId` (Int, optionnel) : Spécialité concernée.
- `notes` (String, optionnel).
- `isSystemGenerated` (Boolean, optionnel) : Indique si l'affectation a été créée par l'algorithme.

## 5. Configuration et Administration

- Une interface d'administration (probablement située sous `src/app/admin/activity-types/` ou une route API comme `/api/activity-types/`) permet de gérer la liste des `ActivityType` disponibles, leurs propriétés (code, nom, catégorie, couleur, durée par défaut, etc.) et potentiellement les règles qui leur sont associées implicitement.
- Cela permet d'adapter le système aux besoins spécifiques du service sans modifier le code source pour la définition des types d'activités.

---

La définition claire et la configuration flexible des types d'affectations via le modèle `ActivityType` sont essentielles pour la précision de la planification, la pertinence des règles appliquées, et la clarté des plannings pour les utilisateurs.
