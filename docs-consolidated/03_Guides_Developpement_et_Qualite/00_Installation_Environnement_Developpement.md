# Guide d'Installation et Configuration de l'Environnement de Développement

Ce guide décrit les étapes nécessaires pour mettre en place un environnement de développement local pour Mathildanesth.

## 1. Prérequis

Avant de commencer, assurez-vous d'avoir les outils suivants installés sur votre système :

-   **Node.js** : Version `22.11.0` (recommandé). Utilisez un gestionnaire de versions Node comme [nvm](https://github.com/nvm-sh/nvm) pour installer et gérer facilement les versions de Node.js.
    -   Si vous utilisez `nvm`, vous pouvez exécuter `nvm install` ou `nvm use` à la racine du projet pour utiliser la version spécifiée dans le fichier `.nvmrc`.
-   **npm** (Node Package Manager) ou **Yarn** : npm est généralement inclus avec Node.js. Si vous préférez Yarn, assurez-vous qu'il est installé.
-   **Git** : Pour cloner le dépôt et gérer les versions du code.
-   **Docker** et **Docker Compose** (Fortement Recommandé) : Pour gérer la base de données PostgreSQL et potentiellement d'autres services (ex: Redis pour les sessions ou BullMQ si utilisé).
    -   Le projet contient un fichier `docker-compose.yml` pour faciliter la mise en place de la base de données.
-   **IDE/Éditeur de Code** : Visual Studio Code est recommandé, avec les extensions suivantes :
    -   ESLint
    -   Prettier - Code formatter
    -   Prisma
    -   Tailwind CSS IntelliSense (si Tailwind est utilisé pour le style)

## 2. Configuration Initiale

### 2.1. Cloner le Dépôt

```bash
git clone [URL_DU_DEPOT_GIT_MATHILDANESTH]
cd mathildanesth
```

### 2.2. Installer les Dépendances

Placez-vous à la racine du projet cloné et exécutez :

```bash
npm install
# ou si vous utilisez yarn
# yarn install
```

### 2.3. Configuration de l'Environnement

1.  **Fichier d'environnement** : Copiez le fichier d'exemple `.env.example` vers un nouveau fichier nommé `.env` (ou `.env.local` pour Next.js) à la racine du projet.

    ```bash
    cp .env.example .env
    # ou
    cp .env.example .env.local
    ```

2.  **Variables d'environnement** : Ouvrez le fichier `.env` (ou `.env.local`) et configurez les variables nécessaires, notamment :
    -   `DATABASE_URL` : L'URL de connexion à votre base de données PostgreSQL. Si vous utilisez le `docker-compose.yml` fourni, elle ressemblera à `postgresql://mathildanesth_user:mathildanesth_password@localhost:5432/mathildanesth_db` (vérifiez les noms d'utilisateur, mot de passe, port et nom de base de données dans `docker-compose.yml`).
    -   `NEXTAUTH_URL` : L'URL de base de votre application en développement (ex: `http://localhost:3000`).
    -   `NEXTAUTH_SECRET` : Une chaîne aléatoire secrète pour NextAuth.js. Vous pouvez en générer une avec `openssl rand -base64 32`.
    -   Autres clés d'API ou secrets si nécessaires pour des services externes.

## 3. Mise en Place de la Base de Données

### 3.1. Lancer la Base de Données avec Docker

Si vous utilisez Docker, à la racine du projet :

```bash
docker-compose up -d
```

Cela lancera un conteneur PostgreSQL avec la configuration définie dans `docker-compose.yml`.

### 3.2. Appliquer les Migrations Prisma

Une fois la base de données en cours d'exécution et votre `DATABASE_URL` correctement configurée dans `.env` (ou `.env.local`), appliquez les migrations Prisma pour créer le schéma de la base de données :

```bash
npm run prisma:migrate:dev
# ou
# npx prisma migrate dev
```

L'option `--name init` peut être nécessaire pour la première migration si elle n'est pas déjà nommée.

### 3.3. Initialiser les Données (Seed)

Le projet peut contenir des scripts pour initialiser la base de données avec des données de base (rôles, types d'activités, utilisateurs de test, etc.). Consultez le `package.json` pour les scripts de "seed" disponibles (ex: `npm run seed`, `npm run db:seed`, `npm run prisma:seed`).

Par exemple :
```bash
npm run prisma:seed
# ou le script spécifique s'il existe, par exemple :
# npm run seed
```
Ce script utilise `tsx prisma/seed.ts` d'après le `package.json`.

## 4. Lancer l'Application en Développement

Une fois tout configuré, vous pouvez lancer le serveur de développement Next.js :

```bash
npm run dev
```

L'application devrait maintenant être accessible à l'adresse `http://localhost:3000` (ou le port que vous avez configuré).

## 5. Outils et Commandes Utiles

Consultez le fichier `package.json` pour une liste complète des scripts disponibles. Voici quelques commandes courantes :

-   `npm run lint` : Pour vérifier la qualité du code avec ESLint.
-   `npm run format` : Pour formater le code avec Prettier.
-   `npm run test` : Pour lancer la suite de tests unitaires et d'intégration avec Jest.
-   `npm run cypress:open` : Pour ouvrir l'interface de test Cypress pour les tests E2E.
-   `npx prisma studio` : Pour ouvrir Prisma Studio, une interface web pour visualiser et manipuler votre base de données.

## 6. Dépannage Courant

-   **Problèmes de connexion à la base de données** : Vérifiez que votre conteneur Docker PostgreSQL est bien en cours d'exécution, que la variable `DATABASE_URL` est correcte et que les identifiants correspondent à ceux du `docker-compose.yml`.
-   **Erreurs de dépendances** : Essayez de supprimer `node_modules` et `package-lock.json` (ou `yarn.lock`) et de réinstaller les dépendances avec `npm install` (ou `yarn install`).
-   **Problèmes avec Prisma** : Assurez-vous que Prisma Client est généré après chaque modification du `schema.prisma` (cela se fait généralement automatiquement avec `prisma migrate dev`, mais vous pouvez forcer avec `npx prisma generate`).

---

Avec ces étapes, votre environnement de développement pour Mathildanesth devrait être opérationnel. Bon développement ! 