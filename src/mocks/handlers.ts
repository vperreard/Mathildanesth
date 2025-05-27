import { rest } from 'msw';
import { LeaveConflict, ConflictSeverity, ConflictType } from '../modules/conges/types/conflict';

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
    rest.post('/api/conges/check-conflicts', (req, res, ctx) => {
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
    rest.post('/api/conges', (req, res, ctx) => {
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

    // Gestionnaire pour /api/conges/balance
    rest.get('/api/conges/balance', (req, res, ctx) => {
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

    // Gestionnaire pour récupérer un congé par ID
    rest.get('/api/conges/:leaveId', (req, res, ctx) => {
        const { leaveId } = req.params;
        
        if (leaveId === 'non-existent-id') {
            return res(
                ctx.status(404),
                ctx.json({ error: 'Leave not found' })
            );
        }
        
        return res(
            ctx.status(200),
            ctx.json({
                id: leaveId,
                userId: 'mock-user-id',
                startDate: new Date('2023-07-10').toISOString(),
                endDate: new Date('2023-07-14').toISOString(),
                type: 'PAID',
                status: 'PENDING',
                reason: 'Vacances',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
        );
    }),
    
    // Gestionnaire pour récupérer la liste des congés
    rest.get('/api/conges', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                leaves: [
                    {
                        id: '1',
                        userId: 'mock-user-id',
                        startDate: new Date('2023-07-10').toISOString(),
                        endDate: new Date('2023-07-14').toISOString(),
                        type: 'PAID',
                        status: 'APPROVED',
                        reason: 'Vacances',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    },
                    {
                        id: '2',
                        userId: 'mock-user-id',
                        startDate: new Date('2023-08-01').toISOString(),
                        endDate: new Date('2023-08-05').toISOString(),
                        type: 'PAID',
                        status: 'PENDING',
                        reason: 'Congé été',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    }
                ],
                pagination: {
                    page: 1,
                    perPage: 50,
                    total: 2,
                    totalPages: 1
                }
            })
        );
    }),

    // Gestionnaire pour vérifier les conflits
    rest.get('/api/conges/check-conflicts', (req, res, ctx) => {
        const url = new URL(req.url.href);
        const startDate = url.searchParams.get('startDate');
        const endDate = url.searchParams.get('endDate');
        
        return res(
            ctx.status(200),
            ctx.json({
                hasBlockingConflicts: false,
                conflicts: []
            })
        );
    }),
    
    // Gestionnaire pour vérifier les quotas
    rest.get('/api/conges/check-allowance', (req, res, ctx) => {
        const url = new URL(req.url.href);
        const userId = url.searchParams.get('userId');
        const leaveType = url.searchParams.get('leaveType');
        const countedDays = url.searchParams.get('countedDays');
        
        return res(
            ctx.status(200),
            ctx.json({
                allowed: true,
                remaining: 20,
                used: 5,
                total: 25,
                message: 'Quota suffisant'
            })
        );
    }),
    
    // Gestionnaire pour les congés récurrents
    rest.post('/api/conges/recurrents', (req, res, ctx) => {
        return res(
            ctx.status(201),
            ctx.json({
                id: 'recurring-leave-1',
                parentId: null,
                isRecurring: true,
                recurrencePattern: req.body,
                occurrences: [],
                createdAt: new Date().toISOString()
            })
        );
    }),
    
    // Gestionnaire pour preview des congés récurrents
    rest.post('/api/conges/recurrents/preview', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                occurrences: [
                    {
                        startDate: new Date('2023-07-01').toISOString(),
                        endDate: new Date('2023-07-05').toISOString(),
                        days: 5
                    },
                    {
                        startDate: new Date('2023-08-01').toISOString(),
                        endDate: new Date('2023-08-05').toISOString(),
                        days: 5
                    }
                ],
                totalDays: 10,
                conflicts: []
            })
        );
    }),
    
    // Gestionnaire pour conflits des congés récurrents
    rest.post('/api/conges/recurrents/conflicts', (req, res, ctx) => {
        return res(
            ctx.status(200),
            ctx.json({
                hasConflicts: false,
                conflicts: [],
                occurrencesWithConflicts: []
            })
        );
    }),
    
    // Gestionnaire pour mettre à jour un congé
    rest.put('/api/conges/:leaveId', (req, res, ctx) => {
        const { leaveId } = req.params;
        
        return res(
            ctx.status(200),
            ctx.json({
                id: leaveId,
                ...req.body,
                updatedAt: new Date().toISOString()
            })
        );
    }),
    
    // Gestionnaire pour supprimer un congé
    rest.delete('/api/conges/:leaveId', (req, res, ctx) => {
        const { leaveId } = req.params;
        
        return res(
            ctx.status(200),
            ctx.json({
                success: true,
                deletedId: leaveId
            })
        );
    }),
    
    // Gestionnaire pour approuver un congé
    rest.post('/api/conges/:leaveId/approve', (req, res, ctx) => {
        const { leaveId } = req.params;
        
        return res(
            ctx.status(200),
            ctx.json({
                id: leaveId,
                status: 'APPROVED',
                approvedAt: new Date().toISOString(),
                approvedBy: 'mock-admin-id'
            })
        );
    }),
    
    // Gestionnaire pour rejeter un congé
    rest.post('/api/conges/:leaveId/reject', (req, res, ctx) => {
        const { leaveId } = req.params;
        
        return res(
            ctx.status(200),
            ctx.json({
                id: leaveId,
                status: 'REJECTED',
                rejectedAt: new Date().toISOString(),
                rejectedBy: 'mock-admin-id',
                rejectionReason: req.body?.reason || 'Non spécifié'
            })
        );
    }),
    
    // Gestionnaire pour annuler un congé
    rest.post('/api/conges/:leaveId/cancel', (req, res, ctx) => {
        const { leaveId } = req.params;
        
        return res(
            ctx.status(200),
            ctx.json({
                id: leaveId,
                status: 'CANCELLED',
                cancelledAt: new Date().toISOString()
            })
        );
    }),

    // Ajouter d'autres gestionnaires au besoin...
]; 