/**
 * Factory simple pour générer des données de test
 */
import { TestFactory } from '@/tests/factories/testFactorySimple';


import { 
    BlocPlanningStatus,
    ConflictSeverity,
    BlocStaffRole,
    Period,
    DayOfWeek,
    WeekType 
} from '@prisma/client';

export class TestFactory {
    static Leave = {
        create: (overrides: any = {}) => ({
            id: overrides.id || '1',
            userId: overrides.userId || 1,
            type: overrides.type || 'ANNUAL',
            status: overrides.status || 'PENDING',
            startDate: overrides.startDate || new Date('2024-06-01'),
            endDate: overrides.endDate || new Date('2024-06-05'),
            reason: overrides.reason || 'Congés annuels',
            comment: overrides.comment || null,
            approvedBy: overrides.approvedBy || null,
            approvedAt: overrides.approvedAt || null,
            rejectedBy: overrides.rejectedBy || null,
            rejectedAt: overrides.rejectedAt || null,
            createdAt: overrides.createdAt || new Date(),
            updatedAt: overrides.updatedAt || new Date(),
            ...overrides
        }),
        
        createBatch: (count: number, userId?: number, overrides: any = {}) => {
            return Array.from({ length: count }, (_, i) => 
                TestFactory.Leave.create({
                    id: `leave-${i + 1}`,
                    userId: userId || i + 1,
                    ...overrides
                })
            );
        }
    };

    static User = {
        create: (overrides: any = {}) => ({
            id: overrides.id || 1,
            email: overrides.email || 'test@example.com',
            name: overrides.name || 'Test User',
            role: overrides.role || 'USER',
            status: overrides.status || 'ACTIF',
            professionalRole: overrides.professionalRole || 'MAR',
            password: overrides.password || 'hashedPassword',
            createdAt: overrides.createdAt || new Date(),
            updatedAt: overrides.updatedAt || new Date(),
            ...overrides
        }),
        
        createBatch: (count: number, overrides: any = {}) => {
            return Array.from({ length: count }, (_, i) => 
                TestFactory.User.create({
                    id: i + 1,
                    email: `user${i + 1}@example.com`,
                    name: `User ${i + 1}`,
                    ...overrides
                })
            );
        }
    };

    static LeaveBalance = {
        create: (overrides: any = {}) => ({
            id: overrides.id || 1,
            userId: overrides.userId || 1,
            leaveType: overrides.leaveType || 'ANNUAL',
            year: overrides.year || new Date().getFullYear(),
            total: overrides.total || 30,
            used: overrides.used || 0,
            pending: overrides.pending || 0,
            remaining: overrides.remaining || 30,
            createdAt: overrides.createdAt || new Date(),
            updatedAt: overrides.updatedAt || new Date(),
            ...overrides
        })
    };
    static createSite(overrides: any = {}) {
        return {
            id: '1',
            name: 'Site Test',
            description: 'Site de test',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createOperatingRoom(overrides: any = {}) {
        return {
            id: 1,
            name: 'Salle 1',
            description: 'Salle de test',
            capacity: 1,
            equipment: ['Respirateur', 'Monitoring'],
            sectorId: 1,
            displayOrder: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createOperatingSector(overrides: any = {}) {
        return {
            id: 1,
            name: 'Secteur Test',
            description: 'Secteur de test',
            displayOrder: 1,
            category: 'STANDARD',
            sectorType: 'GENERAL',
            supervisionRules: {
                maxRoomsPerSupervisor: 2,
                requiresContiguousRooms: true,
                compatibleSectors: ['GENERAL']
            },
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createUser(overrides: any = {}) {
        return {
            id: 1,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User',
            role: 'SUPERVISOR',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createSurgeon(overrides: any = {}) {
        return {
            id: 1,
            userId: 1,
            specialtyId: 1,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createBlocPlanning(overrides: any = {}) {
        return {
            id: 1,
            siteId: '1',
            date: new Date(),
            weekType: WeekType.REGULAR,
            status: BlocPlanningStatus.DRAFT,
            version: 1,
            validatedAt: null,
            validatedById: null,
            publishedAt: null,
            publishedById: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createBlocDayPlanning(overrides: any = {}) {
        return {
            id: 1,
            blocPlanningId: 1,
            dayOfWeek: DayOfWeek.MONDAY,
            period: Period.MORNING,
            roomsOpen: 5,
            staffRequired: 3,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createBlocRoomAssignment(overrides: any = {}) {
        return {
            id: 1,
            blocDayPlanningId: 1,
            operatingRoomId: 1,
            activityTypeId: 1,
            surgeonId: 1,
            priority: 1,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createBlocStaffAssignment(overrides: any = {}) {
        return {
            id: 1,
            blocDayPlanningId: 1,
            userId: 1,
            role: BlocStaffRole.ANESTHESIA,
            roomIds: [1],
            startTime: new Date(),
            endTime: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createBlocPlanningConflict(overrides: any = {}) {
        return {
            id: 1,
            blocPlanningId: 1,
            severity: ConflictSeverity.WARNING,
            type: 'SUPERVISION_LIMIT',
            description: 'Limite de supervision dépassée',
            affectedEntityType: 'STAFF',
            affectedEntityId: '1',
            suggestedResolution: 'Réduire le nombre de salles',
            resolvedAt: null,
            resolvedById: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }

    static createValidationContext(overrides: any = {}) {
        return {
            supervisorId: 1,
            rooms: [
                TestFactory.createOperatingRoom({ id: 1, sectorId: 1 }),
                TestFactory.createOperatingRoom({ id: 2, sectorId: 1 }),
                TestFactory.createOperatingRoom({ id: 3, sectorId: 2 })
            ],
            sectors: [
                TestFactory.createOperatingSector({ id: 1, sectorType: 'GENERAL' }),
                TestFactory.createOperatingSector({ id: 2, sectorType: 'CARDIAC' })
            ],
            existingAssignments: [],
            ...overrides
        };
    }

    static createTrameModele(overrides: any = {}) {
        return {
            id: 1,
            name: 'Trame Test',
            description: 'Trame de test',
            typeActivite: 'BLOC',
            weekType: WeekType.REGULAR,
            siteId: '1',
            isActive: true,
            affectations: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            ...overrides
        };
    }
}