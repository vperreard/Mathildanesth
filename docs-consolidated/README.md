# Documentation Consolidée Mathildanesth

Cette documentation consolidée représente une synthèse complète des projets mathildanesth et MATHILDA. Elle vise à fournir une base solide pour le développement futur de l'application de planification pour équipe d'anesthésie.

## Structure de la Documentation

Cette documentation est organisée de manière hiérarchique pour couvrir tous les aspects du projet :

### 1. Introduction
- [`00_Introduction.md`](./00_Introduction.md) - Présentation générale du projet, objectifs et contexte

### 2. Architecture Générale
- [`01_Architecture_Generale/01_Structure_Projet.md`](./01_Architecture_Generale/01_Structure_Projet.md) - Organisation des dossiers et fichiers
- `01_Architecture_Generale/02_Stack_Technique.md` - Technologies utilisées
- `01_Architecture_Generale/03_Modeles_Donnees.md` - Modèles de données principaux

### 3. Fonctionnalités
- **Utilisateurs et Profils**
  - [`02_Fonctionnalites/01_Utilisateurs_Profils/01_Modele_Utilisateur.md`](./02_Fonctionnalites/01_Utilisateurs_Profils/01_Modele_Utilisateur.md) - Modèle utilisateur et types
  - `02_Fonctionnalites/01_Utilisateurs_Profils/02_MAR_Configuration.md` - Configuration des MARs
  - `02_Fonctionnalites/01_Utilisateurs_Profils/03_IADE_Configuration.md` - Configuration des IADEs
  - `02_Fonctionnalites/01_Utilisateurs_Profils/04_Compteurs_Metriques.md` - Compteurs et métriques

- **Gestion des Congés**
  - [`02_Fonctionnalites/02_Gestion_Conges/01_Validation_Dates.md`](./02_Fonctionnalites/02_Gestion_Conges/01_Validation_Dates.md) - Système de validation des dates
  - `02_Fonctionnalites/02_Gestion_Conges/02_Quota_Management.md` - Gestion des quotas de congés
  - `02_Fonctionnalites/02_Gestion_Conges/03_Detection_Conflits.md` - Détection et gestion des conflits
  - `02_Fonctionnalites/02_Gestion_Conges/04_Leaves_Recurring.md` - Congés récurrents

- **Génération de Planning**
  - [`02_Fonctionnalites/03_Planning_Generation/01_Moteur_Regles.md`](./02_Fonctionnalites/03_Planning_Generation/01_Moteur_Regles.md) - Moteur de règles
  - `02_Fonctionnalites/03_Planning_Generation/02_Algorithme_Generation.md` - Algorithme de génération
  - `02_Fonctionnalites/03_Planning_Generation/03_Scoring_Evaluation.md` - Scoring et évaluation
  - `02_Fonctionnalites/03_Planning_Generation/04_Optimisation_Planning.md` - Optimisation du planning

- **Bloc Opératoire**
  - `02_Fonctionnalites/04_Bloc_Operatoire/01_Salles_Secteurs.md` - Salles et secteurs
  - [`02_Fonctionnalites/04_Bloc_Operatoire/02_Regles_Supervision.md`](./02_Fonctionnalites/04_Bloc_Operatoire/02_Regles_Supervision.md) - Règles de supervision
  - `02_Fonctionnalites/04_Bloc_Operatoire/03_Planning_Hebdomadaire.md` - Planning hebdomadaire
  - `02_Fonctionnalites/04_Bloc_Operatoire/04_Trames_Planning.md` - Trames de planning

- **Interface et Collaboration**
  - `02_Fonctionnalites/05_Interface_Collaboration/01_Notifications.md` - Système de notifications
  - `02_Fonctionnalites/05_Interface_Collaboration/02_Remplacements.md` - Gestion des remplacements
  - `02_Fonctionnalites/05_Interface_Collaboration/03_Indisponibilites.md` - Gestion des indisponibilités
  - `02_Fonctionnalites/05_Interface_Collaboration/04_Communications.md` - Outils de communication

- **Analytics**
  - `02_Fonctionnalites/06_Analytics/01_Tableau_Bord.md` - Tableau de bord
  - `02_Fonctionnalites/06_Analytics/02_Rapports.md` - Rapports
  - `02_Fonctionnalites/06_Analytics/03_Visualisations.md` - Visualisations de données
  - `02_Fonctionnalites/06_Analytics/04_Exportations.md` - Exportations

### 4. Guides de Développement
- `03_Guides_Developpement/01_Composants_UI.md` - Guide des composants UI
- `03_Guides_Developpement/02_Performance.md` - Optimisation des performances
- `03_Guides_Developpement/03_Tests.md` - Guide des tests

### 5. Roadmap
- [`04_Roadmap/01_Phases_Priorites.md`](./04_Roadmap/01_Phases_Priorites.md) - Phases et priorités de développement
- `04_Roadmap/02_Plan_Implementation.md` - Plan d'implémentation détaillé

### 6. Annexes
- `05_Annexes/01_Glossaire.md` - Glossaire des termes
- `05_Annexes/02_References.md` - Références et resources

## État de la Documentation

Cette documentation est en cours de développement. Les fichiers marqués par des liens sont déjà créés et disponibles, tandis que les autres sont planifiés et seront complétés ultérieurement.

## Origine de la Consolidation

Cette documentation est le résultat de la fusion de deux sources principales :
1. Le projet **mathildanesth** - Application existante avec plusieurs modules fonctionnels
2. Le projet **MATHILDA** - Conception documentaire détaillée pour une architecture alternative

L'objectif est de capitaliser sur les forces des deux approches :
- L'implémentation concrète et les fonctionnalités développées dans mathildanesth
- L'architecture claire et la documentation structurée de MATHILDA

## Prochaines étapes de la documentation

1. Compléter les sections manquantes, en particulier sur l'algorithme de génération de planning
2. Documenter les interfaces utilisateur avec captures d'écran
3. Ajouter des diagrammes d'architecture et de flux de données
4. Développer les guides de contribution pour nouveaux développeurs 