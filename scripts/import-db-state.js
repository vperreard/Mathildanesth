import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const saltRounds = 10;

/**
 * Importe les données d'un fichier JSON précédemment exporté
 * @param {string} importFile - Chemin vers le fichier à importer
 */
async function importDatabaseState(importFile) {
    console.log(`Importation des données depuis: ${importFile}`);

    try {
        // Vérifier que le fichier existe
        if (!fs.existsSync(importFile)) {
            throw new Error(`Le fichier ${importFile} n'existe pas`);
        }

        // Lire le contenu du fichier
        const jsonData = fs.readFileSync(importFile, 'utf8');
        const data = JSON.parse(jsonData);

        // Statistiques
        const stats = {
            created: {},
            updated: {},
            errors: {}
        };

        // Fonction utilitaire pour compter
        const countStat = (category, type) => {
            stats[category][type] = (stats[category][type] || 0) + 1;
        };

        // 1. Importer les spécialités (nécessaires pour les chirurgiens)
        console.log("Importation des spécialités...");
        if (data.specialties && data.specialties.length > 0) {
            for (const specialty of data.specialties) {
                const { id, ...specialtyData } = specialty;

                try {
                    const existing = await prisma.specialty.findUnique({
                        where: { name: specialty.name }
                    });

                    if (existing) {
                        await prisma.specialty.update({
                            where: { id: existing.id },
                            data: specialtyData
                        });
                        countStat('updated', 'specialties');
                    } else {
                        await prisma.specialty.create({
                            data: specialtyData
                        });
                        countStat('created', 'specialties');
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'importation de la spécialité ${specialty.name}:`, error.message);
                    countStat('errors', 'specialties');
                }
            }
        }

        // 2. Importer les secteurs opératoires (nécessaires pour les salles)
        console.log("Importation des secteurs opératoires...");
        if (data.operatingSectors && data.operatingSectors.length > 0) {
            for (const sector of data.operatingSectors) {
                const { id, ...sectorData } = sector;

                try {
                    const existing = await prisma.operatingSector.findUnique({
                        where: { name: sector.name }
                    });

                    if (existing) {
                        await prisma.operatingSector.update({
                            where: { id: existing.id },
                            data: sectorData
                        });
                        countStat('updated', 'sectors');
                    } else {
                        await prisma.operatingSector.create({
                            data: sectorData
                        });
                        countStat('created', 'sectors');
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'importation du secteur ${sector.name}:`, error.message);
                    countStat('errors', 'sectors');
                }
            }
        }

        // 3. Importer les utilisateurs
        console.log("Importation des utilisateurs...");
        if (data.users && data.users.length > 0) {
            for (const user of data.users) {
                const { id, joursTravaillesSemaineImpaire, joursTravaillesSemainePaire, ...userData } = user;

                try {
                    const existing = await prisma.user.findUnique({
                        where: { login: user.login }
                    });

                    // Comme le mot de passe n'est pas exporté, utiliser un mot de passe par défaut pour les nouveaux utilisateurs
                    const defaultPassword = await bcrypt.hash(user.login, saltRounds);

                    // Convertir les JSON en objets
                    const userDataWithJson = {
                        ...userData,
                        password: existing ? existing.password : defaultPassword,
                        joursTravaillesSemaineImpaire: joursTravaillesSemaineImpaire || [],
                        joursTravaillesSemainePaire: joursTravaillesSemainePaire || []
                    };

                    if (existing) {
                        await prisma.user.update({
                            where: { id: existing.id },
                            data: {
                                ...userDataWithJson,
                                password: existing.password // Conserver le mot de passe existant
                            }
                        });
                        countStat('updated', 'users');
                    } else {
                        await prisma.user.create({
                            data: userDataWithJson
                        });
                        countStat('created', 'users');
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'importation de l'utilisateur ${user.login}:`, error.message);
                    countStat('errors', 'users');
                }
            }
        }

        // 4. Importer les chirurgiens
        console.log("Importation des chirurgiens...");
        if (data.surgeons && data.surgeons.length > 0) {
            for (const surgeon of data.surgeons) {
                const { id, specialties, ...surgeonData } = surgeon;

                try {
                    // Rechercher par nom et prénom
                    const existing = await prisma.surgeon.findFirst({
                        where: {
                            nom: surgeon.nom,
                            prenom: surgeon.prenom
                        }
                    });

                    // Récupérer les IDs des spécialités
                    const specialtyConnections = specialties?.map(s => ({ id: s.id })) || [];

                    if (existing) {
                        await prisma.surgeon.update({
                            where: { id: existing.id },
                            data: {
                                ...surgeonData,
                                specialties: {
                                    set: [], // Déconnecter les spécialités existantes
                                    connect: specialtyConnections
                                }
                            }
                        });
                        countStat('updated', 'surgeons');
                    } else {
                        await prisma.surgeon.create({
                            data: {
                                ...surgeonData,
                                specialties: {
                                    connect: specialtyConnections
                                }
                            }
                        });
                        countStat('created', 'surgeons');
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'importation du chirurgien ${surgeon.prenom} ${surgeon.nom}:`, error.message);
                    countStat('errors', 'surgeons');
                }
            }
        }

        // 5. Importer les salles d'opération
        console.log("Importation des salles d'opération...");
        if (data.operatingRooms && data.operatingRooms.length > 0) {
            for (const room of data.operatingRooms) {
                const { id, sector, ...roomData } = room;

                try {
                    const existing = await prisma.operatingRoom.findUnique({
                        where: { number: room.number }
                    });

                    if (existing) {
                        await prisma.operatingRoom.update({
                            where: { id: existing.id },
                            data: roomData
                        });
                        countStat('updated', 'rooms');
                    } else {
                        await prisma.operatingRoom.create({
                            data: roomData
                        });
                        countStat('created', 'rooms');
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'importation de la salle ${room.name}:`, error.message);
                    countStat('errors', 'rooms');
                }
            }
        }

        // 6. Importer les types de congés
        console.log("Importation des types de congés...");
        if (data.leaveTypeSettings && data.leaveTypeSettings.length > 0) {
            for (const leaveType of data.leaveTypeSettings) {
                const { id, ...leaveTypeData } = leaveType;

                try {
                    const existing = await prisma.leaveTypeSetting.findUnique({
                        where: { code: leaveType.code }
                    });

                    if (existing) {
                        await prisma.leaveTypeSetting.update({
                            where: { id: existing.id },
                            data: leaveTypeData
                        });
                        countStat('updated', 'leaveTypes');
                    } else {
                        await prisma.leaveTypeSetting.create({
                            data: leaveTypeData
                        });
                        countStat('created', 'leaveTypes');
                    }
                } catch (error) {
                    console.error(`Erreur lors de l'importation du type de congé ${leaveType.label}:`, error.message);
                    countStat('errors', 'leaveTypes');
                }
            }
        }

        // Afficher les statistiques
        console.log("\nImportation terminée avec succès !");
        console.log("\nRécapitulatif:");
        console.log("Créations:");
        Object.entries(stats.created).forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
        });

        console.log("Mises à jour:");
        Object.entries(stats.updated).forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
        });

        console.log("Erreurs:");
        Object.entries(stats.errors).forEach(([type, count]) => {
            console.log(`- ${type}: ${count}`);
        });

    } catch (error) {
        console.error("Erreur lors de l'importation des données:", error);
        throw error;
    }
}

async function main() {
    try {
        // Récupérer le nom du fichier à partir des arguments
        const [, , importFileName] = process.argv;

        if (!importFileName) {
            console.error("Erreur: Veuillez spécifier un fichier d'import.");
            console.log("Usage: node scripts/import-db-state.js <fichier>");
            console.log("Exemple: node scripts/import-db-state.js db-export-2023-01-01.json");
            process.exit(1);
        }

        // Construire le chemin complet
        const importFile = path.join(process.cwd(), 'exports', importFileName);

        await importDatabaseState(importFile);
    } catch (error) {
        console.error("Erreur:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 