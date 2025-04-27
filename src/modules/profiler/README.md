# Module de Profilage de Performance

Ce module permet d'identifier les goulots d'étranglement de performance dans l'application Mathildanesth. Il fournit des outils pour mesurer et analyser les performances des composants React et du moteur de règles.

## Fonctionnalités

- Mesure du temps d'exécution des fonctions et méthodes
- Profilage spécifique pour le moteur de règles (avec et sans cache)
- Mesure du temps de rendu des composants React
- Surveillance de l'utilisation de la mémoire
- Génération de rapports visuels avec recommandations d'optimisation

## Installation

Ce module est intégré à l'application et ne nécessite pas d'installation supplémentaire.

## Utilisation

### Initialisation du profileur

Pour initialiser le profileur avec le moteur de règles:

```typescript
import { initializeProfiler } from 'src/modules/profiler';
import { ruleEngine } from 'src/modules/rules/engine/rule-engine';
import { ruleCache } from 'src/modules/rules/services/ruleCache';

// Initialiser le profileur avec le moteur de règles et le cache
initializeProfiler(ruleEngine, ruleCache);
```

### Profilage d'un composant React

Utilisez le hook `useProfiler` pour profiler un composant React:

```typescript
import { useProfiler, MetricType } from 'src/modules/profiler';

function MyComponent() {
  const { 
    startProfiling, 
    stopProfiling, 
    isActive,
    measureFunction,
    measure
  } = useProfiler('MyComponent');

  // Démarrer le profilage
  const handleStart = () => {
    startProfiling();
  };

  // Arrêter le profilage et générer un rapport
  const handleStop = () => {
    const session = stopProfiling();
    console.log('Session de profilage terminée:', session);
  };

  // Mesurer une fonction spécifique
  const expensiveCalculation = (n) => {
    // Logique coûteuse...
    return result;
  };

  // Envelopper la fonction avec le profileur
  const profiledCalculation = measureFunction(
    expensiveCalculation,
    'calculation',
    MetricType.COMPONENT_RENDER
  );

  // Mesurer un bloc de code spécifique
  const handleOperation = () => {
    const endMeasure = measure('operation', MetricType.COMPONENT_RENDER);
    
    // Code à mesurer...
    
    // Terminer la mesure
    endMeasure();
  };

  return (
    <div>
      {/* Contenu du composant */}
    </div>
  );
}
```

### Affichage du rapport de profilage

Utilisez le composant `ProfilerReport` pour afficher le rapport:

```typescript
import { ProfilerReport } from 'src/modules/profiler';

function ProfilingResults({ report }) {
  return (
    <div>
      <h2>Résultats du profilage</h2>
      <ProfilerReport report={report} />
    </div>
  );
}
```

### Profilage direct de fonctions

Vous pouvez également profiler directement des fonctions sans utiliser le hook:

```typescript
import { profileFunction, MetricType } from 'src/modules/profiler';

// Fonction originale
function fetchData(id) {
  // Logique de récupération de données...
}

// Fonction profilée
const profiledFetchData = profileFunction(
  fetchData,
  MetricType.API_CALL,
  'fetchData'
);

// Utilisation
profiledFetchData(123); // Les performances seront mesurées
```

## Types de métriques

Le module supporte différents types de métriques:

- `RULE_EVALUATION`: Évaluation de règles sans cache
- `RULE_EVALUATION_CACHED`: Évaluation de règles avec cache
- `COMPONENT_RENDER`: Rendu de composants React
- `MEMORY_USAGE`: Utilisation de la mémoire
- `API_CALL`: Appels API
- `DATABASE_QUERY`: Requêtes de base de données

## Rapport de profilage

Le rapport de profilage fournit:

- Temps d'exécution moyens par type d'opération
- Top des opérations les plus lentes
- Comparaison des performances avec/sans cache pour les règles
- Analyse de l'utilisation mémoire
- Recommandations d'optimisation basées sur les données collectées

## Exemple complet

Consultez le fichier `src/modules/profiler/examples/ProfilerExample.tsx` pour un exemple complet d'utilisation du profileur.

## Configuration

Vous pouvez configurer le profileur selon vos besoins:

```typescript
import { profilerService } from 'src/modules/profiler';

profilerService.configure({
  enabled: true, // Activer/désactiver le profileur
  sampleRate: 500, // Fréquence d'échantillonnage mémoire en ms
  maxSessionDuration: 10 * 60 * 1000, // Durée max. de session (10 min)
  componentsToProfil: ['PlanningSimulator', 'UserForm'] // Composants à profiler
});
```

## Recommandations

Le module analyse automatiquement les données de performance et génère des recommandations d'optimisation, comme:

- Optimisation du cache des règles
- Amélioration des composants avec des temps de rendu élevés
- Détection des fuites mémoire potentielles
- Stratégies d'optimisation pour les calculs coûteux

## Limitations

- Le profileur peut avoir un impact sur les performances lorsqu'il est actif
- La mesure de mémoire n'est disponible que dans les navigateurs supportant l'API Performance Memory
- Les mesures précises peuvent varier selon l'environnement d'exécution

## Bonnes pratiques

- Activer le profileur uniquement pendant le développement ou les tests de performance
- Cibler des sections spécifiques de l'application pour un profilage précis
- Analyser les rapports dans différentes conditions et avec différents jeux de données
- Comparer les métriques avant et après les optimisations 