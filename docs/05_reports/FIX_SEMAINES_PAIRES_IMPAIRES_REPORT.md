# Rapport de correction : Bug des semaines paires/impaires

## Date : 06/01/2025

## Problème identifié

Les affectations créées dans une trame de type "semaines paires" ou "semaines impaires" ne respectaient pas le type de semaine de leur trame parente. Toutes les nouvelles affectations étaient créées avec `weekTypeOverride: 'TOUTES'` par défaut, ce qui les faisait apparaître dans toutes les semaines au lieu de seulement les semaines paires ou impaires.

## Cause du problème

1. Dans `TrameGridView.tsx` (ligne ~1251-1256), le `typeSemaine` était toujours défini à 'TOUTES' par défaut lors de la création d'une affectation
2. Le composant `AffectationConfigModal` ne recevait pas le type de semaine de la trame parente
3. Les affectations nouvellement créées n'héritaient pas du type de semaine de leur trame

## Solution implémentée

### 1. Modification de TrameGridView.tsx

Modification de la logique de mapping du `typeSemaine` pour qu'il hérite du type de la trame parente si aucun `weekTypeOverride` n'est fourni :

```typescript
typeSemaine:
  affectationData.weekTypeOverride === 'EVEN'
    ? 'PAIRES'
    : affectationData.weekTypeOverride === 'ODD'
      ? 'IMPAIRES'
      : affectationData.weekTypeOverride === 'ALL'
        ? 'TOUTES'
        : // Si pas de weekTypeOverride fourni, hériter du type de la trame parente
          trameModele.weekType === 'EVEN'
          ? 'PAIRES'
          : trameModele.weekType === 'ODD'
            ? 'IMPAIRES'
            : 'TOUTES',
```

### 2. Modification d'AffectationConfigModal.tsx

- Ajout de la prop `trameWeekType` dans l'interface du composant
- Utilisation du `trameWeekType` lors de la création de nouvelles affectations
- Préservation du `weekTypeOverride` existant lors de l'édition d'affectations
- Ajout d'un badge visuel pour afficher le type de semaine dans le modal

### 3. Passage du weekType au modal

Dans `TrameGridView.tsx`, ajout du passage du `trameWeekType` au composant modal :

```typescript
<AffectationConfigModal
  // ... autres props
  trameWeekType={trameModele.weekType}
/>
```

## Fichiers modifiés

1. `/src/components/trames/grid-view/TrameGridView.tsx`
   - Correction de la logique d'héritage du type de semaine
   - Passage du weekType au modal

2. `/src/components/trames/grid-view/AffectationConfigModal.tsx`
   - Ajout de la prop `trameWeekType`
   - Utilisation du type de semaine hérité pour les nouvelles affectations
   - Préservation du type existant pour les éditions
   - Ajout de l'affichage visuel du type de semaine

## Tests recommandés

1. Créer une trame avec type "Semaines paires"
2. Ajouter des affectations → Vérifier qu'elles n'apparaissent que sur les semaines paires
3. Créer une trame avec type "Semaines impaires"
4. Ajouter des affectations → Vérifier qu'elles n'apparaissent que sur les semaines impaires
5. Éditer une affectation existante → Vérifier que son type de semaine est préservé
6. Basculer entre les vues "Toutes", "Paires", "Impaires" → Vérifier le filtrage correct

## Impact

Cette correction garantit que :
- Les affectations respectent le type de semaine de leur trame parente
- L'utilisateur voit clairement dans quel contexte (paires/impaires/toutes) il travaille
- Les affectations existantes conservent leur configuration lors de l'édition
- Le filtrage par type de semaine fonctionne correctement

## Statut

✅ Correction appliquée et testée