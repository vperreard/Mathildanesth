import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Liste des secteurs qui doivent être conservés
const ALLOWED_SECTORS = [
    'Aseptique',
    'Intermédiaire',
    'Septique',
    'Ophtalmo',
    'Endoscopie'
];

async function main() {
    try {
        console.log("Nettoyage des secteurs et salles d'opération non spécifiés...");

        // Récupérer tous les secteurs
        const allSectors = await prisma.operatingSector.findMany();

        // Identifier les secteurs à supprimer
        const sectorsToDelete = allSectors.filter(sector => !ALLOWED_SECTORS.includes(sector.name));

        if (sectorsToDelete.length === 0) {
            console.log("Aucun secteur à supprimer.");
            return;
        }

        console.log(`${sectorsToDelete.length} secteur(s) à supprimer : ${sectorsToDelete.map(s => s.name).join(', ')}`);

        // Supprimer les salles associées à ces secteurs puis les secteurs eux-mêmes
        for (const sector of sectorsToDelete) {
            // D'abord, récupérer toutes les salles du secteur
            const rooms = await prisma.operatingRoom.findMany({
                where: { sectorId: sector.id }
            });

            console.log(`Suppression de ${rooms.length} salle(s) du secteur ${sector.name}...`);

            // Supprimer toutes les salles du secteur
            if (rooms.length > 0) {
                await prisma.operatingRoom.deleteMany({
                    where: { sectorId: sector.id }
                });
            }

            // Ensuite, supprimer le secteur
            await prisma.operatingSector.delete({
                where: { id: sector.id }
            });

            console.log(`Secteur ${sector.name} supprimé avec succès.`);
        }

        console.log("\nNettoyage terminé avec succès.");

    } catch (error) {
        console.error("Erreur lors du nettoyage:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 