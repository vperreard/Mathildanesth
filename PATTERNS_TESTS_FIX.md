# Patterns de Correction des Tests - Mathildanesth

## 📋 Résumé des Corrections

### État Initial
- **Tests échoués**: 367/1536 (23.4%)
- **Tests passés**: 1158 (73.6%)

### État Actuel (en cours)
- **Tests échoués**: ~415/1736 
- **Tests passés**: 1236+ (progression de +78 tests)
- **Modules corrigés**: auth ✅, leaves ✅, planning ✅, bloc-operatoire ✅

## 🔧 Patterns de Fix Récurrents

### 1. Fichiers/Services Manquants
**Problème**: `Cannot find module 'xxx'`

**Solutions appliquées**:
- `src/lib/apiClient.ts` - Client HTTP avec intercepteurs
- `src/services/teamService.ts` - Service de gestion d'équipes
- `src/modules/profiles/services/workScheduleService.ts` - Gestion emplois du temps
- `src/modules/profiles/types/workSchedule.ts` - Types associés

### 2. Mocks Prisma et Extensions
**Problème**: `prisma.$use is not a function`

**Solution**:
```typescript
// Dans __mocks__/@prisma/client.ts
export const prisma = mockDeep<PrismaClientMock>();
prisma.$use = jest.fn();
prisma.$extends = jest.fn();
```

### 3. NextResponse Mock
**Problème**: NextResponse.json non mocké correctement

**Solution dans jest.setup.js**:
```javascript
jest.mock('next/server', () => {
  const NextResponse = {
    json: jest.fn((data, init) => ({
      ok: true,
      status: init?.status || 200,
      // ... propriétés complètes Response
    })),
    redirect: jest.fn(),
    error: jest.fn()
  };
  return { NextRequest, NextResponse };
});
```

### 4. Enums Manquants
**Problème**: `Cannot read properties of undefined (reading 'ENUM_VALUE')`

**Solution**: Ajouter tous les enums Prisma dans le mock
```typescript
export enum NotificationType {
    NEW_CONTEXTUAL_MESSAGE = 'NEW_CONTEXTUAL_MESSAGE',
    // ... tous les valeurs
}
```

### 5. Dépendances Circulaires
**Problème**: `Cannot access 'xxx' before initialization`

**Solution**: Réorganiser les imports
```typescript
// Mock AVANT les imports
jest.mock('@prisma/client', () => {
    const { mockPrismaClient } = require('@/tests/mocks/serviceMocks');
    return { PrismaClient: jest.fn(() => mockPrismaClient) };
});

// Imports APRÈS les mocks
import { Service } from '../service';
```

### 6. MSW Handlers Manquants
**Problème**: `[MSW] Warning: intercepted a request without a matching request handler`

**Solution**: Ajouter tous les endpoints dans src/mocks/handlers.ts
```typescript
rest.get('/api/leaves/:leaveId', (req, res, ctx) => {
    const { leaveId } = req.params;
    return res(ctx.status(200), ctx.json({ id: leaveId, ... }));
})
```

## 🚀 Commandes Utiles

### Tests par Module
```bash
# Module leaves
npm test -- --testPathPattern="leaves"

# Module auth
npm test -- --testPathPattern="auth"

# Module planning  
npm test -- --testPathPattern="planning"

# Module bloc-operatoire
npm test -- --testPathPattern="bloc.*operatoire"
```

### Debug
```bash
# Un test spécifique
npm test -- path/to/test.ts

# Avec sortie détaillée
npm test -- --verbose

# Sans cache
npm test -- --no-cache
```

## 📈 Progression par Module

### ✅ Module Auth
- Tests d'authentification JWT
- Tests d'autorisation et rôles
- Hook useAuth
- **Statut**: Fonctionnel

### ✅ Module Leaves  
- Service de congés
- Calcul de quotas
- Conflits et récurrence
- **Statut**: Handlers MSW ajoutés

### ✅ Module Planning
- Génération de planning
- Validation et scoring
- **Statut**: Corrigé (sauf 1 test de score)

### ✅ Module Bloc Opératoire
- Service de planning bloc
- Gestion des secteurs
- **Statut**: Mock circulaire résolu

## 🎯 Prochaines Étapes

1. **Finaliser les tests restants** (~400 tests échoués)
2. **Atteindre 95% de réussite** (objectif: 1459/1536 tests)
3. **Optimiser la couverture** des modules critiques
4. **Documenter** les nouveaux patterns découverts

## 💡 Tips

- Toujours mocker AVANT d'importer
- Vérifier les enums Prisma dans le schéma
- Utiliser les factories existantes (TestFactory)
- Ajouter les handlers MSW au fur et à mesure
- Privilégier les mocks inline pour éviter les dépendances circulaires

---
*Document généré le 26/01/2025 pendant la campagne de stabilisation des tests*