# Livrables et Considérations Non-Fonctionnelles

Ce document complète les spécifications fonctionnelles en détaillant les aspects non-fonctionnels cruciaux pour la qualité, la maintenabilité et la sécurité de l'application MATHILDA.

## 1. Logging

### 1.1 Stratégie de Logging

*   **Objectif :** Enregistrer les événements importants pour le débogage, l'audit et le monitoring.
*   **Format :** JSON structuré pour faciliter l'analyse et l'agrégation.
    *   Inclure systématiquement : timestamp, niveau de log (`info`, `warn`, `error`, `debug`), message, contexte (ID utilisateur, ID requête, module...). 
*   **Niveaux de Log :**
    *   `error` : Erreurs inattendues, pannes critiques.
    *   `warn` : Situations potentiellement problématiques mais non bloquantes.
    *   `info` : Événements importants du cycle de vie (démarrage serveur, déploiement, actions admin majeures).
    *   `debug` : Informations détaillées pour le débogage (activé uniquement en développement ou temporairement en production).
*   **Outil Backend :** Utiliser une librairie de logging robuste comme [Winston](https://github.com/winstonjs/winston) ou [Pino](https://github.com/pinojs/pino).
*   **Informations Sensibles :** NE JAMAIS logger d'informations sensibles en clair (mots de passe, tokens, données personnelles spécifiques).

### 1.2 Agrégation et Analyse

*   **Outil :** Utiliser un service d'agrégation centralisé (Logtail, Datadog Logs, Papertrail, ELK Stack...). 
*   **Conservation :** Définir une politique de rétention des logs (ex: 30 jours pour les logs applicatifs, plus longtemps pour les logs d'audit si requis).
*   **Alerting :** Configurer des alertes sur les patterns d'erreurs critiques ou les volumes anormaux de logs.

## 2. Sécurité

### 2.1 Authentification et Autorisation

*   **Authentification :** JWT via cookies HTTP-only sécurisés (confirmé dans API Design).
*   **Autorisation :** Basée sur les rôles (confirmé). Vérification systématique des droits au niveau des middlewares et des services backend.
*   **Gestion des Mots de Passe :** Hachage sécurisé (bcrypt) côté backend. JAMAIS stocker de mots de passe en clair.
*   **Protection CSRF :** Implémenter des mesures anti-CSRF (ex: tokens synchronizer) si utilisation de cookies pour la session.
*   **Gestion de Session :** Durée de vie limitée pour les tokens JWT, mécanisme de révocation/blacklist (optionnel mais recommandé).

### 2.2 Sécurité Web (Frontend & Backend)

*   **HTTPS :** Utilisation obligatoire (confirmé).
*   **Headers de Sécurité :**
    *   `Content-Security-Policy (CSP)` : Définir une politique stricte pour limiter les sources de contenu (scripts, styles, images).
    *   `Strict-Transport-Security (HSTS)` : Forcer l'utilisation de HTTPS.
    *   `X-Content-Type-Options: nosniff` : Empêcher le navigateur d'interpréter les fichiers différemment du Content-Type déclaré.
    *   `X-Frame-Options: DENY` ou `SAMEORIGIN` : Protéger contre le clickjacking.
    *   `Referrer-Policy: strict-origin-when-cross-origin` : Contrôler les informations envoyées dans le header Referer.
*   **Protection XSS :**
    *   Nettoyer systématiquement les entrées utilisateur côté serveur.
    *   Utiliser les mécanismes d'échappement des frameworks frontend (React le fait par défaut pour le contenu).
    *   Valider et nettoyer le HTML potentiellement généré par les utilisateurs (si fonction de rich text).
*   **Validation des Entrées :** Valider toutes les données (format, type, longueur) côté backend, même si une validation existe côté frontend.
*   **Gestion des Dépendances :**
    *   Scanner régulièrement avec `npm audit`.
    *   Utiliser des outils comme Snyk ou Dependabot pour une veille continue.

### 2.3 Gestion des Secrets

*   Utiliser les variables d'environnement gérées par la plateforme d'hébergement ou un service dédié (Vault, AWS Secrets Manager, etc.).
*   Ne jamais commiter de secrets dans le code source.

## 3. Monitoring et Alerting

### 3.1 Monitoring Applicatif (APM)

*   **Outil :** Sentry, Datadog, New Relic...
*   **Suivi des Erreurs :** Capturer et agréger les erreurs non interceptées du backend et du frontend.
*   **Suivi des Performances :**
    *   Backend : Temps de réponse moyen/percentiles des endpoints API, débit.
    *   Frontend : Temps de chargement (LCP, FCP), interactivité (FID, TBT), erreurs JavaScript.
*   **Distributed Tracing :** (Optionnel, si microservices) Suivre une requête à travers différents services.

### 3.2 Monitoring Système/Infrastructure

*   Utilisation CPU, RAM, disque, réseau des serveurs/conteneurs.
*   Santé et performance de la base de données (connexions, requêtes lentes).
*   Disponibilité des services (uptime checks).

### 3.3 Alerting

*   Configurer des alertes proactives sur :
    *   Taux d'erreur élevé (backend/frontend).
    *   Latence anormale des endpoints critiques.
    *   Utilisation excessive des ressources système (CPU > 90%, mémoire faible).
    *   Base de données indisponible ou lente.
    *   Échecs de tâches critiques (ex: génération de planning).
*   **Canaux d'Alerte :** Email, Slack, PagerDuty selon la criticité.

## 4. Performance

*   **Base de Données :**
    *   Indexation appropriée des colonnes fréquemment utilisées dans les requêtes `WHERE`, `JOIN`, `ORDER BY`.
    *   Optimisation des requêtes complexes (éviter N+1, utiliser `EXPLAIN ANALYZE`).
    *   Pooling de connexions.
*   **API Backend :**
    *   Mise en cache des données rarement modifiées.
    *   Pagination systématique des listes volumineuses.
    *   Utilisation de Dataloader pour éviter les requêtes dupliquées dans un même cycle requête/réponse.
*   **Frontend :**
    *   Optimisation des assets (images, polices).
    *   Code splitting / chargement paresseux (Lazy Loading) des composants/pages.
    *   Minimisation et compression (gzip/brotli) des bundles JS/CSS.
    *   Utilisation judicieuse du memoization (React.memo, useMemo, useCallback).
    *   Virtualisation pour les listes très longues.

*(Voir aussi `docs/01_Specifications_Fonctionnelles/10_Exigences_Non_Fonctionnelles.md` pour les objectifs spécifiques)* 