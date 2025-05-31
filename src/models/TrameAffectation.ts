/**
 * TrameAffectation Model - Migration vers Prisma (Phase 3)
 * @deprecated Utilisez TrameAffectationPrisma à la place
 */

// Import du nouveau modèle Prisma
export { TrameAffectationPrisma as TrameAffectation, PeriodeType, TrameAffectationAttributes } from './TrameAffectationPrisma';
export { default } from './TrameAffectationPrisma';

// Avertissement de dépréciation
if (process.env.NODE_ENV === 'development') {
    console.warn(
        '⚠️  DÉPRÉCIATION: src/models/TrameAffectation.ts utilise Sequelize (obsolète).\n' +
        '   → Utilisez TrameAffectationPrisma à la place.\n' +
        '   → Ce fichier sera supprimé dans une version future.'
    );
} 