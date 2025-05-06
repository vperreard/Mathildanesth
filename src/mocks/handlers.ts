import { rest } from 'msw';
import { LeaveConflict, ConflictSeverity, ConflictType } from '../modules/leaves/types/conflict';

// Mock data pour les conflits de congés
const mockConflicts: Partial<LeaveConflict>[] = [
    {
        id: '1',
        type: ConflictType.USER_LEAVE_OVERLAP,
        severity: ConflictSeverity.BLOQUANT,
        description: 'Ce congé chevauche un autre congé existant',
        startDate: new Date('2023-07-10').toISOString(),
        endDate: new Date('2023-07-12').toISOString(),
        leaveId: '123',
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: '2',
        type: ConflictType.SPECIALTY_CAPACITY,
        severity: ConflictSeverity.AVERTISSEMENT,
        description: 'Vous êtes le seul avec cette spécialité sur cette période',
        startDate: new Date('2023-07-15').toISOString(),
        endDate: new Date('2023-07-15').toISOString(),
        leaveId: '456',
        affectedUserIds: ['123'],
        resolved: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

export const handlers = [
    // Gestionnaire pour le endpoint de vérification des conflits
    rest.post('/api/leaves/check-conflicts', (req, res, ctx) => {
        // Simulation d'un délai réseau
        return res(
            ctx.delay(100),
            ctx.status(200),
            ctx.json({
                hasBlockingConflicts: true,
                conflicts: mockConflicts
            })
        );
    }),

    // Gestionnaire pour le endpoint de création d'un congé
    rest.post('/api/leaves', (req, res, ctx) => {
        return res(
            ctx.delay(100),
            ctx.status(201),
            ctx.json({
                id: '999',
                startDate: '2023-07-10',
                endDate: '2023-07-14',
                status: 'PENDING',
                userId: '1',
                type: 'PAID',
                createdAt: new Date().toISOString()
            })
        );
    }),

    // Gestionnaire pour /api/auth/me
    rest.get('/api/auth/me', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                authenticated: true,
                user: {
                    id: 'mock-user-id',
                    login: 'testuser',
                    nom: 'Test',
                    prenom: 'User',
                    email: 'test@example.com',
                    role: 'ADMIN_TOTAL', // Adapter le rôle si nécessaire
                    mustChangePassword: false,
                    // ... autres propriétés utilisateur si besoin
                }
            })
        );
    }),

    // Gestionnaire pour /api/leaves/balance
    rest.get('/api/leaves/balance', (req, res, ctx) => {
        // Simuler une balance de congés
        return res(
            ctx.status(200),
            ctx.json({
                userId: 'mock-user-id', // Utiliser le même ID que dans /api/auth/me
                year: new Date().getFullYear(),
                initialAllowance: 25,
                additionalAllowance: 5,
                used: 10,
                pending: 2,
                remaining: 18,
                detailsByType: {
                    ANNUAL: { used: 8, pending: 1 },
                    RECOVERY: { used: 2, pending: 1 },
                },
                lastUpdated: new Date().toISOString()
            })
        );
    }),

    // Ajouter d'autres gestionnaires au besoin...
]; 