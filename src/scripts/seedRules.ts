import { connectToDatabase } from '../lib/mongodb.js';
import { logger } from "../lib/logger";
import { defaultRules } from '../modules/rules/seeds/defaultRules.js';

/**
 * Script pour initialiser les règles par défaut dans la base de données
 */
export async function seedRules() {
  try {
    logger.info("Démarrage de l'initialisation des règles...");

    // Connexion à la base de données
    const { db } = await connectToDatabase();
    const rulesCollection = db.collection('rules');

    // Vérifier si des règles existent déjà
    const existingRules = await rulesCollection.countDocuments();

    if (existingRules > 0) {
      logger.info(`${existingRules} règles existent déjà dans la base de données.`);
      logger.info('Vérification des règles manquantes...');

      // Récupérer toutes les règles existantes
      const existingRulesData = await rulesCollection.find().toArray();
      const existingRuleNames = existingRulesData.map(rule => rule.name);

      // Filtrer les règles à ajouter (celles qui n'existent pas encore)
      const rulesToAdd = defaultRules.filter(rule => !existingRuleNames.includes(rule.name));

      if (rulesToAdd.length > 0) {
        await rulesCollection.insertMany(rulesToAdd);
        logger.info(`${rulesToAdd.length} nouvelles règles ont été ajoutées.`);
      } else {
        logger.info('Aucune nouvelle règle à ajouter.');
      }
    } else {
      // Aucune règle n'existe, ajouter toutes les règles par défaut
      await rulesCollection.insertMany(defaultRules);
      logger.info(`${defaultRules.length} règles par défaut ont été ajoutées.`);
    }

    logger.info('Initialisation des règles terminée avec succès!');
    return true;
  } catch (error: unknown) {
    logger.error("Erreur lors de l'initialisation des règles:", { error: error });
    throw error;
  }
}

// Exécuter si appelé directement
// if (import.meta.url === import.meta.resolve('./seedRules.js')) { // Ligne 52 problématique
//     seedRules()
//         .then(() => process.exit(0))
//         .catch(error => {
//             logger.error('Erreur lors du seed des règles:', { error: error });
//             process.exit(1);
//         });
// }
