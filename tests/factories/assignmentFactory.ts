import { faker } from '@faker-js/faker';
import { Assignment, AssignmentStatus } from '@/types/assignment';
import { ShiftType } from '@/types/common';

let assignmentIdCounter = 0;

// Génère un objet Assignment complet
export function createAssignment(overrides: Partial<Assignment> = {}): Assignment {
    assignmentIdCounter++;
    const startDate = faker.date.future();
    // Assurer une durée minimale pour éviter les erreurs de date
    const endDate = new Date(startDate.getTime() + faker.number.int({ min: 1, max: 24 }) * 60 * 60 * 1000);

    const defaults: Assignment = {
        id: overrides.id ?? `asgn-${assignmentIdCounter}`,
        userId: overrides.userId ?? `user-${faker.number.int({ min: 1, max: 10 })}`,
        shiftType: faker.helpers.arrayElement(Object.values(ShiftType)),
        startDate: startDate,
        endDate: endDate,
        status: faker.helpers.arrayElement(Object.values(AssignmentStatus)),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
        notes: faker.datatype.boolean(0.3) ? faker.lorem.sentence() : undefined, // Note optionnelle
        validatedBy: undefined,
        validatedAt: undefined,
        rejectionReason: undefined,
        cancellationReason: undefined,
    };

    return { ...defaults, ...overrides };
}

// Factory spécifique pour créer les attributs de données (utile si l'ID/timestamps sont gérés ailleurs)
// Note: Pour l'instant, elle est similaire à createAssignment, mais pourrait diverger.
export function createAssignmentAttributes(overrides: Partial<Assignment> = {}): Assignment {
    return createAssignment(overrides);
} 