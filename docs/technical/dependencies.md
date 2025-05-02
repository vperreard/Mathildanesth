# Dépendances du Projet

Ce document répertorie et explique les principales dépendances utilisées dans le projet, leurs versions, et comment elles sont utilisées.

## Frontend

### Core

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| React | ^18.2.0 | Bibliothèque UI principale |
| Next.js | ^13.4.19 | Framework React avec SSR et routage |
| TypeScript | ^5.1.6 | Support de typage statique |

### UI Components

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| @radix-ui/react-* | ^1.0.0 | Composants UI primitifs accessibles |
| tailwindcss | ^3.3.3 | Framework CSS utilitaire |
| react-datepicker | ^4.16.0 | Sélecteur de date |
| react-markdown | ^8.0.7 | Rendu Markdown |

### State Management

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| zustand | ^4.4.1 | Gestion d'état global |
| immer | ^10.0.2 | Mises à jour immuables d'état |
| swr | ^2.2.2 | Mise en cache des requêtes et revalidation |

### Date & Time

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| date-fns | ^2.30.0 | Manipulation de dates |
| date-fns-tz | ^2.0.0 | Support de fuseaux horaires |

### API & Networking

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| axios | ^1.4.0 | Client HTTP pour les requêtes API |
| socket.io-client | ^4.7.2 | Communications temps réel |

### Auth

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| jsonwebtoken | ^9.0.2 | Validation de tokens JWT |
| bcryptjs | ^2.4.3 | Hachage de mots de passe |

### Validation

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| zod | ^3.22.2 | Validation de schémas |
| yup | ^1.2.0 | Validation de formulaires |

## Backend

### ORM & Database

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| sequelize | ^6.32.1 | ORM SQL |
| prisma | ^5.2.0 | Nouvelle couche ORM (en cours de migration) |
| pg | ^8.11.3 | Driver PostgreSQL |

### Server

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| express | ^4.18.2 | Framework serveur Node.js |
| cors | ^2.8.5 | Middleware CORS |
| helmet | ^7.0.0 | Sécurité HTTP |

### Logging & Monitoring

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| winston | ^3.10.0 | Logging |
| pino | ^8.15.0 | Logging haute performance |

## Développement

### Testing

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| jest | ^29.6.4 | Framework de test |
| @testing-library/react | ^14.0.0 | Tests de composants React |
| cypress | ^13.1.0 | Tests E2E |

### Linting & Formatting

| Dépendance | Version | Utilisation |
|------------|---------|-------------|
| eslint | ^8.49.0 | Linting JavaScript/TypeScript |
| prettier | ^3.0.3 | Formatage de code |

## Dépendances à éviter

Ces dépendances ne doivent pas être ajoutées au projet sans discussion préalable :

1. **moment.js** - Utiliser date-fns à la place (plus légère, immuable)
2. **lodash** (importation complète) - Utiliser des importations ciblées si nécessaire
3. **jquery** - Non compatible avec le modèle React
4. **bootstrap** - Conflit avec le système de design Tailwind
5. **material-ui** - Conflit avec le système de design existant

## Guide d'intégration de nouvelles dépendances

Avant d'ajouter une nouvelle dépendance, suivez ces étapes :

1. **Vérifier si la fonctionnalité existe déjà** dans le code ou via une dépendance existante
2. **Évaluer la taille** de la dépendance et son impact sur le bundle
3. **Vérifier la maintenance** : date du dernier commit, nombre d'issues ouvertes, nombre d'étoiles
4. **Vérifier la compatibilité** avec TypeScript et le reste de la stack
5. **Proposer l'ajout** en expliquant les avantages et les alternatives considérées

### Ajout d'une dépendance

```bash
# Dépendance de production
npm install nom-package --save

# Dépendance de développement
npm install nom-package --save-dev

# Avec une version spécifique
npm install nom-package@1.2.3
```

### Mise à jour des dépendances

```bash
# Vérifier les dépendances obsolètes
npm outdated

# Mettre à jour une dépendance spécifique
npm update nom-package

# Mettre à jour toutes les dépendances selon package.json
npm update
```

## Résolution des problèmes courants

### Conflits de dépendances

Si vous rencontrez des erreurs liées aux dépendances :

1. Vérifiez les versions incompatibles avec `npm ls nom-package`
2. Utilisez `npm dedupe` pour éliminer les duplications
3. En dernier recours, supprimez `node_modules` et réinstallez

### Vulnérabilités

1. Exécutez `npm audit` pour identifier les vulnérabilités
2. Utilisez `npm audit fix` pour les résoudre automatiquement
3. Pour les vulnérabilités qui ne peuvent pas être résolues automatiquement, consultez la documentation ou mettez à jour manuellement 