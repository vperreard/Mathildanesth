# Guide de migration du hook useAuth

Ce document explique comment migrer le hook `useAuth` depuis le contexte d'authentification vers un fichier proxy, et comment tester que tout fonctionne correctement après cette modification.

## Contexte

Le hook `useAuth` a été déplacé du dossier `src/hooks` vers `src/context/AuthContext`. Ce fichier proxy permet de maintenir la compatibilité avec le code existant en réexportant le hook depuis son nouvel emplacement, évitant ainsi de devoir modifier manuellement tous les imports.

## Étapes de migration

1. Créer un fichier proxy `src/hooks/useAuth.ts` qui réexporte le hook depuis le contexte d'authentification.
2. Exécuter le script de migration pour mettre à jour automatiquement tous les imports.

## Utilisation du script de migration

Le script de migration parcourt tous les fichiers JavaScript et TypeScript du projet et met à jour les imports du hook useAuth.

### Pour les projets utilisant les modules ES (avec "type": "module" dans package.json)

Utilisez la version `.mjs` du script :

```bash
# Exécuter le script
node scripts/update-auth-imports.mjs
```

### Pour les projets utilisant CommonJS

Utilisez la version `.cjs` du script :

```bash
# Donner les permissions d'exécution au script
chmod +x scripts/update-auth-imports.cjs

# Exécuter le script
node scripts/update-auth-imports.cjs
```

## Tests de vérification

Après avoir exécuté le script, vous devez vérifier que tout fonctionne correctement. Voici comment procéder :

### 1. Tester la compilation du projet

```bash
# Vérifier que le projet compile sans erreur
npm run build
```

Si la compilation réussit, cela signifie que tous les imports ont été correctement mis à jour.

### 2. Vérifier les imports dans le code

Faites une recherche globale dans votre IDE pour vérifier que tous les imports du hook useAuth pointent vers le bon emplacement :

```tsx
// Ancien import (devrait être remplacé)
import { useAuth } from '@/context/AuthContext';

// Nouvel import (correct)
import { useAuth } from '@/hooks/useAuth';
```

### 3. Tester les fonctionnalités d'authentification

Testez manuellement les fonctionnalités d'authentification pour vous assurer qu'elles fonctionnent toujours correctement :

- Connexion
- Déconnexion
- Vérification de l'état d'authentification
- Accès aux informations de l'utilisateur connecté

### 4. Exécuter les tests automatisés (si disponibles)

```bash
npm run test
```

## Problèmes connus et solutions

### Imports combinés

Si un fichier importe à la fois le hook useAuth et d'autres éléments du contexte d'authentification, le script séparera ces imports en deux lignes distinctes :

```tsx
// Avant
import { useAuth, AuthProvider, User } from '@/context/AuthContext';

// Après
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider, User } from '@/context/AuthContext';
```

### Cas non gérés par le script

Le script peut ne pas couvrir tous les cas d'imports particuliers. Si vous rencontrez des erreurs après la migration, vérifiez les imports dans les fichiers concernés et corrigez-les manuellement.

## Résolution des erreurs courantes

### Erreur "require is not defined in ES module scope"

Cette erreur se produit si votre projet est configuré avec `"type": "module"` dans le package.json et que vous essayez d'exécuter la version CommonJS du script. Utilisez plutôt la version `.mjs` du script.

### Erreur avec les chemins dans les modules ES

Si vous rencontrez des erreurs liées aux chemins dans les modules ES, vérifiez que les imports dans le script `.mjs` sont corrects et utilisent `fileURLToPath` et `import.meta.url` pour résoudre les chemins correctement.

## Retour en arrière

Si vous rencontrez des problèmes majeurs après la migration, vous pouvez revenir en arrière en supprimant le fichier proxy et en restaurant les imports d'origine depuis les commits précédents. 