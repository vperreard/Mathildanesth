# Guide Développeur - Mathildanesth

## Introduction

Ce guide couvre tous les aspects du développement pour Mathildanesth, une application de gestion de planning médical pour les équipes d'anesthésie.

## Configuration de l'Environnement

### Prérequis

**Logiciels Requis :**
- Node.js 20+ (LTS recommandé)
- PostgreSQL 14+
- Redis 6+
- Git
- Docker (optionnel pour développement)

**IDE Recommandé :**
- Visual Studio Code avec extensions :
  - TypeScript
  - Prisma
  - Tailwind CSS IntelliSense
  - ES7+ React/Redux/React-Native snippets
  - Auto Rename Tag

### Installation Initiale

```bash
# 1. Cloner le repository
git clone https://github.com/your-org/mathildanesth.git
cd mathildanesth

# 2. Installer les dépendances
npm install

# 3. Configuration environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres

# 4. Base de données
npx prisma migrate dev
npx prisma generate
npm run db:seed

# 5. Démarrer en développement
npm run dev
```

### Variables d'Environnement

```bash
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/mathildanesth"
REDIS_URL="redis://localhost:6379"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Optionnel
PUSHER_APP_ID="your-pusher-id"
PUSHER_SECRET="your-pusher-secret"
NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```

## Architecture du Code

### Structure des Dossiers

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # Routes API
│   │   ├── auth/          # Authentification
│   │   ├── leaves/        # Gestion congés
│   │   ├── planning/      # Planning
│   │   └── admin/         # Administration
│   ├── (auth)/            # Pages auth (groupées)
│   ├── (user)/            # Pages utilisateur
│   ├── (admin)/           # Pages admin
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
├── modules/               # Modules métier
│   ├── leaves/            # Module congés
│   │   ├── components/    # Composants spécifiques
│   │   ├── hooks/         # Hooks React
│   │   ├── services/      # Services métier
│   │   └── types/         # Types TypeScript
│   ├── planning/          # Module planning
│   └── ...
├── components/            # Composants UI partagés
│   ├── ui/               # Composants de base (Button, Input...)
│   ├── forms/            # Composants formulaires
│   ├── layout/           # Composants layout
│   └── ...
├── hooks/                 # Hooks React globaux
├── services/              # Services partagés
├── lib/                   # Utilitaires et configuration
│   ├── auth/             # Système authentification
│   ├── database/         # Configuration DB
│   ├── utils/            # Fonctions utilitaires
│   └── ...
├── types/                 # Types TypeScript globaux
└── styles/               # Styles CSS personnalisés
```

### Conventions de Nommage

**Fichiers et Dossiers :**
- `kebab-case` pour les dossiers
- `PascalCase` pour les composants React
- `camelCase` pour les utilitaires et services
- `UPPER_CASE` pour les constantes

**Variables et Fonctions :**
```typescript
// Variables et fonctions : camelCase
const userName = 'Jean Dupont';
const getUserById = (id: string) => { };

// Constantes : UPPER_CASE
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Types et Interfaces : PascalCase
interface UserProfile {
  id: string;
  nom: string;
  prenom: string;
}

// Enums : PascalCase avec valeurs UPPER_CASE
enum UserRole {
  ADMIN_TOTAL = 'ADMIN_TOTAL',
  ADMIN_PARTIEL = 'ADMIN_PARTIEL',
  MAR = 'MAR',
  IADE = 'IADE'
}
```

## Développement Frontend

### Composants React

**Structure Type d'un Composant :**
```typescript
// components/UserProfile.tsx
import { useState, useEffect } from 'react';
import { User } from '@/types/user';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';

interface UserProfileProps {
  user: User;
  onUpdate?: (user: User) => void;
  className?: string;
}

export function UserProfile({ 
  user, 
  onUpdate, 
  className = '' 
}: UserProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const { hasPermission } = useAuth();

  const handleSave = async (userData: Partial<User>) => {
    try {
      // Logique de sauvegarde
      onUpdate?.(updatedUser);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  if (!hasPermission('users:read:own')) {
    return <div>Accès non autorisé</div>;
  }

  return (
    <div className={`user-profile ${className}`}>
      {/* JSX du composant */}
    </div>
  );
}

// Export par défaut si composant principal du fichier
export default UserProfile;
```

**Hooks Personnalisés :**
```typescript
// hooks/useLeaves.ts
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesService } from '@/services/leavesService';
import { Leave, CreateLeaveRequest } from '@/types/leave';

export function useLeaves(filters?: LeaveFilters) {
  const queryClient = useQueryClient();

  // Récupération des congés
  const {
    data: leaves,
    isLoading,
    error
  } = useQuery({
    queryKey: ['leaves', filters],
    queryFn: () => leavesService.getLeaves(filters),
  });

  // Création d'un congé
  const createLeaveMutation = useMutation({
    mutationFn: (data: CreateLeaveRequest) => 
      leavesService.createLeave(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });

  return {
    leaves,
    isLoading,
    error,
    createLeave: createLeaveMutation.mutate,
    isCreating: createLeaveMutation.isPending
  };
}
```

### Gestion d'État

**React Query pour l'État Serveur :**
```typescript
// lib/reactQuery.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,     // 5 minutes
      gcTime: 10 * 60 * 1000,       // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

export function ReactQueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Context API pour l'État Global :**
```typescript
// context/AuthContext.tsx
import { createContext, useContext, useReducer } from 'react';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
}

interface AuthContextType extends AuthState {
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Formulaires et Validation

**React Hook Form + Zod :**
```typescript
// components/forms/CreateLeaveForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const createLeaveSchema = z.object({
  startDate: z.date({
    required_error: 'Date de début requise',
  }),
  endDate: z.date({
    required_error: 'Date de fin requise',
  }),
  type: z.enum(['ANNUAL', 'SICK', 'TRAINING'], {
    required_error: 'Type de congé requis',
  }),
  reason: z.string().min(1, 'Raison requise').max(500, 'Raison trop longue'),
}).refine(data => data.endDate >= data.startDate, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
});

type CreateLeaveForm = z.infer<typeof createLeaveSchema>;

export function CreateLeaveForm({ onSubmit }: { onSubmit: (data: CreateLeaveForm) => void }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue
  } = useForm<CreateLeaveForm>({
    resolver: zodResolver(createLeaveSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="startDate">Date de début</label>
        <input
          type="date"
          {...register('startDate', { valueAsDate: true })}
          className="input"
        />
        {errors.startDate && (
          <p className="text-red-500 text-sm">{errors.startDate.message}</p>
        )}
      </div>
      
      {/* Autres champs... */}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="btn btn-primary"
      >
        {isSubmitting ? 'Création...' : 'Créer le congé'}
      </button>
    </form>
  );
}
```

## Développement Backend

### Routes API (App Router)

**Structure d'une Route API :**
```typescript
// app/api/leaves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authMiddleware, requirePermission } from '@/lib/middleware/auth';
import { leavesService } from '@/services/leavesService';
import { validateRequest } from '@/lib/validation';

const getLeavesSchema = z.object({
  page: z.string().optional().transform(Number).default(1),
  limit: z.string().optional().transform(Number).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  userId: z.string().optional(),
});

const createLeaveSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  type: z.enum(['ANNUAL', 'SICK', 'TRAINING', 'SPECIAL']),
  reason: z.string().optional(),
  isRecurring: z.boolean().default(false),
});

// GET /api/leaves
export async function GET(request: NextRequest) {
  try {
    // Authentification
    const authResult = await authMiddleware(request);
    if (authResult.error) {
      return authResult.response;
    }
    
    // Autorisation
    if (!requirePermission(authResult.user, 'leaves:read:own')) {
      return NextResponse.json(
        { success: false, error: { message: 'Accès non autorisé', code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    // Validation query parameters
    const { data: filters, error } = validateRequest(
      Object.fromEntries(request.nextUrl.searchParams),
      getLeavesSchema
    );
    
    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    // Business logic
    const result = await leavesService.getLeaves(authResult.user, filters);
    
    return NextResponse.json({
      success: true,
      data: result.data,
      meta: result.meta
    });

  } catch (error) {
    console.error('Erreur GET /api/leaves:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}

// POST /api/leaves
export async function POST(request: NextRequest) {
  try {
    const authResult = await authMiddleware(request);
    if (authResult.error) {
      return authResult.response;
    }

    if (!requirePermission(authResult.user, 'leaves:create:own')) {
      return NextResponse.json(
        { success: false, error: { message: 'Accès non autorisé', code: 'FORBIDDEN' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { data: leaveData, error } = validateRequest(body, createLeaveSchema);
    
    if (error) {
      return NextResponse.json(
        { success: false, error },
        { status: 400 }
      );
    }

    const leave = await leavesService.createLeave(authResult.user, leaveData);
    
    return NextResponse.json(
      { success: true, data: leave },
      { status: 201 }
    );

  } catch (error) {
    if (error.code === 'QUOTA_EXCEEDED') {
      return NextResponse.json(
        { success: false, error: { message: 'Quota de congés dépassé', code: 'QUOTA_EXCEEDED' } },
        { status: 422 }
      );
    }
    
    console.error('Erreur POST /api/leaves:', error);
    return NextResponse.json(
      { success: false, error: { message: 'Erreur interne', code: 'INTERNAL_ERROR' } },
      { status: 500 }
    );
  }
}
```

### Services Métier

**Structure d'un Service :**
```typescript
// services/leavesService.ts
import { prisma } from '@/lib/database/prisma';
import { redis } from '@/lib/database/redis';
import { User, Leave, CreateLeaveRequest } from '@/types';
import { auditLogger } from '@/lib/logging/audit';
import { quotaService } from './quotaService';
import { conflictDetectionService } from './conflictDetectionService';

export class LeavesService {
  async getLeaves(user: User, filters: LeaveFilters) {
    const cacheKey = `leaves:${user.id}:${JSON.stringify(filters)}`;
    
    // Vérifier cache Redis
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Construire la requête Prisma
    const where = this.buildWhereClause(user, filters);
    
    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          user: {
            select: { nom: true, prenom: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
      }),
      prisma.leave.count({ where })
    ]);

    const result = {
      data: leaves,
      meta: {
        total,
        page: filters.page,
        limit: filters.limit,
        totalPages: Math.ceil(total / filters.limit)
      }
    };

    // Cache pour 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(result));
    
    return result;
  }

  async createLeave(user: User, data: CreateLeaveRequest): Promise<Leave> {
    // Validation métier
    await this.validateLeaveRequest(user, data);
    
    // Vérifier quota
    const quota = await quotaService.checkQuota(user.id, data.type, data.startDate, data.endDate);
    if (!quota.allowed) {
      throw new Error('QUOTA_EXCEEDED');
    }

    // Détecter conflits
    const conflicts = await conflictDetectionService.detectConflicts(user.id, data);
    
    const leave = await prisma.$transaction(async (tx) => {
      // Créer le congé
      const newLeave = await tx.leave.create({
        data: {
          ...data,
          userId: user.id,
          quotaUsed: quota.daysUsed,
          status: conflicts.length > 0 ? 'PENDING' : 'APPROVED'
        },
        include: {
          user: true
        }
      });

      // Mettre à jour quota
      await quotaService.updateQuota(tx, user.id, data.type, quota.daysUsed);

      // Enregistrer les conflits
      if (conflicts.length > 0) {
        await this.recordConflicts(tx, newLeave.id, conflicts);
      }

      return newLeave;
    });

    // Audit log
    await auditLogger.log('LEAVE_CREATED', user.id, {
      leaveId: leave.id,
      type: data.type,
      duration: quota.daysUsed
    });

    // Invalider cache
    await this.invalidateUserCache(user.id);

    // Notification si nécessaire
    if (leave.status === 'PENDING') {
      await this.notifyAdmins(leave);
    }

    return leave;
  }

  private async validateLeaveRequest(user: User, data: CreateLeaveRequest) {
    // Validation des dates
    if (new Date(data.endDate) <= new Date(data.startDate)) {
      throw new Error('INVALID_DATE_RANGE');
    }

    // Validation type de congé
    const allowedTypes = await this.getAllowedLeaveTypes(user);
    if (!allowedTypes.includes(data.type)) {
      throw new Error('LEAVE_TYPE_NOT_ALLOWED');
    }

    // Validation préavis
    const minNotice = await this.getMinimumNotice(data.type);
    const noticeGiven = new Date(data.startDate).getTime() - Date.now();
    if (noticeGiven < minNotice) {
      throw new Error('INSUFFICIENT_NOTICE');
    }
  }

  private buildWhereClause(user: User, filters: LeaveFilters) {
    const where: any = {};

    // Filtrage par permissions
    if (user.role === 'USER' || user.role === 'MAR' || user.role === 'IADE') {
      where.userId = user.id; // Ne peut voir que ses congés
    } else if (filters.userId) {
      where.userId = filters.userId;
    }

    // Autres filtres
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.AND = [];
      if (filters.startDate) {
        where.AND.push({ endDate: { gte: new Date(filters.startDate) } });
      }
      if (filters.endDate) {
        where.AND.push({ startDate: { lte: new Date(filters.endDate) } });
      }
    }

    return where;
  }

  private async invalidateUserCache(userId: string) {
    const pattern = `leaves:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const leavesService = new LeavesService();
```

## Base de Données

### Prisma Schema

**Modèle Type :**
```prisma
// schema.prisma
model Leave {
  id              String      @id @default(cuid())
  userId          String
  startDate       DateTime
  endDate         DateTime
  type            LeaveType
  status          LeaveStatus @default(PENDING)
  reason          String?
  isRecurring     Boolean     @default(false)
  recurringConfig Json?
  quotaUsed       Float       @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  user            User        @relation(fields: [userId], references: [id])
  conflicts       LeaveConflict[]
  analytics       LeaveAnalytics[]

  // Index pour performance
  @@index([userId, startDate, endDate])
  @@index([status, createdAt])
  @@map("leaves")
}

enum LeaveType {
  ANNUAL
  SICK
  TRAINING
  SPECIAL
  UNPAID
}

enum LeaveStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}
```

### Migrations

**Créer une Migration :**
```bash
# Créer une nouvelle migration
npx prisma migrate dev --name add_leave_analytics

# Appliquer en production
npx prisma migrate deploy

# Réinitialiser la DB (dev seulement)
npx prisma migrate reset
```

**Migration Personnalisée :**
```sql
-- migrations/001_add_performance_indexes.sql
BEGIN;

-- Index pour les requêtes fréquentes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leaves_user_date 
ON leaves(user_id, start_date, end_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_planning_site_date 
ON bloc_day_planning(site_id, date);

-- Contrainte pour éviter les doublons
ALTER TABLE leave_quotas 
ADD CONSTRAINT unique_user_year_type 
UNIQUE (user_id, year, type);

COMMIT;
```

## Tests

### Configuration Jest

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
```

### Tests Unitaires

```typescript
// __tests__/services/leavesService.test.ts
import { leavesService } from '@/services/leavesService';
import { prisma } from '@/lib/database/prisma';
import { createMockUser, createMockLeave } from '@/test-utils/factories';

// Mock Prisma
jest.mock('@/lib/database/prisma', () => ({
  leave: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
}));

describe('LeavesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLeaves', () => {
    it('should return user leaves with pagination', async () => {
      // Arrange
      const user = createMockUser({ role: 'MAR' });
      const mockLeaves = [createMockLeave(), createMockLeave()];
      
      (prisma.leave.findMany as jest.Mock).mockResolvedValue(mockLeaves);
      (prisma.leave.count as jest.Mock).mockResolvedValue(10);

      // Act
      const result = await leavesService.getLeaves(user, { page: 1, limit: 20 });

      // Assert
      expect(result.data).toEqual(mockLeaves);
      expect(result.meta.total).toBe(10);
      expect(prisma.leave.findMany).toHaveBeenCalledWith({
        where: { userId: user.id },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 20,
      });
    });

    it('should apply role-based filtering', async () => {
      // Test que les utilisateurs ne voient que leurs congés
      const user = createMockUser({ role: 'USER' });
      
      await leavesService.getLeaves(user, { page: 1, limit: 20 });
      
      expect(prisma.leave.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: user.id }
        })
      );
    });
  });

  describe('createLeave', () => {
    it('should create leave successfully', async () => {
      // Mock des dépendances
      const user = createMockUser();
      const leaveData = {
        startDate: '2025-07-01T00:00:00Z',
        endDate: '2025-07-05T00:00:00Z',
        type: 'ANNUAL' as const,
        reason: 'Vacances été'
      };

      const mockLeave = createMockLeave(leaveData);
      (prisma.$transaction as jest.Mock).mockResolvedValue(mockLeave);

      // Act
      const result = await leavesService.createLeave(user, leaveData);

      // Assert
      expect(result).toEqual(mockLeave);
      expect(prisma.$transaction).toHaveBeenCalled();
    });

    it('should throw error when quota exceeded', async () => {
      // Test gestion erreur quota
      const user = createMockUser();
      const leaveData = {
        startDate: '2025-07-01T00:00:00Z',
        endDate: '2025-07-05T00:00:00Z',
        type: 'ANNUAL' as const,
      };

      // Mock quota service pour retourner quota dépassé
      jest.spyOn(quotaService, 'checkQuota').mockResolvedValue({
        allowed: false,
        reason: 'QUOTA_EXCEEDED'
      });

      // Act & Assert
      await expect(leavesService.createLeave(user, leaveData))
        .rejects.toThrow('QUOTA_EXCEEDED');
    });
  });
});
```

### Tests d'Intégration

```typescript
// __tests__/api/leaves.test.ts
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/leaves/route';
import { createMockUser, createMockRequest } from '@/test-utils/api';

describe('/api/leaves', () => {
  describe('GET', () => {
    it('should return leaves for authenticated user', async () => {
      // Arrange
      const user = createMockUser();
      const request = createMockRequest({
        url: 'http://localhost:3000/api/leaves?page=1&limit=10',
        user
      });

      // Act
      const response = await GET(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.meta).toBeDefined();
    });

    it('should return 401 for unauthenticated request', async () => {
      const request = createMockRequest({
        url: 'http://localhost:3000/api/leaves'
      });

      const response = await GET(request);
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('should create leave successfully', async () => {
      const user = createMockUser();
      const leaveData = {
        startDate: '2025-07-01T00:00:00Z',
        endDate: '2025-07-05T00:00:00Z',
        type: 'ANNUAL',
        reason: 'Vacances'
      };

      const request = createMockRequest({
        method: 'POST',
        url: 'http://localhost:3000/api/leaves',
        body: leaveData,
        user
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.type).toBe('ANNUAL');
    });
  });
});
```

### Tests E2E avec Cypress

```typescript
// cypress/e2e/leaves.cy.ts
describe('Gestion des Congés', () => {
  beforeEach(() => {
    // Connexion utilisateur
    cy.login('jean.dupont@hopital.fr', 'password');
    cy.visit('/conges');
  });

  it('should create a new leave request', () => {
    // Cliquer sur "Nouvelle demande"
    cy.get('[data-cy=new-leave-button]').click();

    // Remplir le formulaire
    cy.get('[data-cy=start-date]').type('2025-07-01');
    cy.get('[data-cy=end-date]').type('2025-07-05');
    cy.get('[data-cy=leave-type]').select('ANNUAL');
    cy.get('[data-cy=reason]').type('Vacances été');

    // Soumettre
    cy.get('[data-cy=submit-button]').click();

    // Vérifier succès
    cy.get('[data-cy=success-message]').should('be.visible');
    cy.get('[data-cy=leaves-list]').should('contain', 'Vacances été');
  });

  it('should display quota information', () => {
    cy.get('[data-cy=quota-annual]').should('be.visible');
    cy.get('[data-cy=quota-remaining]').should('contain', 'jour');
  });

  it('should validate date range', () => {
    cy.get('[data-cy=new-leave-button]').click();
    
    // Dates invalides (fin avant début)
    cy.get('[data-cy=start-date]').type('2025-07-05');
    cy.get('[data-cy=end-date]').type('2025-07-01');
    cy.get('[data-cy=submit-button]').click();

    // Vérifier message erreur
    cy.get('[data-cy=error-message]')
      .should('contain', 'date de fin doit être après');
  });
});
```

## Commandes de Développement

### Scripts NPM Essentiels

```bash
# Développement
npm run dev              # Démarrer serveur développement
npm run dev:debug        # Mode debug avec inspection
npm run dev:clean        # Nettoyage + démarrage

# Build et Production
npm run build            # Build production
npm run start            # Démarrer serveur production
npm run lint             # Linting ESLint
npm run type-check       # Vérification TypeScript

# Base de données
npm run db:migrate       # Appliquer migrations
npm run db:seed          # Peupler base de données
npm run db:studio        # Interface Prisma Studio
npm run db:reset         # Réinitialiser DB (dev)

# Tests
npm test                 # Tests unitaires
npm run test:watch       # Tests en mode watch
npm run test:coverage    # Couverture de tests
npm run test:e2e         # Tests E2E Cypress

# Qualité
npm run validate         # Lint + type-check + tests
npm run format           # Formatage Prettier
npm run audit            # Audit sécurité

# Performance
npm run perf:analyze     # Analyse bundle
npm run perf:audit       # Audit performance
```

### Points d'Étape Développement

```bash
# Avant chaque commit
npm run validate         # Vérification complète
npm run test:critical    # Tests des modules critiques

# Checkpoint projet
npm run etape           # Script audit global personnalisé

# Avant mise en production
npm run build           # Vérifier build
npm run test:e2e        # Tests E2E complets
```

## Débogage

### Logs et Monitoring

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Usage dans le code
logger.info('User login successful', { userId: user.id, email: user.email });
logger.error('Database connection failed', { error: error.message });
```

### Débogage API Routes

```typescript
// Middleware de debugging
export function debugMiddleware(request: NextRequest) {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    process.nextTick(() => {
      const duration = Date.now() - startTime;
      
      logger.debug('API Request', {
        method: request.method,
        url: request.url,
        duration,
        userAgent: request.headers.get('user-agent'),
      });
      
      resolve(null);
    });
  });
}
```

### Outils de Développement

**Performance Dashboard :**
- Accès : `/admin/performance`
- Métriques temps réel
- Surveillance des requêtes lentes

**Prisma Studio :**
```bash
npx prisma studio  # Interface graphique DB
```

**React DevTools & React Query DevTools :**
- Extensions navigateur recommandées
- Debugging état React et requêtes

---

*Guide Développeur mis à jour : Juin 2025*