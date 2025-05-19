# Compteurs Horaires et Suivi du Temps de Travail

## 1. Introduction

Le suivi précis du temps de travail et la gestion de compteurs horaires sont essentiels pour le respect du droit du travail, l'équité entre les membres du personnel, et une gestion efficace des ressources. Mathildanesth doit intégrer des fonctionnalités pour enregistrer le temps de travail effectué et calculer divers compteurs (heures travaillées, soldes de récupération, etc.), en particulier pour les Médecins Anesthésistes-Réanimateurs (MARs) soumis à des réglementations spécifiques.

Le projet `MATHILDA` soulignait l'importance d'un "Compteur Horaire MAR (Droit du travail français)". Bien qu'un modèle `TimeTracking` dédié ne soit pas présent dans le schéma Prisma actuel (`prisma/schema.prisma`), la logique de suivi du temps s'appuiera sur les affectations (`Assignment`) et les informations contractuelles des utilisateurs (`User`).

## 2. Objectifs du Suivi du Temps et des Compteurs

- **Conformité Légale** : Assurer le respect des réglementations sur le temps de travail, les repos obligatoires, les heures supplémentaires.
- **Équité** : Fournir une base objective pour comparer la charge de travail entre les individus et s'assurer d'une répartition équitable.
- **Rémunération** : Calculer les éléments variables de paie (heures supplémentaires, majorations pour travail de nuit/week-end) – bien que la paie elle-même soit hors scope, Mathildanesth peut fournir les données nécessaires.
- **Gestion des Récupérations** : Suivre les droits à récupération générés par certaines activités (ex: gardes) et leur prise.
- **Visibilité pour l'Utilisateur** : Permettre à chaque employé de consulter ses propres compteurs et le détail de son temps de travail.
- **Pilotage pour les Managers** : Offrir aux responsables une vue d'ensemble des temps de travail de leur équipe.

## 3. Données de Base

- **Temps de Travail Contractuel et Modalités** : Le modèle `User` (`prisma/schema.prisma`) fournit plusieurs champs pour définir le cadre du temps de travail :
  - `tempsPartiel` (Boolean) : Indique si l'utilisateur est à temps partiel.
  - `pourcentageTempsPartiel` (Float, optionnel) : Le pourcentage du temps partiel (ex: 0.8 pour 80%).
  - `workPattern` (Enum `WorkPatternType`) : Définit le modèle de travail (ex: `FULL_TIME`, `ALTERNATING_WEEKS`, `SPECIFIC_DAYS`).
  - `joursTravaillesSemaineImpaire` et `joursTravaillesSemainePaire` (Json) : Peuvent spécifier les jours travaillés pour certains `workPattern`.
  Ces informations sont cruciales pour calculer le temps de travail théorique et les écarts par rapport au réalisé.

- **Affectations Planifiées et Réalisées** : Les [Assignments](./01_Types_Affectations.md) (gardes, vacations, consultations, etc., stockées dans le modèle `Assignment`) constituent la source principale des informations sur le travail prévu et, une fois leur statut mis à jour (ex: de `PREVU` à `REALISE`), du travail effectué. Chaque `Assignment` a une `startDate` et `endDate`.

- **Types d'Activités** : Le modèle [`ActivityType`](../07_Gestion_Affectations/01_Types_Affectations.md) (via son `code` et sa `category`) permet de qualifier la nature de chaque `Assignment` et d'appliquer des règles de décompte spécifiques (ex: une garde de nuit compte différemment d'une consultation de jour).

## 4. Logique de Suivi du Temps (En l'absence d'un modèle `TimeTracking` dédié)

En l'absence d'un modèle `TimeTracking` granulaire, le suivi du temps de travail effectif et la génération des compteurs reposeront principalement sur l'analyse des enregistrements du modèle `Assignment` :

- **Statut des Affectations** : Il est crucial que les `Assignment` puissent avoir un statut reflétant leur état (ex: `PREVU`, `CONFIRME`, `REALISE`, `ANNULE`). Le travail effectif serait dérivé des affectations `REALISE`.
- **Horodatage Précis** : Les champs `startDate` et `endDate` (ou `heureDebut`/`heureFin` si combinés avec `date`) des `Assignment` doivent refléter précisément les heures de début et de fin du travail effectué.
- **Génération de Périodes de Travail** : Pour chaque `Assignment` considérée comme `REALISEE`:
    - La durée est calculée à partir de `startDate` et `endDate`.
    - Le `type` de l'`Assignment` (qui correspond à un `ActivityType.code`) et la catégorie de l'`ActivityType` permettent de savoir comment ce temps doit être comptabilisé (travail standard, garde, astreinte avec majoration, etc.).
- **Ajustements Manuels** : Des mécanismes d'ajustement pourraient être nécessaires si les heures réelles d'une affectation diffèrent de ce qui était planifié. Cela pourrait se faire en modifiant directement l'`Assignment` concernée ou via un système de saisie complémentaire (qui pourrait alors justifier un modèle plus simple, type `TimeAdjustmentEntry`).

## 5. Types de Compteurs à Gérer

### 5.1. Compteur d'Heures Travaillées

- **Calcul** : Somme des durées des `Assignment` marquées comme `REALISE` et dont l'`ActivityType` correspond à du temps de travail effectif (ex: `TRAVAIL`, `GARDE`, et potentiellement une fraction des `ASTREINTE` selon les règles de valorisation).
- **Périodicité** : Calculé par semaine, mois, année, ou sur une période glissante.
- **Comparaison au Théorique** : Écart entre les heures travaillées (issues des `Assignment`) et le temps de travail théorique dérivé des champs `tempsPartiel`, `pourcentageTempsPartiel`, `workPattern` du modèle `User`.
- **Décompte des Heures Supplémentaires** : Heures effectuées au-delà du seuil contractuel ou légal, calculées à partir de cet écart.

### 5.2. Compteur de Gardes et Astreintes

- Nombre de gardes de nuit, de week-end, de jour férié.
- Nombre d'astreintes.
- Utile pour le suivi de l'équité et le respect des quotas si définis.

### 5.3. Solde de Récupération (Repos Compensateur)

- **Génération** : Certaines affectations (ex: gardes) peuvent générer des droits à récupération (ex: 1 garde = X heures de récupération).
- **Consommation** : Prise de jours/heures de récupération, qui décrémentent le solde.
- Nécessite des règles claires pour le calcul des droits et la gestion des prises.

### 5.4. Compteurs de Pénibilité (Optionnel)

- Si des systèmes de points de pénibilité sont en place, certaines affectations pourraient incrémenter ces compteurs (ex: travail de nuit, week-ends).

### 5.5. Soldes de Congés

- Bien que gérés par le module des [Congés et Absences](../02_Gestion_Conges_Absences/01_Processus_Gestion_Conges_Absences.md), les soldes (`User.annualLeaveAllowance`, `User.sickLeaveAllowance`, etc.) font partie du suivi global du temps.

## 6. Fonctionnalités Associées

- **Saisie/Validation des Temps Réalisés** :
  - Possibilité pour les utilisateurs de vérifier/corriger les temps générés à partir de leurs affectations.
  - Workflow de validation par un manager si nécessaire.
- **Visualisation des Compteurs** :
  - Tableau de bord personnel affichant les principaux compteurs et soldes.
  - Vue détaillée de l'historique du temps de travail et des mouvements sur les compteurs.
- **Alertes** :
  - Notifications en cas de dépassement de seuils (heures max, repos min non respecté).
  - Alertes pour les soldes de récupération arrivant à expiration (si applicable).
- **Reporting** :
  - Exports des données de temps de travail pour la paie ou des analyses.
  - Rapports sur les heures supplémentaires, l'équité des gardes, etc.

## 7. Services et Logique Applicative

- Une **Logique de Service Applicative** (potentiellement un `TimeCalculationService` ou similaire) sera nécessaire pour :
    - Interpréter les `Assignment` (statut, `ActivityType`) pour en déduire le temps de travail effectif.
    - Calculer le temps de travail théorique à partir des informations du modèle `User`.
    - Agréger ces données pour produire les différents compteurs (heures travaillées, soldes de récupération, etc.).
    - Gérer la logique de génération des droits à récupération et leur consommation.
- **Règles de Calcul Configurables** : Idéalement, les règles de décompte (ex: comment une astreinte est valorisée en temps, comment les heures supplémentaires sont calculées, quels `ActivityType.code` ouvrent droit à récupération) devraient être configurables pour s'adapter aux accords locaux. Cela pourrait se faire via une interface d'administration et stocké dans un modèle de configuration (ex: `TimePolicyConfig`).

---

Un système robuste de suivi du temps et de gestion des compteurs, basé sur l'exploitation des affectations et des profils utilisateurs, est fondamental pour Mathildanesth. Il assure la conformité, favorise l'équité, et fournit des données précieuses pour le pilotage du service et la gestion individuelle du temps de travail.
