# Guide d'utilisation des tests automatisés

Ce guide explique comment exécuter et interpréter les tests automatisés pour Mathildanesth, afin de vérifier que l'application fonctionne correctement.

## Introduction aux tests automatisés

Les tests automatisés permettent de vérifier rapidement que toutes les fonctionnalités de l'application fonctionnent correctement. Nous utilisons plusieurs types de tests :

- **Tests fonctionnels** : vérifient que les fonctionnalités principales (authentification, gestion des congés, etc.) fonctionnent correctement
- **Tests d'accessibilité** : vérifient que l'application est accessible aux personnes en situation de handicap
- **Tests de performance** : mesurent les temps de chargement et la réactivité de l'application
- **Tests de compatibilité** : vérifient que l'application fonctionne sur différentes tailles d'écran

## Comment exécuter les tests

### Prérequis

Avant d'exécuter les tests, assurez-vous d'avoir :

1. Installé Node.js et npm sur votre ordinateur
2. Cloné le dépôt Mathildanesth
3. Installé les dépendances avec `npm install`
4. Configuré la base de données de test avec `npm run cypress:setup-test-db`

### Exécution de tous les tests

Pour lancer tous les tests automatisés :

```bash
npm run test:e2e:all
```

Cette commande lancera l'application en mode développement et exécutera tous les tests Cypress.

### Exécution de tests spécifiques

Vous pouvez également exécuter des catégories spécifiques de tests :

- Tests d'accessibilité :
  ```bash
  npm run test:e2e:a11y
  ```

- Tests de performance :
  ```bash
  npm run test:e2e:perf
  ```

- Tests de compatibilité responsive :
  ```bash
  npm run test:e2e:responsive
  ```

### Interface graphique Cypress

Pour une utilisation plus interactive avec interface graphique :

```bash
npm run cypress:open
```

Cette interface vous permettra de :
- Sélectionner visuellement les tests à exécuter
- Voir l'exécution des tests en temps réel
- Comprendre plus facilement la cause des échecs

## Comprendre les résultats des tests

### Rapports générés

Après l'exécution des tests, des rapports sont générés dans plusieurs dossiers :

- `cypress/reports/mocha/` - Rapports généraux
- `cypress/reports/a11y/` - Rapports d'accessibilité
- `cypress/reports/lighthouse/` - Rapports de performance

Pour générer un rapport consolidé au format HTML :

```bash
npm run cypress:reports
```

Le rapport HTML sera disponible dans `cypress/reports/mocha/report.html`.

### Captures d'écran et vidéos

Pour vous aider à comprendre les problèmes :

- En cas d'échec de test, des captures d'écran sont générées dans `cypress/screenshots/`
- Des vidéos montrant le déroulement des tests sont enregistrées dans `cypress/videos/`

### Interpréter les résultats d'accessibilité

Les tests d'accessibilité identifient les problèmes selon leur gravité :

- **Critique** : problèmes empêchant complètement l'accès à une fonctionnalité
- **Sérieux** : problèmes rendant une fonctionnalité difficile à utiliser
- **Modéré** : problèmes causant des difficultés mineures
- **Mineur** : problèmes affectant l'expérience mais pas l'utilisation

### Interpréter les résultats de performance

Les audits de performance mesurent :

- **Performance** : vitesse de chargement et réactivité
- **Accessibilité** : respect des standards WCAG
- **Bonnes pratiques** : respect des pratiques modernes de développement web
- **SEO** : optimisation pour les moteurs de recherche

Chaque métrique est notée sur 100. Un score de 90 ou plus est considéré comme excellent.

## Que faire en cas d'échec des tests

Si des tests échouent, voici la marche à suivre :

1. **Examiner le rapport de test** pour comprendre quels tests ont échoué
2. **Consulter les captures d'écran et vidéos** pour voir ce qui s'est passé
3. **Vérifier si le problème est reproductible** manuellement
4. **Signaler le problème** à l'équipe de développement avec :
   - Le nom du test qui a échoué
   - Les étapes pour reproduire le problème
   - Les captures d'écran ou vidéos générées
   - Votre environnement (navigateur, système d'exploitation)

## Maintenance des tests

### Quand mettre à jour les tests

Les tests doivent être mis à jour lorsque :

1. Une nouvelle fonctionnalité est ajoutée à l'application
2. Une fonctionnalité existante est modifiée
3. L'interface utilisateur change significativement
4. Les tests échouent régulièrement alors que l'application fonctionne correctement

## Conclusion

Les tests automatisés sont un outil précieux pour garantir la qualité de l'application Mathildanesth. En suivant ce guide, vous pourrez exécuter et interpréter ces tests pour vous assurer que l'application fonctionne correctement dans différents contextes et pour tous les utilisateurs.

Pour toute question ou problème concernant les tests, n'hésitez pas à contacter l'équipe de développement. 