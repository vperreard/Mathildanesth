# Tableaux de Bord et Indicateurs Statistiques

## 1. Introduction

Mathildanesth vise à fournir des outils d'analyse et de reporting pour aider les gestionnaires et les utilisateurs à comprendre l'activité, suivre les tendances, évaluer l'équité des plannings, et identifier des pistes d'amélioration. Cela se matérialise par des tableaux de bord personnalisables et des indicateurs statistiques pertinents.

La roadmap (`documentation/roadmap-dev-updated.md`) prévoit :

- Phase 2 : Mise en place d'un "tableau de bord analytique basique" (ex: répartition heures, taux de remplacement).
- Phase 5 : "Fonctionnalités avancées d'Analytics (prédictions, etc.)".
  Le modèle `Dashboard` dans `prisma/schema.prisma` suggère une infrastructure pour stocker des configurations de tableaux de bord personnalisés.

## 2. Objectifs des Tableaux de Bord et Statistiques

- **Suivi de l'Activité** : Fournir une vue d'ensemble de l'activité planifiée et réalisée.
- **Aide à la Décision** : Offrir des données pour éclairer les décisions de planification et de gestion des ressources.
- **Évaluation de l'Équité** : Mesurer et suivre la répartition de la charge de travail et des contraintes.
- **Identification des Tendances** : Repérer des motifs, des évolutions (ex: augmentation des absences, types de gardes les plus fréquents).
- **Optimisation des Ressources** : Identifier les sous-utilisations ou sur-utilisations de ressources.
- **Reporting** : Générer des rapports pour les instances dirigeantes ou pour des analyses spécifiques.

## 3. Types de Tableaux de Bord Envisageables

### 3.1. Tableau de Bord Principal (Général ou par Rôle)

- **Vue d'Ensemble** : Widgets clés affichant les informations les plus pertinentes pour l'utilisateur connecté ou son rôle.
- **Indicateurs Fréquents** :
  - Nombre de jours de congé restants (pour l'utilisateur).
  - Prochaines gardes/astreintes.
  - Alertes importantes (conflits non résolus, demandes en attente).
  - Statistiques rapides sur l'activité de la semaine/mois en cours.
- Le modèle `Dashboard` (`prisma/schema.prisma`) avec ses champs `name`, `layout`, `filters`, `userId` suggère que les utilisateurs pourraient créer/personnaliser leurs propres tableaux de bord.

### 3.2. Tableau de Bord des Planificateurs/Gestionnaires

- **Suivi de la Charge de Travail** :
  - Taux d'occupation moyen du personnel.
  - Répartition des heures travaillées par utilisateur, par rôle.
  - Nombre moyen d'heures supplémentaires.
- **Indicateurs d'Équité** :
  - Répartition des gardes (nuit, week-end, férié) par utilisateur.
  - Répartition des astreintes.
  - Comparaison des compteurs de pénibilité.
- **Gestion des Absences** :
  - Taux d'absentéisme (global, par service, par type d'absence).
  - Nombre de demandes de congés en attente, approuvées, rejetées.
  - Suivi des remplacements (taux de remplacement, délai moyen pour trouver un remplaçant).
- **Couverture des Besoins** :
  - Pourcentage de postes couverts vs. besoins théoriques.
  - Alertes sur les postes fréquemment non couverts.
- **Conflits de Planning** :
  - Nombre de conflits non résolus par type/sévérité.
  - Tendances des types de conflits les plus fréquents.

### 3.3. Tableau de Bord du Bloc Opératoire

- **Utilisation des Salles** :
  - Taux d'occupation des salles.
  - Temps moyen d'intervention par salle/spécialité.
  - Nombre d'interventions par jour/semaine/salle.
- **Performance du Personnel du Bloc** :
  - Nombre d'heures effectuées au bloc par MAR/IADE.
  - Répartition des types d'interventions par anesthésiste.
- **Respect des Règles de Supervision** :
  - Statistiques sur les violations des règles de supervision.

## 4. Types d'Indicateurs Statistiques et Visualisations

- **Compteurs et Sommes** : Nombre de gardes, total d'heures, nombre de jours de congé.
- **Moyennes et Ratios** : Taux d'occupation, durée moyenne, pourcentage de couverture.
- **Distributions et Répartitions** : Graphiques en barres, camemberts pour montrer la répartition des tâches.
- **Séries Temporelles** : Courbes pour suivre l'évolution d'indicateurs dans le temps.
- **Comparaisons** : Entre utilisateurs, entre périodes, entre services.
- **Cartes de Chaleur (Heatmaps)** : Pour visualiser les périodes de forte/faible activité ou de concentration de certains événements.

## 5. Fonctionnalités de Reporting

- **Export de Données** : Possibilité d'exporter les données brutes ou les tableaux de statistiques (CSV, Excel).
- **Génération de Rapports PDF** : Création de rapports synthétiques et visuels prêts à être partagés.
- **Filtres et Périodes Personnalisables** : Sélectionner la période d'analyse, les services, les rôles, etc., pour affiner les rapports.

## 6. Analytics Avancées (Phase 5)

- **Analyses Prédictives** :
  - Prévision des périodes de forte demande de congés.
  - Anticipation des risques de sous-effectif basés sur les tendances historiques et les congés prévus.
  - Modélisation de l'impact de changements organisationnels (ex: ouverture d'une nouvelle salle).
- **Détection d'Anomalies** : Identifier des schémas inhabituels dans les données de planification ou d'absence.
- **Suggestions d'Optimisation Basées sur les Données** : Proposer des ajustements de règles ou de trames en se basant sur l'analyse des plannings passés et de leur efficacité.

## 7. Implémentation Technique (Considérations)

- **Agrégation de Données** : Nécessité de mécanismes pour agréger efficacement les données de planning, d'absences, et de profils utilisateurs.
- **Base de Données Analytique (Optionnel)** : Pour des analyses complexes et volumineuses, une base de données optimisée pour l'analytique ou un data warehouse pourrait être envisagé à long terme.
- **Bibliothèques de Visualisation** : Utilisation de bibliothèques graphiques (ex: Chart.js, D3.js, Recharts) pour créer les tableaux de bord interactifs.
- **Services Backend** : API pour fournir les données agrégées aux composants frontend des tableaux de bord.

---

Les tableaux de bord et les statistiques offrent une valeur ajoutée significative en transformant les données brutes de planification en informations actionnables, soutenant ainsi une gestion plus proactive et éclairée des ressources humaines et matérielles.
