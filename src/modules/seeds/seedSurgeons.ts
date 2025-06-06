import { connectToDatabase } from '../../lib/mongodb.js';
import { logger } from "../../lib/logger";
import { v4 as uuidv4 } from 'uuid';

/**
 * Liste des chirurgiens à initialiser
 */
export const surgeonsList = [
  {
    id: uuidv4(),
    nom: 'ADAM',
    prenom: 'Jacques-Marie',
    email: 'jmadam@yahoo.fr',
    phoneNumber: '0673478524',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'ADAM JM',
  },
  {
    id: uuidv4(),
    nom: 'RIFAI',
    prenom: 'Yasser',
    email: 'yasser.rifai@hotmail.fr',
    phoneNumber: '+33603628817',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'RIFAI',
  },
  {
    id: uuidv4(),
    nom: 'BERNARD-CUISINIER',
    prenom: 'Alan',
    email: 'alanbc@hotmail.fr',
    phoneNumber: '0662228841',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'BERNARD CUISINIER',
  },
  {
    id: uuidv4(),
    nom: 'MALEKPOUR',
    prenom: 'Louis',
    email: 'louismalekp@hotmail.fr',
    phoneNumber: '0633311793',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'MALEKPOUR',
  },
  {
    id: uuidv4(),
    nom: 'RAHALI',
    prenom: 'Said',
    email: 'said.rahali@gmail.com',
    phoneNumber: '0669751169',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'RAHALI S',
  },
  {
    id: uuidv4(),
    nom: 'ABU AMARA',
    prenom: 'Saad',
    email: 'dr.abuamara@gmail.com',
    phoneNumber: '0664042493',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie Pédiatrique'],
    googleSheetName: 'ABU AMARA',
  },
  {
    id: uuidv4(),
    nom: 'LEROUX',
    prenom: 'Julien',
    email: 'dr.julien.leroux@gmail.com',
    phoneNumber: '0661114762',
    status: 'ACTIF',
    specialtyNames: ['Orthopédie pédiatrique'],
    googleSheetName: 'LEROUX',
  },
  {
    id: uuidv4(),
    nom: 'BAILLEUX-MOISSANT',
    prenom: 'Marion',
    email: 'marion.bailleux@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie vasculaire'],
    googleSheetName: 'BAILLEUX MOISSANT',
  },
  {
    id: uuidv4(),
    nom: 'ROUX',
    prenom: 'Nicolas',
    email: 'nicolas.roux@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie vasculaire'],
    googleSheetName: 'ROUX',
  },
  {
    id: uuidv4(),
    nom: 'LECA',
    prenom: 'Jean-Baptiste',
    email: 'jb.leca@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie plastique'],
    googleSheetName: 'LECA',
  },
  {
    id: uuidv4(),
    nom: 'BON-MARDION',
    prenom: 'Nicolas',
    email: 'nicolas.bonmardion@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['ORL', 'ORL pédiatrique'],
    googleSheetName: 'BON-MARDION',
  },
  {
    id: uuidv4(),
    nom: 'BARON',
    prenom: 'Marc',
    email: 'marc.baron@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie gynécologique'],
    googleSheetName: 'BARON',
  },
  {
    id: uuidv4(),
    nom: 'LE DEM',
    prenom: 'Nicolas',
    email: 'nicolas.ledem@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie digestive'],
    googleSheetName: 'LE DEM',
  },
  {
    id: uuidv4(),
    nom: 'PASQUIER',
    prenom: 'Geoffroy',
    email: 'geoffroy.pasquier@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie urologique'],
    googleSheetName: 'PASQUIER',
  },
  {
    id: uuidv4(),
    nom: 'COMTE',
    prenom: 'Diane',
    email: 'diane.comte@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie urologique pédiatrique'],
    googleSheetName: 'COMTE',
  },
  {
    id: uuidv4(),
    nom: 'RAHALI',
    prenom: 'Héla',
    email: 'hela.rahali@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Ophtalmologie'],
    googleSheetName: 'RAHALI H',
  },
  {
    id: uuidv4(),
    nom: 'LUCE',
    prenom: 'Alexandra',
    email: 'alexandra.luce@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Ophtalmologie', 'Ophtalmologie pédiatrique'],
    googleSheetName: 'LUCE',
  },
  {
    id: uuidv4(),
    nom: 'AL HAMEEDI',
    prenom: 'Raied',
    email: 'raied.alhameedi@example.com',
    phoneNumber: '',
    status: 'ACTIF',
    specialtyNames: ['Endoscopie digestive', 'Endoscopie interventionnelle'],
    googleSheetName: 'AL HAMEEDI',
  },
  {
    id: uuidv4(),
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@chir.example.local',
    phoneNumber: '0600000000',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie digestive', 'Chirurgie vasculaire'],
    googleSheetName: 'DUPONT J',
  },
  {
    id: uuidv4(),
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@chir.example.local',
    phoneNumber: '0600000000',
    status: 'ACTIF',
    specialtyNames: ['Chirurgie plastique', 'ORL'],
    googleSheetName: 'MARTIN S',
  },
];

/**
 * Fonction pour initialiser les chirurgiens dans la base de données
 */
export async function seedSurgeons() {
  try {
    logger.info("Démarrage de l'initialisation des chirurgiens...");

    // Connexion à la base de données
    const { db } = await connectToDatabase();
    const surgeonsCollection = db.collection('surgeons');
    const specialtiesCollection = db.collection('specialties');

    // Récupérer toutes les spécialités pour faire le lien avec les chirurgiens
    const specialties = await specialtiesCollection.find().toArray();
    const specialtiesMap = new Map();

    // Créer un map des spécialités avec leur nom en minuscules comme clé
    specialties.forEach(specialty => {
      const specialtyName = specialty.name.toLowerCase();
      specialtiesMap.set(specialtyName, specialty._id);
      logger.info(`Spécialité mappée: ${specialtyName} -> ${specialty._id}`);
    });

    // Vérifier si des chirurgiens existent déjà
    const existingSurgeons = await surgeonsCollection.countDocuments();

    if (existingSurgeons > 0) {
      logger.info(`${existingSurgeons} chirurgiens existent déjà dans la base de données.`);
      logger.info('Mise à jour des chirurgiens existants et ajout des nouveaux...');

      for (const surgeon of surgeonsList) {
        // Convertir les noms de spécialités en IDs
        const specialtyIds: string[] = [];
        for (const specialtyName of surgeon.specialtyNames) {
          const specialtyId = specialtiesMap.get(specialtyName.toLowerCase());
          if (specialtyId) {
            specialtyIds.push(specialtyId.toString());
            logger.info(
              `Spécialité trouvée pour ${surgeon.prenom} ${surgeon.nom}: ${specialtyName} -> ${specialtyId}`
            );
          } else {
            logger.warn(
              `AVERTISSEMENT: Spécialité "${specialtyName}" non trouvée pour ${surgeon.prenom} ${surgeon.nom}`
            );
          }
        }

        // Rechercher si le chirurgien existe déjà (par email)
        const existingSurgeon = await surgeonsCollection.findOne({ email: surgeon.email });

        if (existingSurgeon) {
          // Mettre à jour le chirurgien existant
          await surgeonsCollection.updateOne(
            { email: surgeon.email },
            {
              $set: {
                nom: surgeon.nom,
                prenom: surgeon.prenom,
                phoneNumber: surgeon.phoneNumber,
                status: surgeon.status,
                specialtyIds: specialtyIds,
                googleSheetName: surgeon.googleSheetName,
                updatedAt: new Date(),
              },
            }
          );
          logger.info(
            `Chirurgien mis à jour: ${surgeon.prenom} ${surgeon.nom} avec ${specialtyIds.length} spécialités`
          );
        } else {
          // Créer un nouveau chirurgien
          await surgeonsCollection.insertOne({
            id: surgeon.id,
            nom: surgeon.nom,
            prenom: surgeon.prenom,
            email: surgeon.email,
            phoneNumber: surgeon.phoneNumber,
            status: surgeon.status,
            specialtyIds: specialtyIds,
            googleSheetName: surgeon.googleSheetName,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          logger.info(
            `Nouveau chirurgien ajouté: ${surgeon.prenom} ${surgeon.nom} avec ${specialtyIds.length} spécialités`
          );
        }
      }
    } else {
      // Aucun chirurgien n'existe, ajouter tous les chirurgiens
      const surgeonsToInsert = surgeonsList.map(surgeon => {
        // Convertir les noms de spécialités en IDs
        const specialtyIds: string[] = [];
        for (const specialtyName of surgeon.specialtyNames) {
          const specialtyId = specialtiesMap.get(specialtyName.toLowerCase());
          if (specialtyId) {
            specialtyIds.push(specialtyId.toString());
            logger.info(
              `Spécialité trouvée pour ${surgeon.prenom} ${surgeon.nom}: ${specialtyName} -> ${specialtyId}`
            );
          } else {
            logger.warn(
              `AVERTISSEMENT: Spécialité "${specialtyName}" non trouvée pour ${surgeon.prenom} ${surgeon.nom}`
            );
          }
        }

        return {
          id: surgeon.id,
          nom: surgeon.nom,
          prenom: surgeon.prenom,
          email: surgeon.email,
          phoneNumber: surgeon.phoneNumber,
          status: surgeon.status,
          specialtyIds: specialtyIds,
          googleSheetName: surgeon.googleSheetName,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });

      await surgeonsCollection.insertMany(surgeonsToInsert);
      logger.info(`${surgeonsToInsert.length} chirurgiens ont été ajoutés.`);
    }

    logger.info('Initialisation des chirurgiens terminée avec succès!');
    return true;
  } catch (error: unknown) {
    logger.error("Erreur lors de l'initialisation des chirurgiens:", { error: error });
    throw error;
  }
}

// Exécuter si appelé directement
// if (import.meta.url === import.meta.resolve('./seedSurgeons.js')) {
//     seedSurgeons()
//         .then(() => process.exit(0))
//         .catch(error => {
//             logger.error('Erreur lors du seed des chirurgiens:', { error: error });
//             process.exit(1);
//         });
// }
