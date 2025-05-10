# Planning Hebdomadaire du Bloc Opératoire

## 1. Introduction

La vue du planning hebdomadaire est un outil central pour la gestion opérationnelle du bloc opératoire dans Mathildanesth. Elle offre une vision détaillée des affectations par salle et par secteur sur une semaine donnée, et intègre des fonctionnalités interactives pour faciliter la planification et les ajustements.

Cette vue est principalement gérée par le composant `src/app/planning/hebdomadaire/page.tsx`, qui a fait l'objet d'importantes évolutions, notamment l'implémentation du Drag & Drop (DND), l'intégration avec le moteur de règles, et l'utilisation des données réelles pour les salles et les spécialités.

## 2. Objectifs et Fonctionnalités Clés

- **Visualisation Claire** : Offrir une vue d'ensemble lisible des affectations MAR/IADE par salle, par jour et par créneau (matin/après-midi).
- **Gestion Interactive** : Permettre aux planificateurs de modifier facilement les affectations.
- **Respect des Règles** : Intégrer la vérification des [Règles de Supervision](./02_Regles_Supervision.md) et autres règles de planification en temps réel.
- **Données à Jour** : Afficher les informations les plus récentes issues de la [Configuration des Salles et Secteurs](./01_Configuration_Salles_Secteurs.md) et des profils utilisateurs.

## 3. Structure et Affichage

- **Grille Hebdomadaire** :
  - **Lignes** : Typiquement, chaque ligne représente une salle d'opération, regroupée par secteur. L'ordre d'affichage des secteurs et des salles respecte le `displayOrder` défini dans la configuration.
    - Les salles utilisent leur `colorCode` (défini dans `OperatingRoom.colorCode`) pour le fond des lignes, améliorant la distinction visuelle (implémenté dans `BlocPlanningTemplateEditor.tsx` et applicable ici).
  - **Colonnes** : Les jours de la semaine, souvent divisés en créneaux (ex: Matin / Après-midi).
- **Affichage des Affectations** :
  - Les affectations du personnel (MAR, IADE) aux différentes salles et créneaux sont affichées dans les cellules de la grille.
  - Des informations clés comme le nom de l'intervenant, son rôle professionnel, et potentiellement la spécialité de l'intervention peuvent être visibles.
- **Indicateurs Visuels** :
  - Violations de règles (supervision, temps de travail) signalées par des icônes ou des changements de couleur (`RuleViolationIndicator.tsx`).
  - Statut des salles (ex: ouverte, fermée, réservée).

## 4. Fonctionnalités Interactives

### 4.1. Drag & Drop (Glisser-Déposer)

Une fonctionnalité majeure est la possibilité de modifier les affectations par glisser-déposer (`documentation/roadmap-dev-updated.md` confirme l'implémentation initiale).

- **Fonctionnement** : Les planificateurs peuvent sélectionner une affectation (ou un utilisateur depuis une liste de disponibles) et la faire glisser vers une autre cellule (salle/créneau).
- **Validation en Temps Réel** : Pendant l'opération de DND et avant la finalisation (drop) :
  - Le [Moteur de Règles](../../03_Planning_Generation/01_Moteur_Regles.md) est sollicité pour valider la nouvelle affectation potentielle.
  - Les [Règles de Supervision](./02_Regles_Supervision.md) spécifiques au bloc sont vérifiées.
  - Un retour visuel indique si le déplacement est valide ou non (ex: la cellule cible change de couleur, un message d'erreur apparaît).
  - Le bug `isDropDisabled must be a boolean` avec `react-beautiful-dnd` a été investigué et des corrections ont été appliquées (`documentation/roadmap-dev-updated.md`).
- **Sauvegarde** : Si le déplacement est valide et confirmé, les modifications sont sauvegardées en base de données, potentiellement via une API de mise à jour en batch pour des raisons de performance (`documentation/roadmap-dev-updated.md`).

### 4.2. Ajout/Modification/Suppression d'Affectations

Outre le DND, des actions contextuelles (ex: clic sur une cellule, menu) permettent de :

- Ajouter une nouvelle affectation à une salle/créneau vide.
- Modifier les détails d'une affectation existante.
- Supprimer une affectation.

Ces actions sont également soumises à validation par le moteur de règles.

### 4.3. Navigation et Filtres

- Navigation facile entre les semaines (Précédent/Suivant/Sélecteur de date).
- Bouton "Actualiser" pour recharger manuellement les données (`documentation/roadmap-dev-updated.md` le mentionne comme une prochaine étape pour l'en-tête du planning hebdo).
- Filtres possibles : par secteur, par type de personnel, par statut d'affectation.

## 5. Intégration des Données Réelles

- **Salles et Secteurs** : La vue utilise les données réelles des `OperatingRoom` et `OperatingSector` issues de la base de données, incluant leur `displayOrder` et `colorCode`.
  - Les services API `/api/operating-rooms` et `/api/operating-sectors` ont été refactorisés pour utiliser `BlocPlanningService` qui trie correctement ces entités (`documentation/roadmap-dev-updated.md`).
- **Personnel** : Les informations des utilisateurs (nom, rôle, compétences) proviennent des profils à jour.
- **Spécialités Chirurgicales** : Pour les trames et potentiellement pour l'affichage des besoins dans le planning, les spécialités sont chargées depuis l'API `/api/specialties` (`documentation/roadmap-dev-updated.md` pour `EditActivityModal.tsx`).

## 6. Prise en Compte des Trames

Le planning hebdomadaire peut être initialisé ou comparé à des [Trames de Planning du Bloc Opératoire](../../../modules/templates/components/BlocPlanningTemplateEditor.md) (lien à vérifier/corriger) pour visualiser les écarts ou pour servir de base à la planification.

## 7. Points Techniques et Dépendances

- **`react-beautiful-dnd`** : Bibliothèque utilisée pour la fonctionnalité de glisser-déposer.
- **Moteur de Règles (`RuleEngineService`)** : Sollicité pour valider les modifications.
- **API Backend** : Pour charger les données du planning, les configurations, et sauvegarder les modifications (ex: API batch pour les mises à jour DND).
- **Gestion de l'État (State Management)** : Pour gérer l'état complexe de la grille de planning et des interactions utilisateur.

---

Le planning hebdomadaire du bloc opératoire est une interface dynamique et critique, au confluent de la configuration, des règles métier, et de l'interaction utilisateur. Sa robustesse et son ergonomie sont essentielles pour une gestion efficace du bloc.
