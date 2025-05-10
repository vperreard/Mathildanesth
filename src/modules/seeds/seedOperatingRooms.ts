import { connectToDatabase, closeDatabase } from '../../lib/mongodb';
import { v4 as uuid } from 'uuid';

/**
 * Structure du bloc opératoire
 */
const operatingRoomsStructure = {
  site: {
    id: uuid(),
    name: 'Clinique Mathilde',
    sectors: [
      {
        id: uuid(),
        name: 'Hyperaseptique',
        rooms: [
          { id: uuid(), name: 'Salle 1', number: '1' },
          { id: uuid(), name: 'Salle 2', number: '2' },
          { id: uuid(), name: 'Salle 3', number: '3' },
          { id: uuid(), name: 'Salle 4', number: '4' },
        ],
      },
      {
        id: uuid(),
        name: 'Intermédiaire',
        rooms: [
          { id: uuid(), name: 'Salle 5', number: '5' },
          { id: uuid(), name: 'Salle 6', number: '6' },
          { id: uuid(), name: 'Salle 7', number: '7' },
        ],
      },
      {
        id: uuid(),
        name: 'Septique',
        rooms: [
          { id: uuid(), name: 'Salle 8', number: '8' },
          { id: uuid(), name: 'Salle 9', number: '9' },
          { id: uuid(), name: 'Salle 10', number: '10' },
          { id: uuid(), name: 'Salle 11', number: '11' },
          { id: uuid(), name: 'Salle 12', number: '12' },
          { id: uuid(), name: 'Salle 12bis', number: '12bis' },
        ],
      },
      {
        id: uuid(),
        name: 'Ophtalmo',
        rooms: [
          { id: uuid(), name: 'Salle 14', number: '14' },
          { id: uuid(), name: 'Salle 15', number: '15' },
          { id: uuid(), name: 'Salle 16', number: '16' },
          { id: uuid(), name: 'Salle 17', number: '17' },
        ],
      },
      {
        id: uuid(),
        name: 'Endoscopies',
        rooms: [
          { id: uuid(), name: 'Endo 1', number: 'E1' },
          { id: uuid(), name: 'Endo 2', number: 'E2' },
          { id: uuid(), name: 'Endo 3', number: 'E3' },
          { id: uuid(), name: 'Endo 4', number: 'E4' },
        ],
      },
    ],
  },
};

/**
 * Fonction pour initialiser l'architecture du bloc opératoire
 */
export async function seedOperatingRooms() {
  console.log("Démarrage de l'initialisation de l'architecture du bloc opératoire...");

  const { db, client } = await connectToDatabase();
  const sitesCollection = db.collection('sites');
  const sectorsCollection = db.collection('sectors');

  // Structure des salles par secteur
  const sectors = [
    {
      name: 'Hyperaseptique',
      rooms: [
        { name: 'Salle 1', number: '1' },
        { name: 'Salle 2', number: '2' },
        { name: 'Salle 3', number: '3' },
        { name: 'Salle 4', number: '4' },
      ],
    },
    {
      name: 'Intermédiaire',
      rooms: [
        { name: 'Salle 5', number: '5' },
        { name: 'Salle 6', number: '6' },
        { name: 'Salle 7', number: '7' },
      ],
    },
    {
      name: 'Septique',
      rooms: [
        { name: 'Salle 8', number: '8' },
        { name: 'Salle 9', number: '9' },
        { name: 'Salle 10', number: '10' },
        { name: 'Salle 11', number: '11' },
        { name: 'Salle 12', number: '12' },
        { name: 'Salle 12bis', number: '12bis' },
      ],
    },
    {
      name: 'Ophtalmo',
      rooms: [
        { name: 'Salle 14', number: '14' },
        { name: 'Salle 15', number: '15' },
        { name: 'Salle 16', number: '16' },
        { name: 'Salle 17', number: '17' },
      ],
    },
    {
      name: 'Endoscopies',
      rooms: [
        { name: 'Endo 1', number: 'E1' },
        { name: 'Endo 2', number: 'E2' },
        { name: 'Endo 3', number: 'E3' },
        { name: 'Endo 4', number: 'E4' },
      ],
    },
  ];

  // Vérifier si le site existe déjà
  const existingSite = await sitesCollection.findOne({ name: 'Clinique Mathilde' });

  if (existingSite) {
    console.log("Le site existe déjà, mise à jour de l'architecture...");

    // Supprimer tous les secteurs existants pour éviter les doublons
    await sectorsCollection.deleteMany({ siteId: existingSite._id });

    // Créer les nouveaux secteurs
    for (const sector of sectors) {
      const sectorId = uuid();
      const rooms = sector.rooms.map(room => ({
        id: uuid(),
        name: room.name,
        number: room.number,
      }));

      await sectorsCollection.insertOne({
        id: sectorId,
        name: sector.name,
        rooms,
        siteId: existingSite._id,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Secteur ${sector.name} créé avec ${rooms.length} salles`);
    }
  } else {
    // Créer le site s'il n'existe pas
    const siteId = uuid();
    await sitesCollection.insertOne({
      id: siteId,
      name: 'Clinique Mathilde',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Créer les secteurs pour le nouveau site
    for (const sector of sectors) {
      const sectorId = uuid();
      const rooms = sector.rooms.map(room => ({
        id: uuid(),
        name: room.name,
        number: room.number,
      }));

      await sectorsCollection.insertOne({
        id: sectorId,
        name: sector.name,
        rooms,
        siteId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`Secteur ${sector.name} créé avec ${rooms.length} salles`);
    }
  }

  console.log('Architecture du bloc opératoire initialisée avec succès!');
  await closeDatabase();
}

// Exécuter si appelé directement
// if (import.meta.url === import.meta.resolve('./seedOperatingRooms.js')) { // Ligne 193 problématique
//     seedOperatingRooms()
//         .then(() => process.exit(0))
//         .catch(error => {
//             console.error('Erreur lors du seed de l\'architecture du bloc opératoire:', error);
//             process.exit(1);
//         });
// }
