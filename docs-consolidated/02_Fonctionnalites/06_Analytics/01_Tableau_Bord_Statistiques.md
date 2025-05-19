# Tableaux de Bord Analytiques et Indicateurs Statistiques

## 1. Introduction

Mathildanesth vise à fournir des outils d'analyse et de reporting pour aider les gestionnaires et les utilisateurs à comprendre l'activité, suivre les tendances, évaluer l'équité des plannings, et identifier des pistes d'amélioration. Cela se matérialise par des tableaux de bord personnalisables et des indicateurs statistiques pertinents.

La roadmap (`documentation/roadmap-dev-updated.md`) prévoit :

- Phase 2 : Mise en place d'un "tableau de bord analytique basique" (ex: répartition heures, taux de remplacement).
- Phase 5 : "Fonctionnalités avancées d'Analytics (prédictions, etc.)".
  Le modèle `Dashboard` dans `prisma/schema.prisma` fournit l'infrastructure pour stocker des configurations de tableaux de bord personnalisés.

## 2. Objectifs des Tableaux de Bord Analytiques

- **Visualisation rapide des informations clés** : Permettre de saisir en un coup d'œil l'état de la planification, l'utilisation des ressources, la charge de travail, etc.
- **Suivi des indicateurs de performance (KPIs)** : Mettre en exergue les KPIs importants pour le pilotage de l'activité (voir `03_Indicateurs_Performance_KPI.md`).
- **Adaptabilité aux rôles et besoins** : Permettre à différents types d'utilisateurs de configurer les informations qui leur sont les plus utiles.
- **Aide à la décision pro-active** : Mettre en évidence les tendances, les alertes, ou les déséquilibres qui pourraient nécessiter une action.
- **Évaluation de l'Équité** : Mesurer et suivre la répartition de la charge de travail et des contraintes.
- **Identification des Tendances** : Repérer des motifs, des évolutions (ex: augmentation des absences, types de gardes les plus fréquents).
- **Optimisation des Ressources** : Identifier les sous-utilisations ou sur-utilisations de ressources.
- **Reporting** : Générer des rapports pour les instances dirigeantes ou pour des analyses spécifiques.

## 3. Fonctionnalités Clés

### 3.1. Modèle de Données `Dashboard` (Prisma)

Le modèle `Dashboard` est central pour cette fonctionnalité :
```prisma
model Dashboard {
  id        String @id @default(cuid())
  name      String // Nom du tableau de bord (ex: "Vue Planificateur Semaine")
  layout    Json?  // Configuration des widgets : leur type, position, taille.
  filters   Json?  // Filtres globaux pour le dashboard (ex: période, service spécifique)
  userId    String?// Si renseigné, tableau de bord personnel à cet utilisateur.
  user      User?  // Relation vers l'utilisateur
  isDefault Boolean @default(false) // Si true, ce dashboard est un modèle par défaut (ex: pour un rôle)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```
- Le champ `layout` (JSON) stocke la disposition et la configuration des widgets choisis par l'utilisateur.
- Le champ `filters` (JSON) permet d'appliquer des filtres globaux au tableau de bord (ex: plage de dates, service).
- `userId` permet d'associer un tableau de bord à un utilisateur spécifique. Si `null` et `isDefault` est `true`, il peut servir de modèle pour un rôle.

### 3.2. Bibliothèque de Widgets

Le système proposerait une collection de "widgets" ou de "tuiles" graphiques que les utilisateurs pourraient sélectionner et agencer. Chaque widget est une petite application affichant une information spécifique.

Exemples de widgets :
- **Statistiques de congés** : Nombre de jours posés/validés/restants (global ou par équipe), taux d'absentéisme.
- **Compteurs d'équité** : Visualisation de la répartition des gardes, astreintes, week-ends (ex: graphique en barres comparant les utilisateurs).
- **Utilisation du bloc opératoire** : Taux d'occupation des salles, nombre d'heures d'anesthésie (détaillé dans `04_Bloc_Operatoire/05_Statistiques_Utilisation_Bloc.md`).
- **Charge de travail planifiée** : Nombre d'heures planifiées par utilisateur, comparaison avec le temps contractuel.
- **Alertes et notifications récentes** : Un widget affichant les dernières alertes importantes (ex: conflits de planning non résolus, demandes en attente de validation).
- **État de la génération du planning** : Si une génération est en cours ou récemment terminée, afficher son statut.
- **Raccourcis rapides** : Liens vers les actions les plus fréquentes pour l'utilisateur (ex: "Valider les demandes de congés", "Ouvrir le planning de la semaine prochaine").
- **Graphiques de tendance** : Évolution d'un indicateur sur le temps (ex: évolution du nombre de gardes par personne sur les 6 derniers mois).
- **Widgets spécifiques au rôle de l'utilisateur** :
    - *Utilisateur standard* : Mes prochaines gardes, mon solde de congés, mes compteurs personnels.
    - *Planificateur* : Conflits en attente, état des demandes (congés, remplacements), couverture des besoins.
    - *Manager/Chef de service* : Taux d'absentéisme de l'équipe, KPIs de performance du service.

### 3.3. Personnalisation du Tableau de Bord

- **Sélection des widgets** : Choisir les widgets à afficher depuis la bibliothèque.
- **Agencement (Layout)** : Permettre de glisser-déposer (`drag-and-drop`) les widgets pour les positionner et les redimensionner sur la grille du tableau de bord. Cette configuration est sauvegardée dans le champ `layout` du modèle `Dashboard`.
- **Configuration par widget** : Certains widgets pourraient avoir des options de configuration propres (ex: choisir la période pour un graphique de tendance, filtrer par type de congé), stockées dans le `layout`.
- **Sauvegarde de plusieurs tableaux de bord** : Un utilisateur pourrait créer et nommer plusieurs configurations de tableaux de bord pour différents usages, chacun étant une instance du modèle `Dashboard`.
- **Tableaux de bord par défaut par rôle** : L'administrateur peut définir des `Dashboard` avec `isDefault = true` et sans `userId` spécifique pour servir de modèles pour les nouveaux utilisateurs d'un rôle.

### 3.4. Interactivité

- **Drill-down** : En cliquant sur un élément d'un widget (ex: une barre dans un graphique), l'utilisateur pourrait accéder à une vue plus détaillée des données ou à un rapport connexe.
- **Mise à jour dynamique** : Les données des widgets se rafraîchissent périodiquement ou lors du chargement du tableau de bord.

## 4. Types de Tableaux de Bord Envisageables (Exemples de configurations)

### 4.1. Tableau de Bord Principal (Général ou par Rôle)

- **Vue d'Ensemble** : Widgets clés affichant les informations les plus pertinentes pour l'utilisateur connecté ou son rôle.
- **Indicateurs Fréquents** :
  - Nombre de jours de congé restants (pour l'utilisateur).
  - Prochaines gardes/astreintes.
  - Alertes importantes (conflits non résolus, demandes en attente).
  - Statistiques rapides sur l'activité de la semaine/mois en cours.
- Le modèle `Dashboard` (`prisma/schema.prisma`) avec ses champs `name`, `layout`, `filters`, `userId` suggère que les utilisateurs pourraient créer/personnaliser leurs propres tableaux de bord.

### 4.2. Tableau de Bord des Planificateurs/Gestionnaires

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

### 4.3. Tableau de Bord du Bloc Opératoire

- **Utilisation des Salles** :
  - Taux d'occupation des salles.
  - Temps moyen d'intervention par salle/spécialité.
  - Nombre d'interventions par jour/semaine/salle.
- **Performance du Personnel du Bloc** :
  - Nombre d'heures effectuées au bloc par MAR/IADE.
  - Répartition des types d'interventions par anesthésiste.
- **Respect des Règles de Supervision** :
  - Statistiques sur les violations des règles de supervision.

## 5. Types d'Indicateurs Statistiques et Visualisations

- **Compteurs et Sommes** : Nombre de gardes, total d'heures, nombre de jours de congé.
- **Moyennes et Ratios** : Taux d'occupation, durée moyenne, pourcentage de couverture.
- **Distributions et Répartitions** : Graphiques en barres, camemberts pour montrer la répartition des tâches.
- **Séries Temporelles** : Courbes pour suivre l'évolution d'indicateurs dans le temps.
- **Comparaisons** : Entre utilisateurs, entre périodes, entre services.
- **Cartes de Chaleur (Heatmaps)** : Pour visualiser les périodes de forte/faible activité ou de concentration de certains événements.

## 6. Fonctionnalités de Reporting

- **Export de Données** : Possibilité d'exporter les données brutes ou les tableaux de statistiques (CSV, Excel).
- **Génération de Rapports PDF** : Création de rapports synthétiques et visuels prêts à être partagés.
- **Filtres et Périodes Personnalisables** : Sélectionner la période d'analyse, les services, les rôles, etc., pour affiner les rapports.

## 7. Analytics Avancées (Phase 5)

- **Analyses Prédictives** :
  - Prévision des périodes de forte demande de congés.
  - Anticipation des risques de sous-effectif basés sur les tendances historiques et les congés prévus.
  - Modélisation de l'impact de changements organisationnels (ex: ouverture d'une nouvelle salle).
- **Détection d'Anomalies** : Identifier des schémas inhabituels dans les données de planification ou d'absence.
- **Suggestions d'Optimisation Basées sur les Données** : Proposer des ajustements de règles ou de trames en se basant sur l'analyse des plannings passés et de leur efficacité.

## 8. Implémentation Technique (Considérations)

- **Agrégation de Données** : Nécessité de mécanismes pour agréger efficacement les données de planning, d'absences, et de profils utilisateurs.
- **Base de Données Analytique (Optionnel)** : Pour des analyses complexes et volumineuses, une base de données optimisée pour l'analytique ou un data warehouse pourrait être envisagé à long terme.
- **Bibliothèques de Visualisation** : Utilisation de bibliothèques graphiques (ex: Chart.js, D3.js, Recharts) pour créer les tableaux de bord interactifs.
- **Services Backend** : API pour fournir les données agrégées aux composants frontend des tableaux de bord.

---

Les tableaux de bord analytiques et les statistiques offrent une valeur ajoutée significative en transformant les données brutes de planification en informations actionnables, soutenant ainsi une gestion plus proactive et éclairée des ressources humaines et matérielles.
