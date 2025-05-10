# Configuration des Salles et Secteurs du Bloc Opératoire

## 1. Introduction

La configuration précise des salles d'opération et des secteurs du bloc opératoire est fondamentale pour une planification efficace et une gestion optimisée des ressources. Mathildanesth permet aux administrateurs de définir et de gérer ces entités, leurs propriétés, et leurs relations.

L'administration du bloc opératoire, incluant la configuration des salles et les règles de supervision, est en cours de développement ou récemment complétée (`documentation/roadmap-dev-updated.md`, `docs/technique/NEXT_STEPS.md`). Des composants comme `OperatingRoomsConfigPanel.tsx` et `OperatingSectorsConfigPanel.tsx` (implicite ou à créer) sont utilisés pour cela.

## 2. Modèle de Données

### 2.1. Secteurs Opératoires (`OperatingSector`)

Un secteur opératoire regroupe plusieurs salles d'opération partageant des caractéristiques ou des ressources communes.

- **`id`** (Int) : Identifiant unique.
- **`name`** (String) : Nom du secteur (ex: "Bloc Central", "Chirurgie Ambulatoire", "Urgences Vitales").
- **`description`** (String, optionnel) : Description plus détaillée du secteur.
- **`siteId`** (String, optionnel) : Lien vers l'entité `Site`, indiquant à quel hôpital ou site physique le secteur appartient. Un secteur peut être multi-sites ou non lié à un site spécifique si la structure est plus simple.
- **`isActive`** (Boolean) : Indique si le secteur est actuellement en service.
- **`displayOrder`** (Int) : Ordre d'affichage du secteur dans les interfaces (pertinent pour la cohérence visuelle, géré par `scripts/update-display-order.js` et des API de réorganisation).
- **`operatingRooms`** (Relation vers `OperatingRoom[]`) : Liste des salles d'opération appartenant à ce secteur.

### 2.2. Salles d'Opération (`OperatingRoom`)

Chaque salle d'opération est une ressource physique où les interventions ont lieu.

- **`id`** (Int) : Identifiant unique.
- **`name`** (String) : Nom ou désignation de la salle (ex: "Salle 1", "Salle Cardio").
- **`number`** (String) : Numéro unique de la salle.
- **`sectorId`** (Int) : Lien vers le `OperatingSector` auquel la salle appartient.
- **`colorCode`** (String, optionnel) : Code couleur pour l'identification visuelle de la salle dans les plannings (ex: affichage des lignes de salle avec cette couleur dans l'éditeur de trames `BlocPlanningTemplateEditor.tsx`).
- **`isActive`** (Boolean) : Indique si la salle est opérationnelle.
- **`supervisionRules`** (Json, optionnel) : Règles spécifiques de supervision pour cette salle (ex: nombre de MARs/IADEs requis, types de compétences nécessaires). Voir `02_Regles_Supervision.md`.
- **`displayOrder`** (Int) : Ordre d'affichage de la salle au sein de son secteur.
- **`siteId`** (implicite via `OperatingSector` ou peut être direct si une salle peut être hors secteur défini) : Appartenance à un site.

## 3. Interface d'Administration

Une section d'administration dédiée (`src/app/admin/bloc-operatoire/` ou `src/app/parametres/configuration/`) permet de gérer ces entités.

### 3.1. Gestion des Secteurs

- **Création, Modification, Suppression** (CRUD) des secteurs opératoires.
- Définition du nom, de la description, du site d'appartenance.
- Activation/Désactivation d'un secteur.
- **Réorganisation de l'Ordre d'Affichage** : Des fonctionnalités (boutons "Réorganiser", API `/api/sectors/reorder`) permettent de changer l'ordre dans lequel les secteurs apparaissent dans les plannings et les interfaces de configuration.

### 3.2. Gestion des Salles

- **Création, Modification, Suppression** (CRUD) des salles d'opération, généralement au sein d'un secteur.
- Définition du nom, numéro, code couleur.
- Assignation à un secteur.
- Activation/Désactivation d'une salle.
- Configuration des règles de supervision spécifiques à la salle.
- **Réorganisation de l'Ordre d'Affichage** : Des fonctionnalités similaires (boutons "Réorganiser", API `/api/operating-rooms/reorder`) permettent de changer l'ordre des salles au sein d'un secteur.

Le composant `OperatingRoomsConfigPanel.tsx` est central pour ces opérations, et la roadmap mentionne des corrections de bugs liés à l'utilisation de `isDropDisabled` dans ce panneau lors de la réorganisation.

## 4. Impact sur la Planification

La configuration des salles et secteurs a un impact direct sur :

- **Affichage des Plannings du Bloc Opératoire** : Les plannings hebdomadaires (`src/app/bloc-operatoire/planning/` et `src/app/planning/hebdomadaire/page.tsx`) sont structurés par secteur et par salle, en respectant leur `displayOrder`.
- **Création de Trames de Planning** : L'éditeur de trames de bloc (`BlocPlanningTemplateEditor.tsx`) charge les salles réelles et utilise leur `colorCode`.
- **Application des Règles de Supervision** : Les règles définies au niveau de la salle ou du secteur sont utilisées par le moteur de règles.
- **Assignation des Ressources** : L'algorithme de planification affecte le personnel aux salles en fonction des besoins et des disponibilités des salles.

## 5. Points Clés

- **Cohérence des Données** : Il est crucial que les informations sur les salles (nombre, nom, secteur) soient exactes et à jour.
- **Flexibilité** : Le système doit permettre d'ajouter facilement de nouvelles salles/secteurs ou de modifier les existants.
- **Lien avec les Sites** : La gestion des sites (`Site` model dans `prisma/schema.prisma`) et leur lien avec les secteurs/salles est important pour les organisations multi-établissements.
  - Le script `scripts/update-operating-sectors-rooms.js` (mentionné dans la structure du projet) pourrait être lié à l'initialisation ou à la mise à jour de ces entités, potentiellement en lien avec des sites.

---

Une configuration claire et bien gérée des salles et secteurs du bloc opératoire est la première étape vers une planification optimisée et une utilisation efficace des ressources chirurgicales.
