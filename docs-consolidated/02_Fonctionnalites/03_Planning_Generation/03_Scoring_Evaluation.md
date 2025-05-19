# Scoring et Évaluation des Plannings

## 1. Introduction

Une fois qu'un planning est généré par l'[algorithme](./02_Algorithme_Generation.md), il est crucial d'évaluer sa qualité de manière objective. Le système de scoring et d'évaluation de Mathildanesth a pour but de quantifier à quel point un planning respecte les contraintes, atteint les objectifs d'équité, de couverture des besoins, et de qualité de vie pour le personnel.

Cette évaluation n'est pas seulement un indicateur final, mais elle peut aussi guider l'algorithme de génération et les phases d'[optimisation](./04_Optimisation_Planning.md). Des éléments de `documentation/regles-planning-documentation.md` (compteurs, gestion de la fatigue) et `documentation/regles-implementation-guide.md` (Fatigue System, Equity System) sont directement liés à ce concept.

## 2. Composants du Score d'un Planning

Le score global d'un planning est généralement une agrégation de plusieurs sous-scores, reflétant différentes dimensions de sa qualité.

### 2.1. Respect des Règles

C'est la composante la plus critique du score.

*   **Règles Dures (Hard Constraints)** : Violations de règles légales, réglementaires, ou de sécurité (ex: dépassement du temps de travail maximum, non-respect du repos de sécurité, manque de personnel qualifié pour une tâche critique).
    *   **Impact** : Chaque violation d'une règle dure devrait idéalement invalider le planning ou entraîner une pénalité très élevée dans le score. L'objectif est d'avoir zéro violation de règle dure.
*   **Règles Souples (Soft Constraints)** : Non-respect de préférences, d'objectifs d'équité non critiques, de certaines règles organisationnelles de confort (ex: enchaînement de tâches peu souhaitable, non-respect d'une préférence de jour de repos).
    *   **Impact** : Chaque violation d'une règle souple entraîne une pénalité, dont le poids peut être configuré. Le système vise à minimiser ces pénalités.

### 2.2. Qualité de la Couverture des Besoins

*   **Adéquation aux besoins** : Le planning couvre-t-il tous les postes requis, avec le bon niveau de compétence, aux bons moments ?
*   **Sur-staffing / Sous-staffing** : Des pénalités peuvent être appliquées si le planning présente un sur-effectif coûteux ou un sous-effectif risqué.

### 2.3. Équité

Plusieurs aspects de l'équité sont évalués, souvent à l'aide de compteurs gérés par le système (cf. `documentation/regles-planning-documentation.md`):

*   **Répartition des tâches pénibles/non populaires** (ex: gardes, astreintes, nuits, week-ends).
*   **Nombre de jours de travail consécutifs**.
*   **Alternance travail/repos**.
*   **Attribution des jours fériés**.
*   **Équilibre des heures travaillées** (par rapport aux contrats).
*   **Score d'équité** : Un score composite peut être calculé basé sur l'écart type ou d'autres mesures de dispersion pour ces différents compteurs entre les membres d'une même équipe/rôle.

### 2.4. Qualité de Vie et Gestion de la Fatigue

*   **Enchaînements de postes** : Éviter les transitions trop rapides ou fatigantes (ex: finir tard et commencer tôt le lendemain – "Quick Returns").
*   **Concentration des heures de travail**.
*   **Prévisibilité du planning**.
*   **Système de gestion de la fatigue** : `documentation/regles-implementation-guide.md` mentionne un "Fatigue System". Cela pourrait impliquer des scores de fatigue individuels basés sur l'historique récent et les affectations actuelles, avec des seuils à ne pas dépasser.

### 2.5. Prise en Compte des Préférences (si applicable)

*   Si le système permet aux utilisateurs de soumettre des préférences (non garanties), le score peut refléter le taux de satisfaction de ces préférences.

## 3. Calcul et Pondération

*   **Pénalités et Bonus** : Le score est souvent calculé en partant d'un maximum et en soustrayant des pénalités pour chaque violation de règle ou défaut, ou en additionnant des points pour des aspects positifs.
*   **Pondération configurable** : L'importance relative de chaque composante du score (ex: l'équité des week-ends par rapport à la satisfaction des préférences) doit être configurable par les administrateurs, comme suggéré dans les [Règles de Configuration (`docs MATHILDA/05_Regles_Metier/02_Regles_Configuration.md`)](./../01_Moteur_Regles.md#3-configuration-des-règles).
*   **Normalisation** : Les scores peuvent être normalisés (ex: sur une échelle de 0 à 100) pour faciliter la comparaison.

## 4. Utilisation du Score

*   **Aide à la décision pour l'algorithme** : Pendant la génération, l'algorithme peut utiliser le score partiel pour choisir entre différentes options d'affectation.
*   **Comparaison de plannings alternatifs** : Permettre aux gestionnaires de comparer plusieurs propositions de planning.
*   **Identification des points faibles** : Un score détaillé aide à identifier les aspects du planning qui nécessitent une [optimisation](./04_Optimisation_Planning.md) manuelle ou automatique.
*   **Feedback aux utilisateurs** : Peut (avec prudence) donner une indication sur la "qualité" globale du planning.

## 5. Interface Utilisateur

*   **Affichage clair du score global et des sous-scores**.
*   **Visualisation des violations de règles** directement sur le planning.
*   **Rapports de qualité** : Graphiques ou tableaux montrant l'évolution de la qualité du planning ou la distribution des compteurs d'équité.

Un système de scoring transparent et bien conçu est essentiel pour piloter la génération de plannings de haute qualité et pour fournir aux gestionnaires les informations nécessaires pour prendre des décisions éclairées. 