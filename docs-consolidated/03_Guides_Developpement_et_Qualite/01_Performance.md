# Performance Applicative

La performance est une exigence non fonctionnelle critique pour Mathildanesth, impactant directement l'expérience utilisateur, l'adoption de l'outil et l'efficacité opérationnelle. Ce document détaille les objectifs, les stratégies et les points d'attention relatifs à la performance de l'application.

## 1. Objectifs de Performance

### 1.1. Temps de Réponse de l'Interface Utilisateur (Frontend)
- **Interactions courantes** : Navigation entre les pages, ouverture de modales, soumission de formulaires simples, etc., doivent s'effectuer de manière fluide, avec un temps de réponse idéalement inférieur à **500ms**.
- **Affichage du Planning** : Le chargement et l'affichage initial des vues de planning (hebdomadaire, mensuel) doivent être rapides, même avec un volume conséquent d'affectations et d'utilisateurs. Objectif : **inférieur à 2 secondes**.
- **Listes volumineuses** : L'affichage de longues listes (ex: utilisateurs, historique des logs) doit utiliser des techniques de virtualisation pour maintenir la fluidité.

### 1.2. Performance du Backend et des APIs
- **Endpoints API courants** : Les appels API fréquemment sollicités par le frontend doivent avoir un temps de réponse moyen inférieur à **200ms** sous une charge normale.
- **Opérations complexes** :
    - **Génération du Planning** : Le processus de génération automatique pour une période significative (ex: un mois pour une équipe de taille moyenne) doit s'exécuter dans un délai raisonnable (objectif initial < 5 minutes, à affiner). Ce processus peut être exécuté en tâche de fond.
    - **Imports/Exports volumineux** : Doivent également être gérés en tâches de fond pour ne pas bloquer l'utilisateur.

### 1.3. Performance de la Base de Données
- **Requêtes optimisées** : Les requêtes à la base de données, en particulier celles sollicitées par les APIs critiques ou les affichages de planning, doivent être rapides et efficaces.
- **Charge admissible** : La base de données doit pouvoir gérer la charge générée par les utilisateurs concurrents et les opérations système sans dégradation majeure.

## 2. Stratégies d'Optimisation et de Suivi

### 2.1. Optimisations Frontend
- **Optimisation des assets** : Compression et optimisation des images, utilisation de formats modernes (WebP), chargement optimisé des polices.
- **Bundling et Code Splitting** : Minimisation des bundles JavaScript/CSS, chargement paresseux (Lazy Loading) des composants, routes et bibliothèques non critiques pour le rendu initial.
- **Memoization et Rendu Conditionnel** : Utilisation judicieuse de `React.memo`, `useMemo`, `useCallback` pour éviter les re-rendus inutiles.
- **Virtualisation des listes** : Pour les affichages de grands ensembles de données.
- **Gestion de l'état optimisée** : Choix et utilisation efficaces des bibliothèques de gestion d'état pour minimiser les mises à jour propagées.
- **Optimistic UI Updates** : Pour certaines actions, mettre à jour l'interface immédiatement et gérer la confirmation/erreur serveur en arrière-plan pour une meilleure sensation de réactivité.

### 2.2. Optimisations Backend (API et Services)
- **Mise en cache** : Utilisation de stratégies de cache (en mémoire, distribué type Redis) pour les données fréquemment accédées et rarement modifiées (ex: configurations, listes de référence).
- **Pagination systématique** : Pour toutes les APIs retournant des listes potentiellement volumineuses.
- **Optimisation des requêtes métier** : Conception efficace des services pour minimiser le nombre d'appels à la base de données (ex: éviter les problèmes N+1 avec des outils comme Dataloader si en GraphQL, ou des jointures/includes Prisma bien pensés).
- **Traitement asynchrone** : Pour les tâches longues (génération de planning, imports/exports), utiliser des files d'attente et des workers (ex: BullMQ, RabbitMQ).
- **Compression des réponses API** (ex: Gzip).

### 2.3. Optimisations de la Base de Données (PostgreSQL avec Prisma)
- **Indexation rigoureuse** : Créer des index sur les colonnes fréquemment utilisées dans les clauses `WHERE`, les jointures (`JOIN`), et les tris (`ORDER BY`). Analyser les plans d'exécution des requêtes (`EXPLAIN ANALYZE`) pour identifier les besoins d'indexation. Prisma facilite la création d'index via le schéma.
- **Optimisation des requêtes Prisma** :
    - Utiliser `select` et `include` de manière judicieuse pour ne récupérer que les données nécessaires.
    - Préférer les opérations batch (`createMany`, `updateMany`, `deleteMany`) lorsque c'est approprié.
    - Être attentif aux requêtes générées par Prisma, surtout pour les relations complexes.
- **Pooling de connexions** : Configurer et utiliser efficacement le pooling de connexions à la base de données (généralement géré par Prisma).
- **Maintenance régulière** : `VACUUM`, `ANALYZE` pour maintenir les performances de la base.

### 2.4. Tests et Monitoring de Performance
- **Tests de charge** : Simuler l'utilisation concurrente par un nombre significatif d'utilisateurs pour identifier les goulots d'étranglement (API, base de données) avant la mise en production. Des outils comme k6, JMeter peuvent être utilisés.
- **Profiling de l'algorithme de génération** : Analyser régulièrement les performances de l'algorithme de génération de planning avec différents jeux de données et complexités de règles pour identifier et optimiser les sections les plus coûteuses en temps.
- **Monitoring des performances applicatives (APM)** : Intégrer des outils (ex: Sentry, Datadog, New Relic) pour suivre en production :
    - Temps de réponse des APIs.
    - Temps de génération des plannings.
    - Performances du frontend (Core Web Vitals : LCP, FID, CLS).
    - Détection et diagnostic des requêtes lentes à la base de données.
- **Alertes de performance** : Configurer des alertes si les temps de réponse dépassent certains seuils.

## 3. Points d'Attention Spécifiques

- **Algorithme de Génération de Planning** : C'est un composant critique. Sa performance doit être une priorité dès la conception et faire l'objet d'optimisations continues. L'impact de l'ajout de nouvelles règles ou contraintes sur la performance doit être évalué.
- **Affichage du Planning Complexe** : La page principale d'affichage du planning peut devenir très dense. Des optimisations spécifiques (rendu intelligent, pagination virtuelle des jours/semaines, chargement progressif des données) sont cruciales.
- **Évolution des Données** : Anticiper l'augmentation du volume de données (utilisateurs, affectations, logs) et s'assurer que les requêtes et l'architecture restent performantes avec le temps.

Une approche proactive de la gestion de la performance, intégrant des optimisations à tous les niveaux de la stack et un monitoring continu, est indispensable pour garantir le succès à long terme de Mathildanesth. 