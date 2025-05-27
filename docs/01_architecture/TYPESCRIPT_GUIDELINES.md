# Guide des Bonnes Pratiques TypeScript - Mathildanesth

## 🚫 Règles Strictes

### Interdiction Absolue des @ts-ignore
- **JAMAIS** d'utilisation de `@ts-ignore` en production
- Chaque `@ts-ignore` doit être remplacé par une solution typée appropriée
- Les `@ts-ignore` temporaires dans les tests doivent avoir une date d'expiration

### Préférer les Solutions Typées

## 📋 Patterns de Résolution des @ts-ignore

### 1. Types de Test et Mocks

**❌ Éviter :**
```typescript
// @ts-ignore - Mock simplifié
mockPrisma.user.findUnique.mockResolvedValue({});
```

**✅ Préférer :**
```typescript
// Créer des types de test appropriés
type MockUser = Partial<User> & Pick<User, 'id' | 'email'>;

const mockUser: MockUser = {
  id: 'test-id',
  email: 'test@example.com',
  name: 'Test User'
};

mockPrisma.user.findUnique.mockResolvedValue(mockUser as User);
```

### 2. Types Prisma et Base de Données

**❌ Éviter :**
```typescript
// @ts-ignore - Incompatibilité de type
const userId = Number(params.userId);
```

**✅ Préférer :**
```typescript
// Validation explicite avec Zod
const UserIdSchema = z.string().transform((val) => {
  const parsed = parseInt(val, 10);
  if (isNaN(parsed)) {
    throw new Error('Invalid user ID');
  }
  return parsed;
});

const userId = UserIdSchema.parse(params.userId);
```

### 3. Propriétés Dynamiques d'Objets

**❌ Éviter :**
```typescript
// @ts-ignore - Accès dynamique
const value = obj[dynamicKey];
```

**✅ Préférer :**
```typescript
// Type guards et assertion de type
function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

if (hasProperty(obj, dynamicKey)) {
  const value = obj[dynamicKey];
}
```

### 4. APIs Externes et Intégrations

**❌ Éviter :**
```typescript
// @ts-ignore - API externe
const response = await fetch(url);
```

**✅ Préférer :**
```typescript
// Types d'API explicites
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

async function fetchTypedData<T>(url: string): Promise<ApiResponse<T>> {
  const response = await fetch(url);
  return response.json() as Promise<ApiResponse<T>>;
}
```

### 5. Extensions Jest et Testing

**❌ Éviter :**
```typescript
// @ts-ignore - Extension jest-dom
expect(element).toBeInTheDocument();
```

**✅ Préférer :**
```typescript
// setup-tests.ts
import '@testing-library/jest-dom';

// types/jest-dom.d.ts
import '@testing-library/jest-dom';
```

## 🛠️ Outils et Patterns Recommandés

### 1. Zod pour la Validation
```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
});

type User = z.infer<typeof UserSchema>;
```

### 2. Type Guards
```typescript
function isUser(obj: unknown): obj is User {
  return UserSchema.safeParse(obj).success;
}
```

### 3. Utility Types
```typescript
// Pour les mises à jour partielles
type UserUpdate = Partial<Pick<User, 'name' | 'email'>>;

// Pour les types requis
type UserCreation = Required<Pick<User, 'email'>> & Partial<User>;
```

### 4. Types de Service
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: K, data: Partial<T>): Promise<T>;
  delete(id: K): Promise<void>;
}
```

## 📝 Conventions de Nommage

### Types et Interfaces
```typescript
// Types de données métier
type User = { /* ... */ };
type LeaveRequest = { /* ... */ };

// Interfaces de service
interface UserService { /* ... */ }
interface LeaveRepository { /* ... */ }

// Types d'API
type CreateUserRequest = { /* ... */ };
type UpdateUserResponse = { /* ... */ };

// Types d'erreur
type ValidationError = { /* ... */ };
type ServiceError = { /* ... */ };
```

### Enums et Constantes
```typescript
// Enums en PascalCase
enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Constantes typées
const API_ENDPOINTS = {
  USERS: '/api/utilisateurs',
  LEAVES: '/api/conges'
} as const;

type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];
```

## 🧪 Patterns pour les Tests

### 1. Factory Functions
```typescript
// tests/factories/userFactory.ts
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'test-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date(),
    ...overrides
  };
}
```

### 2. Type-Safe Mocks
```typescript
import type { PrismaClient } from '@prisma/client';

export function createMockPrisma(): jest.Mocked<PrismaClient> {
  return {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    // ... autres modèles
  } as jest.Mocked<PrismaClient>;
}
```

## 🚨 Gestion d'Erreurs

### 1. Result Pattern
```typescript
type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

async function safeOperation<T>(
  operation: () => Promise<T>
): Promise<Result<T>> {
  try {
    const data = await operation();
    return { success: true, data };
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}
```

### 2. Error Types
```typescript
class ValidationError extends Error {
  constructor(public field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
    this.name = 'NotFoundError';
  }
}
```

## 📊 Métriques et Objectifs

### Cibles Actuelles
- **@ts-ignore actuels :** 93
- **Objectif :** < 45 (réduction de 50%)
- **TODO/FIXME :** ~100+
- **Objectif :** < 40 (réduction de 60%)

### Processus de Review
1. Aucun PR ne peut introduire de nouveaux `@ts-ignore`
2. Chaque suppression de `@ts-ignore` doit être documentée
3. Tests obligatoires pour tout nouveau type créé
4. Review obligatoire pour les types complexes

## 🔄 Migration Graduelle

### Phase 1 : @ts-ignore Simples (Target: -25)
- Mocks de tests
- Types de propriétés simples
- Extensions jest-dom

### Phase 2 : @ts-ignore Moyens (Target: -15)
- API externes
- Intégrations Prisma
- Types de service

### Phase 3 : @ts-ignore Complexes (Target: -5)
- Architecture patterns
- Types génériques avancés
- Legacy code

## ✅ Checklist Avant Merge

- [ ] Aucun nouveau `@ts-ignore`
- [ ] Types appropriés pour toute nouvelle fonction
- [ ] Tests couvrant les nouveaux types
- [ ] Documentation des patterns complexes
- [ ] Validation Zod pour les inputs externes
- [ ] Error handling approprié 