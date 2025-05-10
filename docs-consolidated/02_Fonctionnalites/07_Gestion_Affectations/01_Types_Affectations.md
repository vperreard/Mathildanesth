# Types d'Affectations et Leurs Propriétés

## 1. Introduction

Mathildanesth gère une variété de types d'affectations pour représenter les différentes activités et responsabilités du personnel. Chaque type d'affectation possède des propriétés spécifiques qui influencent la planification, le décompte du temps de travail, et l'application des règles métier. Ce document détaille les principaux types d'affectations et leur configuration.

## 2. Concept de Type d'Affectation

Un "type d'affectation" définit la nature d'une période de travail ou d'une tâche assignée à un utilisateur. Le système doit permettre une configuration flexible de ces types.

Bien qu'un modèle `AssignmentType` dédié ne soit pas explicitement visible dans `prisma/schema.prisma` (le modèle `Assignment` a un champ `type: String` et `assignmentTypeId: Int?`), la logique applicative doit nécessairement s'appuyer sur une typologie structurée des affectations, potentiellement gérée via une table de configuration ou des constantes applicatives enrichies.

Les éléments configurables pour chaque type d'affectation pourraient inclure :

- **Code/Identifiant Unique** (ex: "GARDE_NUIT_MAR", "VAC_BLOC_AM", "CONSULT_SPE")
- **Libellé** (ex: "Garde de Nuit MAR", "Vacation Bloc Après-Midi", "Consultation Spécialisée")
- **Description**
- **Rôle(s) Professionnel(s) Concerné(s)** (ex: ce type d'affectation ne peut être assigné qu'à des MAR, ou IADE, etc.)
- **Couleur d'Affichage** : Pour la représentation visuelle dans les plannings.
- **Propriétés de Durée** : Durée typique, si elle est fixe ou variable.
- **Impact sur les Compteurs** : Comment cette affectation est-elle décomptée (temps de travail effectif, pénibilité, etc.) ?
- **Règles Spécifiques Associées** : Certaines règles du [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) peuvent cibler des types d'affectations spécifiques.
- **Compétences Requises** : Si des compétences particulières sont nécessaires.

## 3. Principaux Types d'Affectations Gérés

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

Le modèle `Assignment` stocke les instances d'affectations. Champs pertinents :

- `id` (String)
- `userId` (Int) : L'utilisateur assigné.
- `date` (DateTime) : Souvent la date de début, mais la sémantique peut dépendre du `type`.
- `startDate` (DateTime)
- `endDate` (DateTime)
- `type` (String) : Le code ou identifiant du type d'affectation.
- `assignmentTypeId` (Int, optionnel) : Pourrait lier à une table `AssignmentType` si elle était formalisée.
- `role` (String, optionnel) : Rôle spécifique pour cette affectation (ex: "MAR Sénior de Garde").
- `locationId` (Int, optionnel) : Lien vers une `Location` (salle, service).
- `operatingRoomId` (Int, optionnel) : Spécifique pour le bloc.
- `specialtyId` (Int, optionnel) : Spécialité concernée.
- `notes` (String, optionnel).
- `isSystemGenerated` (Boolean, optionnel) : Indique si l'affectation a été créée par l'algorithme.

## 5. Configuration et Administration

- Une interface d'administration devrait permettre de gérer la liste des types d'affectations disponibles, leurs propriétés et les règles qui leur sont associées.
  - Cette fonctionnalité pourrait être localisée sous `src/app/admin/assignment-types/` (mentionné dans la structure des API).
- Cela permet d'adapter le système aux besoins spécifiques du service sans modifier le code.

---

La définition claire et la configuration flexible des types d'affectations sont essentielles pour la précision de la planification, la pertinence des règles appliquées, et la clarté des plannings pour les utilisateurs.
