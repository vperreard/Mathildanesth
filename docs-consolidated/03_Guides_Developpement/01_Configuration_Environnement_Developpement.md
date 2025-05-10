# Configuration de l'Environnement de Développement

## Introduction

Ce guide décrit les étapes nécessaires pour configurer votre environnement de développement local afin de travailler sur Mathildanesth.

## Prérequis Logiciels

Assurez-vous d'avoir les logiciels suivants installés sur votre machine :

- **Node.js** : Version LTS recommandée (ex: v18.x ou v20.x). Vous pouvez utiliser [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) pour gérer plusieurs versions de Node.js.
- **npm** ou **yarn** : Gestionnaire de paquets Node.js (le projet utilise `npm` comme indiqué par `package-lock.json`, mais `yarn` peut aussi fonctionner).
- **Docker** et **Docker Compose** : Pour exécuter les services externes comme la base de données PostgreSQL, MongoDB et Redis.
- **Git** : Pour la gestion de version du code.
- Un **éditeur de code** : [Visual Studio Code](https://code.visualstudio.com/) est recommandé, avec les extensions suivantes :
  - ESLint
  - Prettier - Code formatter
  - Tailwind CSS IntelliSense
  - Prisma

## Étapes de Configuration

1.  **Cloner le Dépôt :**

    ```bash
    git clone <URL_DU_DEPOT_GIT>
    cd mathildanesth
    ```

2.  **Installer les Dépendances du Projet :**

    ```bash
    npm install
    # ou si vous préférez yarn
    # yarn install
    ```

3.  **Configurer les Variables d'Environnement :**
    Créez un fichier `.env.local` à la racine du projet. Ce fichier n'est pas versionné et contiendra vos configurations locales.
    Inspirez-vous de la structure d'un fichier `.env.example` s'il existe, ou utilisez les variables suivantes comme base :

    ```env
    # Base de données PostgreSQL (utilisée par Prisma)
    DATABASE_URL="postgresql://mathildanesth_user:mathildanesth_password@localhost:5433/mathildanesth_db"

    # Base de données MongoDB (si utilisée pour certaines fonctionnalités)
    MONGODB_URI="mongodb://localhost:27017/mathildanesth"

    # Redis (si utilisé pour le cache, les sessions, ou les files d'attente)
    REDIS_URL="redis://localhost:6379"

    # Configuration NextAuth.js
    NEXTAUTH_URL="http://localhost:3000" # URL de votre application en développement
    NEXTAUTH_SECRET="VOTRE_SECRET_NEXTAUTH_ALEATOIRE_ET_ROBUSTE" # Générez une chaîne aléatoire

    # Autres variables spécifiques à l'application (ajoutez au besoin)
    # Exemple: API_BASE_URL="http://localhost:3000/api"
    # LOG_LEVEL="debug"
    ```

    **Important :** Pour `NEXTAUTH_SECRET`, générez une chaîne de caractères aléatoire forte (par exemple, via `openssl rand -base64 32`).

4.  **Démarrer les Services Externes avec Docker :**
    Le fichier `docker-compose.yml` à la racine du projet définit les services PostgreSQL, MongoDB et Redis.

    ```bash
    docker-compose up -d
    ```

    Cette commande va télécharger les images nécessaires (si ce n'est pas déjà fait) et démarrer les conteneurs en arrière-plan.

    - PostgreSQL sera accessible sur le port `5433`.
    - MongoDB sera accessible sur le port `27017`.
    - Redis sera accessible sur le port `6379`.

    Pour arrêter les services :

    ```bash
    docker-compose down
    ```

5.  **Appliquer les Migrations de Base de Données (Prisma) :**
    Une fois la base de données PostgreSQL démarrée, appliquez les migrations pour créer le schéma :

    ```bash
    npx prisma migrate dev
    ```

    Cette commande va :

    - Appliquer les migrations existantes.
    - Créer la base de données si elle n'existe pas (selon la configuration).
    - Générer le client Prisma (`@prisma/client`).

6.  **Initialiser les Données de Seed (Facultatif mais recommandé) :**
    Le projet dispose de scripts pour peupler la base de données avec des données initiales.
    Consultez la documentation sur les scripts de seed (`scripts/` ou `prisma/seed.js` / `prisma/seed.cjs`) pour les commandes exactes. Typiquement :

    ```bash
    npm run db:seed # Pour les données Prisma/PostgreSQL
    # ou/et
    npm run seed    # Pour d'autres types de données (ex: MongoDB, si un script dédié existe)
    ```

    Les scripts exacts et leur contenu sont documentés dans `docs/technique/NEXT_STEPS.md` (section "Résolution des problèmes de seed").

7.  **Lancer l'Application en Mode Développement :**
    ```bash
    npm run dev
    ```
    L'application devrait maintenant être accessible à l'adresse [http://localhost:3000](http://localhost:3000). Le serveur de développement se rechargera automatiquement lors de la modification des fichiers.

## Vérification de l'Installation

- Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur. Vous devriez voir la page d'accueil de Mathildanesth.
- Essayez de vous connecter ou de créer un compte (si la fonctionnalité est disponible et que les seeds ont créé des utilisateurs/types de congés).
- Vérifiez les logs dans votre terminal pour d'éventuelles erreurs.

## Dépannage Courant

- **Erreurs `ECONNREFUSED` pour la base de données/Redis/MongoDB :** Assurez-vous que les conteneurs Docker sont bien démarrés (`docker ps`) et que les ports ne sont pas bloqués par un pare-feu ou utilisés par une autre application. Vérifiez que les URLs dans `.env.local` correspondent aux ports configurés dans `docker-compose.yml`.
- **Problèmes avec Prisma :**
  - Assurez-vous que le client Prisma est généré (`npx prisma generate`) après chaque modification du `schema.prisma`.
  - Si vous avez des erreurs de migration, essayez `npx prisma migrate reset` (attention, cela supprime les données de la base de développement).
- **Problèmes avec NextAuth.js :** Vérifiez `NEXTAUTH_URL` et `NEXTAUTH_SECRET` dans `.env.local`. Consultez les logs pour des messages d'erreur spécifiques de NextAuth.js.

Ce guide devrait vous permettre de démarrer avec le développement de Mathildanesth. Reportez-vous aux autres guides de cette section pour plus de détails sur la structure du code, les tests, et les contributions.
