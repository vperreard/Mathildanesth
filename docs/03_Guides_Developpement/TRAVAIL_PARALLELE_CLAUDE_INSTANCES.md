# Guide Travail Parallèle avec Multiple Instances Claude Code

**Date**: 04/06/2025  
**Auteur**: Vincent Perreard  
**Contexte**: Organisation du travail en parallèle sur 3 branches distinctes

## 🎯 État Actuel

### Build Fix Complété ✅

- **39 routes API migrées** vers Next.js 14/15
- **Pattern appliqué**: `{ params }: { params: Promise<{ id: string }> }`
- **Branche**: `feature/axe1-stabilisation-qualite`
- **Status**: Prêt à merger dans main

## 📋 Commandes Git pour Merger le Travail Actuel

```bash
# 1. Sur l'instance actuelle - Sauvegarder et pousser
git add .
git commit -m "feat: migration complète routes API Next.js 14/15 - 39 fichiers

- Migration de toutes les routes dynamiques vers params asynchrones
- Pattern: { params }: { params: Promise<{ id: string }> }
- Résolution complète des erreurs de build Next.js
- Build fonctionnel et testé"

git push origin feature/axe1-stabilisation-qualite

# 2. Créer la PR et merger (via GitHub/GitLab)
# OU merger localement :
git checkout main
git pull origin main
git merge feature/axe1-stabilisation-qualite
git push origin main
```

## 🚀 Instructions pour 3 Instances Claude Code en Parallèle

### Instance 1 : Corriger les Tests en Échec

**Branche**: `fix/failing-tests`

```bash
# Commandes à exécuter
git checkout main
git pull origin main
git checkout -b fix/failing-tests
```

**Prompt pour Claude Code Instance 1**:

```
Je travaille sur la branche fix/failing-tests. Ma mission est de corriger UNIQUEMENT les tests en échec dans PlanningGenerator.

Contexte:
- Ne toucher QU'AUX fichiers de tests
- Focus sur src/services/__tests__/planningGenerator.test.ts
- 3 tests échouent actuellement

Objectifs:
1. Fixer findEligibleUsersForGarde (exclusion des users en congé)
2. Corriger selectBestCandidateForGarde (sélection équitable)
3. Résoudre problème de priorité week-end
4. Nettoyer snapshot obsolète HeatMapChart si nécessaire

IMPORTANT:
- Ne PAS toucher aux routes API
- Ne PAS toucher aux fichiers TypeScript (sauf les tests)
- Commiter fréquemment avec des messages clairs
- Tester avec: npm test -- planningGenerator

Commence par analyser les tests qui échouent avec npm test.
```

### Instance 2 : Résoudre les Erreurs TypeScript

**Branche**: `fix/typescript-errors`

```bash
# Commandes à exécuter
git checkout main
git pull origin main
git checkout -b fix/typescript-errors
```

**Prompt pour Claude Code Instance 2**:

```
Je travaille sur la branche fix/typescript-errors. Ma mission est de corriger les erreurs TypeScript.

Contexte:
- 50+ erreurs de compilation TypeScript à résoudre
- Focus sur la qualité du typage

Objectifs:
1. Corriger les types dans les mocks Prisma (__mocks__/@prisma/client.ts)
2. Fixer les erreurs Cypress (types manquants)
3. Remplacer TOUS les 'any' par des types appropriés
4. Corriger les imports circulaires
5. Valider avec npm run type-check

IMPORTANT:
- Ne PAS toucher aux tests (Instance 1 s'en occupe)
- Ne PAS toucher aux routes API (déjà migrées)
- Commiter par groupe de fichiers (ex: "fix: types Prisma mocks")
- Vérifier régulièrement avec: npm run type-check

Commence par lancer npm run type-check pour voir toutes les erreurs.
```

### Instance 3 : Sécurité et Nettoyage

**Branche**: `chore/security-cleanup`

```bash
# Commandes à exécuter
git checkout main
git pull origin main
git checkout -b chore/security-cleanup
```

**Prompt pour Claude Code Instance 3**:

```
Je travaille sur la branche chore/security-cleanup. Ma mission est le nettoyage et la sécurité.

Contexte:
- Vulnérabilité tar-fs à corriger
- 18 fichiers non commités à gérer
- Console.log à nettoyer
- TODOs critiques à résoudre

Objectifs:
1. npm audit fix pour corriger tar-fs
2. Identifier et commiter les 18 fichiers en attente (git status)
3. Supprimer TOUS les console.log (sauf ceux nécessaires)
4. Résoudre les 20 TODOs les plus critiques
5. Documenter les fonctions complexes manquantes

IMPORTANT:
- Ne PAS toucher aux tests (Instance 1)
- Ne PAS toucher aux types (Instance 2)
- Grouper les commits par type (security, cleanup, docs)
- Tester que rien n'est cassé: npm run dev

Commence par npm audit pour voir les vulnérabilités.
```

## 📊 Coordination et Merge

### Ordre de Merge Recommandé

1. **Instance 1** (tests) - Peut merger rapidement
2. **Instance 3** (security) - Peut merger après Instance 1
3. **Instance 2** (TypeScript) - Merger en dernier (plus complexe)

### Commandes de Merge pour chaque Instance

```bash
# Sur chaque instance une fois le travail terminé
git add .
git commit -m "fix: [description claire du travail]"
git push origin [nom-de-la-branche]

# Créer une PR sur GitHub/GitLab
# OU merger localement:
git checkout main
git pull origin main
git merge [nom-de-la-branche]
git push origin main
```

## ⚠️ Points d'Attention

1. **Communication**: Noter l'avancement dans le canal d'équipe
2. **Conflits**: Si conflit détecté, communiquer immédiatement
3. **Tests**: Toujours vérifier que les tests passent avant de merger
4. **Build**: Vérifier que le build fonctionne avant de merger

## 📝 Suivi des Tâches

| Instance | Branche                | Tâche                   | Status   | Fichiers Principaux       |
| -------- | ---------------------- | ----------------------- | -------- | ------------------------- |
| 1        | fix/failing-tests      | Tests PlanningGenerator | En cours | src/services/**tests**/\* |
| 2        | fix/typescript-errors  | Erreurs TypeScript      | En cours | Mocks, types/\*           |
| 3        | chore/security-cleanup | Sécurité & Nettoyage    | En cours | package.json, divers      |

## 🎯 Objectif Final

Une fois les 3 branches mergées :

- ✅ Build fonctionnel (déjà fait)
- ✅ Tous les tests passent
- ✅ 0 erreur TypeScript
- ✅ 0 vulnérabilité de sécurité
- ✅ Code propre et documenté

Prêt pour passer à la phase suivante : augmenter la couverture de tests à 30% !
