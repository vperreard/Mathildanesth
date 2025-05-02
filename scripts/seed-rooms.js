import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import path from 'path';

const prisma = new PrismaClient();

// Fonction pour lire et parser un fichier CSV
const parseCsv = (filePath) => {
    try {
        const content = readFileSync(filePath, { encoding: 'utf-8' });
        return parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        });
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier ${filePath}:`, error);
        return [];
    }
};

async function seedOperatingRooms() {
    console.log('Importation des salles d\'opération...');
    const roomsData = parseCsv(path.join(process.cwd(), 'prisma/seed_data/operating_rooms.csv'));

    // Créer deux secteurs par défaut
    const sectors = [
        {
            name: "Secteur A",
            colorCode: "#FF5733",
            isActive: true,
            description: "Secteur principal"
        },
        {
            name: "Secteur B",
            colorCode: "#33A8FF",
            isActive: true,
            description: "Secteur secondaire"
        }
    ];

    for (const sectorData of sectors) {
        try {
            const existingSector = await prisma.operatingSector.findUnique({
                where: { name: sectorData.name }
            });

            if (existingSector) {
                await prisma.operatingSector.update({
                    where: { name: sectorData.name },
                    data: sectorData
                });
                console.log(`Secteur mis à jour: ${sectorData.name}`);
            } else {
                await prisma.operatingSector.create({
                    data: sectorData
                });
                console.log(`Secteur créé: ${sectorData.name}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour du secteur ${sectorData.name}:`, error);
        }
    }

    // Créer les salles
    for (const [index, roomData] of roomsData.entries()) {
        try {
            // Associer à un secteur
            const sector = await prisma.operatingSector.findFirst({
                where: { name: roomData.sector || "Secteur A" }
            });

            // Utiliser le numéro comme identifiant unique pour la salle
            const roomNumber = roomData.number || `S${index + 1}`;

            const existingRoom = await prisma.operatingRoom.findUnique({
                where: { number: roomNumber }
            });

            const roomToUpsert = {
                name: roomData.name,
                number: roomNumber,
                colorCode: roomData.colorCode || null,
                isActive: roomData.isActive === 'true',
                supervisionRules: {}, // Objet vide par défaut
                sectorId: sector?.id || 1 // Utiliser le secteur A par défaut
            };

            if (existingRoom) {
                await prisma.operatingRoom.update({
                    where: { number: roomNumber },
                    data: roomToUpsert
                });
                console.log(`Salle mise à jour: ${roomData.name}`);
            } else {
                await prisma.operatingRoom.create({
                    data: roomToUpsert
                });
                console.log(`Salle créée: ${roomData.name}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour de la salle ${roomData.name}:`, error);
        }
    }
}

async function main() {
    try {
        await seedOperatingRooms();
        console.log("Importation des salles d'opération terminée");
    } catch (error) {
        console.error("Erreur lors de l'importation des salles d'opération:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 