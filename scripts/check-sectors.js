import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Vérification des secteurs et salles d'opération...");

        const sectors = await prisma.operatingSector.findMany({
            include: {
                operatingRooms: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        console.log("\n=== Secteurs et salles d'opération ===\n");

        sectors.forEach(sector => {
            console.log(`Secteur: ${sector.name}`);
            console.log(`  Description: ${sector.description}`);
            console.log(`  Couleur: ${sector.colorCode}`);
            console.log(`  Actif: ${sector.isActive}`);
            console.log(`  Salles (${sector.operatingRooms.length}):`);

            sector.operatingRooms.forEach(room => {
                console.log(`    - ${room.name} (${room.number}), ${room.isActive ? 'Active' : 'Inactive'}`);
            });

            console.log(""); // Ligne vide pour séparer les secteurs
        });

        // Nombre total de secteurs et salles
        const totalRooms = sectors.reduce((total, sector) => total + sector.operatingRooms.length, 0);
        console.log(`Total: ${sectors.length} secteurs, ${totalRooms} salles`);

    } catch (error) {
        console.error("Erreur lors de la vérification:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 