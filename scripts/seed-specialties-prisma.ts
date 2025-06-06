import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const specialtiesToSeed = [
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

async function seedSpecialties() {
  try {
    console.log("Démarrage de l'initialisation des spécialités chirurgicales...");

    // Vérifier si des spécialités existent déjà
    const existingSpecialties = await prisma.specialty.count();

    if (existingSpecialties > 0) {
      console.log(`${existingSpecialties} spécialités existent déjà dans la base de données.`);
      console.log('Vérification des spécialités manquantes...');

      // Récupérer toutes les spécialités existantes
      const existingSpecialtiesData = await prisma.specialty.findMany({
        select: { name: true }
      });
      const existingSpecialtyNames = existingSpecialtiesData.map(spec => spec.name);

      // Filtrer les spécialités à ajouter (celles qui n'existent pas encore)
      const specialtiesToAdd = specialtiesToSeed.filter(
        specialty => !existingSpecialtyNames.includes(specialty.name)
      );

      if (specialtiesToAdd.length > 0) {
        await prisma.specialty.createMany({
          data: specialtiesToAdd,
          skipDuplicates: true
        });
        console.log(`${specialtiesToAdd.length} nouvelles spécialités ont été ajoutées.`);
      } else {
        console.log('Aucune nouvelle spécialité à ajouter.');
      }
    } else {
      // Aucune spécialité n'existe, ajouter toutes les spécialités
      await prisma.specialty.createMany({
        data: specialtiesToSeed,
        skipDuplicates: true
      });
      console.log(`${specialtiesToSeed.length} spécialités ont été ajoutées.`);
    }

    console.log('Initialisation des spécialités chirurgicales terminée avec succès!');
    return true;
  } catch (error) {
    console.error("Erreur lors de l'initialisation des spécialités chirurgicales:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedSpecialties()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erreur lors du seed des spécialités:', error);
      process.exit(1);
    });
}

export { seedSpecialties };