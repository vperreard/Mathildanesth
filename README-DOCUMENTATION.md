# Organisation de la documentation Mathildanesth

La documentation du projet Mathildanesth est organisée en deux sections principales pour séparer clairement la documentation technique destinée aux développeurs et la documentation utilisateur.

## Structure des dossiers

- **`docs/`** - Documentation technique destinée aux développeurs
  - `technical/` - Documentation technique existante
  - `technique/` - Documentation technique en français (nouvelle structure)
  - `modules/` - Documentation technique par module
  - `user-guides/` - Guides pour développeurs/mainteneurs

- **`documentation/`** - Documentation fonctionnelle pour l'application et les utilisateurs
  - Guides utilisateur
  - Documentation des fonctionnalités
  - Tutoriels et exemples
  - Documentation d'aide contextuelle

## Documentation technique (docs/)

La documentation technique contient toutes les informations nécessaires pour les développeurs travaillant sur le projet :

- Guides d'architecture
- Standards de code
- Description des API
- Workflows de développement
- Guides de test et de débogage
- Prochaines étapes de développement

**Fichiers clés :**
- `docs/technique/NEXT_STEPS.md` - Prochaines étapes de développement
- `docs/technical/codebase-overview.md` - Vue d'ensemble du code
- `docs/technical/debugging-guide.md` - Guide de débogage
- `docs/technical/cypress-testing-guide.md` - Guide des tests Cypress

## Documentation utilisateur (documentation/)

La documentation utilisateur s'adresse aux utilisateurs finaux de l'application et contient :

- Guides d'utilisation
- Tutoriels pour les fonctionnalités
- FAQ et résolution de problèmes
- Documentation des règles métier
- Exemples et cas d'usage

**Fichiers clés :**
- `documentation/index.md` - Point d'entrée de la documentation
- `documentation/guide-demarrage-rapide.md` - Guide de démarrage rapide
- `documentation/guide-utilisateur-simulateur.md` - Guide d'utilisation principal
- `documentation/guide-tests-e2e.md` - Guide d'utilisation des tests automatisés

## Comment maintenir la documentation

### Principes généraux

1. **Clarté** - Rédigez de façon claire et concise
2. **Séparation des préoccupations** - Gardez la documentation technique séparée de la documentation utilisateur
3. **À jour** - Mettez à jour la documentation lorsque le code change
4. **Exemples** - Incluez des exemples concrets pour illustrer les concepts

### Mise à jour de la documentation technique

Lorsque vous modifiez le code ou l'architecture :
1. Mettez à jour les fichiers techniques pertinents dans `docs/`
2. Actualisez le fichier `NEXT_STEPS.md` si les priorités changent
3. Documentez tout nouveau pattern ou antipattern observé

### Mise à jour de la documentation utilisateur

Lorsque vous ajoutez ou modifiez des fonctionnalités :
1. Mettez à jour les guides utilisateur dans `documentation/`
2. Ajoutez des captures d'écran si nécessaire
3. Vérifiez que les tutoriels sont toujours valides

## Organisation linguistique

- La documentation technique peut être en français ou en anglais selon le fichier
- La documentation utilisateur est principalement en français
- Les fichiers dans `docs/fr/` sont spécifiquement en français

## Organisation des tests

Les tests automatisés Cypress sont documentés dans :
- `docs/technical/cypress-testing-guide.md` (documentation technique en anglais)
- `documentation/guide-tests-e2e.md` (guide utilisateur en français)

## Propositions d'amélioration

Pour la prochaine phase d'organisation de la documentation :
1. Migrer progressivement tous les documents techniques en français dans `docs/technique/`
2. Consolider les guides utilisateur redondants
3. Améliorer l'indexation et la recherche dans la documentation
4. Mettre en place un système de versionnage de la documentation

---

*Dernière mise à jour : Mai 2025* 