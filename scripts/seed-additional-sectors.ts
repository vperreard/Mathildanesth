import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedAdditionalSectors() {
  try {
    console.log("Démarrage de l'ajout des secteurs et salles demandés...");

    // Récupérer les sites existants
    const siteMatilde = await prisma.site.findFirst({
      where: { name: 'Clinique Mathilde' }
    });
    
    const siteEurope = await prisma.site.findFirst({
      where: { name: 'Clinique de l\'Europe' }
    });

    if (!siteMatilde || !siteEurope) {
      throw new Error('Sites Clinique Mathilde ou Clinique de l\'Europe non trouvés');
    }

    console.log(`Site Mathilde trouvé: ${siteMatilde.id}`);
    console.log(`Site Europe trouvé: ${siteEurope.id}`);

    // === CLINIQUE MATHILDE ===
    
    // 1. Secteur Consultations Mathilde
    console.log('\n🏥 Création du secteur Consultations - Clinique Mathilde...');
    
    const consultationsMathilde = await prisma.operatingSector.upsert({
      where: { name: 'Consultations' },
      update: {},
      create: {
        name: 'Consultations',
        description: 'Secteur des consultations spécialisées',
        category: 'STANDARD',
        siteId: siteMatilde.id,
        isActive: true,
        displayOrder: 10
      }
    });

    // Salles de consultation Mathilde
    const sallesConsultationMathilde = ['CS1', 'CS2', 'CS3'];
    
    for (const salleName of sallesConsultationMathilde) {
      await prisma.operatingRoom.upsert({
        where: { number: `CM-${salleName}` },
        update: {},
        create: {
          name: `Salle ${salleName}`,
          number: `CM-${salleName}`,
          description: `Salle de consultation ${salleName} - Clinique Mathilde`,
          roomType: 'CONSULTATION',
          capacity: 1,
          isActive: true,
          siteId: siteMatilde.id,
          operatingSectorId: consultationsMathilde.id,
          displayOrder: parseInt(salleName.replace('CS', ''))
        }
      });
      console.log(`   ✅ Salle ${salleName} créée`);
    }

    // 2. Secteur Gardes-Astreintes Mathilde
    console.log('\n🏥 Création du secteur Gardes-Astreintes - Clinique Mathilde...');
    
    const gardesAstreintesMathilde = await prisma.operatingSector.upsert({
      where: { name: 'Gardes-Astreintes Mathilde' },
      update: {},
      create: {
        name: 'Gardes-Astreintes Mathilde',
        description: 'Secteur des gardes et astreintes',
        category: 'STANDARD',
        siteId: siteMatilde.id,
        isActive: true,
        displayOrder: 11
      }
    });

    // Salles gardes et astreintes Mathilde
    const sallesGardesAstreintes = [
      { name: 'Garde M', number: 'CM-Garde-M', description: 'Salle de garde Mathilde' },
      { name: 'Astreinte M', number: 'CM-Astreinte-M', description: 'Salle d\'astreinte Mathilde' }
    ];
    
    for (const salle of sallesGardesAstreintes) {
      await prisma.operatingRoom.upsert({
        where: { number: salle.number },
        update: {},
        create: {
          name: salle.name,
          number: salle.number,
          description: salle.description,
          roomType: 'STANDARD',
          capacity: 1,
          isActive: true,
          siteId: siteMatilde.id,
          operatingSectorId: gardesAstreintesMathilde.id,
          displayOrder: sallesGardesAstreintes.indexOf(salle) + 1
        }
      });
      console.log(`   ✅ ${salle.name} créée`);
    }

    // === CLINIQUE DE L'EUROPE ===
    
    // 1. Secteur Astreinte Europe
    console.log('\n🏥 Création du secteur Astreinte Europe - Clinique de l\'Europe...');
    
    const astreinteEurope = await prisma.operatingSector.upsert({
      where: { name: 'Astreinte Europe' },
      update: {},
      create: {
        name: 'Astreinte Europe',
        description: 'Secteur d\'astreinte Europe',
        category: 'STANDARD',
        siteId: siteEurope.id,
        isActive: true,
        displayOrder: 10
      }
    });

    // Salle astreinte Europe
    await prisma.operatingRoom.upsert({
      where: { number: 'CE-Astreinte-E' },
      update: {},
      create: {
        name: 'Astreinte E',
        number: 'CE-Astreinte-E',
        description: 'Salle d\'astreinte Europe',
        roomType: 'STANDARD',
        capacity: 1,
        isActive: true,
        siteId: siteEurope.id,
        operatingSectorId: astreinteEurope.id,
        displayOrder: 1
      }
    });
    console.log(`   ✅ Astreinte E créée`);

    // 2. Secteur Consultations Europe
    console.log('\n🏥 Création du secteur Consultations Europe - Clinique de l\'Europe...');
    
    const consultationsEurope = await prisma.operatingSector.upsert({
      where: { name: 'Consultations Europe' },
      update: {},
      create: {
        name: 'Consultations Europe',
        description: 'Secteur des consultations Europe',
        category: 'STANDARD',
        siteId: siteEurope.id,
        isActive: true,
        displayOrder: 11
      }
    });

    // Salles de consultation Europe
    const sallesConsultationEurope = ['CS1E', 'CS2E', 'CS3E'];
    
    for (const salleName of sallesConsultationEurope) {
      await prisma.operatingRoom.upsert({
        where: { number: `CE-${salleName}` },
        update: {},
        create: {
          name: `Salle ${salleName}`,
          number: `CE-${salleName}`,
          description: `Salle de consultation ${salleName} - Clinique de l'Europe`,
          roomType: 'CONSULTATION',
          capacity: 1,
          isActive: true,
          siteId: siteEurope.id,
          operatingSectorId: consultationsEurope.id,
          displayOrder: parseInt(salleName.replace('CS', '').replace('E', ''))
        }
      });
      console.log(`   ✅ Salle ${salleName} créée`);
    }

    console.log('\n🎉 Tous les secteurs et salles ont été créés avec succès !');

    // Résumé final
    console.log('\n=== RÉSUMÉ DES CRÉATIONS ===');
    console.log('📍 Clinique Mathilde:');
    console.log('   🏥 Secteur "Consultations" avec 3 salles: CS1, CS2, CS3');
    console.log('   🏥 Secteur "Gardes-Astreintes Mathilde" avec 2 salles: Garde M, Astreinte M');
    console.log('📍 Clinique de l\'Europe:');
    console.log('   🏥 Secteur "Astreinte Europe" avec 1 salle: Astreinte E');
    console.log('   🏥 Secteur "Consultations Europe" avec 3 salles: CS1E, CS2E, CS3E');

    return true;
  } catch (error) {
    console.error("Erreur lors de la création des secteurs:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  seedAdditionalSectors()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Erreur lors du seed des secteurs:', error);
      process.exit(1);
    });
}

export { seedAdditionalSectors };