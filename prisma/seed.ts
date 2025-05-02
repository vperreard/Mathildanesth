// prisma/seed.ts
console.log("[SEED DEBUG] Début du script seed.ts");
import { PrismaClient, Role, ProfessionalRole, UserStatus, Prisma, WorkPatternType, WeekType } from '@prisma/client';
import bcrypt from 'bcrypt';
console.log("[SEED DEBUG] Import bcrypt OK");
import fs from 'fs';
console.log("[SEED DEBUG] Import fs OK");
import path from 'path';
console.log("[SEED DEBUG] Import path OK");
import { fileURLToPath } from 'url';
console.log("[SEED DEBUG] Import fileURLToPath OK");
import { dirname } from 'path';
console.log("[SEED DEBUG] Import dirname OK");
import { parse } from 'csv-parse/sync';
console.log("[SEED DEBUG] Import csv-parse/sync OK");

// Équivalent ESM à __dirname
console.log("[SEED DEBUG] Calcul de __filename...");
const __filename = fileURLToPath(import.meta.url);
console.log("[SEED DEBUG] __filename OK:", __filename);
console.log("[SEED DEBUG] Calcul de __dirname...");
const __dirname = dirname(__filename);
console.log("[SEED DEBUG] __dirname OK:", __dirname);

console.log("[SEED DEBUG] Instanciation PrismaClient...");
const prisma = new PrismaClient();
console.log("[SEED DEBUG] PrismaClient OK");
const saltRounds = 10;
console.log("[SEED DEBUG] saltRounds OK");

console.log("[SEED DEBUG] Calcul usersCsvPath...");
const usersCsvPath = path.join(__dirname, 'seed_data', 'users.csv');
console.log("[SEED DEBUG] usersCsvPath OK:", usersCsvPath);
console.log("[SEED DEBUG] Calcul surgeonsCsvPath...");
const surgeonsCsvPath = path.join(__dirname, 'seed_data', 'surgeons.csv');
console.log("[SEED DEBUG] surgeonsCsvPath OK:", surgeonsCsvPath);
const specialtySeparator = ';';
console.log("[SEED DEBUG] specialtySeparator OK");


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


// --- Interfaces pour les données CSV ---
interface UserCsvData {
    nom: string;
    prenom: string;
    login: string;
    email: string;
    alias?: string;
    phoneNumber?: string;
    password?: string;
    // role: Role; // Reste commenté
    // professionalRole: ProfessionalRole; // Reste commenté
    tempsPartiel: string;
    pourcentageTempsPartiel?: string;
    joursTravailles?: string;
    dateEntree?: string;
    dateSortie?: string;
    actif: string;
    mustChangePassword?: string;
}

interface SurgeonCsvData {
    nom: string;
    prenom: string;
    email?: string;
    phoneNumber?: string;
    // status: string; // Reste commenté
    specialtyNames?: string;
    googleSheetName?: string;
}

function parseCsv<T>(filePath: string): T[] {
    if (!fs.existsSync(filePath)) {
        console.warn(`WARN: Fichier CSV non trouvé: ${filePath}. Skipping.`);
        return [];
    }
    const csvContent = fs.readFileSync(filePath, { encoding: 'utf-8' });
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true
    });
    return records as T[];
}

// Types de congés par défaut
const leaveTypes = [
    {
        code: 'CP',
        label: 'Congé annuel',
        description: 'Congé annuel payé',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 30,
            minRequestLeadTime: 30,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    },
    {
        code: 'RTT',
        label: 'RTT',
        description: 'Réduction du temps de travail',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 1,
            minRequestLeadTime: 7,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    },
    {
        code: 'FORM',
        label: 'Formation',
        description: 'Congé pour formation',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'CONTINUOUS_ALL_DAYS',
            maxDuration: 90,
            minRequestLeadTime: 30,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    },
    {
        code: 'MAL',
        label: 'Maladie',
        description: 'Congé maladie',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'CONTINUOUS_ALL_DAYS',
            maxDuration: 90,
            minRequestLeadTime: 0,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    },
    {
        code: 'MAT',
        label: 'Maternité',
        description: 'Congé maternité',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'CONTINUOUS_ALL_DAYS',
            maxDuration: 180,
            minRequestLeadTime: 30,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    },
    {
        code: 'CSS',
        label: 'Congé spécial',
        description: 'Congé pour événement spécial',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 5,
            minRequestLeadTime: 15,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    },
    {
        code: 'RECUP',
        label: 'Récupération',
        description: 'Récupération de temps de travail',
        isActive: 'true',
        isUserSelectable: 'true',
        rules: JSON.stringify({
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 1,
            minRequestLeadTime: 7,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        })
    }
];

// Règles de transfert de quotas par défaut
const quotaTransferRules = [
    {
        fromType: 'ANNUAL',
        toType: 'RECOVERY',
        conversionRate: 1.0,
        maxTransferDays: 5,
        maxTransferPercentage: 20,
        requiresApproval: false,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    },
    {
        fromType: 'RECOVERY',
        toType: 'ANNUAL',
        conversionRate: 1.0,
        maxTransferDays: 3,
        maxTransferPercentage: 100,
        requiresApproval: false,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    },
    {
        fromType: 'TRAINING',
        toType: 'ANNUAL',
        conversionRate: 0.5, // 2 jours de formation = 1 jour de congé annuel
        maxTransferDays: 5,
        maxTransferPercentage: 50,
        requiresApproval: true,
        authorizedRoles: ['ADMIN_TOTAL'],
        isActive: true
    },
    {
        fromType: 'ANNUAL',
        toType: 'TRAINING',
        conversionRate: 2.0, // 1 jour de congé annuel = 2 jours de formation
        maxTransferDays: 3,
        maxTransferPercentage: 10,
        requiresApproval: true,
        authorizedRoles: ['ADMIN_TOTAL'],
        isActive: true
    },
    {
        fromType: 'SPECIAL',
        toType: 'ANNUAL',
        conversionRate: 1.0,
        maxTransferDays: 2,
        maxTransferPercentage: 100,
        requiresApproval: true,
        authorizedRoles: ['ADMIN_TOTAL'],
        isActive: true
    }
];

// Règles de report de quotas par défaut
const quotaCarryOverRules = [
    {
        leaveType: 'ANNUAL',
        ruleType: 'PERCENTAGE',
        value: 10, // 10% du solde restant
        maxCarryOverDays: 5,
        expirationDays: 120, // 4 mois
        requiresApproval: false,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    },
    {
        leaveType: 'RECOVERY',
        ruleType: 'FIXED',
        value: 3, // Maximum 3 jours
        requiresApproval: false,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    },
    {
        leaveType: 'TRAINING',
        ruleType: 'PERCENTAGE',
        value: 100, // 100% du solde restant
        maxCarryOverDays: 10,
        requiresApproval: false,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    },
    {
        leaveType: 'SPECIAL',
        ruleType: 'EXPIRABLE',
        value: 100, // 100% du solde restant
        expirationDays: 90, // 3 mois
        requiresApproval: true,
        authorizedRoles: ['ADMIN_TOTAL'],
        isActive: true
    }
];

async function main() {
    console.log("[SEED DEBUG] Début de la fonction main()");

    try {
        // Créer les secteurs opératoires
        const operatingSectors = [
            {
                name: "Secteur A",
                colorCode: "#FF0000",
                isActive: true,
                description: "Secteur principal",
                rules: { maxRoomsPerSupervisor: 2 }
            },
            {
                name: "Secteur B",
                colorCode: "#00FF00",
                isActive: true,
                description: "Secteur secondaire",
                rules: { maxRoomsPerSupervisor: 2 }
            }
        ];

        for (const sector of operatingSectors) {
            try {
                const existingSector = await prisma.operatingSector.findUnique({
                    where: { name: sector.name }
                });

                if (existingSector) {
                    await prisma.operatingSector.update({
                        where: { name: sector.name },
                        data: sector
                    });
                    console.log(`[SEED DEBUG] Secteur opératoire mis à jour: ${sector.name}`);
                } else {
                    await prisma.operatingSector.create({
                        data: sector
                    });
                    console.log(`[SEED DEBUG] Nouveau secteur opératoire créé: ${sector.name}`);
                }
            } catch (error) {
                console.error(`[SEED DEBUG] Erreur lors du traitement du secteur ${sector.name}:`, error);
            }
        }

        // Créer les salles d'opération
        const operatingRooms = parseCsv<{
            name: string;
            number: string;
            sectorId: string;
            colorCode: string;
            isActive: string;
            supervisionRules: string;
        }>(path.join(__dirname, 'seed_data', 'operating_rooms.csv'));

        for (const room of operatingRooms) {
            try {
                const existingRoom = await prisma.operatingRoom.findUnique({
                    where: { number: room.number }
                });

                const roomData = {
                    name: room.name,
                    number: room.number,
                    sectorId: parseInt(room.sectorId),
                    colorCode: room.colorCode,
                    isActive: room.isActive.toLowerCase() === 'true',
                    supervisionRules: JSON.parse(room.supervisionRules)
                };

                if (existingRoom) {
                    await prisma.operatingRoom.update({
                        where: { number: room.number },
                        data: roomData
                    });
                    console.log(`[SEED DEBUG] Salle d'opération mise à jour: ${room.name}`);
                } else {
                    await prisma.operatingRoom.create({
                        data: roomData
                    });
                    console.log(`[SEED DEBUG] Nouvelle salle d'opération créée: ${room.name}`);
                }
            } catch (error) {
                console.error(`[SEED DEBUG] Erreur lors du traitement de la salle ${room.name}:`, error);
            }
        }

        // Créer les types de congés
        for (const leaveType of leaveTypes) {
            try {
                const existingLeaveType = await prisma.leaveTypeSetting.findUnique({
                    where: { code: leaveType.code }
                });

                const leaveTypeData = {
                    code: leaveType.code,
                    label: leaveType.label,
                    description: leaveType.description,
                    isActive: leaveType.isActive.toLowerCase() === 'true',
                    isUserSelectable: leaveType.isUserSelectable.toLowerCase() === 'true',
                    rules: JSON.parse(leaveType.rules)
                };

                if (existingLeaveType) {
                    await prisma.leaveTypeSetting.update({
                        where: { code: leaveType.code },
                        data: leaveTypeData
                    });
                    console.log(`[SEED DEBUG] Type de congé mis à jour: ${leaveType.label}`);
                } else {
                    await prisma.leaveTypeSetting.create({
                        data: leaveTypeData
                    });
                    console.log(`[SEED DEBUG] Nouveau type de congé créé: ${leaveType.label}`);
                }
            } catch (error) {
                console.error(`[SEED DEBUG] Erreur lors du traitement du type de congé ${leaveType.label}:`, error);
            }
        }

        // Créer les rôles professionnels
        const professionalRoles = [
            {
                id: '1',
                code: 'MAR',
                label: 'Médecin Anesthésiste Réanimateur',
                description: 'Médecin spécialisé en anesthésie-réanimation',
                isActive: true,
                displayPreferences: {
                    color: '#2196F3',
                    icon: 'doctor',
                    order: 1,
                    visibility: {
                        calendar: true,
                        dashboard: true,
                        planning: true
                    }
                }
            },
            {
                id: '2',
                code: 'IADE',
                label: 'Infirmier Anesthésiste',
                description: 'Infirmier spécialisé en anesthésie',
                isActive: true,
                displayPreferences: {
                    color: '#4CAF50',
                    icon: 'nurse',
                    order: 2,
                    visibility: {
                        calendar: true,
                        dashboard: true,
                        planning: true
                    }
                }
            },
            {
                id: '3',
                code: 'SECRETAIRE',
                label: 'Secrétaire',
                description: 'Personnel administratif',
                isActive: true,
                displayPreferences: {
                    color: '#FF9800',
                    icon: 'secretary',
                    order: 3,
                    visibility: {
                        calendar: true,
                        dashboard: true,
                        planning: true
                    }
                }
            }
        ];

        for (const role of professionalRoles) {
            try {
                const existingRole = await prisma.professionalRoleConfig.findUnique({
                    where: { code: role.code }
                });

                if (existingRole) {
                    await prisma.professionalRoleConfig.update({
                        where: { code: role.code },
                        data: role
                    });
                    console.log(`[SEED DEBUG] Rôle professionnel mis à jour: ${role.code}`);
                } else {
                    await prisma.professionalRoleConfig.create({
                        data: role
                    });
                    console.log(`[SEED DEBUG] Nouveau rôle professionnel créé: ${role.code}`);
                }
            } catch (error) {
                console.error(`[SEED DEBUG] Erreur lors du traitement du rôle ${role.code}:`, error);
            }
        }

        // Création des types de congés par défaut
        for (const leaveType of leaveTypes) {
            await prisma.leaveTypeSetting.create({
                data: leaveType
            });
        }

        // Création des règles de transfert de quotas par défaut
        for (const rule of quotaTransferRules) {
            await prisma.quotaTransferRule.create({
                data: rule
            });
        }

        // Création des règles de report de quotas par défaut
        for (const rule of quotaCarryOverRules) {
            await prisma.quotaCarryOverRule.create({
                data: rule
            });
        }

        // Lire le fichier CSV
        const csvContent = fs.readFileSync(usersCsvPath, 'utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim());

        // Ignorer l'en-tête
        const headers = lines[0].split(',');
        const dataLines = lines.slice(1);

        // Traiter chaque ligne
        for (const line of dataLines) {
            const values = line.split(',');
            const userData: any = {};

            // Mapper les valeurs aux en-têtes
            headers.forEach((header, index) => {
                userData[header.trim()] = values[index]?.trim() || '';
            });

            // Convertir les rôles
            const userRoleString = userData.role?.toUpperCase() || 'USER';
            const userProfRoleString = userData.professionalRole?.toUpperCase() || 'MAR';

            // Convertir les booléens
            const tempsPartiel = userData.tempsPartiel?.toLowerCase() === 'true';
            const pourcentage = userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null;
            const actif = userData.actif?.toLowerCase() !== 'false';
            const mustChangePassword = userData.mustChangePassword?.toLowerCase() !== 'false';

            // Convertir les dates
            const dateEntree = userData.dateEntree ? new Date(userData.dateEntree) : null;
            const dateSortie = userData.dateSortie ? new Date(userData.dateSortie) : null;

            // Déterminer le pattern de travail
            let workPattern: WorkPatternType = WorkPatternType.FULL_TIME;
            let workOnWeekType: WeekType | null = null;
            let workOnMonthType: WeekType | null = null;

            if (tempsPartiel) {
                const joursDesc = userData.joursTravailles?.toLowerCase() || '';
                if (joursDesc.includes('semaines')) {
                    workPattern = WorkPatternType.ALTERNATING_WEEKS;
                } else if (joursDesc.includes('mois')) {
                    workPattern = WorkPatternType.ALTERNATING_MONTHS;
                } else {
                    workPattern = WorkPatternType.SPECIFIC_DAYS;
                }

                if (workPattern === WorkPatternType.SPECIFIC_DAYS) {
                    if (joursDesc.includes('semaines paires')) {
                        workOnWeekType = WeekType.EVEN;
                    } else if (joursDesc.includes('semaines impaires')) {
                        workOnWeekType = WeekType.ODD;
                    }
                }
            }

            try {
                const existingUser = await prisma.user.findUnique({ where: { login: userData.login } });

                const commonUserData = {
                    nom: userData.nom || '',
                    prenom: userData.prenom || '',
                    login: userData.login,
                    email: userData.email || `${userData.login}@example.local`,
                    alias: userData.alias || null,
                    phoneNumber: userData.phoneNumber || null,
                    role: userRoleString as any,
                    professionalRole: userProfRoleString as any,
                    tempsPartiel: tempsPartiel,
                    pourcentageTempsPartiel: pourcentage,
                    dateEntree: dateEntree,
                    dateSortie: dateSortie,
                    actif: actif,
                    mustChangePassword: mustChangePassword,
                    workPattern: workPattern,
                    workOnMonthType: workOnMonthType,
                    joursTravaillesSemaineImpaire: userData.joursTravaillesSemaineImpaire || "[]",
                    joursTravaillesSemainePaire: userData.joursTravaillesSemainePaire || "[]"
                };

                if (existingUser) {
                    // Mettre à jour l'utilisateur existant
                    await prisma.user.update({
                        where: { login: userData.login },
                        data: {
                            ...commonUserData,
                            password: userData.password ? await bcrypt.hash(userData.password, saltRounds) : undefined
                        }
                    });
                    console.log(`[SEED DEBUG] Utilisateur mis à jour: ${userData.login}`);
                } else {
                    // Créer un nouvel utilisateur
                    await prisma.user.create({
                        data: {
                            ...commonUserData,
                            password: await bcrypt.hash(userData.password || 'password', saltRounds)
                        }
                    });
                    console.log(`[SEED DEBUG] Nouvel utilisateur créé: ${userData.login}`);
                }
            } catch (error) {
                console.error(`[SEED DEBUG] Erreur lors du traitement de l'utilisateur ${userData.login}:`, error);
            }
        }

        console.log("[SEED DEBUG] Fin de la fonction main()");
    } catch (error) {
        console.error("[SEED DEBUG] Erreur dans main():", error);
        throw error;
    }
}

console.log("[SEED DEBUG] Appel de main()...");
main()
    .catch(async (e) => {
        console.error("[SEED DEBUG] ERREUR lors de l'appel de main():", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("[SEED DEBUG] Prisma Client déconnecté. Fin du script.");
    }); 