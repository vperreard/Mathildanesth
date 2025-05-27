# Guide des Bonnes Pratiques de Test - Mathildanesth

## Vue d'ensemble

Ce document établit les standards et bonnes pratiques pour maintenir une couverture de tests robuste (objectif : >80%) pour les modules critiques de l'application médicale Mathildanesth.

## Architecture de Tests

### Structure des Répertoires

```
src/
├── modules/
│   ├── leaves/
│   │   ├── __tests__/          # Tests unitaires du module
│   │   ├── services/
│   │   │   └── __tests__/      # Tests services spécifiques
│   │   └── components/
│   │       └── __tests__/      # Tests composants
│   └── auth/
│       ├── __tests__/
│       └── services/
│           └── __tests__/
├── tests/
│   ├── integration/            # Tests d'intégration
│   ├── performance/            # Tests de performance
│   ├── setup/                  # Configuration Jest
│   ├── mocks/                  # Mocks globaux
│   └── utils/                  # Utilitaires de test
```

## Types de Tests

### 1. Tests Unitaires (Target: 80% de couverture)

**Modules Prioritaires :**
- `src/modules/conges/services/` (calculs critiques)
- `src/lib/auth.ts` (sécurité JWT)
- `src/modules/conges/hooks/` (logique métier)

**Standards :**
```typescript
// ✅ BON - Test unitaire service
describe('LeaveCalculatorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should calculate working days excluding weekends and holidays', async () => {
    // Arrange
    const startDate = new Date('2024-08-01');
    const endDate = new Date('2024-08-05');
    const holidays = [new Date('2024-08-02')]; // Vendredi férié
    
    // Act
    const result = await LeaveCalculatorService.calculateWorkingDays(
      startDate, 
      endDate, 
      holidays
    );
    
    // Assert
    expect(result.workingDays).toBe(2); // Jeudi et Lundi
    expect(result.excludedDays).toContain('2024-08-02');
  });
});
```

### 2. Tests d'Intégration

**Focus sur les workflows critiques :**
- Création de demande de congé complète
- Authentification JWT end-to-end
- Calculs de quotas avec base de données

```typescript
// ✅ BON - Test d'intégration
describe('Leave Request Workflow', () => {
  it('should create leave request and update quotas', async () => {
    const user = await createTestUser();
    const leaveType = await createTestLeaveType();
    
    const response = await request(app)
      .post('/api/conges/batch')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        userId: user.id,
        typeCode: leaveType.code,
        startDate: '2024-08-01',
        endDate: '2024-08-05'
      });
      
    expect(response.status).toBe(200);
    
    // Vérifier la mise à jour des quotas
    const updatedQuota = await prisma.leaveBalance.findFirst({
      where: { userId: user.id, typeCode: leaveType.code }
    });
    expect(updatedQuota.balance).toBeLessThan(user.initialBalance);
  });
});
```

### 3. Tests de Performance

**Métriques surveillées :**
- Temps de réponse API < 200ms
- Taille des bundles
- Requêtes Prisma optimisées

```typescript
describe('Performance Tests', () => {
  it('should load leave balance under 200ms', async () => {
    const startTime = Date.now();
    
    await request(app)
      .get('/api/conges/balance')
      .set('Authorization', `Bearer ${validToken}`);
      
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(200);
  });
});
```

## Configuration Jest

### Jest Setup Principal

```javascript
// jest.config.js
module.exports = {
  preset: 'next/jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup/jest.setup.js'],
  collectCoverageFrom: [
    'src/modules/conges/**/*.{js,ts,tsx}',
    'src/lib/auth*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/modules/conges/': {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    }
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

## Mocking Strategy

### Services Externes

```typescript
// src/tests/mocks/prisma.ts
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prismaMock);
});
```

### APIs et Hooks

```typescript
// src/tests/mocks/auth.ts
export const mockAuthHook = {
  user: {
    id: 1,
    login: 'test.user',
    role: 'MEDECIN'
  },
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn()
};
```

## Utilitaires de Test

### Factory Functions

```typescript
// src/tests/factories/userFactory.ts
export const createTestUser = (overrides = {}) => ({
  id: 1,
  login: 'test.user',
  email: 'test@hospital.fr',
  role: 'MEDECIN',
  nom: 'Test',
  prenom: 'User',
  ...overrides
});

export const createTestLeaveRequest = (overrides = {}) => ({
  id: 1,
  userId: 1,
  typeCode: 'ANNUAL',
  startDate: new Date('2024-08-01'),
  endDate: new Date('2024-08-05'),
  status: 'PENDING',
  ...overrides
});
```

### Assertions Personnalisées

```typescript
// src/tests/utils/assertions.ts
export const expectToBeInDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument();
};

export const expectApiResponse = (response: any, expectedStatus: number) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body).toBeDefined();
};
```

## Tests de Régression

### Scenarios Critiques à Préserver

1. **Calculs de congés précis**
   - Exclusion des weekends/fériés
   - Gestion des demi-journées
   - Reports d'une année sur l'autre

2. **Sécurité d'authentification**
   - Validation JWT
   - Expiration de tokens
   - Permissions par rôle

3. **Intégrité des données**
   - Cohérence des quotas
   - Prévention des doublons
   - Validation Zod

## Scripts d'Audit et de Performance

### Scripts de Tests
```bash
# Tests modules critiques
npm run test:critical        # Tests des modules leaves et auth avec couverture
npm run test:leaves          # Tests du module leaves uniquement
npm run test:auth            # Tests du module auth uniquement
npm run test:performance     # Tests de performance baseline

# Tests généraux
npm run test:integration     # Tests d'intégration
npm run test:unit           # Tests unitaires
npm run test:coverage       # Couverture complète
```

### Scripts d'Audit Performance
```bash
# Analyse des bundles
npm run performance:webpack    # Build avec analyse webpack-bundle-analyzer
npm run performance:analyze    # Build avec analyse Next.js
npm run performance:audit      # Audit complet avec Lighthouse

# Monitoring
npm run performance:baseline   # Exécute audit + tests performance
npm run monitoring:start      # Démarre app + monitoring
```

### Scripts d'Audit Qualité
```bash
# Audit complet
npm run quality:full          # Tests critiques + audit performance
node scripts/quality-audit.js # Audit qualité complet avec score

# Audits spécifiques
npm run audit:security        # Audit de sécurité npm
npm run audit:performance     # Audit de performance seul
```

## Outils de Monitoring

### Module de Monitoring (`src/lib/monitoring.ts`)
- **Métriques Core Web Vitals** automatiques
- **Alertes en temps réel** sur dégradation
- **Tracking des APIs** avec `monitoredFetch()`
- **Hook React** `usePerformanceMonitoring()`

#### Utilisation dans les composants :
```typescript
import { usePerformanceMonitoring, monitoredFetch } from '@/lib/monitoring';

function MyPage() {
  usePerformanceMonitoring('page-name');
  
  const handleApiCall = async () => {
    const response = await monitoredFetch('/api/endpoint');
    // La performance est automatiquement trackée
  };
}
```

## Seuils de Performance Configurés

| Métrique | Warning | Critique | Utilisation |
|----------|---------|----------|-------------|
| Page Load Time | 2000ms | 5000ms | Temps de chargement pages |
| API Response Time | 200ms | 500ms | Temps réponse APIs |
| First Contentful Paint | 1800ms | 3000ms | Métrique Core Web Vitals |
| Largest Contentful Paint | 2500ms | 4000ms | Métrique Core Web Vitals |
| Cumulative Layout Shift | 0.1 | 0.25 | Métrique Core Web Vitals |

## Workflow de Développement Recommandé

### Avant chaque commit
```bash
npm run lint              # Vérification du code
npm run type-check        # Vérification TypeScript
npm run test:critical     # Tests modules critiques
```

### Weekly Quality Check
```bash
npm run quality:full      # Audit complet
npm run performance:baseline  # Métriques de performance
```

### Avant release
```bash
node scripts/quality-audit.js  # Score qualité complet
npm run performance:audit      # Audit performance Lighthouse
npm run test:coverage          # Couverture complète
```

## Génération de Rapports

### Rapports automatiques générés :
- **`quality-reports/`** : Rapports d'audit qualité (JSON + MD)
- **`performance-audits/`** : Rapports de performance (JSON + HTML)
- **`coverage/`** : Rapports de couverture de tests (HTML)

### Accès aux rapports :
```bash
# Ouvrir le dernier rapport de couverture
open coverage/lcov-report/index.html

# Voir les audits de performance
ls -la performance-audits/

# Consulter les rapports qualité
ls -la quality-reports/
```

## Intégration CI/CD

### Pipeline recommandé :
1. **Lint + Type Check** : Validation statique
2. **Tests critiques** : `npm run test:critical`
3. **Audit sécurité** : `npm audit`
4. **Build performance** : `npm run performance:analyze`
5. **Score qualité** : `node scripts/quality-audit.js`

### Métriques de qualité minimales :
- **Couverture tests** : > 80% modules critiques
- **Score qualité global** : > 75/100
- **Performance Lighthouse** : > 90/100
- **Vulnérabilités** : 0 critiques

## Debugging et Optimisation

### Problèmes de performance identifiés :
```bash
# Analyser les bundles lourds
npm run performance:webpack

# Identifier les APIs lentes
grep "responseTime.*[5-9][0-9][0-9]" performance-audits/*.json

# Vérifier les Core Web Vitals
npm run performance:audit
```

### Optimisations automatiques configurées :
- **Code splitting** par modules (leaves, auth)
- **Cache filesystem** pour les builds
- **Optimisation images** avec Sharp
- **Bundles différenciés** client/server

---

*Documentation mise à jour le 25 mai 2025 - Version avec outils d'audit complets*

## Métriques de Qualité

### Objectifs par Module

| Module | Couverture Cible | Tests Critiques |
|--------|------------------|-----------------|
| leaves/services | 85% | Calculs, quotas |
| auth | 90% | JWT, permissions |
| components/conges | 75% | Interactions UI |

### Monitoring Continu

- **Couverture minimum**: 70% global, 80% modules critiques
- **Performance**: Tests API < 200ms
- **Régression**: 0 test cassé en production

## Troubleshooting

### Problèmes Courants

1. **Mock Prisma non fonctionnel**
   ```typescript
   // Solution: Reset mocks entre tests
   beforeEach(() => {
     jest.clearAllMocks();
     mockReset(prismaMock);
   });
   ```

2. **Tests timeout sur WebSocket**
   ```typescript
   // Solution: Augmenter timeout et mock
   jest.setTimeout(15000);
   ```

3. **NextAuth sessions dans tests**
   ```typescript
   // Solution: Mock session provider
   const MockSessionProvider = ({ children }) => (
     <SessionProvider session={mockSession}>
       {children}
     </SessionProvider>
   );
   ```

---

**Dernière mise à jour**: Mai 2024  
**Responsable**: Équipe Qualité Mathildanesth 