import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const surgeonsList = [
  {
    nom: 'ADAM',
    prenom: 'Jacques-Marie',
    email: 'jmadam@yahoo.fr',
    phoneNumber: '0673478524',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'ADAM JM',
  },
  {
    nom: 'RIFAI',
    prenom: 'Yasser',
    email: 'yasser.rifai@hotmail.fr',
    phoneNumber: '+33603628817',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'RIFAI',
  },
  {
    nom: 'BERNARD-CUISINIER',
    prenom: 'Alan',
    email: 'alanbc@hotmail.fr',
    phoneNumber: '0662228841',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'BERNARD CUISINIER',
  },
  {
    nom: 'MALEKPOUR',
    prenom: 'Louis',
    email: 'louismalekp@hotmail.fr',
    phoneNumber: '0633311793',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'MALEKPOUR',
  },
  {
    nom: 'RAHALI',
    prenom: 'Said',
    email: 'said.rahali@gmail.com',
    phoneNumber: '0669751169',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie'],
    googleSheetName: 'RAHALI S',
  },
  {
    nom: 'ABU AMARA',
    prenom: 'Saad',
    email: 'dr.abuamara@gmail.com',
    phoneNumber: '0664042493',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie Pédiatrique'],
    googleSheetName: 'ABU AMARA',
  },
  {
    nom: 'LEROUX',
    prenom: 'Julien',
    email: 'dr.julien.leroux@gmail.com',
    phoneNumber: '0661114762',
    status: 'ACTIF' as const,
    specialtyNames: ['Orthopédie pédiatrique'],
    googleSheetName: 'LEROUX',
  },
  {
    nom: 'BAILLEUX-MOISSANT',
    prenom: 'Marion',
    email: 'marion.bailleux@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie vasculaire'],
    googleSheetName: 'BAILLEUX MOISSANT',
  },
  {
    nom: 'ROUX',
    prenom: 'Nicolas',
    email: 'nicolas.roux@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie vasculaire'],
    googleSheetName: 'ROUX',
  },
  {
    nom: 'LECA',
    prenom: 'Jean-Baptiste',
    email: 'jb.leca@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie plastique'],
    googleSheetName: 'LECA',
  },
  {
    nom: 'BON-MARDION',
    prenom: 'Nicolas',
    email: 'nicolas.bonmardion@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['ORL', 'ORL pédiatrique'],
    googleSheetName: 'BON-MARDION',
  },
  {
    nom: 'BARON',
    prenom: 'Marc',
    email: 'marc.baron@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie gynécologique'],
    googleSheetName: 'BARON',
  },
  {
    nom: 'LE DEM',
    prenom: 'Nicolas',
    email: 'nicolas.ledem@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie digestive'],
    googleSheetName: 'LE DEM',
  },
  {
    nom: 'PASQUIER',
    prenom: 'Geoffroy',
    email: 'geoffroy.pasquier@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie urologique'],
    googleSheetName: 'PASQUIER',
  },
  {
    nom: 'COMTE',
    prenom: 'Diane',
    email: 'diane.comte@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie urologique pédiatrique'],
    googleSheetName: 'COMTE',
  },
  {
    nom: 'RAHALI',
    prenom: 'Héla',
    email: 'hela.rahali@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Ophtalmologie'],
    googleSheetName: 'RAHALI H',
  },
  {
    nom: 'LUCE',
    prenom: 'Alexandra',
    email: 'alexandra.luce@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Ophtalmologie', 'Ophtalmologie pédiatrique'],
    googleSheetName: 'LUCE',
  },
  {
    nom: 'AL HAMEEDI',
    prenom: 'Raied',
    email: 'raied.alhameedi@example.com',
    phoneNumber: '',
    status: 'ACTIF' as const,
    specialtyNames: ['Endoscopie digestive', 'Endoscopie interventionnelle'],
    googleSheetName: 'AL HAMEEDI',
  },
  {
    nom: 'Dupont',
    prenom: 'Jean',
    email: 'jean.dupont@chir.example.local',
    phoneNumber: '0600000000',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie digestive', 'Chirurgie vasculaire'],
    googleSheetName: 'DUPONT J',
  },
  {
    nom: 'Martin',
    prenom: 'Sophie',
    email: 'sophie.martin@chir.example.local',
    phoneNumber: '0600000000',
    status: 'ACTIF' as const,
    specialtyNames: ['Chirurgie plastique', 'ORL'],
    googleSheetName: 'MARTIN S',
  },
];

async function seedSurgeons() {
  try {
    console.log("Démarrage de l'initialisation des chirurgiens...");

    // Récupérer toutes les spécialités pour faire le lien avec les chirurgiens
    const specialties = await prisma.specialty.findMany();
    const specialtiesMap = new Map();

    // Créer un map des spécialités avec leur nom comme clé
    specialties.forEach(specialty => {
      specialtiesMap.set(specialty.name, specialty.id);
      console.log(`Spécialité mappée: ${specialty.name} -> ${specialty.id}`);
    });

    // Vérifier si des chirurgiens existent déjà
    const existingSurgeons = await prisma.surgeon.count();

    if (existingSurgeons > 0) {
      console.log(`${existingSurgeons} chirurgiens existent déjà dans la base de données.`);
      console.log('Mise à jour des chirurgiens existants et ajout des nouveaux...');

      for (const surgeon of surgeonsList) {
        // Rechercher si le chirurgien existe déjà (par email)
        const existingSurgeon = await prisma.surgeon.findUnique({
          where: { email: surgeon.email },
          include: { specialties: true }
        });

        // Convertir les noms de spécialités en IDs
        const specialtyIds: number[] = [];
        for (const specialtyName of surgeon.specialtyNames) {
          const specialtyId = specialtiesMap.get(specialtyName);
          if (specialtyId) {
            specialtyIds.push(specialtyId);
            console.log(
              `Spécialité trouvée pour ${surgeon.prenom} ${surgeon.nom}: ${specialtyName} -> ${specialtyId}`
            );
          } else {
            console.warn(
              `AVERTISSEMENT: Spécialité "${specialtyName}" non trouvée pour ${surgeon.prenom} ${surgeon.nom}`
            );
          }
        }

        if (existingSurgeon) {
          // Mettre à jour le chirurgien existant
          await prisma.surgeon.update({
            where: { email: surgeon.email },
            data: {
              nom: surgeon.nom,
              prenom: surgeon.prenom,
              phoneNumber: surgeon.phoneNumber,
              status: surgeon.status,
              googleSheetName: surgeon.googleSheetName,
              specialties: {
                set: specialtyIds.map(id => ({ id }))
              }
            },
          });
          console.log(
            `Chirurgien mis à jour: ${surgeon.prenom} ${surgeon.nom} avec ${specialtyIds.length} spécialités`
          );
        } else {
          // Créer un nouveau chirurgien
          await prisma.surgeon.create({
            data: {
              nom: surgeon.nom,
              prenom: surgeon.prenom,
              email: surgeon.email,
              phoneNumber: surgeon.phoneNumber,
              status: surgeon.status,
              googleSheetName: surgeon.googleSheetName,
              specialties: {
                connect: specialtyIds.map(id => ({ id }))
              }
            },
          });
          console.log(
            `Nouveau chirurgien ajouté: ${surgeon.prenom} ${surgeon.nom} avec ${specialtyIds.length} spécialités`
          );
        }
      }
    } else {
      // Aucun chirurgien n'existe, ajouter tous les chirurgiens
      for (const surgeon of surgeonsList) {
        // Convertir les noms de spécialités en IDs
        const specialtyIds: number[] = [];
        for (const specialtyName of surgeon.specialtyNames) {
          const specialtyId = specialtiesMap.get(specialtyName);
          if (specialtyId) {
            specialtyIds.push(specialtyId);
            console.log(
              `Spécialité trouvée pour ${surgeon.prenom} ${surgeon.nom}: ${specialtyName} -> ${specialtyId}`
            );
          } else {
            console.warn(
              `AVERTISSEMENT: Spécialité "${specialtyName}" non trouvée pour ${surgeon.prenom} ${surgeon.nom}`
            );
          }
        }

        await prisma.surgeon.create({
          data: {
            nom: surgeon.nom,
            prenom: surgeon.prenom,
            email: surgeon.email,
            phoneNumber: surgeon.phoneNumber,
            status: surgeon.status,
            googleSheetName: surgeon.googleSheetName,
            specialties: {
              connect: specialtyIds.map(id => ({ id }))
            }
          },
        });
        console.log(
          `Chirurgien ajouté: ${surgeon.prenom} ${surgeon.nom} avec ${specialtyIds.length} spécialités`
        );
      }
      console.log(`${surgeonsList.length} chirurgiens ont été ajoutés.`);
    }

    console.log('Initialisation des chirurgiens terminée avec succès!');
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des chirurgiens:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedSurgeons()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erreur lors du seed des chirurgiens:', error);
      process.exit(1);
    });
}

export { seedSurgeons };