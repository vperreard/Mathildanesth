import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExistingSites() {
  try {
    console.log('=== Vérification des sites existants ===');
    
    // Récupérer tous les sites
    const sites = await prisma.site.findMany({
      include: {
        operatingSectors: {
          include: {
            rooms: true
          }
        }
      }
    });
    
    console.log(`Nombre de sites: ${sites.length}`);
    
    sites.forEach(site => {
      console.log(`\n📍 Site: ${site.name}`);
      console.log(`   ID: ${site.id}`);
      console.log(`   Actif: ${site.isActive}`);
      console.log(`   Secteurs: ${site.operatingSectors.length}`);
      
      site.operatingSectors.forEach(sector => {
        console.log(`   🏥 Secteur: ${sector.name}`);
        console.log(`      Salles: ${sector.rooms.length}`);
        sector.rooms.forEach(room => {
          console.log(`      - ${room.name} (${room.number})`);
        });
      });
    });
    
    console.log('\n=== Fin de la vérification ===');
  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingSites();