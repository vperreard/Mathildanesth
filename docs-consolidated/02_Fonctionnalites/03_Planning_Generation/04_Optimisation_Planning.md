# Optimisation du Planning

## 1. Introduction

L'optimisation du planning intervient après la génération initiale par l'[algorithme](./02_Algorithme_Generation.md) ou lorsqu'un planning existant nécessite des ajustements. L'objectif est d'améliorer le [score global](./03_Scoring_Evaluation.md) du planning en résolvant des conflits mineurs, en répondant à des changements de dernière minute, ou en améliorant l'équité et la qualité de vie, sans dégrader significativement d'autres aspects.

Les techniques d'optimisation peuvent être automatiques, semi-automatiques (assistées par l'utilisateur) ou manuelles avec validation par le système.

## 2. Objectifs de l'Optimisation

*   **Amélioration du Score** : Augmenter le score global du planning en réduisant les pénalités liées aux violations de règles souples.
*   **Résolution de Conflits Spécifiques** : Cibler et corriger des problèmes identifiés (ex: un utilisateur avec trop de week-ends travaillés sur une période).
*   **Réponse aux Imprévus** : Adapter le planning suite à une absence de dernière minute, un changement de besoin, etc.
*   **Amélioration Continue** : Permettre aux gestionnaires d'affiner progressivement les plannings.

## 3. Techniques d'Optimisation Automatique

Ces techniques visent à améliorer le planning sans intervention manuelle directe, bien que l'utilisateur puisse initier le processus.

### 3.1. Recherche Locale

*   **Principe** : Partant d'une solution existante (le planning actuel), la recherche locale explore des solutions "voisines" (plannings légèrement modifiés) pour trouver une meilleure alternative.
*   **Mouvements typiques** :
    *   Échanger deux affectations entre utilisateurs.
    *   Déplacer une affectation d'un utilisateur à un autre.
    *   Changer l'horaire d'une affectation.
*   **Critères d'acceptation** : Un mouvement est accepté s'il améliore le score global et ne viole aucune règle dure.
*   **Limites** : Peut rester coincée dans des optima locaux (une solution meilleure que ses voisines, mais pas la meilleure globalement).

### 3.2. Algorithmes Métaheuristiques

Pour surmonter les limites de la recherche locale simple, des métaheuristiques peuvent être envisagées (comme mentionné dans `docs MATHILDA/05_Regles_Metier/01_Regles_Planification.md`) :

*   **Recuit Simulé (Simulated Annealing)** : Permet d'accepter occasionnellement des mouvements qui dégradent le score, pour s'échapper des optima locaux. La probabilité d'accepter un mauvais mouvement diminue avec le temps.
*   **Recherche Tabou (Tabu Search)** : Maintient une liste de mouvements récents interdits ("tabous") pour éviter de cycler et encourager l'exploration de nouvelles régions de l'espace des solutions.
*   **Algorithmes Génétiques** : Font évoluer une population de plannings en utilisant des opérateurs inspirés de la génétique (croisement, mutation) et une sélection basée sur le score.
    *   Ces approches sont computationnellement plus intensives et nécessitent une calibration soignée.

### 3.3. Ajustements Basés sur le Feedback du Moteur de Règles

*   Le système peut suggérer des optimisations ciblées en analysant les violations de règles souples ou les déséquilibres les plus importants dans le [scoring](./03_Scoring_Evaluation.md).

## 4. Optimisation Manuelle Assistée et Interactive

Même avec des outils automatiques, l'intervention humaine reste souvent nécessaire.

### 4.1. Interface d'Édition Intuitive

*   Permettre aux gestionnaires de modifier facilement le planning (glisser-déposer des affectations, changer des horaires).
*   **Validation en temps réel** : Lorsqu'une modification manuelle est effectuée, le système doit immédiatement :
    *   Vérifier la validité par rapport aux règles dures (interdisant la modification si une règle dure est violée).
    *   Recalculer et afficher l'impact sur le score global et les sous-scores (violations de règles souples, équité, fatigue).

### 4.2. Suggestions d'Amélioration Contextuelles

*   Lorsqu'un gestionnaire sélectionne une affectation problématique ou un utilisateur, le système pourrait proposer des solutions alternatives (ex: "Échanger avec X pour améliorer l'équité des week-ends", "Déplacer cette tâche à Y qui est disponible et compétent").

### 4.3. "Bac à Sable" (Sandbox Mode)

*   Permettre aux gestionnaires d'expérimenter des modifications dans un mode "brouillon" sans affecter le planning publié. Ils peuvent ensuite valider ou annuler leurs changements.

## 5. Indicateurs de Performance de l'Optimisation

*   **Amélioration du score** : Le principal indicateur est l'augmentation du score du planning.
*   **Nombre de conflits résolus**.
*   **Temps de calcul** (pour les optimisations automatiques).
*   **Satisfaction utilisateur** (qualitative, via feedback).

## 6. Considérations Techniques

*   **Rapidité des évaluations** : Pour l'optimisation interactive, la validation des règles et le recalcul du score doivent être quasi instantanés.
*   **Complexité des dépendances** : Une modification peut avoir des effets en cascade. L'analyse d'impact doit être robuste.
*   **Historique des modifications** : Tracer les optimisations pour comprendre l'évolution du planning et permettre des retours en arrière si nécessaire.

L'optimisation du planning est un processus continu qui combine la puissance des algorithmes avec l'expertise et le jugement des gestionnaires. Un bon système d'optimisation rend les plannings plus robustes, équitables et adaptables aux réalités du terrain. 