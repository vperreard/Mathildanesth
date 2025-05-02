import { faker } from '@faker-js/faker';
import { User, UserRole, ExperienceLevel, Leave, UserPreferences, LeaveType, LeaveStatus } from '@/types/user';

let userIdCounter = 0;

export function createUser(overrides: Partial<User> = {}): User {
    userIdCounter++;
    const userId = overrides.id ?? `user-${userIdCounter}`;
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const defaults: User = {
        id: userId,
        prenom: firstName,
        nom: lastName,
        email: faker.internet.email({ firstName, lastName }).toLowerCase(),
        role: faker.helpers.arrayElement(Object.values(UserRole)),
        specialties: [faker.helpers.arrayElement(['Anesthésie Générale', 'Réanimation', 'Pédiatrie', 'Obstétrique'])],
        experienceLevel: faker.helpers.arrayElement(Object.values(ExperienceLevel)),
        leaves: [], // Par défaut, pas de congés
        preferences: {}, // Par défaut, pas de préférences
        createdAt: faker.date.past({ years: 2 }),
        updatedAt: faker.date.recent(),
        mustChangePassword: false,
    };

    return { ...defaults, ...overrides };
}

// Factory pour les congés (Leave)
export function createLeave(overrides: Partial<Leave> = {}): Leave {
    const startDate = faker.date.future({ years: 1 });
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + faker.number.int({ min: 1, max: 14 }));

    const defaults: Leave = {
        id: `leave-${faker.string.uuid()}`,
        userId: overrides.userId ?? `user-${userIdCounter}`,
        startDate: startDate,
        endDate: endDate,
        type: faker.helpers.arrayElement(Object.values(LeaveType)),
        status: faker.helpers.arrayElement(Object.values(LeaveStatus)),
        reason: faker.lorem.sentence(),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
    };

    return { ...defaults, ...overrides };
}

// Factory pour les préférences utilisateur
export function createUserPreferences(overrides: Partial<UserPreferences> = {}): UserPreferences {
    const defaults: UserPreferences = {
        preferredShifts: [],
        preferredDays: [],
        maxWeeklyHours: faker.helpers.arrayElement([undefined, 35, 40, 48]),
        minWeeklyHours: faker.helpers.arrayElement([undefined, 20, 30]),
        maxConsecutiveShifts: faker.helpers.arrayElement([undefined, 3, 4, 5]),
        preferredSpecialties: [],
        preferredLocations: [],
        blackoutDates: [],
        notes: faker.lorem.paragraph(),
    };

    const finalPreferences = { ...defaults, ...overrides };

    if (finalPreferences.maxWeeklyHours === null) finalPreferences.maxWeeklyHours = undefined;
    if (finalPreferences.minWeeklyHours === null) finalPreferences.minWeeklyHours = undefined;
    if (finalPreferences.maxConsecutiveShifts === null) finalPreferences.maxConsecutiveShifts = undefined;

    return finalPreferences;
} 