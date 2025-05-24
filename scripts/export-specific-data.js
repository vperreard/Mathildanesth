import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Exporte des données sélectionnées pour créer des seeds
 * Usage: node scripts/export-specific-data.js [tables]
 * Exemple: node scripts/export-specific-data.js users,leaves,surgeons
 */
async function exportSpecificData(tablesToExport = []) {
    console.log("Export sélectif des données...");

    try {
        const exportDir = path.join(process.cwd(), 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `selective-export-${timestamp}.json`;
        const filePath = path.join(exportDir, filename);

        const exportData = {};

        // Tables disponibles pour export
        const availableTables = {
            users: async () => await prisma.user.findMany({
                select: {
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
                    phoneNumber: true,
                    alias: true,
                    workPattern: true,
                    joursTravaillesSemaineImpaire: true,
                    joursTravaillesSemainePaire: true
                }
            }),

            leaves: async () => await prisma.leave.findMany({
                include: {
                    user: {
                        select: {
                            nom: true,
                            prenom: true,
                            professionalRole: true
                        }
                    }
                }
            }),

            surgeons: async () => await prisma.surgeon.findMany({
                include: {
                    specialties: {
                        select: {
                            name: true,
                            isPediatric: true
                        }
                    }
                }
            }),

            specialties: async () => await prisma.specialty.findMany(),

            leaveTypes: async () => await prisma.leaveTypeSetting.findMany(),

            operatingRooms: async () => await prisma.operatingRoom.findMany({
                include: {
                    sector: {
                        select: {
                            name: true,
                            category: true
                        }
                    }
                }
            }),

            operatingSectors: async () => await prisma.operatingSector.findMany(),

            rules: async () => await prisma.rule.findMany(),

            planningRules: async () => await prisma.planningRule.findMany()
        };

        // Si aucune table spécifiée, prendre toutes les tables
        const tablesToProcess = tablesToExport.length > 0
            ? tablesToExport
            : Object.keys(availableTables);

        console.log(`Tables à exporter: ${tablesToProcess.join(', ')}`);

        // Exporter les tables demandées
        for (const table of tablesToProcess) {
            if (availableTables[table]) {
                console.log(`Export de la table: ${table}...`);
                exportData[table] = await availableTables[table]();
                console.log(`  ✅ ${table}: ${exportData[table].length} entrées`);
            } else {
                console.warn(`  ⚠️  Table inconnue: ${table}`);
            }
        }

        // Écrire le fichier JSON
        fs.writeFileSync(filePath, JSON.stringify(exportData, null, 2));

        console.log(`\n✅ Export terminé: ${filePath}`);
        console.log(`\nRécapitulatif:`);
        Object.entries(exportData).forEach(([table, data]) => {
            console.log(`- ${table}: ${data.length} entrées`);
        });

        return { filePath, exportData };
    } catch (error) {
        console.error("Erreur lors de l'export:", error);
        throw error;
    }
}

async function main() {
    try {
        // Récupérer les arguments de la ligne de commande
        const args = process.argv.slice(2);
        const tablesToExport = args.length > 0
            ? args[0].split(',').map(t => t.trim())
            : [];

        const { filePath } = await exportSpecificData(tablesToExport);

        console.log(`\n📋 Tables disponibles pour export:`);
        console.log(`users, leaves, surgeons, specialties, leaveTypes, operatingRooms, operatingSectors, rules, planningRules`);
        console.log(`\n🔄 Pour créer un seed à partir de cet export:`);
        console.log(`node scripts/create-seed-from-export.js ${path.basename(filePath)}`);
    } catch (error) {
        console.error("Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 