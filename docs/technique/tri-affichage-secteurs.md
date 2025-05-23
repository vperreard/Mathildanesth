# Documentation Technique : Tri et Affichage des Secteurs et Salles

## Problématique

L'application présentait un problème d'affichage des secteurs et salles dans la vue grille des trames. L'ordre d'affichage semblait aléatoire ou incohérent, avec des secteurs comme "Consultation" ou "Garde-Astreinte" qui apparaissaient en premier, suivis par d'autres secteurs dans un ordre qui ne correspondait pas à celui défini par les utilisateurs.

## Analyse du Problème

Après investigation, plusieurs problèmes ont été identifiés :

1. **Manque de tri cohérent** : Les APIs ne triaient pas correctement les secteurs et salles selon leur propriété `displayOrder`.

2. **Valeurs `displayOrder` identiques** : Certains secteurs avaient la même valeur (ex: 0) pour le champ `displayOrder`, ce qui conduisait à un ordre ambigu.

3. **Non-sauvegarde de l'ordre** : L'interface de réorganisation des secteurs (glisser-déposer) ne sauvegardait pas correctement l'ordre en base de données.

## Solutions Implémentées

### 1. Amélioration du Tri dans les APIs

#### API des Secteurs (`/api/operating-sectors/route.ts`)

```typescript
const sectors = await prisma.operatingSector.findMany({
    where: siteId ? { siteId } : undefined,
    include: {
        site: true,
        rooms: {
            orderBy: { displayOrder: 'asc' }
        }
    },
    orderBy: [
        { displayOrder: { sort: 'asc', nulls: 'last' } },
        { name: 'asc' }
    ]
});
```

Cette modification assure que :
- Les secteurs sont d'abord triés par leur `displayOrder` croissant
- Les secteurs sans `displayOrder` (null) sont placés à la fin
- À `displayOrder` égal, les secteurs sont triés par ordre alphabétique de leur nom

#### API des Salles (`/api/operating-rooms/route.ts`)

```typescript
const rooms = await prisma.operatingRoom.findMany({
    where: whereClause,
    include: {
        operatingSector: {
            include: {
                site: true
            }
        },
        site: true
    },
    orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
    ]
});
```

Les salles sont triées de manière similaire, assurant un ordre cohérent.

### 2. Amélioration de la Sauvegarde de l'Ordre (`/api/sectors/reorder-by-site/route.ts`)

```typescript
// Mise à jour explicite du displayOrder pour chaque secteur
await tx.operatingSector.update({
    where: { id: sectorId },
    data: { 
        displayOrder: index, // L'index dans le tableau définit l'ordre d'affichage
        siteId: targetSiteId 
    }
});
```

Cette modification garantit que :
- Chaque secteur reçoit une valeur `displayOrder` unique basée sur sa position dans la liste
- L'ordre est explicitement sauvegardé en base de données via une transaction Prisma

### 3. Amélioration de l'Interface Utilisateur

#### Panneau de Configuration des Secteurs

Dans `SectorsConfigPanel.tsx`, plusieurs améliorations ont été apportées :
- Message d'information expliquant le fonctionnement de la fonctionnalité
- Ajout d'indicateurs visuels de succès/erreur lors de la sauvegarde
- Ajout d'un bouton de réinitialisation de l'ordre des secteurs
- Amélioration du processus de sauvegarde pour garantir la mise à jour en base

#### Vue Grille des Trames

Dans `TrameGridView.tsx`, des indicateurs visuels d'ordre ont été ajoutés pour faciliter le débogage et la compréhension de l'ordre utilisé.

## Utilisation

### Pour les Utilisateurs

1. Accédez à la page "Configuration des Sites et Secteurs"
2. Cliquez sur "Réorganiser les secteurs"
3. Glissez-déposez les secteurs dans l'ordre souhaité
4. Cliquez sur "Terminer la réorganisation" pour sauvegarder
5. Si nécessaire, utilisez "Réinitialiser l'ordre" pour revenir à l'ordre alphabétique

### Pour les Développeurs

#### Ajout d'un Nouveau Secteur

Lors de la création d'un nouveau secteur, définissez un `displayOrder` cohérent pour déterminer sa position dans la liste. Par défaut, les nouveaux secteurs avec `displayOrder: null` apparaîtront à la fin de la liste.

#### Modification de l'Algorithme de Tri

Si vous devez modifier l'algorithme de tri, assurez-vous de maintenir la cohérence entre toutes les APIs :
- `/api/operating-sectors/route.ts`
- `/api/operating-rooms/route.ts`
- `/api/sectors/reorder-by-site/route.ts`

## Dépannage

### Logs de Débogage

Des logs détaillés ont été ajoutés pour faciliter le débogage :

```typescript
console.log(`GET /api/operating-sectors: Récupération de ${sectors.length} secteurs`);
console.log(`Premier secteur récupéré:`, {
    id: sectors[0].id,
    name: sectors[0].name,
    displayOrder: sectors[0].displayOrder
});
```

### Problèmes Courants

1. **Secteurs mal ordonnés** : Vérifiez que chaque secteur a une valeur `displayOrder` unique et appropriée en base de données.

2. **Ordre non sauvegardé** : Assurez-vous que la fonction de sauvegarde est appelée et que la transaction Prisma se termine correctement.

3. **Valeurs `displayOrder` dupliquées** : Utilisez la fonction de réinitialisation pour rétablir un ordre propre, puis réorganisez les secteurs.

### Dépannage Avancé

Si malgré les modifications apportées, certains secteurs n'apparaissent toujours pas correctement dans le bloc opératoire, vérifiez les points suivants :

1. **Problèmes d'association secteur-site** : Les logs montrent des erreurs comme `Ordered sector 16 for site X has mismatched siteId (undefined) or not found`. Vérifiez que l'ID du secteur dans l'ordre stocké correspond bien à un secteur existant avec le bon siteId.

2. **Problèmes d'affichage dans les trames** : Si certains secteurs n'apparaissent pas dans la vue grille des trames :
   - Vérifiez les filtres de site actifs qui pourraient masquer certains secteurs
   - Vérifiez que les secteurs ont au moins une salle associée (les secteurs sans salles sont ignorés par défaut)
   - Examinez les logs de débogage avec le préfixe `[ORCP_DEBUG]` pour comprendre l'attribution des salles aux secteurs

3. **Problèmes de sauvegarde d'ordre** : Pour vérifier si l'ordre est correctement sauvegardé en base de données, utilisez le script suivant :

```sql
-- Vérifier l'ordre des secteurs par site
SELECT 
  s.name AS site_name, 
  os.id, 
  os.name AS sector_name, 
  os.displayOrder 
FROM 
  "OperatingSector" os
JOIN 
  "Site" s ON os.siteId = s.id
ORDER BY 
  s.name, 
  os.displayOrder NULLS LAST, 
  os.name;
```

4. **Réinitialisation complète** : En dernier recours, vous pouvez utiliser le script `fix-sector-display-order.js` pour réinitialiser complètement l'ordre des secteurs en base de données :

```bash
node scripts/fix-sector-display-order.js
```

5. **Mise à jour directe des valeurs displayOrder** : Si les valeurs displayOrder restent à 0 dans la base de données malgré l'utilisation de l'interface, utilisez le script de mise à jour directe :

```bash
node scripts/update-sector-display-order.js
```

Ce script utilise des valeurs prédéfinies pour chaque secteur et les applique directement en base de données, contournant tous les problèmes d'interface ou d'API.

6. **État localStorage incohérent** : Si l'interface semble utiliser un ordre différent de celui en base de données, il peut y avoir un état enregistré dans localStorage qui n'est plus synchronisé. Dans la console du navigateur, essayez :

```javascript
// Vérifier l'état actuel
console.log(localStorage.getItem('sector-order'));

// Effacer l'ordre stocké en cas de problème
localStorage.removeItem('sector-order');
```

Puis rechargez la page pour forcer une récupération de l'ordre depuis la base de données. 