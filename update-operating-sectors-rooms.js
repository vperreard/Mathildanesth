const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Début de la mise à jour des secteurs et salles opératoires...');

    try {
        // Supprimer toutes les salles existantes
        console.log('Suppression des salles existantes...');
        await prisma.operatingRoom.deleteMany({});
        console.log('Toutes les salles d\'opération ont été supprimées.');

        // Supprimer tous les secteurs existants
        console.log('Suppression des secteurs existants...');
        await prisma.operatingSector.deleteMany({});
        console.log('Tous les secteurs opératoires ont été supprimés.');

        // Créer les secteurs opératoires
        const sectors = [
            {
                name: "Secteur hyperaseptique",
                colorCode: "#4CAF50", // Vert
                isActive: true,
                description: "Secteur pour chirurgie propre/stérile",
                rules: { maxRoomsPerSupervisor: 2 }
            },
            {
                name: "Secteur intermédiaire",
                colorCode: "#2196F3", // Bleu
                isActive: true,
                description: "Secteur pour chirurgie propre/contaminée",
                rules: { maxRoomsPerSupervisor: 2 }
            },
            {
                name: "Secteur septique",
                colorCode: "#F44336", // Rouge
                isActive: true,
                description: "Secteur pour chirurgie contaminée",
                rules: { maxRoomsPerSupervisor: 2 }
            },
            {
                name: "Secteur ophtalmo",
                colorCode: "#9C27B0", // Violet
                isActive: true,
                description: "Secteur spécialisé ophtalmologie",
                rules: { maxRoomsPerSupervisor: 3 }
            },
            {
                name: "Secteur endoscopie",
                colorCode: "#FF9800", // Orange
                isActive: true,
                description: "Secteur d'endoscopie",
                rules: { maxRoomsPerSupervisor: 4 }
            }
        ];

        console.log('Création des nouveaux secteurs opératoires...');

        // Créer les secteurs et stocker leurs IDs
        const sectorIds = {};
        for (const sector of sectors) {
            const createdSector = await prisma.operatingSector.create({
                data: sector
            });
            sectorIds[sector.name] = createdSector.id;
            console.log(`Secteur créé: ${sector.name} (ID: ${createdSector.id})`);
        }

        // Définir les salles pour chaque secteur
        const rooms = [
            // Secteur hyperaseptique (salles 1-4)
            ...Array.from({ length: 4 }, (_, i) => ({
                name: `Salle ${i + 1}`,
                number: `${i + 1}`,
                sectorId: sectorIds["Secteur hyperaseptique"],
                colorCode: "#4CAF50",
                isActive: true,
                supervisionRules: { maxSimultaneousSupervisions: 2 }
            })),

            // Secteur intermédiaire (salles 5-8)
            ...Array.from({ length: 4 }, (_, i) => ({
                name: `Salle ${i + 5}`,
                number: `${i + 5}`,
                sectorId: sectorIds["Secteur intermédiaire"],
                colorCode: "#2196F3",
                isActive: true,
                supervisionRules: { maxSimultaneousSupervisions: 2 }
            })),

            // Secteur septique (salles 9-12bis)
            ...Array.from({ length: 4 }, (_, i) => ({
                name: `Salle ${i + 9}${i === 3 ? 'bis' : ''}`,
                number: `${i + 9}${i === 3 ? 'bis' : ''}`,
                sectorId: sectorIds["Secteur septique"],
                colorCode: "#F44336",
                isActive: true,
                supervisionRules: { maxSimultaneousSupervisions: 2 }
            })),

            // Secteur ophtalmo (salles 14-17)
            ...Array.from({ length: 4 }, (_, i) => ({
                name: `Salle ${i + 14}`,
                number: `${i + 14}`,
                sectorId: sectorIds["Secteur ophtalmo"],
                colorCode: "#9C27B0",
                isActive: true,
                supervisionRules: { maxSimultaneousSupervisions: 2 }
            })),

            // Secteur endoscopie (endo 1-4)
            ...Array.from({ length: 4 }, (_, i) => ({
                name: `Endo ${i + 1}`,
                number: `E${i + 1}`,
                sectorId: sectorIds["Secteur endoscopie"],
                colorCode: "#FF9800",
                isActive: true,
                supervisionRules: { maxSimultaneousSupervisions: 2 }
            }))
        ];

        console.log('Création des nouvelles salles d\'opération...');

        // Créer les salles
        for (const room of rooms) {
            const createdRoom = await prisma.operatingRoom.create({
                data: room
            });
            console.log(`Salle créée: ${room.name} (Numéro: ${room.number}, Secteur ID: ${room.sectorId})`);
        }

        console.log('Mise à jour terminée avec succès !');

    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    }); 