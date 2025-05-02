import { faker } from '@faker-js/faker';
import { TrameAffectationAttributes, PeriodeType } from '@/models/TrameAffectation';

// Cette factory génère UNIQUEMENT les attributs de données brutes.
// Elle ne tente PAS de simuler une instance de modèle Sequelize.

let idCounter = 0;

// Génère un objet complet TrameAffectationAttributes (avec id/timestamps)
export function createTrameAffectationAttributes(
    overrides: Partial<TrameAffectationAttributes> = {}
): TrameAffectationAttributes {
    idCounter++;
    const defaultStartDate = faker.date.future({ years: 1 });
    const defaultEndDate = new Date(defaultStartDate);
    defaultEndDate.setFullYear(defaultStartDate.getFullYear() + 1);

    const defaults: TrameAffectationAttributes = {
        id: `uuid-trame-${idCounter}`,
        userId: faker.number.int({ min: 1, max: 1000 }),
        periodeType: faker.helpers.arrayElement<PeriodeType>(['HEBDOMADAIRE', 'BI_HEBDOMADAIRE', 'MENSUEL']),
        dateDebut: defaultStartDate,
        dateFin: defaultEndDate,
        motif: faker.lorem.sentence(),
        isRecurrent: faker.datatype.boolean(),
        createdAt: faker.date.past({ years: 1 }),
        updatedAt: faker.date.recent(),
    };

    return { ...defaults, ...overrides };
}

// Factory pour créer uniquement les données nécessaires pour la création (sans id/timestamps)
export function createTrameAffectationData(
    overrides: Partial<Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'> {
    const defaultStartDate = faker.date.future({ years: 1 });
    const defaultEndDate = new Date(defaultStartDate);
    defaultEndDate.setFullYear(defaultStartDate.getFullYear() + 1);

    const defaultAttributes: Omit<TrameAffectationAttributes, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: faker.number.int({ min: 1, max: 1000 }),
        periodeType: faker.helpers.arrayElement<PeriodeType>(['HEBDOMADAIRE', 'BI_HEBDOMADAIRE', 'MENSUEL']),
        dateDebut: defaultStartDate,
        dateFin: defaultEndDate,
        motif: faker.lorem.sentence(),
        isRecurrent: faker.datatype.boolean(),
    };
    return { ...defaultAttributes, ...overrides };
} 