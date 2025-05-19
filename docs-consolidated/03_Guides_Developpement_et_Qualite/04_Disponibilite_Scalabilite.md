# Disponibilité et Scalabilité

Mathildanesth est une application critique pour la gestion des plannings du personnel médical. Sa disponibilité et sa capacité à monter en charge (scalabilité) sont donc des exigences non fonctionnelles essentielles.

## 1. Disponibilité (Availability)

- **Objectif de Disponibilité (Uptime)** :
    - Viser une haute disponibilité, particulièrement pendant les heures ouvrées et les périodes de consultation/modification intensive des plannings. Un objectif de **99.5% à 99.9%** de disponibilité annuelle est souhaitable.
    - Cela se traduit par une tolérance à la panne limitée (ex: quelques heures d'indisponibilité cumulées par an au maximum pour 99.9%).
- **Planification des Maintenances** :
    - Les opérations de maintenance programmées (mises à jour applicatives, maintenance de la base de données, mises à jour d'infrastructure) doivent être planifiées pendant les périodes de faible activité (ex: nuit, week-end) pour minimiser l'impact sur les utilisateurs.
    - Prévenir les utilisateurs à l'avance des interruptions de service prévues.
- **Architecture Tolérante aux Pannes (Fault Tolerance)** :
    - **Redondance** : Déployer les composants clés de l'application (serveurs d'application, base de données) avec une redondance pour éviter les points uniques de défaillance (Single Points of Failure - SPOF).
        - Exemple : Plusieurs instances du serveur d'application derrière un load balancer.
        - Exemple : Base de données avec une configuration de réplication (primaire/secondaire) et basculement automatique (failover).
    - **Détection et Récupération Rapide** : Mettre en place un monitoring (voir section `03_Logging_Monitoring_Alerting.md`) pour détecter rapidement les pannes et automatiser autant que possible les processus de récupération.
- **Sauvegardes et Plan de Reprise d'Activité (PRA) / Plan de Continuité d'Activité (PCA)** :
    - **Sauvegardes Régulières de la Base de Données** : Effectuer des sauvegardes fréquentes et automatisées de la base de données (ex: quotidiennes complètes, plus fréquentes pour les journaux de transactions).
    - **Tests de Restauration** : Tester périodiquement la capacité à restaurer les données à partir des sauvegardes.
    - **Définir un PRA/PCA** : Documenter les procédures à suivre en cas d'incident majeur pour restaurer le service dans des délais acceptables (RTO - Recovery Time Objective) et avec une perte de données minimale (RPO - Recovery Point Objective).

## 2. Scalabilité (Scalability)

La scalabilité est la capacité de l'application à maintenir ses performances et sa disponibilité lorsque la charge augmente (nombre d'utilisateurs concurrents, volume de données, complexité des opérations).

### 2.1. Types de Scalabilité

- **Scalabilité Verticale (Scale-Up)** : Augmenter les ressources d'un serveur existant (CPU, RAM, disque). Solution simple à court terme, mais avec des limites physiques et de coût.
- **Scalabilité Horizontale (Scale-Out)** : Ajouter plus d'instances de serveurs (pour l'application) ou de nœuds (pour la base de données distribuée). C'est la stratégie privilégiée pour une haute scalabilité et résilience.

### 2.2. Stratégies pour la Scalabilité de Mathildanesth

- **Architecture Backend Stateless** :
    - Concevoir les serveurs d'application (API) pour être "stateless" (sans état). L'état de la session utilisateur est géré côté client (ex: via JWT) ou dans un datastore centralisé (ex: Redis pour les sessions si nécessaire), permettant ainsi de distribuer les requêtes sur n'importe quelle instance du serveur d'application via un load balancer.
- **Load Balancing** :
    - Utiliser un load balancer pour répartir la charge des requêtes entrantes entre plusieurs instances du serveur d'application.
- **Scalabilité de la Base de Données** :
    - **Optimisation des Requêtes** : Des requêtes bien optimisées et des index judicieux sont la première étape (voir `01_Performance.md`).
    - **Read Replicas** : Pour les applications avec une forte charge de lecture, utiliser des réplicas en lecture de la base de données pour décharger la base de données primaire.
    - **Sharding (Partitionnement)** : Pour des volumes de données très importants, le sharding (distribution des données sur plusieurs bases de données) peut être envisagé, mais complexifie significativement l'architecture.
- **Services Asynchrones et Files d'Attente (Message Queues)** :
    - Pour les opérations longues ou gourmandes en ressources (ex: génération de planning, imports/exports massifs, envoi de notifications en masse), les déporter vers des workers asynchrones via une file d'attente (ex: BullMQ, RabbitMQ, Kafka). Cela permet de ne pas bloquer les requêtes synchrones et de scaler les workers indépendamment.
- **Infrastructure Cloud Native (si applicable)** :
    - Profiter des services managés des fournisseurs cloud (AWS, Azure, GCP) qui offrent des fonctionnalités de scalabilité automatique (auto-scaling groups, bases de données serverless/scalables).
- **Tests de Charge et de Performance Continus** :
    - Identifier les goulots d'étranglement et les limites de scalabilité par des tests de charge réguliers (voir `01_Performance.md`).
    - Monitorer les indicateurs de performance sous charge pour anticiper les besoins de scaling.

### 2.3. Scalabilité de l'Algorithme de Génération de Planning

- L'algorithme de génération de planning est un point sensible. Sa capacité à gérer un nombre croissant d'utilisateurs, de contraintes, et de périodes de planification sans dégradation prohibitive de performance est cruciale.
- Des optimisations algorithmiques, des stratégies de parallélisation (si possible), ou des approches de décomposition du problème peuvent être nécessaires pour assurer sa scalabilité.

Une architecture pensée pour la disponibilité et la scalabilité dès le départ permet à Mathildanesth de grandir avec les besoins de ses utilisateurs et de garantir un service fiable et performant. 