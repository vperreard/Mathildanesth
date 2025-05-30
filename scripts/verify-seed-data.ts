import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
  try {
    console.log('=== Vérification des données de la base ===');
    
    // Compter les spécialités
    const specialtyCount = await prisma.specialty.count();
    console.log(`Nombre de spécialités: ${specialtyCount}`);
    
    // Compter les chirurgiens
    const surgeonCount = await prisma.surgeon.count();
    console.log(`Nombre de chirurgiens: ${surgeonCount}`);
    
    // Afficher quelques spécialités
    const specialties = await prisma.specialty.findMany({
      take: 5,
      orderBy: { name: 'asc' }
    });
    console.log('\n=== Quelques spécialités ===');
    specialties.forEach(spec => {
      console.log(`- ${spec.name} (Pédiatrique: ${spec.isPediatric})`);
    });
    
    // Afficher quelques chirurgiens avec leurs spécialités
    const surgeons = await prisma.surgeon.findMany({
      take: 5,
      include: {
        specialties: true
      },
      orderBy: { nom: 'asc' }
    });
    console.log('\n=== Quelques chirurgiens ===');
    surgeons.forEach(surgeon => {
      console.log(`- ${surgeon.prenom} ${surgeon.nom}`);
      console.log(`  Email: ${surgeon.email}`);
      console.log(`  Spécialités: ${surgeon.specialties.map(s => s.name).join(', ')}`);
      console.log('');
    });
    
    console.log('=== Vérification terminée ===');
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();