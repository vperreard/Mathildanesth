/**
 * Database Connection - Sequelize (Phase 3 - DÉPRÉCIÉ)
 * @deprecated Utilisez le client Prisma à la place
 */

// Avertissement de dépréciation
if (process.env.NODE_ENV === 'development') {
    logger.warn(
        '⚠️  DÉPRÉCIATION: src/lib/database.ts utilise Sequelize (obsolète).\n' +
        '   → Utilisez le client Prisma depuis @/lib/prisma à la place.\n' +
        '   → Ce fichier sera supprimé dans une version future.'
    );
}

// Import conditionnel pour éviter les erreurs en Edge Runtime
import { ifRuntimeSupports } from './runtime-detector';

import { logger } from "./logger";
const sequelize = ifRuntimeSupports('sequelize', () => {
    const { Sequelize } = require('sequelize');
    
    return new Sequelize(
        process.env.DATABASE_URL || 'postgres://localhost:5432/mathildanesth',
        {
            dialect: 'postgres',
            logging: process.env.NODE_ENV === 'development' ? console.log : false,
            pool: {
                max: 5,
                min: 0,
                acquire: 30000,
                idle: 10000,
            },
        }
    );
}, null);

export default sequelize; 