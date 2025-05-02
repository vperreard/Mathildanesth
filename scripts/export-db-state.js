import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Exporte l'état actuel de la base de données dans un fichier JSON
 * pour permettre de restaurer facilement les données
 */
async function exportDatabaseState() {
    console.log("Exportation de l'état de la base de données...");

    try {
        // Créer le dossier d'export s'il n'existe pas
        const exportDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        // Timestamp pour le nom du fichier
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `db-export-${timestamp}.json`;
        const filePath = path.join(exportDir, filename);

        // Récupérer les données des différentes tables
        const exportData = {
            users: await prisma.user.findMany({
                select: {
                    id: true,
                    nom: true,
                    prenom: true,
                    login: true,
                    email: true,
                    role: true,
                    professionalRole: true,
                    tempsPartiel: true,
                    pourcentageTempsPartiel: true,
                    dateEntree: true,
                    dateSortie: true,
                    actif: true,
                    mustChangePassword: true,
                    phoneNumber: true,
                    alias: true,
                    workOnMonthType: true,
                    workPattern: true,
                    joursTravaillesSemaineImpaire: true,
                    joursTravaillesSemainePaire: true
                    // Exclure le mot de passe pour des raisons de sécurité
                }
            }),

            specialties: await prisma.specialty.findMany(),

            surgeons: await prisma.surgeon.findMany({
                include: {
                    specialties: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }),

            operatingSectors: await prisma.operatingSector.findMany(),

            operatingRooms: await prisma.operatingRoom.findMany({
                include: {
                    sector: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                }
            }),

            leaveTypeSettings: await prisma.leaveTypeSetting.findMany(),

            // Ajouter d'autres tables selon les besoins
            rules: await prisma.rule.findMany(),
            planningRules: await prisma.planningRule.findMany()
        };

        // Écrire les données dans un fichier JSON
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

        console.log(`\nExportation terminée avec succès !`);
        console.log(`Fichier créé: ${filePath}`);
        console.log(`\nRécapitulatif des données exportées:`);
        Object.entries(exportData).forEach(([table, data]) => {
            console.log(`- ${table}: ${Array.isArray(data) ? data.length : 0} entrées`);
        });

        return filePath;
    } catch (error) {
        console.error("Erreur lors de l'exportation des données:", error);
        throw error;
    }
}

async function main() {
    try {
        const exportedFilePath = await exportDatabaseState();
        console.log(`\nPour restaurer ces données ultérieurement, utilisez:`);
        console.log(`node scripts/import-db-state.js ${path.basename(exportedFilePath)}`);
    } catch (error) {
        console.error("Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 