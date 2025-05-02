import { rest } from 'msw';
import { LeaveConflict, ConflictSeverity, ConflictType } from '../modules/leaves/types/conflict';

// Mock data pour les conflits de congés
const mockConflicts: Partial<LeaveConflict>[] = [
    {
        id: '1',
        type: ConflictType.USER_LEAVE_OVERLAP,
        severity: ConflictSeverity.ERROR,
        description: 'Ce congé chevauche un autre congé existant',
        startDate: new Date('2023-07-10'),
        endDate: new Date('2023-07-12'),
        leaveId: '123',
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: '2',
        type: ConflictType.SPECIALTY_CAPACITY,
        severity: ConflictSeverity.WARNING,
        description: 'Vous êtes le seul avec cette spécialité sur cette période',
        startDate: new Date('2023-07-15'),
        endDate: new Date('2023-07-15'),
        leaveId: '456',
        affectedUserIds: ['123'],
        resolved: false,
        createdAt: new Date(),
        updatedAt: new Date()
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

    // Ajouter d'autres gestionnaires au besoin...
]; 