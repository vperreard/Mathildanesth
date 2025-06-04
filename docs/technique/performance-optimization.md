# Guide d'optimisation des performances - Mathildanesth

Ce document présente les différentes optimisations de performance implémentées dans l'application Mathildanesth, ainsi que des recommandations pour les développeurs afin de maintenir et d'améliorer les performances.

## Table des matières

1. [Optimisations réalisées](#optimisations-réalisées)
2. [Système de cache Prisma](#système-de-cache-prisma)
3. [Corrections techniques](#corrections-techniques)
4. [Bonnes pratiques de développement](#bonnes-pratiques-de-développement)
5. [Tableau de bord des performances](#tableau-de-bord-des-performances)
6. [Optimisations à venir](#optimisations-à-venir)

## Optimisations réalisées

### Mai 2025

1. **Correction des routes API dynamiques**
   - Problème: Erreur "Route used `params.id`. `params` should be awaited before using its properties"
   - Solution: Ajout de `await Promise.resolve(params)` dans toutes les routes API dynamiques
   - Script automatisé: `scripts/fix-params-routes.js`
   - Impact: Réduction des erreurs et amélioration de la stabilité des API

2. **Migration de la configuration Turbopack**
   - Problème: Configuration obsolète `experimental.turbo: true`
   - Solution: Migration vers `turbopack: true` à la racine de la configuration
   - Impact: Conformité avec la version stable de Turbopack

3. **Correction des avertissements de métadonnées viewport**
   - Problème: Avertissements "Unsupported metadata viewport is configured in metadata export"
   - Solution: Séparation de la configuration viewport en export distinct
   - Script automatisé: `scripts/fix-viewport-metadata.js`
   - Impact: Élimination des avertissements et conformité avec les dernières pratiques Next.js

4. **Mise en place du cache Prisma**
   - Solution: Implémentation d'un middleware de cache pour Prisma avec invalidation sélective
   - Fichiers: `src/lib/prisma-client.ts` et `src/lib/prisma.ts`
   - Interface d'administration: `/admin/performance` (onglet Cache)
   - Impact: Réduction des requêtes à la base de données et amélioration des temps de réponse

## Système de cache Prisma

### Fonctionnement

Le système de cache Prisma implémenté intercepte les requêtes de lecture (`findUnique`, `findFirst`, `findMany`) et stocke les résultats en mémoire pendant une durée configurable (5 minutes par défaut). Les requêtes identiques suivantes sont servies directement depuis le cache, sans accéder à la base de données.

Pour les opérations de mutation (`create`, `update`, `delete`, etc.), le cache est automatiquement invalidé pour le modèle concerné, garantissant ainsi la cohérence des données.

### Configuration

Le cache est configuré dans `src/lib/prisma-client.ts` avec les paramètres suivants :

```typescript
// Configuration du cache
const CACHE_TTL = 5 * 60; // 5 minutes en secondes
const CACHE_CHECK_PERIOD = 60; // Vérification d'expiration toutes les 60 secondes
```

### API de gestion du cache

Une API d'administration a été créée pour visualiser et gérer le cache :

- **GET /api/cache-stats** : Récupère les statistiques du cache (nombres d'entrées, hits, misses, taux de succès)
- **POST /api/cache-stats** : Permet d'invalider le cache (tout, un modèle spécifique ou une clé spécifique)

### Interface d'administration

Un composant `CacheStatsPanel` a été créé pour visualiser et gérer le cache depuis l'interface d'administration. Il permet de :

- Voir les statistiques en temps réel
- Invalider tout le cache
- Invalider le cache pour un modèle spécifique
- Invalider une clé de cache spécifique

## Corrections techniques

### Correction des routes API dynamiques

Dans Next.js App Router, les paramètres dynamiques (`params`) doivent être attendus avant d'être utilisés. Nous avons automatisé cette correction avec un script qui ajoute `await Promise.resolve(params)` dans toutes les routes API dynamiques.

Exemple de correction :

```typescript
// Avant (problématique)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params; // ❌ Erreur: params devrait être awaité
  
  // Suite du code...
}

// Après (corrigé)
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params); // ✅ Correct: awaiter params
  
  // Suite du code...
}
```

### Migration de la configuration Turbopack

La configuration de Turbopack a été mise à jour conformément aux dernières recommandations de Next.js :

```javascript
// Avant (déprécié)
module.exports = {
  experimental: {
    turbo: true, // Déprécié
    // autres options...
  },
  // ...
}

// Après (correct)
module.exports = {
  experimental: {
    // autres options...
  },
  turbopack: true, // Nouvelle option recommandée
  // ...
}
```

### Correction des métadonnées viewport

Les métadonnées viewport ont été séparées de l'objet `metadata` conformément aux dernières pratiques de Next.js :

```typescript
// Avant (déprécié)
export const metadata = {
  title: 'Titre',
  description: '...',
  viewport: '...' // Déprécié dans l'objet metadata
};

// Après (correct)
export const metadata = {
  title: 'Titre',
  description: '...'
};

export const viewport = {
  width: 'device-width',
  initialScale: 1
};
```

## Bonnes pratiques de développement

Pour maintenir de bonnes performances, voici quelques bonnes pratiques à suivre :

1. **Utilisation du cache Prisma**
   - Privilégier les requêtes `findUnique`, `findFirst` et `findMany` pour bénéficier du cache
   - Éviter les requêtes avec des jointures trop complexes qui ne peuvent pas être efficacement mises en cache

2. **Optimisation des requêtes API**
   - Limiter les champs retournés avec `select`
   - Implémenter la pagination pour les listes longues
   - Utiliser `take` et `skip` pour limiter le nombre de résultats

3. **Optimisation des composants React**
   - Utiliser `React.memo` pour les composants purement présentationnels
   - Optimiser les `useEffect` avec des dépendances précises
   - Utiliser `useMemo` et `useCallback` pour les calculs ou fonctions coûteux
   - Implémenter la virtualisation pour les listes longues

4. **Chargement des pages**
   - Utiliser le chargement progressif avec `Suspense`
   - Implémenter le chargement différé des composants non critiques avec `dynamic`
   - Précharger les données importantes avec `prefetch`

## Tableau de bord des performances

Un tableau de bord de performance a été créé à l'adresse `/admin/performance` pour :

1. **Gérer le cache Prisma**
   - Visualiser les statistiques en temps réel
   - Invalider le cache si nécessaire

2. **Consulter les métriques de performance**
   - Temps de chargement des pages
   - Temps de réponse des API
   - Métriques d'interaction utilisateur

3. **Suivre les optimisations**
   - Optimisations réalisées
   - Optimisations en cours
   - Optimisations planifiées

## Optimisations à venir

Les prochaines optimisations prévues incluent :

1. **Optimisation des pages d'authentification**
   - Réduction du JavaScript initial
   - Chargement progressif des ressources
   - Validation côté client optimisée

2. **Virtualisation des listes volumineuses**
   - Implémentation de `react-window` ou `react-virtualized` pour les listes longues
   - Pagination côté serveur pour les API de listes

3. **Service worker pour fonctionnalités hors ligne**
   - Cache des ressources statiques
   - Synchronisation en arrière-plan
   - Expérience hors ligne améliorée

4. **Optimisation de la base de données**
   - Création d'index ciblés pour les requêtes fréquentes
   - Optimisation des relations et jointures
   - Monitoring des performances de requêtes

---

*Document créé le 22 mai 2025* 