# Sécurité Applicative

La sécurité est une préoccupation majeure pour Mathildanesth, manipulant des données sensibles relatives au personnel et à l'organisation des soins. Ce document décrit les principes et mesures de sécurité mis en œuvre.

## 1. Authentification et Autorisation

- **Authentification Robuste** :
    - Utilisation de **NextAuth.js** pour la gestion de l'authentification, supportant divers fournisseurs (Credentials, OAuth potentiellement).
    - Les mots de passe utilisateurs sont stockés de manière sécurisée en base de données en utilisant des algorithmes de **hachage forts** (ex: bcrypt ou Argon2, à vérifier dans l'implémentation de NextAuth et du modèle `User`). JAMAIS stocker de mots de passe en clair.
    - Les sessions sont gérées via des **JSON Web Tokens (JWT)**, transmis via des **cookies HTTP-only et sécurisés (Secure, SameSite)** pour prévenir les accès non autorisés et les attaques XSS sur les tokens.
    - **Gestion de Session** : Les JWTs ont une durée de vie limitée. Un mécanisme de rafraîchissement de token (refresh token) peut être utilisé pour maintenir la session sans redemander les identifiants trop fréquemment. La révocation de session (ex: via une blacklist de tokens) est une mesure de sécurité avancée à considérer.
- **Autorisation Basée sur les Rôles (RBAC)** :
    - Chaque utilisateur est associé à un ou plusieurs rôles (ex: `USER`, `PLANNER`, `ADMIN`, `VIEWER_BLOC`).
    - Les permissions d'accès aux fonctionnalités et aux données sont strictement contrôlées en fonction de ces rôles.
    - Les vérifications d'autorisation sont effectuées systématiquement côté backend (dans les middlewares d'API et au niveau des services) avant toute action ou accès à des données sensibles.
- **Protection contre les Attaques d'Authentification** :
    - Limites de taux (rate limiting) sur les tentatives de connexion pour prévenir les attaques par force brute.
    - Politique de mots de passe robustes (longueur, complexité) encouragée ou imposée.

## 2. Sécurité des Communications et des Données

- **HTTPS Obligatoire** : Toutes les communications entre le client (navigateur) et le serveur sont chiffrées via HTTPS/TLS pour protéger la confidentialité et l'intégrité des données en transit.
- **Headers de Sécurité HTTP** : Implémentation des headers HTTP suivants pour renforcer la sécurité du client :
    - `Content-Security-Policy (CSP)` : Définir une politique restrictive pour limiter les sources de contenu (scripts, styles, images, iframes, etc.) et prévenir les attaques XSS.
    - `Strict-Transport-Security (HSTS)` : Instruire les navigateurs de communiquer uniquement via HTTPS pour le domaine, après la première visite.
    - `X-Content-Type-Options: nosniff` : Empêcher le navigateur d'interpréter les fichiers avec un type MIME différent de celui déclaré par le serveur.
    - `X-Frame-Options: DENY` ou `SAMEORIGIN` : Protéger contre les attaques de type clickjacking.
    - `Referrer-Policy: strict-origin-when-cross-origin` ou `same-origin` : Contrôler la quantité d'informations de référent envoyées lors de la navigation.
- **Protection des Données au Repos** : Si la base de données contient des informations extrêmement sensibles, envisager des mesures de chiffrement au niveau de la base de données ou du système de fichiers (généralement géré par le fournisseur de services cloud ou l'administrateur système).

## 3. Prévention des Vulnérabilités Applicatives Courantes

- **Cross-Site Scripting (XSS)** :
    - **Frontend (React)** : React échappe par défaut les données insérées dans le JSX, offrant une protection de base. Être vigilant lors de l'utilisation de `dangerouslySetInnerHTML`.
    - **Backend** : Valider et nettoyer systématiquement toutes les données provenant des utilisateurs avant de les stocker ou de les réafficher. Utiliser des bibliothèques de sanitization si du HTML riche est permis.
- **Cross-Site Request Forgery (CSRF)** :
    - Utilisation de techniques anti-CSRF telles que les tokens synchronizer (double soumission de cookie) ou la vérification de l'en-tête `Origin`/`Referer` pour les requêtes modifiant l'état. NextAuth.js intègre des protections CSRF.
- **Injection SQL (et autres injections)** :
    - L'utilisation d'un ORM comme **Prisma** paramètre les requêtes par défaut, ce qui constitue la principale défense contre les injections SQL.
    - Valider et typer fortement toutes les entrées utilisateur.
- **Validation des Entrées** : Toutes les données soumises par les utilisateurs (formulaires, paramètres d'URL, corps de requête API) doivent être rigoureusement validées côté backend (type, format, longueur, plage de valeurs) avant d'être traitées, même si une validation existe déjà côté frontend.
- **Gestion des Dépendances** :
    - Effectuer des audits réguliers des dépendances du projet (ex: `npm audit`, `yarn audit`).
    - Utiliser des outils de veille et de gestion des vulnérabilités des dépendances (ex: Snyk, Dependabot) pour être informé des failles connues et les corriger rapidement.

## 4. Gestion des Secrets

- **Configuration Sécurisée** : Les clés d'API, les secrets de base de données, les clés de signature JWT, et autres informations sensibles ne doivent JAMAIS être codés en dur dans le code source ou commités dans le dépôt Git.
- **Variables d'Environnement** : Utiliser des variables d'environnement pour gérer ces secrets, idéalement injectées au moment du build ou du runtime par la plateforme d'hébergement (ex: Vercel, Docker Swarm/Kubernetes secrets, HashiCorp Vault, AWS Secrets Manager).
- **Fichiers `.env`** : Si des fichiers `.env` sont utilisés en développement, s'assurer qu'ils sont listés dans `.gitignore` et ne sont pas versionnés.

## 5. Journalisation et Audit de Sécurité

- **Journal d'Audit (`AuditLog`)** : Enregistrer les actions sensibles (connexions, modifications de données critiques, changements de permissions, etc.) comme décrit dans la section `02_Fonctionnalites/16_Historisation_Audit/01_Journal_Activite_Historique.md`.
- **Logs d'Accès et d'Erreurs** : Configurer une journalisation adéquate des requêtes API (avec anonymisation des données sensibles) et des erreurs serveur pour faciliter la détection d'activités suspectes ou de tentatives d'attaque.

## 6. Audits de Sécurité et Tests d'Intrusion

- **Révisions de Code Axées Sécurité** : Intégrer des considérations de sécurité dans le processus de revue de code.
- **Tests d'Intrusion (Optionnel/Recommandé)** : Pour les applications critiques, envisager des tests d'intrusion périodiques par des experts externes pour identifier les vulnérabilités.

Une approche de "défense en profondeur", où plusieurs couches de sécurité sont mises en place, est essentielle pour protéger Mathildanesth et ses utilisateurs. 