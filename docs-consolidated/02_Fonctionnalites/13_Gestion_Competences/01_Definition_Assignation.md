# Définition et Assignation des Compétences et Spécialités

## 1. Introduction

La gestion des compétences et des spécialités est cruciale dans un environnement médical pour s'assurer que le personnel affecté aux différentes tâches et postes possède les qualifications et l'expérience requises. Mathildanesth intègre des mécanismes pour définir et prendre en compte ces éléments, notamment via les modèles `Specialty`, `Skill` et `UserSkill`.

## 2. Objectifs de la Gestion des Compétences/Spécialités

- **Sécurité des Soins** : Garantir que seules les personnes compétentes réalisent certaines tâches ou occupent certains postes.
- **Optimisation de la Planification** : Affecter le personnel en fonction de leurs compétences spécifiques, en particulier pour les activités spécialisées (ex: anesthésie pédiatrique, neurochirurgie).
- **Développement Professionnel** : Potentiellement, suivre l'acquisition de nouvelles compétences par le personnel (hors scope MVP mais une extension possible).
- **Flexibilité** : Permettre une configuration des compétences requises pour différents types d'affectations ou de salles.

## 3. Modèles de Données

Mathildanesth utilise plusieurs modèles Prisma pour gérer les compétences et spécialités :

### 3.1. Modèle `Specialty`

Ce modèle est particulièrement pertinent pour les rôles médicaux et chirurgicaux, et pour caractériser des activités.
- **Champs Principaux** :
  - `id` (Int) : Identifiant unique.
  - `name` (String) : Nom de la spécialité (ex: "Anesthésie Pédiatrique", "Orthopédie", "Cardiologie Interventionnelle").
  - `isPediatric` (Boolean) : Indique si la spécialité concerne la pédiatrie.
- **Relations** :
  - `Assignment[]` : Les affectations peuvent être liées à une spécialité.
  - `Surgeon[]` : Les chirurgiens (modèle `Surgeon`, qui peut être lié à un `User`) peuvent être associés à une ou plusieurs spécialités.

Le module de Trames (`EditActivityModal.tsx`) se connecte à l'API `/api/specialties` pour utiliser ces données.

### 3.2. Modèle `Skill`

Ce modèle permet de définir des compétences de manière plus générique, applicables à tous les types d'utilisateurs.
- **Champs Principaux** :
  - `id` (String) : Identifiant unique (CUID).
  - `name` (String) : Nom de la compétence (ex: "ALR membre supérieur", "Prise en charge polytraumatisé", "Utilisation appareil X").
  - `description` (String, optionnel).
- **Relation** :
  - `userSkills` (Relation vers `UserSkill[]`) : Lie la compétence aux utilisateurs qui la possèdent.

### 3.3. Modèle `UserSkill` (Table de Liaison)

Ce modèle fait le lien entre un utilisateur (`User`) et une compétence (`Skill`) :
- **Champs Principaux** :
  - `id` (String) : Identifiant unique (CUID).
  - `userId` (Int) : ID de l'utilisateur.
  - `skillId` (String) : ID de la compétence.
  - `assignedAt` (DateTime) : Date à laquelle la compétence a été assignée/reconnue.
  - `assignedBy` (Int, optionnel) : ID de l'utilisateur (admin) qui a assigné la compétence.
- **Relations** :
  - `user` (vers `User`).
  - `skill` (vers `Skill`).
  - `assignedByAdmin` (vers `User`, l'admin ayant assigné).
- **Contrainte Unique** : `@@unique([userId, skillId])` pour s'assurer qu'une compétence n'est assignée qu'une fois par utilisateur.

## 4. Assignation des Compétences et Spécialités aux Utilisateurs

- **Spécialités pour Chirurgiens (`Surgeon`)** : Les utilisateurs ayant un profil `Surgeon` se voient assigner des `Specialty` via leur profil.
- **Compétences Génériques pour tous les `User`** : Via la table `UserSkill`, n'importe quel utilisateur (MAR, IADE, etc.) peut se voir attribuer des `Skill` spécifiques. Cela permet une gestion fine des qualifications (ex: IADE compétent en ALR, MAR formé à une technique particulière).
- **Gestion Administrative** : L'assignation se fait probablement via une interface d'administration des utilisateurs, où l'on peut lier des `Skill` à un `User` et des `Specialty` à un `Surgeon`.

## 5. Utilisation dans la Planification

- **Adéquation Poste/Profil** : L'[Algorithme de Génération de Planning](../../03_Planning_Generation/02_Algorithme_Generation.md) et le [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) doivent pouvoir prendre en compte :
  - Les `Specialty` requises pour une affectation (ex: via `Assignment.specialtyId`).
  - Les `Skill` requises, en vérifiant la présence d'un enregistrement `UserSkill` correspondant pour l'utilisateur.
  - Exemple : Si une salle de bloc est réservée pour de la chirurgie pédiatrique (une `Specialty`), seuls les MAR/IADE ayant la `Skill` "Anesthésie Pédiatrique" (ou une `Specialty` équivalente si modélisée ainsi pour les anesthésistes) devraient y être affectés.
- **Règles de Compétences/Spécialités** : Des règles spécifiques peuvent être définies :
  - "Au moins un MAR avec la `Skill` Y ou la `Specialty` Z doit être présent si une intervention de type X a lieu."
  - "La salle Z nécessite du personnel ayant la `Skill` W."
- **Trames de Planning** : Lors de la création de [Trames de Bloc Opératoire](../../../modules/templates/components/BlocPlanningTemplateEditor.md), la `Specialty` chirurgicale prévue pour une salle informe des besoins en `Skill` et/ou `Specialty` anesthésiques.

## 6. Interface d'Administration

- **Gestion des Spécialités (`Specialty`)** :
  - Interface CRUD (potentiellement `/admin/specialties/`).
- **Gestion des Compétences (`Skill`)** :
  - Interface CRUD pour les `Skill` génériques (potentiellement `/admin/skills/`).
- **Assignation aux Utilisateurs** :
  - Dans l'interface de gestion des utilisateurs/profils, permettre de lier des `Specialty` aux `Surgeon` et des `Skill` (via `UserSkill`) à tous les `User`.

## 7. Évolutions Possibles (au-delà des modèles `Specialty`, `Skill`, `UserSkill` actuels)

- **Niveaux de Compétence** : Introduction de niveaux (ex: Débutant, Confirmé, Expert) pour chaque `UserSkill`.
- **Date d'Acquisition/Expiration/Validité** : Suivi plus fin de la validité des `UserSkill` (le `assignedAt` existe déjà, on pourrait ajouter `expiresAt`).
- **Groupes de Compétences** : Possibilité de regrouper des `Skill`.
- **Auto-Déclaration et Validation** : Processus où les utilisateurs peuvent déclarer des `Skill`, soumises à validation (pourrait utiliser le modèle `UserRequest`).

## 8. Impact sur les Modules

- **Utilisateurs et Profils** : Stockage des compétences assignées.
- **Planning (Génération et Manuel)** : Prise en compte des compétences pour les affectations.
- **Moteur de Règles** : Définition et application de règles basées sur les compétences.
- **Bloc Opératoire** : Association forte entre spécialités chirurgicales, salles, et compétences du personnel d'anesthésie.

---

Une gestion claire des compétences et spécialités, s'appuyant sur les modèles `Specialty`, `Skill` et `UserSkill`, est un atout pour la qualité et la sécurité de la planification des soins dans Mathildanesth.
