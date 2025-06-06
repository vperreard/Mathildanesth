# Rapport des Erreurs de Build - 06/06/2025

## Résumé

Le build Next.js échoue avec plusieurs types d'erreurs récurrentes dans les composants du module bloc-operatoire.

## Types d'Erreurs Identifiées

### 1. Erreurs de Schéma Zod

- **Fichiers**: OperatingRoomForm.tsx, OperatingSectorForm.tsx
- **Problème**: Les schémas Zod utilisent `.default()` qui crée des types optionnels incompatibles
- **Solution**: Retirer `.default()` et fournir les valeurs par défaut dans defaultFormValues

### 2. Erreurs de Noms de Méthodes

- **Fichiers**: ReglesSupervisionAdmin.tsx, SecteursAdmin.tsx
- **Problème**: Mauvais noms de méthodes du service BlocPlanningService
- **Corrections**:
  - `getAllSupervisionRules` → `getAllSupervisorRules`
  - `getAllSectors` → `getAllOperatingSectors`
  - `deleteSupervisionRule` → `deleteSupervisorRule`
  - `updateSupervisionRule` → `updateSupervisorRule`
  - `createSupervisionRule` → `createSupervisorRule`
  - `deleteSector` → Non existant
  - `updateSector` → Non existant
  - `createSector` → Non existant

### 3. Erreurs de Types BlocSector

- **Problème**: Incohérence entre les propriétés attendues et fournies
- **Propriétés correctes**:
  - `name` (pas `nom`)
  - `colorCode` (pas `couleur`)
  - `isActive` (pas `estActif`)
  - `salles` est requis (array de strings)

### 4. Erreurs de Types Number vs String

- **Problème**: Les IDs sont des nombres mais utilisés comme strings dans certains endroits
- **Solution**: Utiliser `.toString()` lors des comparaisons et conversions

### 5. Erreurs de Routes API

- **Fichiers**: Routes utilisant `withAuth`
- **Problème**: `withAuth` n'est pas compatible avec Next.js 14+
- **Solution**: Utiliser `checkUserRole` directement

## Actions Correctives Nécessaires

1. **OperatingSectorForm.tsx**: Retirer les `.default()` du schéma Zod
2. **OperatingSectorList.tsx**: Ajouter `salles: []` lors de la création
3. **ReglesSupervisionAdmin.tsx**:
   - Corriger tous les noms de méthodes
   - Adapter les types entre service et composant
   - Convertir les IDs en strings pour les comparaisons
4. **SecteursAdmin.tsx**:
   - Corriger les noms de méthodes
   - Utiliser les bonnes propriétés (`name`, `colorCode`, `isActive`)
   - Implémenter les méthodes manquantes ou utiliser des alternatives

## État Actuel

- ✅ Routes API corrigées (withAuth → checkUserRole)
- ✅ Module permissions créé
- ❌ Composants bloc-operatoire avec multiples erreurs de types
- ❌ Incohérences entre les types du service et des composants
