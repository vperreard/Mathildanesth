# Mathildanesth - Application de Planning pour Équipe d\'Anesthésie\n\n## 1. Présentation\n\nApplication web pour la gestion des plannings (gardes, astreintes, consultations, bloc opératoire), des congés, et du temps de travail pour une équipe d\'anesthésie (MARs et IADEs). Inspirée de Momentum (BioSked) mais adaptée aux besoins spécifiques de l\'équipe.\n\n## 2. Stack Technologique Principale\n\n-   **Frontend:** Next.js (v14) avec React, TypeScript, Tailwind CSS\n-   **Backend:** API Routes Next.js (Node.js)\n-   **Base de Données:** PostgreSQL (via variable d\'environnement `DATABASE_URL`)\n-   **ORM:** Prisma\n-   **Authentification:** JWT (via cookies HTTPOnly)\n\n## 3. Configuration Requise\n\nAvant de lancer l\'application, assurez-vous de créer un fichier `.env` à la racine du projet avec les variables d\'environnement suivantes :\n\n```env\n# Exemple pour une base de données PostgreSQL locale\nDATABASE_URL=\"postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public\"\n\n# Clé secrète pour la signature des tokens JWT (doit être une chaîne longue et aléatoire)\nJWT_SECRET=\"VOTRE_CLE_SECRETE_ICI\"\n```\n\nRemplacez les placeholders `USER`, `PASSWORD`, `HOST`, `PORT`, `DATABASE` par vos informations de connexion PostgreSQL et définissez une clé secrète robuste pour `JWT_SECRET`.\n\n## 4. Installation\n\n1.  **Cloner le dépôt :**\n    ```bash\n    git clone <url_du_depot>\n    cd Mathildanesth\n    ```\n2.  **Installer les dépendances :**\n    ```bash\n    npm install\n    ```\n3.  **Configurer la base de données :**\n    *   Assurez-vous que votre serveur PostgreSQL est lancé et accessible.\n    *   Créez le fichier `.env` comme décrit ci-dessus.\n    *   Appliquez les migrations Prisma pour créer les tables :\n        ```bash\n        npx prisma migrate dev\n        ```\n4.  **(Optionnel) Générer le client Prisma (si nécessaire) :**\n    ```bash\n    npx prisma generate\n    ```\n5.  **(Optionnel) Initialiser la base de données avec des données de base (si un script seed existe) :**\n    *   Vérifiez le script `prisma/seed.ts`.\n    *   Lancez le seeding :\n        ```bash\n        npx prisma db seed\n        ```\n\n## 5. Commandes Principales\n\n-   **Lancer le serveur de développement :**\n    ```bash\n    npm run dev\n    ```\n    L\'application sera généralement accessible sur `http://localhost:3000` (ou un port alternatif si 3000 est occupé).\n\n-   **Construire l\'application pour la production :**\n    ```bash\n    npm run build\n    ```\n\n-   **Lancer l\'application en mode production (après build) :**\n    ```bash\n    npm run start\n    ```\n\n-   **Gérer les migrations de base de données :**\n    ```bash\n    # Créer et appliquer une nouvelle migration\n    npx prisma migrate dev --name nom_de_la_migration\n\n    # Appliquer les migrations en attente (production)\n    npx prisma migrate deploy\n    ```\n\n-   **Ouvrir Prisma Studio (interface graphique pour la BDD) :**\n    ```bash\n    npx prisma studio\n    ```\n\n-   **Lancer le linter (ESLint) :**\n    ```bash\n    npm run lint\n    ```\n\n## 6. Structure du Projet (Simplifiée)\n\n-   `prisma/`: Contient le schéma de la base de données (`schema.prisma`), les migrations et le script de seeding (`seed.ts`).\n-   `src/`: Code source principal.\n    -   `app/`: Structure des routes et des pages de l\'application (App Router Next.js).\n        -   `api/`: Routes de l\'API backend.\n    -   `components/`: Composants React réutilisables.\n    -   `context/`: Contextes React (ex: authentification).\n    -   `lib/`: Fonctions utilitaires (ex: Prisma client, authentification JWT).\n    -   `types/`: Définitions de types TypeScript partagés.\n-   `docs/`: Documentation organisée par thématique (voir section Documentation ci-dessous).\n-   `.env`: Fichier (à créer) pour les variables d\'environnement (non versionné).\n-   `next.config.cjs`: Configuration de Next.js.\n-   `tsconfig.json`: Configuration de TypeScript.\n-   `tailwind.config.js`: Configuration de Tailwind CSS.\n-   `postcss.config.js`: Configuration de PostCSS.\n\n## 7. Documentation\n\nLa documentation est organisée de manière thématique dans le dossier `docs/` :\n\n### 📁 Structure de la Documentation\n\n```\ndocs/\n├── 01_architecture/\t# Guides techniques et architecture\n│   ├── TYPESCRIPT_GUIDELINES.md\t# Standards TypeScript\n│   ├── TESTING_GUIDELINES.md\t# Guide des bonnes pratiques de test\n│   ├── TECHNICAL_DEBT_REDUCTION_REPORT.md\n│   └── INTEGRATION.md\n├── 02_implementation/\t# Plans d'implémentation\n│   ├── NEXT_STEPS.md\t# Plan détaillé des prochaines étapes\n│   └── GESTION_SITES_IMPLEMENTATION.md\n├── 03_performance/\t# Performance et optimisations\n│   ├── PERFORMANCE_AUDIT_REPORT.md\n│   ├── OPTIMISATIONS_REALISEES.md\n│   └── SIMULATION_OPTIMIZATIONS.md\n├── 04_roadmap/\t# Roadmap et planification\n│   ├── ROADMAP.md\t# Roadmap complète du projet\n│   ├── ROADMAP_SUGGESTIONS.md\n│   └── URGENT_TODO_ACTION_PLAN.md\n├── 05_user-guides/\t# Guides utilisateur\n├── 06_technical/\t# Documentation technique détaillée\n├── 07_modules/\t# Documentation par modules\n└── temp/\t# Fichiers temporaires de développement\n```\n\n### 📋 Documents Clés\n\n- **[Architecture & Standards](docs/01_architecture/)** : Guides techniques, TypeScript, tests\n- **[Implémentation](docs/02_implementation/)** : Plans détaillés des fonctionnalités à venir\n- **[Performance](docs/03_performance/)** : Audits et optimisations\n- **[Roadmap](docs/04_roadmap/)** : Planification et feuille de route\n\n## 8. État Actuel (Mai 2025)\n\n-   Gestion complète des utilisateurs (CRUD).\n-   Système d\'authentification basé sur JWT avec rôles (ADMIN\_TOTAL, ADMIN\_PARTIEL, USER).\n-   Autorisations granulaires basées sur les rôles pour les actions d\'administration.\n-   Fonctionnalité de changement de mot de passe pour l\'utilisateur connecté.\n-   Fonctionnalité de réinitialisation de mot de passe par les administrateurs (avec règles spécifiques).\n-   Journalisation des connexions réussies.\n-   Interface utilisateur pour la gestion des utilisateurs et le profil.\n\n## 9. Prochaines Étapes / Roadmap\n\nConsulter `docs/roadmap-dev-mise-a-jour.md` pour la roadmap détaillée.\n\nLes prochaines étapes pourraient inclure :\n\n-   Implémentation de la gestion des plannings (gardes, astreintes, etc.).\n-   Gestion des congés.\n-   Améliorations de la sécurité (complexité MDP, 2FA, récupération MDP utilisateur).\n-   Fonctionnalités pour listes longues (pagination, recherche, filtres).\n-   Audit détaillé des actions.\n-   Gestion des remplaçants.\n\n*(Ce README sera mis à jour au fur et à mesure de l\'avancement du projet sur demande.)*\n\n# Éditeur d'gardes/vacations par Drag & Drop\n\nCe projet propose un éditeur d'gardes/vacations avec les fonctionnalités suivantes :\n\n## Interface d'édition par glisser-déposer (Drag & Drop)\n\nL'éditeur permet de :\n- Visualiser les gardes/vacations sous forme de tableau (médecins en lignes, jours en colonnes)\n- Déplacer les gardes/vacations par glisser-déposer\n- Visualiser en temps réel les violations de règles\n- Recevoir des suggestions automatiques pour résoudre les conflits\n\n## Composants principaux\n\n### DragDropAssignmentEditor\n\nLe composant principal permettant l'édition des gardes/vacations et la visualisation des violations de règles.\n\n```tsx\nimport { DragDropAssignmentEditor } from './components';\n\n<DragDropAssignmentEditor \n  attributions={attributions}\n  medecins={medecins}\n  startDate={weekStart}\n  endDate={weekEnd}\n  ruleEngine={ruleEngine}\n  onAssignmentsChange={(newAssignments) => {\n    setAssignments(newAssignments);\n    saveAssignments(newAssignments);\n  }}\n/>\n```\n\n## Fonctionnalités de détection des violations\n\nL'éditeur est connecté au moteur de règles du système pour détecter en temps réel :\n- Les violations de règles d'équité\n- Les problèmes de fatigue excessive\n- Les contraintes de continuité de service\n- Les préférences personnelles\n\n## Suggestions de résolution\n\nPour chaque violation détectée, le système propose automatiquement des actions de résolution :\n- Suppression d'gardes/vacations problématiques\n- Échange d'gardes/vacations entre médecins\n- Déplacement d'gardes/vacations à d'autres dates\n- Solutions alternatives avec évaluation d'impact\n\n## Installation\n\nAssurez-vous d'installer les dépendances nécessaires :\n\n```bash\nnpm install react-beautiful-dnd @types/react-beautiful-dnd\n```\n\n## Intégration\n\nLa fonctionnalité est conçue pour s'intégrer facilement dans le planning hebdomadaire existant via un système d'onglets, permettant de basculer entre la vue traditionnelle et l'éditeur drag-and-drop.\n\n## Simulateur Multi-Planning\n\nLe simulateur multi-planning permet de générer et comparer plusieurs versions de planning avec différents paramètres pour trouver la solution optimale.\n\n### Fonctionnalités principales\n\n- Génération de plusieurs variantes de planning avec différents paramètres\n- Affichage comparatif des métriques (équité, respect des règles, fatigue moyenne)\n- Modèles prédéfinis pour faciliter la génération (équité, préférences, qualité de vie)\n- Possibilité d'appliquer directement la meilleure variante\n\n### Comment utiliser le simulateur\n\n1. Accédez à la page du simulateur via le menu principal ou l'URL `/planning/simulateur`\n2. Dans l'onglet "Nouvelle Simulation", choisissez un modèle prédéfini ou personnalisez vos paramètres\n3. Générez plusieurs simulations avec différents paramètres pour comparer les résultats\n4. Dans l'onglet "Comparaison", sélectionnez deux simulations pour comparer leurs métriques côte à côte\n5. Appliquez la simulation qui correspond le mieux à vos besoins\n\n### Modèles prédéfinis\n\n- **Priorité à l'équité** : Favorise une répartition équitable des gardes entre tous les membres\n- **Priorité aux préférences** : Respecte au maximum les préférences personnelles\n- **Priorité à la qualité de vie** : Minimise la fatigue et optimise l'équilibre vie-travail\n- **Optimisation maximale** : Recherche approfondie pour trouver la meilleure solution globale\n\n## Premiers pas sur une nouvelle machine\n\nPour garantir que le projet fonctionne correctement sur n'importe quel ordinateur :

1. Installez la bonne version de Node.js (recommandé : utilisez nvm)
   - `nvm install` (utilise la version indiquée dans .nvmrc)
   - `nvm use`
2. Installez les dépendances du projet :
   - `npm install`
3. (Optionnel, en cas de bug) Nettoyez l'environnement :
   - `npm run clean`
   - `npx jest --clearCache`
4. Lancez les tests :
   - `npm test`

**Astuce** : Après chaque `git pull`, relancez `npm install` pour synchroniser les dépendances.

## 10. Optimisation des Performances (Mai 2025)

Mathildanesth met désormais l'accent sur l'optimisation des performances pour garantir une expérience utilisateur fluide, même avec de grandes quantités de données et des fonctionnalités complexes.

### Système de test de performance

Un ensemble de tests automatisés avec Cypress a été mis en place pour mesurer :
- Les temps de chargement des pages principales
- Les temps de réponse des API
- Les interactions utilisateur (formulaires, saisie, etc.)

Les résultats sont visualisables dans le tableau de bord dédié à `/admin/performance`.

### Résultats des derniers tests (mai 2025)

| Élément | Temps | Évaluation |
|---------|-------|------------|
| Page d'authentification | 10.3s | Critique 🔴 |
| Page de connexion | 6.3s | À améliorer 🟠 |
| Page d'accueil | 1.7s | Acceptable 🟡 |
| Temps de réponse API | 4-11ms | Excellent 🟢 |
| Chargement initial app | 696ms | Bon 🟢 |

### Optimisations déjà implémentées

- **Middleware d'authentification** : Cache de vérification des tokens JWT avec TTL de 5 minutes
- **Layout principal optimisé** : Chargement dynamique des composants non critiques et utilisation de Suspense
- **Hook WebSocket amélioré** : Cache global avec TTL, limitation des messages et debounce des mises à jour
- **Configuration Webpack optimisée** : Code splitting intelligent par catégories de packages
- **Tableau de bord de performance** : Visualisation des métriques et recommandations automatiques

### Recommandations d'optimisation à venir

- Optimisation critique des pages d'authentification (objectif : réduction de 80%)
- Migration vers la configuration Turbopack stable
- Correction des erreurs de paramètres dans les routes API
- Virtualisation des listes volumineuses
- Service worker pour fonctionnalités hors ligne

Pour exécuter les tests de performance :
```bash
# Lancer les tests de performance
npx cypress run --spec "cypress/e2e/performance/*.cy.js"

# Voir les résultats dans le tableau de bord
# Ouvrir http://localhost:3000/admin/performance
```

Pour plus de détails, consultez :
- `docs/technique/performance-test-results.md` - Résultats complets des tests
- `docs/technique/performance-optimization.md` - Guide d'optimisation des performances
- `ROADMAP.md` - Plan d'optimisation à venir


## 🤖 Infrastructure Bulletproof & Claude Workers (NOUVEAU - 30/05/2025)

### Tests Ultra-Rapides
L'infrastructure de tests a été révolutionnée pour garantir des tests en moins de 30 secondes :

```bash
# Tests optimisés
npm run test:fast           # Tests critiques seulement (15-20s)
npm run test:bulletproof    # Validation performance complète (30s)
npm run test:validate       # Monitoring continu performance
```

### Système Claude Workers Révolutionnaire
Réparation autonome des tests cassés avec des instances Claude spécialisées :

```bash
# Générer les missions pour workers autonomes
npm run claude:workers      # Analyse + génération prompts spécialisés
npm run claude:analyze      # Alias pour claude:workers

# Résultat : Dossier claude-workers-prompts/ avec missions détaillées
# Usage : Copier prompts dans instances Claude Code séparées
# Impact : 90% temps gagné (45-60 min vs 3-4h manuelles)
```

### Documentation Complète
- **CLAUDE_WORKERS_GUIDE.md** : Guide complet d'utilisation des workers
- **CONSOLIDATION_TESTS_RAPPORT.md** : Rapport détaillé des optimisations
- **CLAUDE.md** : Instructions mises à jour pour Claude Code

### Bénéfices
- ⚡ Tests 42% plus rapides (20s vs 35s+)
- 🤖 Réparation autonome par IA spécialisées  
- 🧹 Infrastructure nettoyée (23 fichiers redondants supprimés)
- 📊 Monitoring performance en continu
- 🎯 Qualité garantie par validation croisée

