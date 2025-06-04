/**
 * Factory Pattern pour la génération de données de test
 * Chaque factory permet de créer des instances valides pour les tests
 */

import { faker } from '@faker-js/faker/locale/fr';
import type {
    User,
    Leave,
    OperatingRoom,
    BlocDayPlanning,
    BlocRoomAssignment,
    LeaveBalance,
    Site,
    Surgeon,
    Attribution,
    Role,
    LeaveType,
    LeaveStatus,
    ProfessionalRole,
    WorkPatternType,
    Period,
    BlocPlanningStatus
} from '@prisma/client';

// Types pour les factories avec des champs optionnels
type UserFactoryInput = Partial<User>;
type LeaveFactoryInput = Partial<Leave>;
type OperatingRoomFactoryInput = Partial<OperatingRoom>;
type BlocDayPlanningFactoryInput = Partial<BlocDayPlanning>;
type BlocRoomAssignmentFactoryInput = Partial<BlocRoomAssignment>;
type LeaveBalanceFactoryInput = Partial<LeaveBalance>;
type SiteFactoryInput = Partial<Site>;
type SurgeonFactoryInput = Partial<Surgeon>;

/**
 * Factory pour créer des utilisateurs de test
 */
export class UserFactory {
    static create(overrides: UserFactoryInput = {}): User {
        return {
            id: faker.number.int({ min: 1, max: 999999 }),
            nom: faker.person.lastName(),
            prenom: faker.person.firstName(),
            login: faker.internet.userName(),
            email: faker.internet.email(),
            password: faker.internet.password(),
            role: 'USER' as Role,
            professionalRole: 'MAR' as ProfessionalRole,
            tempsPartiel: false,
            pourcentageTempsPartiel: null,
            dateEntree: null,
            dateSortie: null,
            actif: true,
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            mustChangePassword: false,
            phoneNumber: null,
            alias: null,
            workOnMonthType: null,
            workPattern: 'FULL_TIME' as WorkPatternType,
            joursTravaillesSemaineImpaire: [],
            joursTravaillesSemainePaire: [],
            displayPreferences: null,
            lastLogin: faker.date.recent(),
            departmentId: null,
            canSuperviseEndo: false,
            canSuperviseOphtalmo: false,
            ...overrides,
        };
    }

    static createAdmin(overrides: UserFactoryInput = {}): User {
        return this.create({
            role: 'ADMIN_TOTAL' as Role,
            ...overrides,
        });
    }

    static createUser(overrides: UserFactoryInput = {}): User {
        return this.create({
            role: 'USER' as Role,
            professionalRole: 'MAR' as ProfessionalRole,
            ...overrides,
        });
    }

    static createBatch(count: number, overrides: UserFactoryInput = {}): User[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }
}

/**
 * Factory pour créer des congés de test
 */
export class LeaveFactory {
    static create(overrides: LeaveFactoryInput = {}): Leave {
        const startDate = faker.date.soon();
        const endDate = faker.date.soon({ days: 7, refDate: startDate });

        return {
            id: faker.string.uuid(),
            userId: faker.number.int({ min: 1, max: 999999 }),
            startDate,
            endDate,
            typeCode: 'ANNUAL',
            type: 'ANNUAL' as LeaveType,
            status: 'PENDING' as LeaveStatus,
            reason: faker.lorem.sentence(),
            comment: null,
            requestDate: faker.date.recent(),
            approvalDate: null,
            approvedById: null,
            countedDays: faker.number.float({ min: 1, max: 14 }),
            calculationDetails: null,
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            isRecurring: false,
            parentId: null,
            recurrencePattern: null,
            halfDayPeriod: null,
            isHalfDay: false,
            ...overrides,
        };
    }

    static createApproved(overrides: LeaveFactoryInput = {}): Leave {
        return this.create({
            status: 'APPROVED' as LeaveStatus,
            approvalDate: faker.date.recent(),
            approvedById: faker.number.int({ min: 1, max: 999999 }),
            ...overrides,
        });
    }

    static createRecurring(overrides: LeaveFactoryInput = {}): Leave {
        return this.create({
            isRecurring: true,
            recurrencePattern: {
                frequency: 'WEEKLY',
                interval: 1,
                daysOfWeek: [1, 3, 5], // Lundi, Mercredi, Vendredi
                endDate: faker.date.future({ years: 1 }),
            },
            ...overrides,
        });
    }

    static createBatch(count: number, userId?: number, overrides: LeaveFactoryInput = {}): Leave[] {
        return Array.from({ length: count }, () =>
            this.create({
                userId: userId || faker.number.int({ min: 1, max: 999999 }),
                ...overrides
            })
        );
    }
}

/**
 * Factory pour créer des balances de congés (quotas)
 */
export class LeaveBalanceFactory {
    static create(overrides: LeaveBalanceFactoryInput = {}): LeaveBalance {
        return {
            id: faker.string.uuid(),
            userId: faker.number.int({ min: 1, max: 999999 }),
            leaveType: 'ANNUAL' as LeaveType,
            year: faker.date.recent().getFullYear(),
            initial: 25,
            used: faker.number.float({ min: 0, max: 20 }),
            pending: faker.number.float({ min: 0, max: 5 }),
            remaining: faker.number.float({ min: 5, max: 25 }),
            lastUpdated: faker.date.recent(),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            ...overrides,
        };
    }

    static createForUser(userId: number, year: number, overrides: LeaveBalanceFactoryInput = {}): LeaveBalance {
        return this.create({
            userId,
            year,
            ...overrides,
        });
    }

    static createBatch(count: number, overrides: LeaveBalanceFactoryInput = {}): LeaveBalance[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }
}

/**
 * Factory pour créer des sites
 */
export class SiteFactory {
    static create(overrides: SiteFactoryInput = {}): Site {
        return {
            id: faker.string.uuid(),
            name: `Hôpital ${faker.location.city()}`,
            isActive: true,
            displayOrder: faker.number.int({ min: 1, max: 10 }),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            address: faker.location.streetAddress(),
            colorCode: faker.color.rgb(),
            description: faker.company.catchPhrase(),
            timezone: 'Europe/Paris',
            ...overrides,
        };
    }

    static createBatch(count: number, overrides: SiteFactoryInput = {}): Site[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }
}

/**
 * Factory pour créer des salles d'opération
 */
export class OperatingRoomFactory {
    static create(overrides: OperatingRoomFactoryInput = {}): OperatingRoom {
        return {
            id: faker.number.int({ min: 1, max: 999999 }),
            name: `Salle ${faker.number.int({ min: 1, max: 20 })}`,
            isActive: true,
            sectorId: faker.number.int({ min: 1, max: 100 }),
            siteId: faker.string.uuid(),
            type: 'STANDARD',
            locationId: null,
            capacity: faker.number.int({ min: 1, max: 4 }),
            equipment: ['TABLE_CHIRURGICALE', 'MONITORING'],
            configuration: {
                specialty: 'GENERAL_SURGERY',
                hasLaparoscopy: faker.datatype.boolean(),
            },
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            ...overrides,
        };
    }

    static createBatch(count: number, siteId?: string, overrides: OperatingRoomFactoryInput = {}): OperatingRoom[] {
        return Array.from({ length: count }, () =>
            this.create({
                siteId: siteId || faker.string.uuid(),
                ...overrides
            })
        );
    }
}

/**
 * Factory pour créer des plannings de bloc journaliers
 */
export class BlocDayPlanningFactory {
    static create(overrides: BlocDayPlanningFactoryInput = {}): BlocDayPlanning {
        return {
            id: faker.string.uuid(),
            date: faker.date.soon(),
            siteId: faker.string.uuid(),
            status: 'DRAFT' as BlocPlanningStatus,
            lockedAt: null,
            lockedByUserId: null,
            validatedAt: null,
            validatedByUserId: null,
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            ...overrides,
        };
    }

    static createForDate(date: Date, siteId: string, overrides: BlocDayPlanningFactoryInput = {}): BlocDayPlanning {
        return this.create({
            date,
            siteId,
            ...overrides,
        });
    }

    static createBatch(count: number, overrides: BlocDayPlanningFactoryInput = {}): BlocDayPlanning[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }
}

/**
 * Factory pour créer des assignations de salles
 */
export class BlocRoomAssignmentFactory {
    static create(overrides: BlocRoomAssignmentFactoryInput = {}): BlocRoomAssignment {
        return {
            id: faker.string.uuid(),
            blocDayPlanningId: faker.string.uuid(),
            operatingRoomId: faker.number.int({ min: 1, max: 999999 }),
            period: 'MORNING' as Period,
            chirurgienId: faker.number.int({ min: 1, max: 999999 }),
            expectedSpecialty: 'GENERAL_SURGERY',
            sourceBlocTrameAffectationId: null,
            notes: faker.lorem.sentence(),
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            ...overrides,
        };
    }

    static createBatch(count: number, overrides: BlocRoomAssignmentFactoryInput = {}): BlocRoomAssignment[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }
}

/**
 * Factory pour créer des chirurgiens
 */
export class SurgeonFactory {
    static create(overrides: SurgeonFactoryInput = {}): Surgeon {
        return {
            id: faker.number.int({ min: 1, max: 999999 }),
            userId: faker.number.int({ min: 1, max: 999999 }),
            specialtyId: faker.number.int({ min: 1, max: 100 }),
            matricule: faker.string.alphanumeric(8).toUpperCase(),
            isActive: true,
            preferences: {
                preferredDays: ['MONDAY', 'TUESDAY', 'WEDNESDAY'],
                maxHoursPerWeek: 60,
            },
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent(),
            ...overrides,
        };
    }

    static createWithSpecialty(specialtyId: number, overrides: SurgeonFactoryInput = {}): Surgeon {
        return this.create({
            specialtyId,
            ...overrides,
        });
    }

    static createBatch(count: number, overrides: SurgeonFactoryInput = {}): Surgeon[] {
        return Array.from({ length: count }, () => this.create(overrides));
    }
}

/**
 * Factory principale exposant toutes les factories
 */
export class TestFactory {
    static User = UserFactory;
    static Leave = LeaveFactory;
    static LeaveBalance = LeaveBalanceFactory;
    static Site = SiteFactory;
    static OperatingRoom = OperatingRoomFactory;
    static BlocDayPlanning = BlocDayPlanningFactory;
    static BlocRoomAssignment = BlocRoomAssignmentFactory;
    static Surgeon = SurgeonFactory;

    /**
     * Crée un environnement de test complet avec toutes les entités liées
     */
    static createTestEnvironment() {
        const site = SiteFactory.create();
        const users = UserFactory.createBatch(5);
        const admin = UserFactory.createAdmin();
        const surgeon = SurgeonFactory.create();

        const operatingRooms = OperatingRoomFactory.createBatch(3, site.id);
        const balances = users.map(user =>
            LeaveBalanceFactory.createForUser(user.id, new Date().getFullYear())
        );

        return {
            site,
            users,
            admin,
            surgeon,
            operatingRooms,
            balances,
        };
    }

    /**
     * Crée des données de test pour les conflits de planning
     */
    static createConflictScenario() {
        const { site, surgeon, operatingRooms } = this.createTestEnvironment();
        const conflictDate = faker.date.soon();

        const blocPlanning = BlocDayPlanningFactory.createForDate(conflictDate, site.id);
        const conflictingAssignments = [
            BlocRoomAssignmentFactory.create({
                blocDayPlanningId: blocPlanning.id,
                operatingRoomId: operatingRooms[0].id,
                period: 'MORNING' as Period,
            }),
            BlocRoomAssignmentFactory.create({
                blocDayPlanningId: blocPlanning.id,
                operatingRoomId: operatingRooms[0].id,
                period: 'MORNING' as Period,
            }),
        ];

        return {
            site,
            surgeon,
            operatingRoom: operatingRooms[0],
            blocPlanning,
            conflictingAssignments,
        };
    }
} 