# Compteurs Horaires et Suivi du Temps de Travail

## 1. Introduction

Le suivi précis du temps de travail et la gestion de compteurs horaires sont essentiels pour le respect du droit du travail, l'équité entre les membres du personnel, et une gestion efficace des ressources. Mathildanesth intègre des fonctionnalités pour enregistrer le temps de travail effectué et calculer divers compteurs (heures travaillées, soldes de récupération, etc.), en particulier pour les Médecins Anesthésistes-Réanimateurs (MARs) soumis à des réglementations spécifiques.

Le projet `MATHILDA` soulignait l'importance d'un "Compteur Horaire MAR (Droit du travail français)". Dans `mathildanesth`, le modèle `TimeTracking` et les services associés (`TimeTrackingService.ts`, `TimeTrackingRepository.ts` mentionnés dans `docs/technique/NEXT_STEPS.md`) constituent la base de cette fonctionnalité.

## 2. Objectifs du Suivi du Temps et des Compteurs

- **Conformité Légale** : Assurer le respect des réglementations sur le temps de travail, les repos obligatoires, les heures supplémentaires.
- **Équité** : Fournir une base objective pour comparer la charge de travail entre les individus et s'assurer d'une répartition équitable.
- **Rémunération** : Calculer les éléments variables de paie (heures supplémentaires, majorations pour travail de nuit/week-end) – bien que la paie elle-même soit hors scope, Mathildanesth peut fournir les données nécessaires.
- **Gestion des Récupérations** : Suivre les droits à récupération générés par certaines activités (ex: gardes) et leur prise.
- **Visibilité pour l'Utilisateur** : Permettre à chaque employé de consulter ses propres compteurs et le détail de son temps de travail.
- **Pilotage pour les Managers** : Offrir aux responsables une vue d'ensemble des temps de travail de leur équipe.

## 3. Données de Base

- **Temps de Travail Contractuel** : Le modèle `User` possède un champ `workingHours` (String) qui peut stocker la base contractuelle (ex: "39h/semaine", "Forfait jours"). Cette information est cruciale pour calculer les écarts.
- **Affectations Planifiées et Réalisées** : Les [Assignments](../../07_Gestion_Affectations/01_Types_Affectations.md) (gardes, vacations, consultations, etc.) constituent la source principale des informations sur le travail prévu et effectué.

## 4. Modèle `TimeTracking`

Le modèle `TimeTracking` (`prisma/schema.prisma`) est conçu pour enregistrer les blocs de temps pertinents :

- `userId` : L'utilisateur concerné.
- `date` : La date de l'enregistrement.
- `startTime`, `endTime` : Heures de début et de fin de la période.
- `type` (Enum : `TRAVAIL`, `ABSENCE`, `GARDE`, `ASTREINTE`, `AUTRE`) : Catégorise la nature du temps enregistré.
- `duration` (Float) : Durée en heures (peut être calculée ou saisie).
- `notes` (String, optionnel).
- `assignmentId` (String, optionnel) : Lien vers l'affectation d'origine si le `TimeTracking` en découle directement.

Les enregistrements `TimeTracking` peuvent être générés :

- **Automatiquement** à partir des affectations validées (ex: une garde planifiée de 12h crée un enregistrement `TimeTracking` de 12h de type `GARDE`).
- **Manuellement** par l'utilisateur ou un administrateur pour ajuster des temps, déclarer des heures non planifiées, ou des activités spécifiques.

## 5. Types de Compteurs à Gérer

### 5.1. Compteur d'Heures Travaillées

- **Calcul** : Somme des durées des enregistrements `TimeTracking` de type `TRAVAIL`, `GARDE`, et potentiellement une fraction des `ASTREINTE` (si déplacement).
- **Périodicité** : Calculé par semaine, mois, année, ou sur une période glissante.
- **Comparaison au Théorique** : Écart entre les heures travaillées et le temps de travail contractuel (`User.workingHours` annualisé/mensualisé).
- **Décompte des Heures Supplémentaires** : Heures effectuées au-delà du seuil contractuel ou légal.

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

- **`TimeTrackingService.ts`** : Contient la logique métier pour créer, mettre à jour, et calculer les `TimeTracking` et les compteurs dérivés.
- **Règles de Calcul Configurables** : Idéalement, les règles de décompte (ex: comment une astreinte est valorisée en temps, comment les heures supplémentaires sont calculées) devraient être configurables pour s'adapter aux accords locaux.

---

Un système robuste de suivi du temps et de gestion des compteurs est fondamental pour Mathildanesth. Il assure la conformité, favorise l'équité, et fournit des données précieuses pour le pilotage du service et la gestion individuelle du temps de travail.
