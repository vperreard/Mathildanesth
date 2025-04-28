/**
 * Script principal pour exécuter tous les seeds
 */

import { seedRules } from '../../scripts/seedRules.js';
import { seedSpecialties } from './seedSpecialties.js';
import { seedSurgeons } from './seedSurgeons.js';

/**
 * Exécute tous les scripts de seed dans l'ordre approprié
 */
async function seedAll() {
    try {
        console.log('=== DÉMARRAGE DU PROCESSUS DE SEED COMPLET ===');

        // 1. Seed des spécialités chirurgicales (doit être fait avant les chirurgiens)
        console.log('\n--- ÉTAPE 1: Initialisation des spécialités chirurgicales ---');
        await seedSpecialties();

        // 2. Seed des chirurgiens (dépend des spécialités)
        console.log('\n--- ÉTAPE 2: Initialisation des chirurgiens ---');
        await seedSurgeons();

        // 3. Seed des règles
        console.log('\n--- ÉTAPE 3: Initialisation des règles ---');
        await seedRules();

        console.log('\n=== SEED COMPLET TERMINÉ AVEC SUCCÈS ===');
    } catch (error) {
        console.error('\n!!! ERREUR LORS DU PROCESSUS DE SEED !!!', error);
        process.exit(1);
    }
}

// Exécuter le script
if (require.main === module) {
    seedAll()
        .then(() => {
            console.log('Processus terminé, fermeture...');
            process.exit(0);
        })
        .catch(error => {
            console.error('Erreur non gérée:', error);
            process.exit(1);
        });
} 