// prisma/seed.ts
// console.log("[SEED DEBUG] Début du script seed.ts");
import { PrismaClient, Role, ProfessionalRole, WorkPatternType, WeekType, LeaveType, RoomType, SectorCategory } from '@prisma/client';
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
// Suppression de operatingRoomsCsvPath car les données sont maintenant en dur
// const operatingRoomsCsvPath = path.resolve(__dirname, 'seed_data', 'operating_rooms.csv');
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

// Suppression de defaultOperatingRooms
// const defaultOperatingRooms = [ ... ];

async function processUsers(usersData: UserCsvData[]) {
    for (const user of usersData) {
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

// Suppression de createDefaultOperatingSectors et processOperatingRooms
// Ces logiques sont maintenant intégrées dans main() avec la nouvelle structure de données

const sitesSeedData = [
    {
        siteName: "Clinique Mathilde",
        siteColorCode: "#4A90E2", // Bleu Mathilde
        sectors: [
            {
                sectorName: "Secteur hyperaseptique",
                sectorColorCode: "#ADD8E6", // Light Blue
                sectorCategory: SectorCategory.HYPERASEPTIQUE,
                rooms: [
                    { name: "Salle 1", number: "1" }, { name: "Salle 2", number: "2" }, { name: "Salle 3", number: "3" }, { name: "Salle 4", number: "4" }
                ],
            },
            {
                sectorName: "Secteur intermédiaire",
                sectorColorCode: "#90EE90", // Light Green
                sectorCategory: SectorCategory.STANDARD,
                rooms: [
                    { name: "Salle 5", number: "5" }, { name: "Salle 6", number: "6" }, { name: "Salle 7", number: "7" }
                ],
            },
            {
                sectorName: "Secteur septique",
                sectorColorCode: "#FFB6C1", // Light Pink
                sectorCategory: SectorCategory.STANDARD, // Ou une catégorie spécifique si elle existe
                rooms: [
                    { name: "Salle 8", number: "8" }, { name: "Salle 9", number: "9" }, { name: "Salle 10", number: "10" },
                    { name: "Salle 11", number: "11" }, { name: "Salle 12", number: "12" }, { name: "Salle 12bis", number: "12bis" }
                ],
            },
            {
                sectorName: "Secteur ophtalmo",
                sectorColorCode: "#FFFFE0", // Light Yellow
                sectorCategory: SectorCategory.OPHTALMOLOGIE,
                rooms: [
                    { name: "Salle O14", number: "O14" }, { name: "Salle O15", number: "O15" },
                    { name: "Salle O16", number: "O16" }, { name: "Salle O17", number: "O17" }
                ],
            },
            {
                sectorName: "Secteur endoscopie",
                sectorColorCode: "#D8BFD8", // Thistle
                sectorCategory: SectorCategory.ENDOSCOPIE,
                rooms: [
                    { name: "Salle Endo1", number: "Endo1" }, { name: "Salle Endo2", number: "Endo2" },
                    { name: "Salle Endo3", number: "Endo3" }, { name: "Salle Endo4", number: "Endo4" }
                ],
            },
        ],
    },
    {
        siteName: "Clinique de l'Europe",
        siteColorCode: "#F5A623", // Orange Europe
        sectors: [
            {
                sectorName: "Bloc hospitalisation",
                sectorColorCode: "#E6E6FA", // Lavender
                sectorCategory: SectorCategory.STANDARD,
                rooms: [
                    { name: "Salle 1", number: "1" }, { name: "Salle 2", number: "2" }, { name: "Salle 3", number: "3" }, { name: "Salle 4", number: "4" },
                    { name: "Salle 5", number: "5" }, { name: "Salle 6", number: "6" }, { name: "Salle 7", number: "7" }, { name: "Salle 8", number: "8" }
                ],
            },
            {
                sectorName: "Bloc ambulatoire",
                sectorColorCode: "#AFEEEE", // Pale Turquoise
                sectorCategory: SectorCategory.STANDARD, // Ou une catégorie spécifique si elle existe pour ambulatoire
                rooms: [
                    { name: "Salle A1", number: "A1" }, { name: "Salle A2", number: "A2" }, { name: "Salle A3", number: "A3" },
                    { name: "Salle A4", number: "A4" }, { name: "Salle A5", number: "A5" }
                ],
            },
        ],
    },
];


async function main() {
    console.log("[SEED DEBUG] Début du processus de seed V2 avec sites et secteurs custom");
    const usersData = safeLoadCsv<UserCsvData>(usersCsvPath, defaultUsers);
    await processUsers(usersData);

    console.log("[SEED DEBUG] Début création Sites, Secteurs et Salles");
    for (const siteData of sitesSeedData) {
        const site = await prisma.site.upsert({
            where: { name: siteData.siteName },
            update: { description: `Site ${siteData.siteName}`, isActive: true, colorCode: siteData.siteColorCode, displayOrder: siteData.siteName === "Clinique Mathilde" ? 1 : 2 },
            create: { name: siteData.siteName, description: `Site ${siteData.siteName}`, isActive: true, colorCode: siteData.siteColorCode, timezone: "Europe/Paris", displayOrder: siteData.siteName === "Clinique Mathilde" ? 1 : 2 },
        });
        console.log(`[SEED DEBUG] Site traité (upserted): ${site.name} (ID: ${site.id})`);

        let sectorDisplayOrder = 1;
        for (const sectorData of siteData.sectors) {
            const currentSectorDisplayOrder = sectorDisplayOrder; // Capturer la valeur actuelle pour cet itération
            const sector = await prisma.operatingSector.upsert({
                where: { name: sectorData.sectorName }, // Supposant que name est globalement unique ou la logique désirée
                update: { siteId: site.id, colorCode: sectorData.sectorColorCode, isActive: true, description: `${sectorData.sectorName} pour ${site.name}`, category: sectorData.sectorCategory || SectorCategory.STANDARD, displayOrder: currentSectorDisplayOrder },
                create: { name: sectorData.sectorName, siteId: site.id, colorCode: sectorData.sectorColorCode, isActive: true, description: `${sectorData.sectorName} pour ${site.name}`, category: sectorData.sectorCategory || SectorCategory.STANDARD, displayOrder: currentSectorDisplayOrder },
            });
            sectorDisplayOrder++; // Incrémenter pour le prochain secteur
            console.log(`[SEED DEBUG] Secteur traité (upserted): ${sector.name} pour site ${site.name} (ID: ${sector.id}), displayOrder: ${currentSectorDisplayOrder}`);

            let roomDisplayOrder = 1;
            for (const roomSpec of sectorData.rooms) {
                const sitePrefix = siteData.siteName.includes("Mathilde") ? "CM" : "CE";
                const uniqueDBRoomNumber = `${sitePrefix}-${roomSpec.number}`;
                const currentRoomDisplayOrder = roomDisplayOrder; // Capturer la valeur actuelle pour cet itération
                await prisma.operatingRoom.upsert({
                    where: { number: uniqueDBRoomNumber },
                    update: { name: roomSpec.name, description: `Salle ${roomSpec.name} (${uniqueDBRoomNumber}) dans ${sector.name}`, roomType: RoomType.STANDARD, capacity: 1, isActive: true, displayOrder: currentRoomDisplayOrder, colorCode: sectorData.sectorColorCode, allowedSpecialties: [], siteId: site.id, operatingSectorId: sector.id, supervisionRules: { maxSimultaneousSupervisions: 2 } },
                    create: { name: roomSpec.name, number: uniqueDBRoomNumber, description: `Salle ${roomSpec.name} (${uniqueDBRoomNumber}) dans ${sector.name}`, roomType: RoomType.STANDARD, capacity: 1, isActive: true, displayOrder: currentRoomDisplayOrder, colorCode: sectorData.sectorColorCode, allowedSpecialties: [], siteId: site.id, operatingSectorId: sector.id, supervisionRules: { maxSimultaneousSupervisions: 2 } },
                });
                roomDisplayOrder++; // Incrémenter pour la prochaine salle
                console.log(`[SEED DEBUG] Salle traitée (upserted): '${roomSpec.name}' (DB Num: ${uniqueDBRoomNumber}) dans secteur ${sector.name}, displayOrder: ${currentRoomDisplayOrder}`);
            }
        }
    }
    console.log("[SEED DEBUG] Fin création Sites, Secteurs et Salles");

    // Traitement des chirurgiens (après les sites si les chirurgiens sont liés aux sites)
    // Pour l'instant, la liaison chirurgien-site n'est pas gérée dans ce CSV/logique de base
    // const surgeons = safeLoadCsv<SurgeonCsvData>(surgeonsCsvPath, defaultSurgeons);
    // await processSurgeons(surgeons); // Implémenter processSurgeons si nécessaire

    console.log("[SEED DEBUG] Début création autres entités (Types Congés, Roles Pro, etc.)");
    for (const leaveType of leaveTypes) {
        try {
            await prisma.leaveTypeSetting.upsert({
                where: { code: leaveType.code },
                update: { label: leaveType.label, description: leaveType.description, isActive: leaveType.isActive, isUserSelectable: leaveType.isUserSelectable, rules: leaveType.rules },
                create: { code: leaveType.code, label: leaveType.label, description: leaveType.description, isActive: leaveType.isActive, isUserSelectable: leaveType.isUserSelectable, rules: leaveType.rules },
            });
            console.log(`[SEED DEBUG] Type de congé traité (upserted): ${leaveType.label}`);
        } catch (error) {
            console.error(`[SEED DEBUG] Erreur lors du traitement du type de congé ${leaveType.label}:`, error);
        }
    }

    const professionalRoles = [
        { id: '1', code: 'MAR', label: 'Médecin Anesthésiste Réanimateur', description: 'Médecin spécialisé en anesthésie-réanimation', isActive: true, displayPreferences: { color: '#2196F3', icon: 'doctor', order: 1, visibility: { calendar: true, dashboard: true, planning: true } } },
        { id: '2', code: 'IADE', label: 'Infirmier Anesthésiste', description: 'Infirmier spécialisé en anesthésie', isActive: true, displayPreferences: { color: '#4CAF50', icon: 'nurse', order: 2, visibility: { calendar: true, dashboard: true, planning: true } } },
        { id: '3', code: 'SECRETAIRE', label: 'Secrétaire', description: 'Personnel administratif', isActive: true, displayPreferences: { color: '#FF9800', icon: 'secretary', order: 3, visibility: { calendar: true, dashboard: true, planning: true } } }
    ];
    for (const role of professionalRoles) {
        try {
            await prisma.professionalRoleConfig.upsert({
                where: { code: role.code },
                update: { label: role.label, description: role.description, isActive: role.isActive, displayPreferences: role.displayPreferences },
                create: { id: role.id, code: role.code, label: role.label, description: role.description, isActive: role.isActive, displayPreferences: role.displayPreferences },
            });
            console.log(`[SEED DEBUG] Rôle professionnel traité (upserted): ${role.code}`);
        } catch (error) {
            console.error(`[SEED DEBUG] Erreur lors du traitement du rôle ${role.code}:`, error);
        }
    }

    console.log("[SEED DEBUG] Début création QuotaTransferRule");
    for (const rule of quotaTransferRules) {
        await prisma.quotaTransferRule.upsert({
            where: { fromType_toType: { fromType: rule.fromType, toType: rule.toType } },
            create: rule,
            update: rule,
        });
        console.log(`[SEED DEBUG] Règle de transfert de quota traitée (upserted): ${rule.fromType} -> ${rule.toType}`);
    }
    console.log("[SEED DEBUG] Fin création QuotaTransferRule");

    console.log("[SEED DEBUG] Début création QuotaCarryOverRule");
    for (const rule of quotaCarryOverRules) {
        await prisma.quotaCarryOverRule.upsert({
            where: { leaveType: rule.leaveType },
            create: rule,
            update: rule,
        });
        console.log(`[SEED DEBUG] Règle de report de quota traitée (upserted): ${rule.leaveType}`);
    }
    console.log("[SEED DEBUG] Fin création QuotaCarryOverRule");

    console.log("[SEED DEBUG] Fin du processus de seed");
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