import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import bcrypt from 'bcrypt';
import path from 'path';

const prisma = new PrismaClient();
const saltRounds = 10;

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

async function seedUsers() {
    console.log('Importation des utilisateurs...');
    const usersData = parseCsv(path.join(process.cwd(), 'prisma/seed_data/utilisateurs.csv'));

    for (const userData of usersData) {
        try {
            const existingUser = await prisma.user.findUnique({
                where: { login: userData.login }
            });

            const userToCreate = {
                nom: userData.nom,
                prenom: userData.prenom,
                login: userData.login,
                email: userData.email || `${userData.login}@mathildanesth.fr`,
                password: await bcrypt.hash(userData.password || userData.login, saltRounds),
                role: userData.role || 'USER',
                professionalRole: userData.professionalRole || 'MAR',
                actif: userData.actif === 'true',
                mustChangePassword: userData.mustChangePassword === 'true',
                phoneNumber: userData.phoneNumber || null,
                tempsPartiel: userData.tempsPartiel === 'true',
                pourcentageTempsPartiel: userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null,
                joursTravailles: userData.joursTravailles || null,
                dateEntree: userData.dateEntree ? new Date(userData.dateEntree) : null,
                dateSortie: userData.dateSortie ? new Date(userData.dateSortie) : null
            };

            if (existingUser) {
                await prisma.user.update({
                    where: { login: userData.login },
                    data: userToCreate
                });
                console.log(`Utilisateur mis à jour: ${userData.prenom} ${userData.nom}`);
            } else {
                await prisma.user.create({
                    data: userToCreate
                });
                console.log(`Utilisateur créé: ${userData.prenom} ${userData.nom}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour de l'utilisateur ${userData.login}:`, error);
        }
    }
}

async function seedSurgeons() {
    console.log('Importation des chirurgiens...');
    const surgeonsData = parseCsv(path.join(process.cwd(), 'prisma/seed_data/chirurgiens.csv'));

    for (const surgeonData of surgeonsData) {
        try {
            const existingSurgeon = await prisma.surgeon.findFirst({
                where: {
                    nom: surgeonData.nom,
                    prenom: surgeonData.prenom
                }
            });

            const specialtyNames = surgeonData.specialtyNames?.split(';').filter(Boolean) || [];

            // Récupérer les IDs des spécialités
            const specialties = [];
            for (const name of specialtyNames) {
                const specialty = await prisma.specialty.findFirst({
                    where: { name: { contains: name, mode: 'insensitive' } }
                });

                if (specialty) {
                    specialties.push({ id: specialty.id });
                } else {
                    // Créer la spécialité si elle n'existe pas
                    const newSpecialty = await prisma.specialty.create({
                        data: {
                            name: name,
                            isPediatric: name.toLowerCase().includes('pédiatrique') || name.toLowerCase().includes('pediatrique')
                        }
                    });
                    specialties.push({ id: newSpecialty.id });
                }
            }

            const surgeonToUpsert = {
                nom: surgeonData.nom,
                prenom: surgeonData.prenom,
                email: surgeonData.email || null,
                phoneNumber: surgeonData.phoneNumber || null,
                googleSheetName: surgeonData.googleSheetName || null,
                isActive: true,
                specialties: {
                    connect: specialties
                }
            };

            if (existingSurgeon) {
                // Mise à jour du chirurgien existant
                await prisma.surgeon.update({
                    where: { id: existingSurgeon.id },
                    data: {
                        ...surgeonToUpsert,
                        specialties: {
                            set: [], // Déconnecter toutes les spécialités existantes
                            connect: specialties // Connecter les nouvelles spécialités
                        }
                    }
                });
                console.log(`Chirurgien mis à jour: ${surgeonData.prenom} ${surgeonData.nom}`);
            } else {
                // Création d'un nouveau chirurgien
                await prisma.surgeon.create({
                    data: surgeonToUpsert
                });
                console.log(`Chirurgien créé: ${surgeonData.prenom} ${surgeonData.nom}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour du chirurgien ${surgeonData.prenom} ${surgeonData.nom}:`, error);
        }
    }
}

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
    for (const roomData of roomsData) {
        try {
            // Associer à un secteur
            const sector = await prisma.operatingSector.findFirst({
                where: { name: roomData.sector || "Secteur A" }
            });

            const existingRoom = await prisma.operatingRoom.findUnique({
                where: { name: roomData.name }
            });

            const roomToUpsert = {
                name: roomData.name,
                shortName: roomData.shortName || roomData.name,
                description: roomData.description || '',
                isActive: roomData.isActive === 'true',
                operatingSectorId: sector?.id
            };

            if (existingRoom) {
                await prisma.operatingRoom.update({
                    where: { name: roomData.name },
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

async function seedLeaveTypes() {
    console.log('Importation des types de congés...');
    const leaveTypesData = parseCsv(path.join(process.cwd(), 'prisma/seed_data/leave_types.csv'));

    for (const typeData of leaveTypesData) {
        try {
            const existingType = await prisma.leaveTypeSetting.findUnique({
                where: { code: typeData.code }
            });

            let rules = {};
            try {
                rules = typeData.rules ? JSON.parse(typeData.rules) : {};
            } catch (e) {
                console.warn(`Impossible de parser les règles pour ${typeData.code}, utilisation de règles par défaut`);
            }

            const typeToUpsert = {
                code: typeData.code,
                label: typeData.label,
                description: typeData.description || '',
                isActive: typeData.isActive === 'true',
                isUserSelectable: typeData.isUserSelectable === 'true',
                rules: rules
            };

            if (existingType) {
                await prisma.leaveTypeSetting.update({
                    where: { code: typeData.code },
                    data: typeToUpsert
                });
                console.log(`Type de congé mis à jour: ${typeData.label}`);
            } else {
                await prisma.leaveTypeSetting.create({
                    data: typeToUpsert
                });
                console.log(`Type de congé créé: ${typeData.label}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour du type de congé ${typeData.code}:`, error);
        }
    }
}

async function seedSpecialties() {
    console.log('Création des spécialités par défaut...');

    const specialtiesToSeed = [
        { name: "Endoscopie digestive", isPediatric: false },
        { name: "Endoscopies digestives", isPediatric: false },
        { name: "Endoscopie interventionnelle", isPediatric: false },
        { name: "Orthopédie", isPediatric: false },
        { name: "Orthopédie Pédiatrique", isPediatric: true },
        { name: "Orthopédie pédiatrique", isPediatric: true },
        { name: "Chirurgie plastique", isPediatric: false },
        { name: "Chirurgie vasculaire", isPediatric: false },
        { name: "ORL", isPediatric: false },
        { name: "ORL pédiatrique", isPediatric: true },
        { name: "Chirurgie dentaire", isPediatric: false },
        { name: "Chirurgie maxillo-faciale", isPediatric: false },
        { name: "Chirurgie gynécologique", isPediatric: false },
        { name: "Procréation médicalement assistée", isPediatric: false },
        { name: "Chirurgie digestive", isPediatric: false },
        { name: "Chirurgie urologique", isPediatric: false },
        { name: "Chirurgie urologique pédiatrique", isPediatric: true },
        { name: "Ophtalmologie", isPediatric: false },
        { name: "Ophtalmologie pédiatrique", isPediatric: true },
        { name: "Chirurgie dentaire pédiatrique", isPediatric: true },
    ];

    for (const specialtyData of specialtiesToSeed) {
        try {
            const existingSpecialty = await prisma.specialty.findFirst({
                where: { name: specialtyData.name }
            });

            if (existingSpecialty) {
                await prisma.specialty.update({
                    where: { id: existingSpecialty.id },
                    data: specialtyData
                });
                console.log(`Spécialité mise à jour: ${specialtyData.name}`);
            } else {
                await prisma.specialty.create({
                    data: specialtyData
                });
                console.log(`Spécialité créée: ${specialtyData.name}`);
            }
        } catch (error) {
            console.error(`Erreur lors de la création/mise à jour de la spécialité ${specialtyData.name}:`, error);
        }
    }
}

async function main() {
    try {
        console.log("=== DÉBUT DE L'IMPORTATION DES DONNÉES ===");

        // Créer les spécialités (nécessaire pour les chirurgiens)
        await seedSpecialties();

        // Importer les utilisateurs
        await seedUsers();

        // Importer les chirurgiens
        await seedSurgeons();

        // Importer les salles d'opération
        await seedOperatingRooms();

        // Importer les types de congés
        await seedLeaveTypes();

        console.log("=== IMPORTATION TERMINÉE AVEC SUCCÈS ===");
    } catch (error) {
        console.error("Erreur lors de l'importation des données:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 