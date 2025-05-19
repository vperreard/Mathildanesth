# Logging, Monitoring et Alerting

La mise en place d'une stratégie robuste de logging, de monitoring et d'alerting est cruciale pour assurer la stabilité, la performance, la sécurité et la maintenabilité de Mathildanesth.

## 1. Logging

### 1.1. Stratégie de Logging

- **Objectif** : Enregistrer les événements système importants pour le débogage, l'analyse des performances, l'audit de sécurité et la compréhension du comportement de l'application.
- **Format des Logs** : Utiliser un format **JSON structuré** pour tous les logs applicatifs. Cela facilite leur parsing, leur agrégation et leur analyse par des outils centralisés.
    - **Champs Standards à Inclure** : `timestamp`, `level` (niveau de log), `message`, `service` (nom du module/service), `requestId` (pour tracer une requête à travers les services), `userId` (si applicable et authentifié), `errorStack` (pour les erreurs), et tout autre contexte pertinent (ex: `entityId`, `entityType`, `durationMs`).
- **Niveaux de Log** : Utiliser des niveaux de log standards pour classifier l'importance et la nature des messages :
    - `ERROR` : Erreurs critiques et inattendues qui empêchent une fonctionnalité de s'exécuter correctement ou indiquent une instabilité.
    - `WARN` : Situations potentiellement problématiques ou exceptions attendues mais non critiques (ex: échec de validation métier, tentative d'accès non autorisé bloquée).
    - `INFO` : Événements importants du cycle de vie de l'application ou des requêtes (ex: démarrage/arrêt du serveur, déploiement réussi, création d'une entité majeure, exécution d'une tâche en arrière-plan).
    - `DEBUG` : Informations détaillées utiles uniquement pour le débogage. Ces logs doivent être désactivables en production par défaut et activables dynamiquement si besoin.
- **Outils de Logging Backend (Node.js/NestJS)** :
    - Privilégier des bibliothèques de logging performantes et configurables comme **Pino** (recommandé pour sa performance) ou Winston.
    - Configurer le logger pour qu'il écrive sur `stdout/stderr` (pratique standard pour les environnements conteneurisés), et potentiellement vers des fichiers en développement.
- **Informations Sensibles** : **NE JAMAIS logger d'informations sensibles en clair** dans les logs applicatifs (ex: mots de passe, tokens d'API complets, détails de cartes de crédit, contenu de champs très personnels). Si des identifiants ou des fragments d'information doivent être loggés pour le débogage, ils doivent être masqués ou tronqués.
- **Logging Frontend** : Les erreurs JavaScript non interceptées et les événements importants du frontend peuvent également être envoyés à un service de collecte d'erreurs (voir section Monitoring).

### 1.2. Agrégation et Analyse Centralisée des Logs

- **Objectif** : Centraliser les logs de toutes les instances de l'application et de l'infrastructure pour faciliter la recherche, l'analyse et la corrélation des événements.
- **Outils** : Envisager l'utilisation de services d'agrégation de logs tels que :
    - Solutions managées : Datadog Logs, Logtail (Better Stack), Sentry (pour les erreurs avec contexte), Papertrail, AWS CloudWatch Logs, Google Cloud Logging.
    - Solutions auto-hébergées : Stack ELK (Elasticsearch, Logstash, Kibana) ou Grafana Loki.
- **Politique de Rétention** : Définir une politique de rétention des logs en fonction des besoins de conformité, de débogage et des coûts de stockage (ex: 7 jours pour les logs DEBUG, 30-90 jours pour INFO/WARN, 1 an ou plus pour ERROR et les logs d'audit).

## 2. Monitoring

### 2.1. Monitoring Applicatif (APM - Application Performance Monitoring)

- **Objectif** : Suivre en temps réel la santé, les performances et le comportement de l'application Mathildanesth.
- **Outils APM** : Sentry (excellent pour le suivi des erreurs frontend et backend), Datadog APM, New Relic, Dynatrace, ou des solutions open-source combinées (Prometheus, Grafana, Jaeger pour le tracing).
- **Indicateurs Clés à Suivre (Backend)** :
    - **Taux d'erreur** des APIs (par endpoint, global).
    - **Latence des APIs** (temps de réponse moyen, P50, P90, P95, P99).
    - **Débit des APIs** (nombre de requêtes par minute/seconde).
    - **Saturation et Utilisation des Workers/Threads**.
    - **Performance des tâches en arrière-plan** (durée, taux d'échec).
- **Indicateurs Clés à Suivre (Frontend)** :
    - **Core Web Vitals** : Largest Contentful Paint (LCP), First Input Delay (FID remplacé par Interaction to Next Paint - INP), Cumulative Layout Shift (CLS).
    - **Erreurs JavaScript** non interceptées.
    - **Temps de chargement des pages**.
    - **Performance des appels API initiés par le client**.
- **Distributed Tracing** : Si l'architecture évolue vers des microservices, implémenter le tracing distribué pour suivre une requête à travers les différents services et identifier les goulots d'étranglement.

### 2.2. Monitoring Système et Infrastructure

- **Objectif** : Surveiller la santé des serveurs, conteneurs, bases de données et autres composants d'infrastructure.
- **Indicateurs Clés à Suivre** :
    - **Utilisation des ressources serveur** : CPU, mémoire vive (RAM), espace disque, I/O disque, utilisation réseau.
    - **Santé de la base de données** : Connexions actives, requêtes lentes, utilisation CPU/mémoire, espace disque, réplication (si applicable).
    - **Disponibilité des services (Uptime)** : Vérifications externes (ping, requêtes HTTP) pour s'assurer que l'application est accessible.
    - **État des conteneurs et orchestrateurs** (si Docker/Kubernetes est utilisé).

## 3. Alerting

- **Objectif** : Être notifié pro-activement des problèmes critiques ou des dégradations de performance avant qu'ils n'impactent significativement les utilisateurs.
- **Stratégie d'Alerting** :
    - **Alertes Basées sur des Seuils** : Déclencher des alertes lorsque des métriques clés dépassent des seuils prédéfinis (ex: taux d'erreur API > 5% pendant 5 minutes, latence P95 > 1 seconde, CPU > 90% pendant 10 minutes).
    - **Alertes sur les Erreurs Critiques** : Notification immédiate pour les nouvelles erreurs graves ou les pics d'erreurs.
    - **Alertes de Disponibilité** : Si l'application devient inaccessible.
    - **Alertes sur les Tâches en Arrière-Plan** : Échecs répétés d'une tâche critique (ex: génération de planning, envoi de notifications importantes).
- **Niveaux de Criticité des Alertes** : Différencier les alertes (ex: P1 pour critique/immédiat, P2 pour avertissement/urgent, P3 pour informationnel).
- **Canaux de Notification** : Configurer les notifications d'alerte via des canaux appropriés en fonction de la criticité :
    - Email.
    - Messagerie instantanée (Slack, Microsoft Teams).
    - Systèmes d'astreinte (PagerDuty, Opsgenie) pour les alertes critiques nécessitant une intervention immédiate.
- **Réduction du Bruit** : Affiner les seuils et les conditions d'alerte pour éviter la fatigue due à un excès de fausses alertes ou d'alertes non actionnables. Mettre en place des délais ou des agrégations avant de déclencher.
- **Tableaux de Bord de Monitoring** : Visualiser les métriques clés et l'état des alertes sur des dashboards dédiés (ex: avec Grafana, Kibana, ou les outils APM/logging).

Une infrastructure de logging, monitoring et alerting bien conçue est indispensable pour opérer Mathildanesth de manière fiable, identifier rapidement les problèmes, comprendre leur cause racine, et assurer une haute qualité de service. 