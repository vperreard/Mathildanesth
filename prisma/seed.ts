// prisma/seed.ts
// console.log("[SEED DEBUG] Début du script seed.ts");
import { PrismaClient, Role, ProfessionalRole, WorkPatternType, WeekType, LeaveType } from '@prisma/client';
import bcrypt from 'bcrypt';
// console.log("[SEED DEBUG] Import bcrypt OK");
import fs from 'fs';
// console.log("[SEED DEBUG] Import fs OK");
import path from 'path';
// console.log("[SEED DEBUG] Import path OK");
// console.log("[SEED DEBUG] Import fileURLToPath OK");
// console.log("[SEED DEBUG] Import dirname OK");
import { parse } from 'csv-parse/sync';
// console.log("[SEED DEBUG] Import csv-parse/sync OK");

// console.log("[SEED DEBUG] Instanciation PrismaClient...");
const prisma = new PrismaClient();
// console.log("[SEED DEBUG] PrismaClient OK");
const saltRounds = 10;
// console.log("[SEED DEBUG] saltRounds OK");

// console.log("[SEED DEBUG] Calcul usersCsvPath...");
const usersCsvPath = path.resolve(__dirname, 'seed_data', 'users.csv');
// console.log("[SEED DEBUG] usersCsvPath OK:", usersCsvPath);
// console.log("[SEED DEBUG] Calcul surgeonsCsvPath...");
const surgeonsCsvPath = path.resolve(__dirname, 'seed_data', 'surgeons.csv');
// console.log("[SEED DEBUG] surgeonsCsvPath OK:", surgeonsCsvPath);
// console.log("[SEED DEBUG] Calcul operatingRoomsCsvPath...");
const operatingRoomsCsvPath = path.resolve(__dirname, 'seed_data', 'operating_rooms.csv');
// console.log("[SEED DEBUG] operatingRoomsCsvPath OK:", operatingRoomsCsvPath);
const specialtySeparator = ';';
// console.log("[SEED DEBUG] specialtySeparator OK");


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
    role?: string;
    professionalRole?: string;
    tempsPartiel: string;
    pourcentageTempsPartiel?: string;
    joursTravailles?: string;
    joursTravaillesSemaineImpaire?: string;
    joursTravaillesSemainePaire?: string;
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

// Fonction de chargement sécurisé des CSV
function safeLoadCsv<T>(filePath: string, defaultValue: T[] = []): T[] {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`[SEED WARN] Fichier CSV non trouvé : ${filePath}`);
            return defaultValue;
        }
        const csvContent = fs.readFileSync(filePath, 'utf-8');
        return parse(csvContent, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true
        }) as T[];
    } catch (error) {
        console.error(`[SEED ERROR] Erreur lors du chargement de ${filePath}:`, error);
        return defaultValue;
    }
}

// Types de congés par défaut
const leaveTypes = [
    {
        code: 'CP',
        label: 'Congé annuel',
        description: 'Congé annuel payé',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 30,
            minRequestLeadTime: 30,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    },
    {
        code: 'RTT',
        label: 'RTT',
        description: 'Réduction du temps de travail',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 1,
            minRequestLeadTime: 7,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    },
    {
        code: 'FORM',
        label: 'Formation',
        description: 'Congé pour formation',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'CONTINUOUS_ALL_DAYS',
            maxDuration: 90,
            minRequestLeadTime: 30,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    },
    {
        code: 'MAL',
        label: 'Maladie',
        description: 'Congé maladie',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'CONTINUOUS_ALL_DAYS',
            maxDuration: 90,
            minRequestLeadTime: 0,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    },
    {
        code: 'MAT',
        label: 'Maternité',
        description: 'Congé maternité',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'CONTINUOUS_ALL_DAYS',
            maxDuration: 180,
            minRequestLeadTime: 30,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    },
    {
        code: 'CSS',
        label: 'Congé spécial',
        description: 'Congé pour événement spécial',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 5,
            minRequestLeadTime: 15,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    },
    {
        code: 'RECUP',
        label: 'Récupération',
        description: 'Récupération de temps de travail',
        isActive: true,
        isUserSelectable: true,
        rules: {
            countingMethod: 'WEEKDAYS_IF_WORKING',
            maxDuration: 1,
            minRequestLeadTime: 7,
            approverRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
        }
    }
];

// Modification des règles de transfert et de report de quotas
const quotaTransferRules = [
    {
        fromType: 'ANNUAL' as LeaveType,
        toType: 'RECOVERY' as LeaveType,
        conversionRate: 1,
        maxTransferDays: 5,
        maxTransferPercentage: 50,
        requiresApproval: true,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    }
];

const quotaCarryOverRules = [
    {
        leaveType: 'ANNUAL' as LeaveType,
        ruleType: 'PERCENTAGE',
        value: 50,
        maxCarryOverDays: 10,
        expirationDays: 365,
        requiresApproval: true,
        authorizedRoles: ['ADMIN_TOTAL', 'ADMIN_PARTIEL'],
        isActive: true
    }
];

// Données par défaut si les CSV sont absents
const defaultUsers: UserCsvData[] = [
    {
        nom: 'Administrateur',
        prenom: 'Principal',
        login: 'admin',
        email: 'admin@mathildanesth.local',
        tempsPartiel: 'false',
        actif: 'true',
        mustChangePassword: 'true'
    }
];

const defaultSurgeons: SurgeonCsvData[] = [
    {
        nom: 'Chirurgien',
        prenom: 'Défaut',
        email: 'chirurgien@mathildanesth.local'
    }
];

const defaultOperatingRooms = [
    {
        name: 'Salle Opératoire 1',
        number: '1',
        sectorId: '1',
        colorCode: '#FF0000',
        isActive: 'true',
        supervisionRules: JSON.stringify({ maxSurgeons: 2 })
    }
];

async function processUsers(users: UserCsvData[]) {
    for (const user of users) {
        // Validation et conversion des données
        const login = user.login || `${user.prenom.toLowerCase()}.${user.nom.toLowerCase()}`;
        const email = user.email || `${login}@mathildanesth.local`;

        // Convertir les rôles
        const userRoleString = (user.role?.toUpperCase() || 'USER') as Role;
        const userProfRoleString = (user.professionalRole?.toUpperCase() || 'MAR') as ProfessionalRole;

        // Convertir les booléens
        const tempsPartiel = user.tempsPartiel?.toLowerCase() === 'true';
        const pourcentage = user.pourcentageTempsPartiel ? parseFloat(user.pourcentageTempsPartiel) : null;
        const actif = user.actif?.toLowerCase() !== 'false';
        const mustChangePassword = user.mustChangePassword?.toLowerCase() !== 'false';

        // Convertir les dates
        const dateEntree = user.dateEntree ? new Date(user.dateEntree) : null;
        const dateSortie = user.dateSortie ? new Date(user.dateSortie) : null;

        // Déterminer le pattern de travail
        let workPattern: WorkPatternType = WorkPatternType.FULL_TIME;
        let workOnWeekType: WeekType | null = null;
        let workOnMonthType: WeekType | null = null;

        if (tempsPartiel) {
            const joursDesc = user.joursTravailles?.toLowerCase() || '';
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
            const existingUser = await prisma.user.findUnique({ where: { login } });

            const userData = {
                nom: user.nom,
                prenom: user.prenom,
                login,
                email,
                alias: user.alias || null,
                phoneNumber: user.phoneNumber || null,
                role: userRoleString,
                professionalRole: userProfRoleString,
                tempsPartiel,
                pourcentageTempsPartiel: pourcentage,
                dateEntree,
                dateSortie,
                actif,
                mustChangePassword,
                workPattern,
                workOnMonthType,
                joursTravaillesSemaineImpaire: user.joursTravaillesSemaineImpaire || "[]",
                joursTravaillesSemainePaire: user.joursTravaillesSemainePaire || "[]",
                password: user.password ? bcrypt.hashSync(user.password, saltRounds) : bcrypt.hashSync('password', saltRounds)
            };

            if (existingUser) {
                await prisma.user.update({
                    where: { login },
                    data: userData
                });
                console.log(`[SEED DEBUG] Utilisateur mis à jour: ${login}`);
            } else {
                await prisma.user.create({ data: userData });
                console.log(`[SEED DEBUG] Nouvel utilisateur créé: ${login}`);
            }
        } catch (error) {
            console.error(`[SEED DEBUG] Erreur lors du traitement de l'utilisateur ${login}:`, error);
        }
    }
}

async function main() {
    console.log("[SEED DEBUG] Début du processus de seed");

    try {
        // Charger les données avec fallback
        const users = safeLoadCsv<UserCsvData>(usersCsvPath, defaultUsers);
        const surgeons = safeLoadCsv<SurgeonCsvData>(surgeonsCsvPath, defaultSurgeons);
        const operatingRooms = safeLoadCsv<{
            name: string;
            number: string;
            sectorId: string;
            colorCode: string;
            isActive: string;
            supervisionRules: string;
        }>(operatingRoomsCsvPath, defaultOperatingRooms);

        // Traitement des utilisateurs
        await processUsers(users);

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
                    isActive: leaveType.isActive,
                    isUserSelectable: leaveType.isUserSelectable,
                    rules: leaveType.rules
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

        // Création des règles de transfert de quotas
        for (const rule of quotaTransferRules) {
            await prisma.quotaTransferRule.create({
                data: {
                    fromType: rule.fromType,
                    toType: rule.toType,
                    conversionRate: rule.conversionRate,
                    maxTransferDays: rule.maxTransferDays,
                    maxTransferPercentage: rule.maxTransferPercentage,
                    requiresApproval: rule.requiresApproval,
                    authorizedRoles: rule.authorizedRoles,
                    isActive: rule.isActive
                }
            });
        }

        // Création des règles de report de quotas
        for (const rule of quotaCarryOverRules) {
            await prisma.quotaCarryOverRule.create({
                data: {
                    leaveType: rule.leaveType,
                    ruleType: rule.ruleType,
                    value: rule.value,
                    maxCarryOverDays: rule.maxCarryOverDays,
                    expirationDays: rule.expirationDays,
                    requiresApproval: rule.requiresApproval,
                    authorizedRoles: rule.authorizedRoles,
                    isActive: rule.isActive
                }
            });
        }

        console.log("[SEED DEBUG] Fin du processus de seed");
    } catch (error) {
        console.error("[SEED FATAL ERROR]", error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Ajout de logs supplémentaires
console.log("[SEED DEBUG] Script de seed chargé. Prêt à être exécuté.");
main()
    .catch(async (e) => {
        console.error("[SEED FATAL ERROR]:", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("[SEED DEBUG] Processus de seed terminé.");
    }); 