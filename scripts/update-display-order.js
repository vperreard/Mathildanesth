// Script pour mettre à jour l'ordre d'affichage des secteurs opératoires et salles
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ordre souhaité des secteurs (à personnaliser selon vos besoins)
const SECTOR_ORDER = [
    "Hyperaseptique",
    "Orthopédie",
    "Viscéral",
    "Ambulatoire",
    "Ophtalmologie",
    "Bloc A",
    "Bloc B",
    "Endoscopie"
];

async function updateDisplayOrder() {
    try {
        console.log("Mise à jour des displayOrder pour les secteurs et salles opératoires...");

        // 1. Récupérer tous les secteurs
        const sectors = await prisma.operatingSector.findMany();
        console.log(`${sectors.length} secteurs trouvés.`);

        // 2. Mettre à jour le displayOrder des secteurs selon l'ordre spécifié
        for (let i = 0; i < SECTOR_ORDER.length; i++) {
            const sectorName = SECTOR_ORDER[i];
            const matchingSectors = sectors.filter(s =>
                s.name.toLowerCase().includes(sectorName.toLowerCase())
            );

            for (const sector of matchingSectors) {
                await prisma.operatingSector.update({
                    where: { id: sector.id },
                    data: { displayOrder: i + 1 } // Commencer à 1 pour que 0 reste la valeur par défaut
                });
                console.log(`Secteur "${sector.name}" (ID: ${sector.id}) : displayOrder mis à jour à ${i + 1}`);
            }
        }

        // 3. Pour les secteurs non listés dans SECTOR_ORDER, garder displayOrder = 0
        const unlisted = sectors.filter(s => !SECTOR_ORDER.some(name =>
            s.name.toLowerCase().includes(name.toLowerCase())
        ));
        console.log(`${unlisted.length} secteurs non listés gardent displayOrder = 0`);

        // 4. Pour chaque secteur, mettre à jour les salles associées
        for (const sector of sectors) {
            // Récupérer les salles du secteur
            const rooms = await prisma.operatingRoom.findMany({
                where: { sectorId: sector.id }
            });

            // Mettre à jour displayOrder des salles (par ordre alphabétique ou numérique)
            rooms.sort((a, b) => {
                // Essayer de trier par numéro si possible
                const numA = parseInt(a.number);
                const numB = parseInt(b.number);
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                // Sinon trier par nom
                return a.name.localeCompare(b.name);
            });

            for (let i = 0; i < rooms.length; i++) {
                await prisma.operatingRoom.update({
                    where: { id: rooms[i].id },
                    data: { displayOrder: i + 1 }
                });
                console.log(`Salle "${rooms[i].name}" (ID: ${rooms[i].id}) du secteur ${sector.name} : displayOrder mis à jour à ${i + 1}`);
            }
        }

        console.log("Mise à jour terminée avec succès !");
    } catch (error) {
        console.error("Erreur lors de la mise à jour des displayOrder:", error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
updateDisplayOrder()
    .then(() => console.log("Script terminé."))
    .catch(e => console.error("Erreur d'exécution:", e)); 