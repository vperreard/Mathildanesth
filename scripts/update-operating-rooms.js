import { PrismaClient } from '@prisma/client';
import { operatingConfiguration } from '../config/seed-config.js';

const prisma = new PrismaClient();

/**
 * Met à jour les secteurs et salles d'opération selon la configuration centralisée
 */
async function updateOperatingSectors() {
    console.log("Mise à jour des secteurs opératoires et salles d'opération...");

    try {
        // Récupérer les secteurs existants
        const existingSectors = await prisma.operatingSector.findMany();
        const existingSectorIds = new Map(existingSectors.map(s => [s.name, s.id]));

        // Récupérer les salles existantes
        const existingRooms = await prisma.operatingRoom.findMany();
        const existingRoomIds = new Map(existingRooms.map(r => [r.number, r.id]));

        // Compter pour le reporting
        let sectorsCreated = 0;
        let sectorsUpdated = 0;
        let roomsCreated = 0;
        let roomsUpdated = 0;

        // Traiter chaque secteur de la configuration
        for (const sectorConfig of operatingConfiguration.sectors) {
            let sectorId;

            // Vérifier si le secteur existe déjà
            if (existingSectorIds.has(sectorConfig.name)) {
                // Mettre à jour le secteur existant
                sectorId = existingSectorIds.get(sectorConfig.name);
                await prisma.operatingSector.update({
                    where: { id: sectorId },
                    data: {
                        colorCode: sectorConfig.colorCode,
                        isActive: sectorConfig.isActive,
                        description: sectorConfig.description
                    }
                });
                sectorsUpdated++;
                console.log(`Secteur mis à jour: ${sectorConfig.name}`);
            } else {
                // Créer un nouveau secteur
                const newSector = await prisma.operatingSector.create({
                    data: {
                        name: sectorConfig.name,
                        colorCode: sectorConfig.colorCode,
                        isActive: sectorConfig.isActive,
                        description: sectorConfig.description,
                        rules: { maxRoomsPerSupervisor: 4 } // Règle par défaut
                    }
                });
                sectorId = newSector.id;
                sectorsCreated++;
                console.log(`Secteur créé: ${sectorConfig.name}`);
            }

            // Traiter chaque salle du secteur
            for (const roomConfig of sectorConfig.rooms) {
                // Vérifier si la salle existe déjà
                if (existingRoomIds.has(roomConfig.number)) {
                    // Mettre à jour la salle existante
                    const roomId = existingRoomIds.get(roomConfig.number);
                    await prisma.operatingRoom.update({
                        where: { id: roomId },
                        data: {
                            name: roomConfig.name,
                            sectorId: sectorId,
                            isActive: roomConfig.isActive,
                            colorCode: roomConfig.colorCode || null,
                            // Préserver les règles de supervision existantes ou initialiser
                            supervisionRules: existingRooms.find(r => r.id === roomId)?.supervisionRules || {},
                        }
                    });
                    roomsUpdated++;
                    console.log(`Salle mise à jour: ${roomConfig.name} (${roomConfig.number})`);
                } else {
                    // Créer une nouvelle salle
                    await prisma.operatingRoom.create({
                        data: {
                            name: roomConfig.name,
                            number: roomConfig.number,
                            sectorId: sectorId,
                            isActive: roomConfig.isActive,
                            colorCode: roomConfig.colorCode || null,
                            supervisionRules: {} // Objet vide par défaut
                        }
                    });
                    roomsCreated++;
                    console.log(`Salle créée: ${roomConfig.name} (${roomConfig.number})`);
                }
            }
        }

        console.log("\nRécapitulatif:");
        console.log(`Secteurs créés: ${sectorsCreated}, Secteurs mis à jour: ${sectorsUpdated}`);
        console.log(`Salles créées: ${roomsCreated}, Salles mises à jour: ${roomsUpdated}`);

    } catch (error) {
        console.error("Erreur lors de la mise à jour des secteurs et salles:", error);
    }
}

async function main() {
    try {
        await updateOperatingSectors();
        console.log("Mise à jour des salles d'opération terminée avec succès");
    } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 