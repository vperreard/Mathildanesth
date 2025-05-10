# Gestion des Erreurs et Journalisation (Logging)

## Introduction

Une gestion robuste des erreurs et une journalisation (logging) complète sont cruciales pour la stabilité, la maintenabilité et le débogage de Mathildanesth. Ce document décrit les stratégies et outils employés.

## Gestion des Erreurs

### 1. Erreurs Côté Client (Frontend)

- **Composants d'Erreur React (Error Boundaries) :**
  - Utilisés pour capturer les erreurs JavaScript dans les composants React en aval de leur arborescence, afficher une UI de repli (fallback UI), et journaliser ces erreurs.
  - Next.js fournit des conventions pour les `error.tsx` au niveau des routes de l'App Router pour gérer les erreurs de rendu spécifiques à un segment.
- **Validation des Formulaires :**
  - La validation des entrées utilisateur (ex: avec Zod) avant la soumission permet de prévenir de nombreuses erreurs et de fournir un feedback immédiat à l'utilisateur.
- **Gestion des Erreurs d'API :**
  - Les appels API depuis le client (vers les API Routes Next.js ou des API externes) doivent gérer les réponses d'erreur (codes HTTP 4xx, 5xx).
  - Affichage de messages d'erreur conviviaux à l'utilisateur.
  - Utilisation de `toast` ou de notifications pour les erreurs non bloquantes.
- **Journalisation des Erreurs Client :**
  - Les erreurs client non capturées par les Error Boundaries ou les erreurs significatives doivent être envoyées à un service de journalisation externe (voir section Logging).

### 2. Erreurs Côté Serveur (Backend - API Routes, Server Actions, Services)

- **Validation des Entrées :**
  - Les API Routes et les Server Actions doivent valider toutes les données entrantes (payloads, paramètres d'URL) en utilisant Zod ou des mécanismes similaires.
  - Retourner des réponses HTTP 400 (Bad Request) avec des messages clairs en cas d'échec de validation.
- **Gestion Centralisée des Erreurs :**
  - Un middleware ou un gestionnaire d'erreurs global pour les API Routes peut intercepter les erreurs non gérées, les journaliser, et retourner une réponse HTTP 500 (Internal Server Error) standardisée.
- **Erreurs Spécifiques aux Services Métier :**
  - Les services métier peuvent lever des exceptions personnalisées pour indiquer des erreurs spécifiques (ex: `RuleConflictError`, `UserNotFoundError`).
  - Ces exceptions sont capturées par les API Routes ou les Server Actions et traduites en réponses HTTP appropriées.
- **Transactions de Base de Données :**
  - Utilisation de transactions Prisma (`prisma.$transaction`) pour les opérations qui doivent être atomiques. En cas d'erreur, la transaction est annulée (rollback) pour maintenir la cohérence des données.

## Journalisation (Logging)

### 1. Objectifs de la Journalisation

- **Débogage :** Tracer le flux d'exécution, les valeurs des variables clés pour aider à diagnostiquer les problèmes.
- **Monitoring :** Suivre l'état de santé de l'application, détecter les anomalies et les pics d'erreurs.
- **Audit :** Enregistrer les actions sensibles pour des raisons de sécurité et de conformité (voir `../02_Fonctionnalites/16_Historisation_Audit/01_Journal_Activite_Historique.md`).
- **Analyse de Performance :** Mesurer le temps d'exécution de certaines opérations critiques.

### 2. Niveaux de Journalisation

Utilisation des niveaux de log standards :

- **`DEBUG` :** Informations détaillées utiles uniquement pour le débogage (ex: valeurs de variables, étapes d'un algorithme).
- **`INFO` :** Événements normaux de l'application (ex: démarrage d'un service, traitement d'une requête utilisateur, action réussie).
- **`WARN` :** Situations potentiellement problématiques qui ne sont pas encore des erreurs critiques (ex: tentative de connexion échouée, utilisation d'une API dépréciée).
- **`ERROR` :** Erreurs qui ont empêché le bon déroulement d'une opération (ex: exception non capturée, échec d'une interaction avec un service externe).
- **`FATAL` :** Erreurs très graves qui nécessitent l'arrêt de l'application (rare dans une application web).

### 3. Ce qui est Journalisé

- **Requêtes HTTP (API Routes) :** Méthode, URL, code de statut de la réponse, durée, IP source (si pertinent et conforme RGPD).
- **Erreurs :** Toutes les erreurs capturées côté client et serveur, avec leur stack trace, le contexte (utilisateur, données en jeu).
- **Événements Métier Importants :** Ex: création d'un planning, validation d'un congé, connexion d'un utilisateur.
- **Appels aux Services Externes :** Succès, échec, durée.

### 4. Outils de Journalisation

- **Développement Local :**
  - `console.log`, `console.error`, etc., pour un retour rapide.
  - La sortie de Next.js dans le terminal.
- **Production :**
  - **Bibliothèques de Logging Structuré :** [Pino](https://getpino.io/), [Winston](https://github.com/winstonjs/winston) pour Node.js. Elles permettent de formater les logs en JSON pour une meilleure exploitabilité.
  - **Services de Journalisation Externe/Plateformes d'Observabilité :**
    - [Sentry](https://sentry.io/) (pour le suivi des erreurs frontend et backend).
    - [Logtail](https://logtail.com/) (maintenant Better Stack), [Datadog](https://www.datadoghq.com/), [New Relic](https://newrelic.com/), [Axiom](https://axiom.co/).
    - Solutions cloud natives (ex: AWS CloudWatch Logs, Google Cloud Logging).
  - Ces services offrent des fonctionnalités avancées : agrégation, recherche, alertes sur les logs, tableaux de bord.
  - La roadmap de `mathildanesth` mentionne l'utilisation de Sentry.

### 5. Format des Logs

- **Logs Structurés (JSON) :** Préféré en production pour faciliter le parsage, la recherche et l'analyse automatisée.
- **Informations Clés par Log :**
  - Timestamp (date et heure exactes).
  - Niveau de log (INFO, ERROR, etc.).
  - Message descriptif.
  - Contexte (ex: `userId`, `requestId`, `serviceName`, `functionName`).
  - Stack trace pour les erreurs.
  - Données structurées additionnelles (payload de la requête, etc.).

### 6. Configuration

- Le niveau de log doit être configurable (ex: via des variables d'environnement) pour pouvoir augmenter la verbosité en débogage et la réduire en production normale.
- Configuration des "transports" (où les logs sont envoyés : console, fichier, service externe).

## Conclusion

Une stratégie de gestion des erreurs et de journalisation bien définie est un investissement essentiel. Elle permet de construire une application plus fiable, plus facile à maintenir et à faire évoluer. L'utilisation d'outils comme Sentry et des bibliothèques de logging structuré est une bonne pratique.
