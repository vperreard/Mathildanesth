# Tests du Module Bloc Opératoire

Ce répertoire contient l'ensemble des tests unitaires et d'intégration pour le module de planification du bloc opératoire. L'objectif est d'atteindre une couverture de test de 70%, en se concentrant sur les fonctionnalités clés.

## Structure des tests

### Tests unitaires

Les tests unitaires se trouvent dans le dossier principal `tests` et testent les composants et services de manière isolée :

- `blocPlanningService.test.ts` : Tests pour le service de gestion du bloc opératoire
- `tests/components/BlocPlanningEditor.test.ts` : Tests unitaires pour l'éditeur de planning

### Tests d'intégration

Les tests d'intégration se trouvent dans le dossier `tests/integration/bloc-operatoire` et sont organisés thématiquement :

1. **Workflows complets** (`planningWorkflows.integration.test.ts`)
   - Tests des scénarios complets de création et modification de planning
   - Tests des interactions entre les différentes étapes du workflow
   - Tests de la gestion des erreurs et des cas limites

2. **Formulaires complexes** (`complexForms.integration.test.ts`)
   - Tests des formulaires d'édition de salles et superviseurs
   - Tests de la validation des formulaires
   - Tests des interactions utilisateur avec les formulaires complexes
   - Tests des retours visuels (couleurs, messages d'erreur)

3. **Structure de navigation** (`planningStructure.integration.test.ts`)
   - Tests de l'affichage de la vue calendrier
   - Tests de la navigation entre les semaines
   - Tests de l'affichage des plannings existants
   - Tests de l'affichage des différents statuts de planning

4. **Hooks personnalisés** (`planningHooks.integration.test.ts`)
   - Tests du hook `useOperatingRoomPlanning`
   - Tests de la gestion des états de chargement, sauvegarde et erreurs
   - Tests des modifications de l'état au fil des actions utilisateur

## Approche de test

### Stratégie de mocking

Pour les tests d'intégration, nous utilisons des mocks pour :
- Les appels API (via le service `blocPlanningService`)
- La navigation (via les hooks Next.js)
- Les données externes (utilisateurs, salles, etc.)

Nous évitons de mocker les composants UI afin de tester les interactions réelles.

### Scénarios testés

Nous testons en priorité :

1. **Fonctionnalités critiques**
   - Création et modification de plannings
   - Gestion des superviseurs
   - Validation des plannings
   - Navigation et organisation des données

2. **Flux d'erreurs**
   - Erreurs réseau
   - Validation et conflits
   - Gestion des états d'erreur

3. **Interactions UI complexes**
   - Formulaires à plusieurs niveaux
   - Navigation contextuelle
   - Feedback utilisateur

## Exécution des tests

Pour exécuter les tests d'intégration du bloc opératoire :

```bash
npm run test:integration bloc-operatoire
```

Pour exécuter un fichier de test spécifique :

```bash
npm run test src/tests/integration/bloc-operatoire/planningWorkflows.integration.test.ts
```

Pour générer un rapport de couverture :

```bash
npm run test:coverage
```

## Bonnes pratiques

- Chaque test doit être indépendant et ne pas dépendre de l'état des autres tests
- Utiliser `beforeEach` pour réinitialiser les mocks entre les tests
- Préférer `waitFor` à `act` quand on attend des mises à jour asynchrones
- Toujours vérifier l'état initial de chargement avant les assertions principales
- Tester les cas limites et les gestions d'erreurs
- Éviter les tests redondants qui ne testent pas de nouvelles fonctionnalités 