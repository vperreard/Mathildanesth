/**
 * TrameAffectation Model - Migration vers Prisma (Phase 3)
 * @deprecated Utilisez TrameAffectationPrisma à la place
 */

// Import et ré-export du nouveau modèle Prisma
export { TrameAffectationPrisma as TrameAffectation } from './TrameAffectationPrisma';
export { default } from './TrameAffectationPrisma';

// Ré-export des types depuis TrameAffectationPrisma  
import { PeriodeType as PT, TrameAffectationAttributes as TAA } from './TrameAffectationPrisma';
export type PeriodeType = PT;
export type TrameAffectationAttributes = TAA;

// Avertissement de dépréciation
if (process.env.NODE_ENV === 'development') {
    console.warn(
        '⚠️  DÉPRÉCIATION: src/models/TrameAffectation.ts utilise Sequelize (obsolète).\n' +
        '   → Utilisez TrameAffectationPrisma à la place.\n' +
        '   → Ce fichier sera supprimé dans une version future.'
    );
} 