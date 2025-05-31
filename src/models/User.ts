/**
 * User Model - Migration vers Prisma (Phase 3)
 * @deprecated Utilisez UserPrisma à la place
 */

// Import du nouveau modèle Prisma
export { UserPrisma as User, UserRole, UserAttributes } from './UserPrisma';
export { default } from './UserPrisma';

// Avertissement de dépréciation
if (process.env.NODE_ENV === 'development') {
    console.warn(
        '⚠️  DÉPRÉCIATION: src/models/User.ts utilise Sequelize (obsolète).\n' +
        '   → Utilisez UserPrisma ou UserService à la place.\n' +
        '   → Ce fichier sera supprimé dans une version future.'
    );
} 