# Moteur de Règles et Génération de Planning

## 1. Vue d'ensemble du Moteur de Règles

Le cœur de la génération de planning dans Mathildanesth repose sur un moteur de règles sophistiqué. Son objectif est de produire des plannings optimisés, équitables, et conformes aux contraintes légales, organisationnelles et individuelles. Ce moteur prend en compte une multitude de facteurs pour automatiser au maximum la création des emplois du temps.

Les principes fondamentaux du moteur de règles sont :

- **Paramétrabilité et Adaptabilité** : Les règles peuvent être configurées finement pour s'adapter aux besoins spécifiques de chaque établissement et de chaque service.
- **Hiérarchisation des Règles** : Toutes les règles n'ont pas le même poids. Le système distingue les règles impératives (ex: repos de sécurité) des règles souhaitables (ex: préférences utilisateur).
- **Transparence** : Bien que le processus soit complexe, le système doit pouvoir expliquer pourquoi une décision a été prise ou pourquoi une affectation a été générée.
- **Équité** : Un objectif majeur est d'assurer une répartition équitable des tâches pénibles (gardes, astreintes, week-ends) et des périodes de repos entre tous les membres du personnel.
- **Optimisation Continue** : Le système peut intégrer des mécanismes d'apprentissage (bien que cela soit une fonctionnalité avancée) pour améliorer ses propositions avec le temps.

## 2. Types de Règles Gérées

Le moteur de règles de Mathildanesth est capable de traiter plusieurs catégories de règles :

### 2.1. Règles Légales et Conventionnelles
- Temps de travail maximum (journalier, hebdomadaire, etc.).
- Repos quotidien et hebdomadaire obligatoires (ex: repos de sécurité après une garde).
- Nombre de jours de congés annuels, RTT, etc.

### 2.2. Règles Organisationnelles (par Établissement/Service)
- **Besoins de couverture** : Nombre de personnes requises par poste/compétence/secteur à différents moments.
- **Quotas d'absences simultanées** : Nombre maximum de personnes pouvant être absentes en même temps dans un service ou pour une compétence donnée.
- **Règles de compétences et qualifications** : S'assurer que les bonnes personnes avec les bonnes compétences sont affectées aux bonnes tâches (ex: supervision de salles spécifiques, pédiatrie).
- **Continuité de service** : Éviter les trous dans le planning.
- **Règles spécifiques à certaines activités** :
    - **Gardes et Astreintes** : Fréquence maximale, espacement minimal, enchaînements interdits, repos compensateur.
    - **Consultations** : Volume hebdomadaire, répartition.
    - **Bloc Opératoire** : Règles de supervision de salles (nombre, localisation), compatibilité des secteurs.

### 2.3. Règles d'Équité
- **Répartition des gardes** (total, week-ends, jours fériés).
- **Répartition des astreintes**.
- **Répartition des week-ends travaillés et des jours fériés travaillés**.
- **Rotation sur les postes/tâches pénibles ou moins désirables**.
- **Lissage de la charge de travail** sur une période donnée.
Le système utilise souvent des **compteurs** par utilisateur pour suivre ces éléments et garantir l'équité sur le moyen/long terme.

### 2.4. Règles de Qualité de Vie et Préférences Utilisateurs
- **Gestion de la Fatigue** : Prise en compte de l'enchaînement des tâches, des gardes, pour éviter une surcharge excessive. Peut inclure un système de "points de fatigue".
- **Préférences individuelles** (si configurées et permises) : Souhaits de jours OFF, types d'activités préférées/évitées (dans la limite du raisonnable et des besoins du service).
- **Incompatibilités personnelles** : Deux utilisateurs ne souhaitant pas travailler ensemble sur certaines plages (à utiliser avec parcimonie).
- **Demandes de congés validées**.

### 2.5. Règles de Transition et d'Enchaînement
- Temps de trajet minimal entre deux lieux d'affectation différents.
- Incompatibilité d'enchaînement direct entre certaines tâches (ex: pas de consultation immédiatement après une garde de nuit).

## 3. Configuration des Règles

L'interface d'administration de Mathildanesth permet aux planificateurs et administrateurs de configurer ces règles.

- **Interface dédiée** : Une section spécifique permet de visualiser, créer, modifier, activer/désactiver les règles.
- **Niveaux de priorité/criticité** : Possibilité de définir si une règle est bloquante ("hard constraint") ou si elle est une préférence/optimisation ("soft constraint" avec un coût en cas de non-respect).
- **Paramètres variables** : Beaucoup de règles sont basées sur des valeurs numériques (ex: "minimum 3 jours entre deux gardes", "maximum 2 salles supervisées"). Ces valeurs sont configurables.
- **Application par profil/rôle/utilisateur** : Certaines règles peuvent s'appliquer globalement, d'autres spécifiquement à des groupes d'utilisateurs (ex: MAR, IADE) ou même à un individu (pour des exceptions justifiées).
- **Périodes de validité** : Certaines règles peuvent être temporaires.

## 4. Processus de Génération de Planning

Bien que les détails de l'algorithme soient complexes, le processus général suit généralement ces étapes :

1.  **Collecte des Données d'Entrée** :
    *   Effectif disponible (avec leurs contrats, temps partiels, compétences).
    *   Congés et absences déjà validés.
    *   Besoins de couverture définis.
    *   Ensemble des règles configurées et actives.
    *   Historique des plannings précédents (pour l'équité).
2.  **Placement des Éléments Prioritaires** : Souvent, les gardes, astreintes, et autres affectations critiques ou difficiles à placer sont positionnées en premier.
3.  **Application des Règles Contraignantes** : Le système tente de satisfaire toutes les règles "dures".
4.  **Optimisation et Application des Règles Souples** : Une fois les contraintes respectées, le système cherche à optimiser le planning en fonction des règles d'équité, de qualité de vie, et des préférences, en minimisant les "coûts" de non-respect des règles souples.
5.  **Détection et Signalement des Conflits** : Si des règles ne peuvent être satisfaites, le système signale les conflits, leur nature, et si possible, propose des pistes de résolution.
6.  **Proposition du Planning** : Un ou plusieurs scénarios de planning peuvent être proposés au planificateur.
7.  **Ajustements Manuels** : Le planificateur garde la main pour effectuer des ajustements fins si nécessaire, le système pouvant alors re-valider la cohérence du planning modifié.

## 5. Gestion de la Fatigue (Exemple de Règle Complexe)

Un aspect important peut être la modélisation et la gestion de la fatigue.

- **Système de points de fatigue** : Chaque type d'affectation (garde, astreinte, supervision multiple, type de chirurgie lourd) peut se voir attribuer un certain nombre de points de fatigue.
- **Accumulation et récupération** : Les points s'accumulent avec le travail et diminuent avec les périodes de repos (jour OFF, week-end OFF, vacances).
- **Seuils d'alerte et critiques** : Des seuils peuvent être définis. Si un utilisateur dépasse un seuil, des alertes sont levées, et des affectations supplémentaires peuvent être bloquées ou nécessiter une validation spéciale.
- **Objectif** : Prévenir l'épuisement professionnel et maintenir la sécurité des soins en évitant de surcharger le personnel.

Ce moteur de règles est un composant dynamique, et sa configuration précise est la clé d'un planning réussi et accepté par les équipes.
