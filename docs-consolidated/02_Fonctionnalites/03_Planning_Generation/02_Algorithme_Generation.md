# Algorithme de Génération de Planning

## 1. Introduction

La génération automatique de plannings médicaux est une tâche complexe en raison du grand nombre de contraintes à satisfaire, des multiples objectifs à optimiser (équité, couverture des besoins, préférences) et de la nécessité de produire des plannings robustes et flexibles. L'algorithme de Mathildanesth vise à aborder ces défis en utilisant une approche hybride combinant des techniques heuristiques, la satisfaction de contraintes et des phases d'optimisation.

Le document `documentation/regles-planning-documentation.md` souligne l'architecture modulaire du moteur de règles, ce qui est fondamental pour l'algorithme qui s'appuie sur ces règles à chaque étape.

## 2. Principes Généraux de l'Algorithme

L'algorithme de génération de planning s'articule autour des principes suivants :

*   **Approche par étapes** : La génération est décomposée en plusieurs phases distinctes (pré-traitement, affectation principale, post-traitement) pour gérer la complexité.
*   **Priorisation des règles** : Les règles "dures" (légales, sécurité) sont prioritaires sur les règles "souples" (préférences, confort).
*   **Itératif et adaptatif** : L'algorithme peut nécessiter des itérations pour trouver une solution satisfaisante, en ajustant les affectations pour résoudre les conflits.
*   **Configurabilité** : De nombreux aspects de l'algorithme sont influencés par les paramètres définis dans [Règles de Configuration (`docs MATHILDA/05_Regles_Metier/02_Regles_Configuration.md`)](./../01_Moteur_Regles.md#3-configuration-des-règles).

## 3. Phases de l'Algorithme

### 3.1. Pré-traitement et Initialisation

Avant de commencer l'affectation, plusieurs étapes préparatoires sont nécessaires :

*   **Collecte des données** :
    *   Utilisateurs disponibles (avec leurs rôles, compétences, contrats, temps partiels).
    *   Absences planifiées (congés, formations).
    *   Demandes spécifiques (si prises en compte automatiquement).
    *   Besoins de couverture pour chaque service/poste/salle.
    *   Règles de planification actives.
*   **Création des "slots" à pourvoir** : Définition de toutes les tâches ou postes qui doivent être couverts sur la période de planning.
*   **Filtrage initial des candidats** : Pour chaque slot, une première liste de candidats potentiels peut être établie en fonction des compétences de base et des incompatibilités manifestes.

### 3.2. Affectation Principale

C'est le cœur de l'algorithme, où les utilisateurs sont assignés aux slots. Plusieurs stratégies peuvent être combinées :

*   **Approche basée sur les contraintes (Constraint Satisfaction Problem - CSP)** :
    *   Les variables sont les affectations (quel utilisateur pour quel slot).
    *   Les domaines sont les utilisateurs éligibles pour chaque slot.
    *   Les contraintes sont les règles du [Moteur de Règles](./01_Moteur_Regles.md).
    *   Des solveurs de contraintes ou des techniques de recherche avec backtracking peuvent être utilisés. `docs MATHILDA/05_Regles_Metier/01_Regles_Planification.md` évoque cette approche.
*   **Heuristiques et priorisation** :
    *   **Priorité aux tâches critiques** : Les postes indispensables sont pourvus en premier.
    *   **Priorité aux utilisateurs avec peu d'options** : Pour éviter de bloquer certains utilisateurs en fin de processus.
    *   **Rotation et équité** : Les heuristiques peuvent viser à distribuer équitablement les tâches pénibles ou les week-ends dès cette phase, en s'appuyant sur les compteurs d'équité.
    *   **Affectation par type de personnel** : Par exemple, affecter d'abord les MAR, puis les IADE, en fonction des dépendances.
*   **Gestion des demandes et préférences** : Les demandes validées sont traitées comme des contraintes fortes. Les préférences sont prises en compte avec un poids moins élevé.

### 3.3. Post-traitement et Optimisation Initiale

Une fois une première version du planning générée, des ajustements peuvent être nécessaires :

*   **Résolution de conflits mineurs** : Si des règles souples n'ont pu être totalement satisfaites.
*   **Première passe d'équilibrage** : Ajustements pour améliorer les scores d'équité ou de fatigue sans violer les contraintes dures.
*   **Vérification de la complétude** : S'assurer que tous les besoins critiques sont couverts.

## 4. Stratégies Spécifiques

*   **Backtracking intelligent** : En cas de blocage (aucun utilisateur ne peut être affecté à un slot sans violer une contrainte dure), l'algorithme doit pouvoir revenir en arrière de manière efficace pour explorer d'autres solutions.
*   **Gestion des affectations liées/conditionnelles** : Par exemple, un chirurgien nécessitant un IADE spécifique, ou une salle ne pouvant ouvrir que si une autre est fermée.
*   **Recherche Tabou ou Recuit Simulé** : Comme mentionné dans `docs MATHILDA/05_Regles_Metier/01_Regles_Planification.md`, des techniques de métaheuristique pourraient être explorées pour l'optimisation ou pour sortir des optima locaux lors de la phase d'affectation.

## 5. Considérations Techniques

*   **Performance** : La génération doit être suffisamment rapide pour être utilisable, surtout pour de grandes équipes ou des plannings complexes. Des optimisations algorithmiques et techniques (ex: parallélisation de certaines évaluations) sont cruciales.
*   **Évolutivité** : L'algorithme doit pouvoir s'adapter à l'augmentation du nombre d'utilisateurs, de services et de règles.
*   **Transparence** : Idéalement, l'algorithme devrait pouvoir fournir des explications sur les raisons de certaines affectations ou sur les difficultés rencontrées, s'appuyant sur le [Scoring et Évaluation](./03_Scoring_Evaluation.md).

L'algorithme de génération est un processus itératif qui bénéficie d'un moteur de règles bien défini et d'un système de [scoring robuste](./03_Scoring_Evaluation.md) pour guider ses décisions. Des phases d'[optimisation plus poussées](./04_Optimisation_Planning.md) peuvent ensuite affiner le planning généré. 