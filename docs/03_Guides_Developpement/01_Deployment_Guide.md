# Guide de Déploiement et Production

Ce document décrit les considérations et étapes pour déployer et maintenir l'application MATHILDA en production.

## 1. Choix de l'Infrastructure

Le choix de la plateforme d'hébergement dépendra des contraintes (budget, compétences, scalabilité requise). Options courantes :

*   **Platform as a Service (PaaS) :**
    *   [Heroku](https://www.heroku.com/)
    *   [Scalingo](https://scalingo.com/)
    *   [Render](https://render.com/)
    *   **Avantages :** Simplicité de déploiement, gestion de l'infrastructure sous-jacente.
    *   **Inconvénients :** Moins de contrôle, coût potentiellement plus élevé à grande échelle.
*   **Infrastructure as a Service (IaaS) / Cloud Providers :**
    *   AWS (EC2, Fargate, RDS)
    *   Google Cloud (Compute Engine, Cloud Run, Cloud SQL)
    *   Azure (Virtual Machines, App Service, Azure Database for PostgreSQL)
    *   **Avantages :** Flexibilité totale, optimisation des coûts possible.
    *   **Inconvénients :** Complexité de configuration et de gestion accrue.
*   **Auto-hébergement :**
    *   Sur des serveurs dédiés ou virtuels gérés en interne.
    *   **Avantages :** Contrôle maximal.
    *   **Inconvénients :** Nécessite une expertise significative en administration système et sécurité.

**Recommandation initiale :** Commencer avec un PaaS (ex: Heroku, Render) pour simplifier le démarrage, puis envisager une migration vers IaaS si nécessaire.

## 2. Configuration de l'Environnement de Production

*   **Variables d'Environnement :**
    *   NE JAMAIS commiter de secrets (clés API, mots de passe BDD, secret JWT) dans le code.
    *   Utiliser un fichier `.env.production` (ajouté au `.gitignore`) ou la gestion des variables d'environnement de la plateforme d'hébergement.
    *   Variables clés : `NODE_ENV=production`, `DATABASE_URL` (pointant vers la BDD de prod), `JWT_SECRET`, `API_BASE_URL` (pour le frontend), etc.
*   **Base de Données :**
    *   Utiliser une instance PostgreSQL managée (ex: Heroku Postgres, AWS RDS, Google Cloud SQL).
    *   Configurer des backups réguliers et automatiques.
    *   Sécuriser l'accès (identifiants forts, restrictions IP si possible).
*   **Build de Production :**
    *   Configurer les scripts `build` dans `package.json` pour optimiser le code (minification, etc.).
    *   Le backend (Node.js) doit être compilé en JavaScript.
    *   Le frontend (React) doit être buildé en fichiers statiques optimisés.

## 3. Processus de Déploiement

*   **Automatisation (CI/CD) :**
    *   Utiliser **GitHub Actions** (défini dans `.github/workflows/`) pour automatiser le processus.
    *   Workflow typique pour la branche `main` (déploiement) :
        1.  Checkout
        2.  Tests (unitaires, intégration)
        3.  Build des applications (backend, frontend)
        4.  (Optionnel) Push de l'image Docker vers un registre (ex: Docker Hub, GHCR)
        5.  Déploiement sur la plateforme cible (ex: via CLI Heroku, gcloud, Azure CLI, ou action spécifique GitHub Actions)
        6.  Exécution des migrations de base de données (`npx prisma migrate deploy` exécuté sur le serveur/conteneur après déploiement)
*   **Stratégies de Déploiement :**
    *   **Blue/Green :** Maintenir deux environnements identiques, basculer le trafic après validation.
    *   **Canary :** Déployer sur un petit sous-ensemble d'utilisateurs avant un déploiement complet.
    *   **Rolling Update :** Mettre à jour les instances progressivement (si plusieurs instances).
    *   Commencer par un déploiement simple, puis adopter une stratégie plus avancée si nécessaire.
*   **Rollback :** Prévoir une procédure pour revenir rapidement à la version précédente en cas de problème majeur après un déploiement.

## 4. Monitoring et Logs

*   **Monitoring Applicatif (APM) :**
    *   Utiliser des outils comme [Sentry](https://sentry.io/), [Datadog](https://www.datadoghq.com/), [New Relic](https://newrelic.com/) pour :
        *   Suivre les erreurs backend et frontend en temps réel.
        *   Mesurer les performances (temps de réponse API, chargement frontend).
        *   Configurer des alertes sur les taux d'erreur ou les seuils de performance.
*   **Logging :**
    *   Configurer le backend pour logger les informations importantes (requêtes, erreurs critiques) dans un format structuré (JSON).
    *   Utiliser un service d'agrégation de logs (ex: Logtail, Datadog Logs, Papertrail) pour centraliser et rechercher dans les logs.
    *   Définir des niveaux de logs (`info`, `warn`, `error`) et configurer le niveau approprié en production.
*   **Monitoring Infrastructure :**
    *   Surveiller l'utilisation CPU, mémoire, disque, réseau des serveurs/conteneurs.
    *   Surveiller la santé et les performances de la base de données.

## 5. Sécurité

*   **HTTPS :** Configurer TLS/SSL pour sécuriser toutes les communications.
*   **Dépendances :** Scanner régulièrement les dépendances (`npm audit`) et les mettre à jour.
*   **Headers de Sécurité :** Configurer les headers HTTP appropriés (CSP, HSTS, X-Frame-Options, X-Content-Type-Options).
*   **Validation des Entrées :** Valider et nettoyer toutes les données provenant des utilisateurs côté backend.
*   **Gestion des Secrets :** Utiliser un gestionnaire de secrets si nécessaire (ex: HashiCorp Vault, AWS Secrets Manager).
*   **Audits de Sécurité :** Envisager des audits réguliers si l'application gère des données sensibles.

## 6. Backups et Récupération

*   **Base de Données :** Configurer des backups automatiques et réguliers (au moins quotidiens).
*   **Tester la Restauration :** Effectuer des tests périodiques de restauration des backups pour s'assurer de leur validité.
*   **Plan de Reprise d'Activité (PRA) :** Définir une procédure en cas de sinistre majeur. 