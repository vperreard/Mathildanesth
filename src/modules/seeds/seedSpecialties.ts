import { connectToDatabase } from '../../lib/mongodb.js';

import { logger } from "../../lib/logger";
/**
 * Liste des spécialités chirurgicales
 */
export const specialtiesToSeed = [
  { name: 'Endoscopie digestive', isPediatric: false },
  { name: 'Endoscopies digestives', isPediatric: false },
  { name: 'Endoscopie interventionnelle', isPediatric: false },
  { name: 'Orthopédie', isPediatric: false },
  { name: 'Orthopédie Pédiatrique', isPediatric: true },
  { name: 'Orthopédie pédiatrique', isPediatric: true },
  { name: 'Chirurgie plastique', isPediatric: false },
  { name: 'Chirurgie vasculaire', isPediatric: false },
  { name: 'ORL', isPediatric: false },
  { name: 'ORL pédiatrique', isPediatric: true },
  { name: 'Chirurgie dentaire', isPediatric: false },
  { name: 'Chirurgie maxillo-faciale', isPediatric: false },
  { name: 'Chirurgie gynécologique', isPediatric: false },
  { name: 'Procréation médicalement assistée', isPediatric: false },
  { name: 'Chirurgie digestive', isPediatric: false },
  { name: 'Chirurgie urologique', isPediatric: false },
  { name: 'Chirurgie urologique pédiatrique', isPediatric: true },
  { name: 'Ophtalmologie', isPediatric: false },
  { name: 'Ophtalmologie pédiatrique', isPediatric: true },
  { name: 'Chirurgie dentaire pédiatrique', isPediatric: true },
];

/**
 * Fonction pour initialiser les spécialités chirurgicales dans la base de données
 */
export async function seedSpecialties() {
  try {
    logger.info("Démarrage de l'initialisation des spécialités chirurgicales...");

    // Connexion à la base de données
    const { db } = await connectToDatabase();
    const specialtiesCollection = db.collection('specialties');

    // Vérifier si des spécialités existent déjà
    const existingSpecialties = await specialtiesCollection.countDocuments();

    if (existingSpecialties > 0) {
      logger.info(`${existingSpecialties} spécialités existent déjà dans la base de données.`);
      logger.info('Vérification des spécialités manquantes...');

      // Récupérer toutes les spécialités existantes
      const existingSpecialtiesData = await specialtiesCollection.find().toArray();
      const existingSpecialtyNames = existingSpecialtiesData.map(spec => spec.name);

      // Filtrer les spécialités à ajouter (celles qui n'existent pas encore)
      const specialtiesToAdd = specialtiesToSeed.filter(
        specialty => !existingSpecialtyNames.includes(specialty.name)
      );

      if (specialtiesToAdd.length > 0) {
        await specialtiesCollection.insertMany(specialtiesToAdd);
        logger.info(`${specialtiesToAdd.length} nouvelles spécialités ont été ajoutées.`);
      } else {
        logger.info('Aucune nouvelle spécialité à ajouter.');
      }
    } else {
      // Aucune spécialité n'existe, ajouter toutes les spécialités
      await specialtiesCollection.insertMany(specialtiesToSeed);
      logger.info(`${specialtiesToSeed.length} spécialités ont été ajoutées.`);
    }

    logger.info('Initialisation des spécialités chirurgicales terminée avec succès!');
    return true;
  } catch (error: unknown) {
    logger.error("Erreur lors de l'initialisation des spécialités chirurgicales:", { error: error });
    throw error;
  }
}

// Exécuter si appelé directement
// if (import.meta.url === import.meta.resolve('./seedSpecialties.js')) {
//     seedSpecialties()
//         .then(() => process.exit(0))
//         .catch(error => {
//             logger.error('Erreur lors du seed des spécialités:', { error: error });
//             process.exit(1);
//         });
// }
