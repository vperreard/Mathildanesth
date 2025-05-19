# Configuration des Salles, Secteurs et Équipements du Bloc Opératoire

## 1. Vue d'ensemble

Une configuration précise et flexible du bloc opératoire est la base d'une planification efficace. Mathildanesth permet aux administrateurs de définir la structure physique et organisationnelle du bloc, incluant les secteurs, les salles d'opération, leurs caractéristiques, et d'intégrer la trame d'occupation par les chirurgiens.

## 2. Gestion des Secteurs du Bloc (OperatingSector)

Les secteurs (modèle Prisma: `OperatingSector`) regroupent des salles d'opération qui partagent des caractéristiques communes, des spécialités, ou des règles de fonctionnement spécifiques.

### 2.1. Définition
- Un secteur est une division logique au sein d'un ou plusieurs sites hospitaliers.
- Exemples de catégories de secteurs (basées sur l'enum `SectorCategory` de Prisma) :
    - `HYPERASEPTIQUE` (pourrait correspondre à "Hyperaseptique (salles 1-4)")
    - `OPHTALMOLOGIE` (pourrait correspondre à "Ophtalmologie (salles 14-17)")
    - `ENDOSCOPIE` (pourrait correspondre à "Endoscopies (salles endo 1-4)")
    - `STANDARD` (pourrait correspondre à "Intermédiaire (salles 5-7)" et "Septique (salles 9-12, 12BIS)", ou ces derniers pourraient être des instances nommées de la catégorie `STANDARD`).
- Chaque secteur est identifié par un `id` (Int) unique.

### 2.2. Configuration
Via l'interface d'administration (`/admin/bloc-operatoire`, onglet Secteurs) :
- **Création/Modification/Suppression** de secteurs.
- **Nom du secteur (`name`)** : String, unique. Clair et descriptif.
- **Description (`description`)** : String, optionnel. Pour préciser la nature du secteur.
- **Catégorie (`category`)** : Enum `SectorCategory`. Valeurs possibles : `STANDARD`, `HYPERASEPTIQUE`, `OPHTALMOLOGIE`, `ENDOSCOPIE`.
- **Couleur (`colorCode`)** : String, optionnel. Code couleur pour l'affichage.
- **Site associé (`siteId`, `site`)** : Chaque secteur peut être rattaché à un `Site`.
- **Ordre d'affichage (`displayOrder`)** : Int, optionnel. Pour contrôler l'ordre dans lequel les secteurs apparaissent.
- **Règles spécifiques au secteur (`rules`)** : Json, optionnel. Certaines règles de supervision ou de compétence (ex: `{"maxRoomsPerSupervisor": 2}`).
- **Statut (`isActive`)**: Boolean. Indique si le secteur est actif.

## 3. Gestion des Salles d'Opération (OperatingRoom)

Chaque salle d'opération (modèle Prisma: `OperatingRoom`) est une entité distincte avec ses propres attributs.

### 3.1. Définition
- Représente une salle physique où des interventions peuvent avoir lieu.
- Chaque salle est identifiée par un `id` (Int) unique.

### 3.2. Configuration
Via l'interface d'administration (`/admin/bloc-operatoire`, onglet Salles) :
- **Création/Modification/Suppression** de salles.
- **Nom usuel de la salle (`name`)** : String (ex: "Salle Intervention Alpha", "OPHTA 2").
- **Numéro officiel/identifiant (`number`)**: String, unique (ex: "S1", "OPHTA-002").
- **Secteur de rattachement (`operatingSectorId`, `operatingSector`)** : Chaque salle peut appartenir à un `OperatingSector` (optionnel).
- **Site de rattachement (`siteId`, `site`)**: Chaque salle est obligatoirement rattachée à un `Site`.
- **Statut (`isActive`)** : Boolean, `true` par défaut.
    - Le statut `Réservée` mentionné précédemment pourrait être géré par une combinaison de `isActive = false` et un `description` ou `roomType` spécifique si non couvert par l'enum.
    - Les statuts temporaires (nettoyage, maintenance) ne sont pas gérés dynamiquement par l'application de planification d'anesthésie mais une salle peut être manuellement inactivée (`isActive = false`) pour ces raisons.
- **Description/Alias (`description`)** : String, optionnel.
- **Type de salle (`roomType`)** : Enum `RoomType`. Valeurs possibles: `STANDARD`, `FIV`, `CONSULTATION`.
- **Capacité (`capacity`)**: Int, `1` par défaut.
- **Spécialités autorisées (`allowedSpecialties`)**: Liste de Strings (String[]), vide par défaut.
- **Règles de supervision (`supervisionRules`)**: Json, optionnel. Règles spécifiques à la salle.
- **Couleur (`colorCode`)**: String, optionnel. Code couleur pour l'affichage.
- **Ordre d'affichage (`displayOrder`)** : Int, `0` par défaut. Au sein de son secteur ou site.
- **Équipements spécifiques fixes (informatif)** : Peut être stocké dans le champ `description`. La gestion de la disponibilité du matériel *mobile* reste hors scope de la planification d'anesthésie.

## 4. Intégration de la Trame d'Occupation Chirurgicale

L'affectation des anesthésistes dépend fortement de l'activité chirurgicale prévue. Mathildanesth ne planifie pas les chirurgiens mais intègre leur trame d'occupation.

### 4.1. Objectif
- Fournir les données d'entrée pour estimer les besoins en personnel d'anesthésie (MAR, IADE).
- Permettre l'affichage contextuel du chirurgien et de la spécialité dans le planning d'anesthésie.

### 4.2. Configuration Initiale et Mise à Jour
- **Saisie Manuelle de la Trame de Base** : 
    - Une interface dédiée (potentiellement dans la section d'administration du bloc ou une section "Paramétrage Avancé") permet à un administrateur de saisir la trame d'occupation type des salles par les chirurgiens.
    - Informations à saisir : Chirurgien (Nom ou identifiant), Demi-journée (ex: Lundi Matin, Lundi AM, ...), Salle attribuée, Spécialité principale.
    - Gestion des trames pour semaines paires/impaires si applicable.
- **Mise à Jour via Import (ex: Google Sheets - optionnel)** :
    - Possibilité de configurer une source externe (comme un Google Sheet structuré) pour mettre à jour cette trame.
    - Le processus d'import serait lancé manuellement par un administrateur ou de manière périodique (configurable).
    - L'application lirait les données en lecture seule depuis cette source.
    - Un mécanisme de validation et de prévisualisation des changements avant import est recommandé.

### 4.3. Utilisation de la Trame
- **Pré-planning** : Sert de base à l'outil de calcul des besoins en personnel d'anesthésie.
- **Algorithme d'affectation MAR/IADE** : Les salles occupées par des chirurgiens sont celles nécessitant une couverture anesthésique.
- **Affichage** : Le nom du chirurgien et/_ou la spécialité peuvent être affichés sur le planning d'anesthésie pour chaque salle et créneau occupé.

## 5. Gestion des Équipements (Aspects Limités)

Comme mentionné, la gestion dynamique de la disponibilité du matériel *mobile* (endoscopes spécifiques, colonnes vidéo, etc.) n'est pas une fonctionnalité centrale de Mathildanesth pour la planification des anesthésistes.

Cependant :
- La **configuration des salles** (section 3.2) permet de noter les **équipements fixes importants** associés à une salle. Cela peut aider indirectement les planificateurs à comprendre pourquoi certaines salles sont privilégiées pour certaines spécialités.
- Si des **procédures spécifiques** nécessitant des équipements rares sont planifiées (information provenant de la trame chirurgicale ou d'annotations), cela peut être une information visible pour le planificateur d'anesthésie, mais l'allocation de l'équipement lui-même n'est pas gérée.

Une bonne configuration initiale de ces éléments est essentielle pour que le module Bloc Opératoire puisse fonctionner de manière optimale et fournir des plannings pertinents. 