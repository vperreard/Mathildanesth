# Choix Technologiques

Ce document détaille les technologies sélectionnées pour le développement de MATHILDA, l'application de planification de bloc opératoire, avec leur justification et les alternatives qui ont été considérées.

## 1. Architecture Générale

**Architecture adoptée : Monolithique avec API-first**

Cette architecture propose une application unifiée où le frontend et le backend sont développés séparément mais déployés ensemble, communiquant via une API bien définie.

**Justification :**
- Simplicité de développement et de déploiement
- Complexité réduite par rapport aux microservices
- Facilité de debugging et de tests
- Possibilité d'évolution vers des microservices ultérieurement si nécessaire

**Alternatives considérées :**
- **Microservices :** Trop complexe pour la phase initiale du projet, surtout avec une équipe de développement restreinte
- **Full-stack monolithique classique :** Moins évolutif et plus difficile à maintenir sur le long terme

## 2. Frontend (Interface Utilisateur)

**Technologies adoptées :**
- **Framework principal :** React 18+ avec TypeScript
- **Visualisation de planning :** FullCalendar
- **Composants UI :** Chakra UI
- **Gestion d'état :** React Query pour les données serveur, Zustand pour l'état local
- **Routing :** React Router

**Justification :**
- React est la bibliothèque la plus utilisée avec le plus grand écosystème
- TypeScript ajoute un typage statique qui réduit les erreurs et améliore la maintenabilité
- FullCalendar est spécialisé dans les calendriers complexes et interactifs
- Chakra UI offre des composants accessibles et hautement personnalisables
- React Query simplifie la gestion des données provenant de l'API

**Alternatives considérées :**
- **Vue.js :** Plus simple mais écosystème moins riche pour les applications complexes
- **Angular :** Trop verbeux et avec une courbe d'apprentissage plus raide
- **Svelte :** Prometteur mais communauté plus petite
- **React Big Calendar :** Moins puissant que FullCalendar pour notre cas d'usage

## 3. Backend (Logique Métier)

**Technologies adoptées :**
- **Runtime :** Node.js
- **Framework :** Express.js avec TypeScript
- **API :** REST
- **Validation :** Zod pour la validation des données
- **Logique métier :** Classes et services typés

**Justification :**
- Node.js permet d'utiliser le même langage (JavaScript/TypeScript) côté client et serveur
- Express est léger mais suffisamment puissant pour nos besoins
- TypeScript apporte la rigueur nécessaire pour implémenter les règles métier complexes
- L'architecture REST est bien établie et facile à comprendre

**Alternatives considérées :**
- **Python (FastAPI/Django) :** Bonne option mais moins adapté pour les applications web réactives
- **Java (Spring Boot) :** Trop complexe pour un premier projet, courbe d'apprentissage importante
- **PHP (Laravel) :** Moins adapté aux applications interactives complexes
- **GraphQL :** Intéressant mais potentiellement sur-ingéniérisé pour nos besoins actuels

## 4. Base de Données

**Technologies adoptées :**
- **SGBD :** PostgreSQL
- **ORM :** Prisma
- **Migrations :** Gérées par Prisma

**Justification :**
- PostgreSQL offre d'excellentes performances et est parfaitement adapté aux données relationnelles complexes
- Prisma simplifie considérablement l'interaction avec la base de données
- Le typage fort de Prisma s'intègre parfaitement avec TypeScript
- Prisma gère automatiquement les migrations, facilitant l'évolution du schéma

**Alternatives considérées :**
- **MySQL/MariaDB :** Fonctionnalités avancées moins développées
- **MongoDB :** Moins adapté aux données hautement relationnelles de MATHILDA
- **SQLite :** Non adapté à une utilisation multi-utilisateurs intensive
- **TypeORM/Sequelize :** Moins intégrés avec TypeScript que Prisma

## 5. Hébergement & Déploiement

**Technologies adoptées :**
- **Environnement de développement :** Docker Compose
- **Plateforme de déploiement :** Render ou Railway
- **CI/CD :** GitHub Actions

**Justification :**
- Docker Compose simplifie la configuration de l'environnement de développement
- Render/Railway offrent un bon équilibre entre simplicité et puissance pour le déploiement
- GitHub Actions permet l'automatisation des tests et du déploiement

**Alternatives considérées :**
- **AWS :** Trop complexe pour une première approche
- **VPS :** Nécessite des compétences en administration système
- **Netlify + Backend séparé :** Complexifie la gestion de l'application

**Détails sur l'environnement de développement Docker :**
Docker sera utilisé en développement pour garantir un environnement cohérent entre les développeurs et la production. Docker Compose permettra de définir et exécuter facilement :
- Le serveur Node.js
- La base de données PostgreSQL
- Éventuellement d'autres services (cache, etc.)

Cela évitera les problèmes classiques de "ça marche sur ma machine" et facilitera l'intégration des nouveaux développeurs.

## 6. Sécurité & Authentification

**Technologies adoptées :**
- **Système d'authentification :** NextAuth.js
- **Gestion des sessions :** JWT stockés en cookies sécurisés
- **Hachage des mots de passe :** Bcrypt

**Justification :**
- NextAuth.js est une solution complète et sécurisée pour l'authentification en React
- Support de multiples fournisseurs (email/password, OAuth, etc.)
- Facilité d'intégration avec notre stack technique

**Alternatives considérées :**
- **Clerk :** Solution plus récente mais moins flexible que NextAuth.js
- **Firebase Auth :** Dépendance externe qui pourrait limiter la portabilité
- **Implémentation personnalisée :** Risque de failles de sécurité

## 7. Tests

**Technologies adoptées :**
- **Tests unitaires :** Jest + React Testing Library
- **Tests d'intégration :** Supertest
- **Tests end-to-end :** Cypress

**Justification :**
- Couverture complète du testing à différents niveaux
- Intégration facile avec notre stack technique
- Possibilité d'automatisation via GitHub Actions

## 8. Optimisations de Performance

**Technologies adoptées :**
- **Bundler :** Vite
- **Caching API :** React Query
- **Animations :** Framer Motion (si nécessaire)

**Justification :**
- Vite offre des temps de compilation bien plus rapides que webpack
- React Query permet un caching efficace des requêtes API
- Framer Motion fournit des animations performantes et accessibles

## 9. Outils de Développement

**Technologies adoptées :**
- **Linting :** ESLint
- **Formatting :** Prettier
- **Commit conventions :** Conventional Commits
- **Gestion de paquets :** pnpm (plus rapide et économe en espace que npm)

**Justification :**
- Ces outils assurent une qualité et une cohérence du code
- Facilite le travail en équipe
- Permet l'automatisation via pre-commit hooks

## 10. GitHub Actions (CI/CD)

GitHub Actions est un service d'intégration et déploiement continus (CI/CD) intégré directement à GitHub. Il permet d'automatiser des workflows comme les tests, le build et le déploiement directement depuis votre dépôt GitHub.

**Fonctionnalités utilisées :**
- Exécution automatique des tests à chaque pull request
- Vérification du linting et du formatting
- Déploiement automatique sur l'environnement de préproduction après merge sur la branche principale
- Déploiement manuel sur production via approbation

**Note :** Avoir un compte GitHub est un prérequis, mais GitHub Actions est inclus gratuitement avec les dépôts publics et offre un quota mensuel pour les dépôts privés.

## Conclusion

Cette stack technologique offre un excellent équilibre entre puissance, flexibilité et facilité de développement pour MATHILDA. Elle permet de répondre aux besoins complexes de l'application tout en restant accessible pour une équipe avec différents niveaux d'expertise.

Les technologies choisies sont toutes bien établies, largement utilisées et disposent de communautés actives, ce qui facilitera la recherche de solutions en cas de problèmes pendant le développement. 