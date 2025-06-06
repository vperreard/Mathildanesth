/**
 * Script principal pour exécuter tous les seeds
 */

import { seedRules } from '../../scripts/seedRules.js';
import { logger } from "../../lib/logger";
import { seedSpecialties } from './seedSpecialties.js';
import { seedSurgeons } from './seedSurgeons.js';
import { seedOperatingRooms } from './seedOperatingRooms.js';
import { closeDatabase } from '../../lib/mongodb.js';

/**
 * Exécute tous les scripts de seed dans l'ordre approprié
 */
async function seedAll() {
    try {
        logger.info('=== DÉMARRAGE DU PROCESSUS DE SEED COMPLET ===');

        // 1. Seed des spécialités chirurgicales (doit être fait avant les chirurgiens)
        logger.info('\n--- ÉTAPE 1: Initialisation des spécialités chirurgicales ---');
        await seedSpecialties();

        // 2. Seed des chirurgiens (dépend des spécialités)
        logger.info('\n--- ÉTAPE 2: Initialisation des chirurgiens ---');
        await seedSurgeons();

        // 3. Seed des règles
        logger.info('\n--- ÉTAPE 3: Initialisation des règles ---');
        await seedRules();

        // 4. Seed de l'architecture du bloc opératoire
        logger.info('\n--- ÉTAPE 4: Initialisation de l\'architecture du bloc opératoire ---');
        await seedOperatingRooms();

        logger.info('\n=== SEED COMPLET TERMINÉ AVEC SUCCÈS ===');
    } catch (error: unknown) {
        logger.error('\n!!! ERREUR LORS DU PROCESSUS DE SEED !!!', { error: error });
        process.exit(1);
    } finally {
        // Fermer la connexion à la base de données
        await closeDatabase();
    }
}

// Exécuter le script
seedAll()
    .then(() => {
        logger.info('Processus terminé, fermeture...');
        process.exit(0);
    })
    .catch(error => {
        logger.error('Erreur non gérée:', { error: error });
        process.exit(1);
    }); 