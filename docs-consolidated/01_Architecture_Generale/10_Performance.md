# Performance Web dans Mathildanesth

## Introduction

La performance web est un aspect crucial de l'expérience utilisateur (UX) et du succès de Mathildanesth. Une application rapide et réactive améliore la satisfaction des utilisateurs, leur productivité et peut même influencer positivement l'adoption de l'outil. Ce document décrit les stratégies et les considérations relatives à la performance.
La roadmap mentionne des optimisations de performance, l'utilisation de Lighthouse et des tests de performance automatisés.

## Objectifs de Performance

- **Chargement Rapide des Pages :** Les pages clés, en particulier le planning et le tableau de bord, doivent se charger rapidement.
- **Réactivité de l'Interface :** Les interactions utilisateur (clics, saisies, drag-and-drop) doivent être fluides et sans latence perceptible.
- **Utilisation Efficace des Ressources :** Minimiser l'utilisation du CPU, de la mémoire et de la bande passante, tant côté client que côté serveur.
- **Respecter les Core Web Vitals de Google :**
  - **LCP (Largest Contentful Paint) :** Mesure la vitesse de chargement perçue. Idéalement inférieur à 2.5 secondes.
  - **FID (First Input Delay) / INP (Interaction to Next Paint) :** Mesurent la réactivité. FID idéalement inférieur à 100 ms, INP inférieur à 200ms.
  - **CLS (Cumulative Layout Shift) :** Mesure la stabilité visuelle. Idéalement inférieur à 0.1.

## Stratégies d'Optimisation Frontend

### 1. Optimisation du Build Next.js

- Next.js intègre de nombreuses optimisations par défaut (code splitting, minification, compression).
- Utiliser le composant `next/image` pour l'optimisation automatique des images (redimensionnement, formats modernes comme WebP, lazy loading).
- Utiliser le composant `next/script` pour optimiser le chargement des scripts tiers.
- Utiliser `next/font` pour optimiser le chargement des polices et éviter les décalages de mise en page (CLS).

### 2. Code Splitting et Lazy Loading

- **Code Splitting Automatique :** Next.js divise le code JavaScript en plus petits morceaux (chunks) qui sont chargés uniquement lorsque les routes ou composants correspondants sont nécessaires.
- **Lazy Loading de Composants :** Utiliser `next/dynamic` pour charger dynamiquement des composants qui ne sont pas immédiatement visibles ou nécessaires (ex: modales, contenu en dehors de la fenêtre visible, widgets de dashboard peu prioritaires).
  - Mentionné dans `NEXT_STEPS.md` pour `ChartWidget.tsx` et `LeaveForm.tsx`.
- **Lazy Loading d'Images et d'Iframes :** Utiliser l'attribut `loading="lazy"` ou les fonctionnalités de `next/image`.

### 3. Optimisation du Rendu React

- **Server Components :** Utiliser les Server Components de Next.js par défaut pour déplacer le travail de rendu et de récupération de données vers le serveur, réduisant la quantité de JavaScript envoyée au client.
- **Memoization :**
  - Utiliser `React.memo` pour les composants fonctionnels afin d'éviter les re-rendus inutiles si leurs props n'ont pas changé.
  - Utiliser `useMemo` pour mémoïser des calculs coûteux.
  - Utiliser `useCallback` pour mémoïser des fonctions passées en props à des composants mémoïsés.
- **Virtualisation des Listes :** Pour les longues listes de données (ex: historique des affectations, listes d'utilisateurs), utiliser des bibliothèques de virtualisation (ex: `react-window`, `react-virtualized`, ou `TanStack Virtual`) pour ne rendre que les éléments visibles à l'écran.
- **Limiter les Re-rendus Inutiles :** Analyser les causes de re-rendus avec React Developer Tools et optimiser en conséquence.

### 4. Gestion de l'État Efficace

- Éviter de stocker des données serveur redondantes dans l'état client. Préférer `SWR` ou `React Query (TanStack Query)` qui gèrent la mise en cache et la revalidation.
- Pour l'état global, choisir des solutions performantes (Zustand est généralement léger).

### 5. Optimisation des CSS

- Tailwind CSS génère des classes utilitaires, et avec PurgeCSS (utilisé par Next.js en production), seuls les CSS utilisés sont inclus dans le build final.
- Minimiser l'utilisation de CSS bloquant le rendu critique.

### 6. Service Workers et Caching

- Utiliser un Service Worker (ex: via `next-pwa`) pour mettre en cache les assets statiques et potentiellement les données d'API, permettant un chargement plus rapide lors des visites ultérieures et une certaine capacité hors-ligne.
- Configurer correctement les en-têtes HTTP de mise en cache (`Cache-Control`) pour les assets et les réponses API.
  - Le `CacheService.ts` mentionné dans `NEXT_STEPS.md` pourrait jouer un rôle ici.

## Stratégies d'Optimisation Backend

### 1. Requêtes de Base de Données Performantes

- **Indexation :** S'assurer que les colonnes fréquemment utilisées dans les clauses `WHERE`, `JOIN`, et `ORDER BY` sont correctement indexées en base de données.
- **Sélection Sélective des Champs :** Utiliser `select` ou `include` de Prisma pour ne récupérer que les champs nécessaires, évitant le sur-chargement de données.
- **Optimisation des Requêtes Complexes :** Analyser les requêtes lentes (ex: avec `EXPLAIN ANALYZE` dans PostgreSQL) et les optimiser. Parfois, des requêtes brutes (`$queryRaw`) peuvent être nécessaires pour des cas très spécifiques, mais à utiliser avec prudence.
- **Pagination :** Mettre en place la pagination pour les API retournant de grandes listes de données.
- **N+1 Problems :** Faire attention aux problèmes de N+1 requêtes, surtout avec des ORM comme Prisma. Utiliser les fonctionnalités d'`include` ou des solutions de dataloader si nécessaire.

### 2. Mise en Cache Côté Serveur

- Mettre en cache les résultats des requêtes coûteuses ou des données fréquemment accédées (ex: avec Redis, Memcached, ou un cache en mémoire).
- Définir des stratégies d'invalidation de cache appropriées.

### 3. Traitements Asynchrones

- Pour les tâches longues ou non critiques (ex: envoi d'emails de notification en masse, génération de rapports complexes), utiliser des files d'attente de messages (ex: RabbitMQ, Kafka, BullMQ) et des workers en arrière-plan pour ne pas bloquer les requêtes HTTP principales.

### 4. Optimisation des API Routes et Server Actions

- Réduire la latence en optimisant la logique métier et les interactions avec les services externes.
- Compression des réponses API (ex: Gzip, Brotli, géré par Next.js/Vercel).

## Monitoring et Tests de Performance

- **Outils de Développement du Navigateur :**
  - Onglet "Performance" pour profiler le JavaScript et le rendu.
  - Onglet "Network" pour analyser les temps de chargement des ressources.
- **Google Lighthouse :** Audits automatisés pour la performance, l'accessibilité, les PWA, etc. (Mentionné dans la roadmap pour CI).
- **WebPageTest :** Test de performance depuis différentes localisations et appareils.
- **Sentry / New Relic / Datadog :** Monitoring des performances en production, détection des transactions lentes, suivi des Core Web Vitals.
- **Tests de Charge (Optionnel, pour des points d'API critiques) :** Outils comme k6, JMeter pour simuler un grand nombre d'utilisateurs et identifier les goulots d'étranglement.
- **Tests de Performance Automatisés :** Intégrer des vérifications de performance (ex: budgets de performance Lighthouse) dans le pipeline de CI. (Mentionné dans la roadmap)

## Bonnes Pratiques

- **Optimisation Continue :** La performance n'est pas une tâche ponctuelle, mais un effort continu.
- **Mesurer Avant d'Optimiser :** Identifier les véritables goulots d'étranglement avant de se lancer dans des optimisations prématurées.
- **Tester sur des Appareils et Connexions Variés :** S'assurer que l'application reste performante pour les utilisateurs ayant des appareils moins puissants ou des connexions internet plus lentes.
- **Le hook `useOptimizedQuery.ts`** mentionné dans la roadmap est un exemple de démarche proactive pour optimiser les requêtes API.

## Conclusion

La performance est un aspect multidimensionnel de Mathildanesth qui nécessite une attention à la fois sur le frontend et le backend. En adoptant les bonnes pratiques, en utilisant les optimisations offertes par Next.js, et en surveillant activement les métriques de performance, il est possible de fournir une expérience utilisateur rapide et agréable.
