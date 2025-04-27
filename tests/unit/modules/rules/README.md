# Tests unitaires du système de cache de règles

Ce répertoire contient les tests unitaires pour le système de cache de règles. Ces tests vérifient les fonctionnalités essentielles du cache et son intégration avec le moteur de règles.

## Structure des tests

La suite de tests est divisée en trois fichiers principaux :

1. **`ruleCache.test.ts`** : Tests unitaires du service de cache de règles (`RuleCacheService`)
2. **`ruleEngine.cache.test.ts`** : Tests unitaires de l'intégration du cache dans le moteur de règles (`RuleEngine`)
3. **`ruleCache.integration.test.ts`** : Tests d'intégration entre le moteur de règles et le service de cache

## Fonctionnalités testées

### Mise en cache et récupération
- Mise en cache et récupération des évaluations de règles
- Mise en cache et récupération des règles elles-mêmes
- Gestion des cas où aucune entrée n'est trouvée dans le cache

### Invalidation du cache
- Invalidation d'entrées spécifiques du cache d'évaluations
- Invalidation d'entrées spécifiques du cache de règles
- Invalidation de toutes les entrées du cache associées à un médecin
- Invalidation complète du cache

### Expiration des entrées
- Expiration automatique des entrées après leur TTL (Time-To-Live)
- Nettoyage automatique des entrées expirées

### Performances
- Tests de performance avec un grand nombre de règles
- Tests de performance avec de nombreux contextes d'évaluation
- Comparaison des temps d'exécution avec et sans cache

### Intégration avec RuleEngine
- Activation/désactivation du cache dans le moteur de règles
- Invalidation du cache lors de l'ajout/suppression de règles
- Utilisation du cache lors de l'évaluation des règles

## Exécution des tests

Pour exécuter ces tests, utilisez l'une des commandes suivantes :

```bash
# Exécuter tous les tests du système de cache de règles
npm run test:rules

# Exécuter les tests en mode watch (pour le développement)
npm run test:rules:watch

# Exécuter les tests avec un rapport de couverture détaillé
npm run test:rules:coverage
```

## Configuration

La configuration des tests se trouve dans le fichier `jest.config.rules.js` à la racine du projet. Cette configuration inclut :

- Les seuils de couverture de code requis
- Les chemins des fichiers à tester
- Le délai d'attente maximal pour les tests
- Le format de sortie des résultats

## Couverture du code

L'objectif de couverture de code est :
- 65% pour les branches
- 70% pour les fonctions
- 70% pour les lignes
- 70% pour les instructions

## Bonnes pratiques pour étendre les tests

Lors de l'ajout de nouvelles fonctionnalités au système de cache, assurez-vous de :

1. Ajouter des tests unitaires pour les nouvelles fonctions
2. Mettre à jour les tests d'intégration si nécessaire
3. Vérifier que tous les tests existants continuent de passer
4. Maintenir ou améliorer la couverture de code

## Mocks et fixtures

Les tests utilisent plusieurs mocks et fixtures :
- Mock de `Date.now()` pour contrôler le temps
- Règles et contextes de test standardisés
- Validateurs simulés pour les tests d'intégration 