/**
 * Factory simple pour générer des données de test
 */

import { 
    BlocPlanningStatus,
    ConflictSeverity,
    BlocStaffRole,
    Period,
    DayOfWeek,
    WeekType 
} from '@prisma/client';

export class TestFactory {
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