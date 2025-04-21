// prisma/seed.ts
import { PrismaClient, Role, ProfessionalRole, UserStatus, Prisma, WorkPatternType, WeekType } from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { parse } from 'csv-parse/sync';

// Équivalent ESM à __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();
const saltRounds = 10;

const usersCsvPath = path.join(__dirname, 'seed_data', 'users.csv');
const surgeonsCsvPath = path.join(__dirname, 'seed_data', 'surgeons.csv');
const specialtySeparator = ';';

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
    role: Role;
    professionalRole: ProfessionalRole;
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
    status: string;
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

async function main() {
    console.log(`Start seeding ...`);

    // 1. Seed Spécialités
    console.log(`Seeding specialties...`);
    const seededSpecialties = new Map<string, number>();
    for (const specData of specialtiesToSeed) {
        const specialty = await prisma.specialty.upsert({
            where: { name: specData.name },
            update: { isPediatric: specData.isPediatric },
            create: { name: specData.name, isPediatric: specData.isPediatric },
        });
        seededSpecialties.set(specialty.name, specialty.id);
    }
    console.log(`Specialties seeding finished. ${seededSpecialties.size} specialties processed.`);

    // 2. Seed Utilisateurs depuis CSV
    console.log(`Seeding users from ${usersCsvPath}...`);
    const usersData = parseCsv<UserCsvData>(usersCsvPath);
    let usersCreated = 0;
    let usersUpdated = 0;

    for (const userData of usersData) {
        if (!userData.login || !userData.password || !userData.role || !userData.professionalRole) {
            console.warn(`WARN: Skipping user row due to missing essential data (login, password, role, professionalRole):`, userData);
            continue;
        }
        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        const dateEntree = userData.dateEntree ? new Date(userData.dateEntree) : null;
        const dateSortie = userData.dateSortie ? new Date(userData.dateSortie) : null;
        const tempsPartiel = userData.tempsPartiel?.toLowerCase() === 'true';
        const actif = userData.actif?.toLowerCase() === 'true';
        const mustChangePassword = userData.mustChangePassword?.toLowerCase() === 'true';
        const pourcentage = tempsPartiel && userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null;
        // const jours = tempsPartiel && userData.joursTravailles ? userData.joursTravailles : null; // <<< On n'utilise plus directement

        // <<< Logique pour interpréter joursTravailles et définir les nouveaux champs >>>
        let workPattern: WorkPatternType = WorkPatternType.FULL_TIME;
        let workOnWeekType: WeekType | null = null;
        let workOnMonthType: WeekType | null = null;
        let workMonday = true;
        let workTuesday = true;
        let workWednesday = true;
        let workThursday = true;
        let workFriday = true;
        let workSaturday = false;
        let workSunday = false;

        if (tempsPartiel && userData.joursTravailles) {
            const joursDesc = userData.joursTravailles.toLowerCase();
            workMonday = false; // Par défaut, si temps partiel, ne travaille aucun jour
            workTuesday = false;
            workWednesday = false;
            workThursday = false;
            workFriday = false;

            if (joursDesc.includes("mois impairs")) {
                workPattern = WorkPatternType.ALTERNATING_MONTHS;
                workOnMonthType = WeekType.ODD;
                // On assume L-V pour ces mois
                workMonday = true; workTuesday = true; workWednesday = true; workThursday = true; workFriday = true;
            } else if (joursDesc.includes("mois pair")) {
                workPattern = WorkPatternType.ALTERNATING_MONTHS;
                workOnMonthType = WeekType.EVEN;
                // On assume L-V pour ces mois
                workMonday = true; workTuesday = true; workWednesday = true; workThursday = true; workFriday = true;
            } else if (joursDesc.includes("lundis- mardis")) {
                workPattern = WorkPatternType.SPECIFIC_DAYS;
                workMonday = true;
                workTuesday = true;
                workOnWeekType = WeekType.ALL; // On assume toutes les semaines si pas précisé
            } else if (joursDesc.includes("jeudis- vendredis")) {
                workPattern = WorkPatternType.SPECIFIC_DAYS;
                workThursday = true;
                workFriday = true;
                workOnWeekType = WeekType.ALL; // On assume toutes les semaines si pas précisé
            } else {
                console.warn(`WARN: Description joursTravailles non reconnue: '${userData.joursTravailles}' pour ${userData.login}. Utilisation de SPECIFIC_DAYS par défaut sans jours spécifiques.`);
                workPattern = WorkPatternType.SPECIFIC_DAYS; // Fallback
                workOnWeekType = WeekType.ALL;
            }
            // Si le pattern contient pair/impair, on peut affiner workOnWeekType
            if (workPattern === WorkPatternType.SPECIFIC_DAYS) {
                if (joursDesc.includes("semaines paires")) {
                    workOnWeekType = WeekType.EVEN;
                } else if (joursDesc.includes("semaines impaires")) {
                    workOnWeekType = WeekType.ODD;
                }
            }

        } else if (!tempsPartiel) {
            // Pour les temps pleins, on remet les valeurs par défaut (L-V)
            workPattern = WorkPatternType.FULL_TIME;
            workMonday = true; workTuesday = true; workWednesday = true; workThursday = true; workFriday = true;
            workSaturday = false; workSunday = false;
            workOnWeekType = null;
            workOnMonthType = null;
        }

        try {
            const existingUser = await prisma.user.findUnique({ where: { login: userData.login } });

            const userDataForCreate: Prisma.UserCreateInput = {
                nom: userData.nom || '',
                prenom: userData.prenom || '',
                login: userData.login,
                email: userData.email || `${userData.login}@example.local`,
                alias: userData.alias || null,
                phoneNumber: userData.phoneNumber || null,
                password: hashedPassword,
                role: userData.role as Role,
                professionalRole: userData.professionalRole as ProfessionalRole,
                tempsPartiel: tempsPartiel,
                pourcentageTempsPartiel: pourcentage,
                dateEntree: dateEntree,
                dateSortie: dateSortie,
                actif: actif,
                mustChangePassword: mustChangePassword,
                workPattern: workPattern,
                workOnMonthType: workOnMonthType,
            };

            const userDataForUpdate: Prisma.UserUpdateInput = {
                nom: userData.nom || '',
                prenom: userData.prenom || '',
                email: userData.email || `${userData.login}@example.local`,
                alias: userData.alias || null,
                phoneNumber: userData.phoneNumber || null,
                role: userData.role as Role,
                professionalRole: userData.professionalRole as ProfessionalRole,
                tempsPartiel: tempsPartiel,
                pourcentageTempsPartiel: pourcentage,
                dateEntree: dateEntree,
                dateSortie: dateSortie,
                actif: actif,
                workPattern: workPattern,
                workOnMonthType: workOnMonthType,
            };

            const user = await prisma.user.upsert({
                where: { login: userData.login },
                update: userDataForUpdate as any,
                create: userDataForCreate as any,
            });
            if (existingUser) { usersUpdated++; } else { usersCreated++; }

            if (user.role === Role.ADMIN_TOTAL && user.mustChangePassword) {
                await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
            }
        } catch (error: any) {
            console.error(`Erreur lors de l'upsert de l'utilisateur ${userData.login}:`, error.message);
        }
    }
    console.log(`Users seeding finished. ${usersCreated} created, ${usersUpdated} updated.`);

    // 3. Seed Chirurgiens depuis CSV
    console.log(`Seeding surgeons from ${surgeonsCsvPath}...`);
    const surgeonsData = parseCsv<SurgeonCsvData>(surgeonsCsvPath);
    let surgeonsCreated = 0;
    let surgeonsUpdated = 0;

    for (const surgeonData of surgeonsData) {
        if (!surgeonData.nom || !surgeonData.prenom) {
            console.warn(`WARN: Skipping surgeon row due to missing nom/prenom:`, surgeonData);
            continue;
        }
        const specialtyIds = (surgeonData.specialtyNames || '')
            .split(specialtySeparator)
            .map((name: string) => name.trim())
            .filter((name: string) => seededSpecialties.has(name))
            .map((name: string) => ({ id: seededSpecialties.get(name)! }));

        if (surgeonData.specialtyNames && specialtyIds.length !== surgeonData.specialtyNames.split(specialtySeparator).length) {
            console.warn(`WARN: Certaines spécialités non trouvées pour ${surgeonData.nom} ${surgeonData.prenom} (listées: '${surgeonData.specialtyNames}')`);
        }
        const status = (surgeonData.status?.toUpperCase() || 'ACTIF') as UserStatus;
        const email = surgeonData.email || `${surgeonData.nom}.${surgeonData.prenom}@chir.example.local`.toLowerCase().replace(/\s+/g, '.');

        try {
            const existingSurgeon = await prisma.surgeon.findUnique({ where: { email: email } });

            const surgeonDataForCreate: Prisma.SurgeonCreateInput = {
                nom: surgeonData.nom,
                prenom: surgeonData.prenom,
                email: email,
                phoneNumber: surgeonData.phoneNumber || null,
                status: status,
                specialties: specialtyIds.length > 0 ? { connect: specialtyIds } : undefined,
                googleSheetName: surgeonData.googleSheetName || null,
            };

            const surgeonDataForUpdate: Prisma.SurgeonUpdateInput = {
                nom: surgeonData.nom,
                prenom: surgeonData.prenom,
                phoneNumber: surgeonData.phoneNumber || null,
                status: status,
                specialties: { set: specialtyIds },
                googleSheetName: surgeonData.googleSheetName || null,
            };

            const surgeon = await prisma.surgeon.upsert({
                where: { email: email },
                update: surgeonDataForUpdate as any, // Garder les 'as any'
                create: surgeonDataForCreate as any,
            });
            if (existingSurgeon) { surgeonsUpdated++; } else { surgeonsCreated++; }

        } catch (error: any) {
            console.error(`Erreur lors de l'upsert du chirurgien ${surgeonData.nom} ${surgeonData.prenom}:`, error.message);
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                console.error(`  -> Email potentiellement dupliqué: ${email}`);
            }
        }
    }
    console.log(`Surgeons seeding finished. ${surgeonsCreated} created, ${surgeonsUpdated} updated.`);

    // --- Seed Leave Type Settings ---
    console.log("Seeding Leave Type Settings ...");

    // Définir les règles pour chaque type
    const leaveTypeRules = {
        ANNUAL_MAR: {
            counting: { method: "WEEKDAYS_IF_WORKING", excludePublicHolidays: true },
            balance: { deducts: true, sourceTypeCode: null, annualAllowance: { defaultDaysByRole: { MAR: 50 }, seniorityBonus: { enabled: false } } }, // Pas de bonus ancienneté MAR
            eligibility: { roles: ["MAR"], minSeniorityMonths: 0 },
            request: { minNoticeDays: 14, requiresReason: false, allowHalfDays: false }, // Prévenance MAR
            approval: { autoApprove: false, requiredRole: "ADMIN_PARTIEL" },
            conflicts: { checkMaxOverlap: true, maxOverlapSameRole: 1 }
        },
        ANNUAL_STAFF: {
            counting: { method: "MONDAY_TO_SATURDAY", excludePublicHolidays: true },
            balance: { deducts: true, sourceTypeCode: null, annualAllowance: { defaultDaysByRole: { IADE: 28, SECRETAIRE: 25 }, seniorityBonus: { enabled: true, yearsRequired: 10, bonusDaysPerThreshold: 1, maxBonusDays: 3, applicableRoles: ["IADE", "SECRETAIRE"] } } },
            eligibility: { roles: ["IADE", "SECRETAIRE"], minSeniorityMonths: 0 },
            request: { minNoticeDays: 21, requiresReason: false, allowHalfDays: false }, // Prévenance Staff (exemple)
            approval: { autoApprove: false, requiredRole: "ADMIN_PARTIEL" },
            conflicts: { checkMaxOverlap: true, maxOverlapSameRole: 1 }
        },
        RECOVERY_IADE: {
            counting: { method: "WEEKDAYS_IF_WORKING", excludePublicHolidays: true }, // A confirmer si correct
            balance: { deducts: true, sourceTypeCode: "RECOVERY_IADE" }, // Suppose un solde spécifique
            eligibility: { roles: ["IADE"], minSeniorityMonths: 0 },
            request: { minNoticeDays: 7, requiresReason: false, allowHalfDays: true }, // Permet demi-journées récup ?
            approval: { autoApprove: false, requiredRole: "ADMIN_PARTIEL" },
            conflicts: { checkMaxOverlap: true, maxOverlapSameRole: 1 }
        },
        // Ajouter RECOVERY_MAR si nécessaire avec ses propres règles
        SICK: {
            counting: { method: "CONTINUOUS_ALL_DAYS", excludePublicHolidays: false }, // Fériés comptent pour maladie
            balance: { deducts: false },
            eligibility: { roles: null, minSeniorityMonths: 0 },
            request: { minNoticeDays: 0, requiresReason: true, allowHalfDays: false },
            approval: { autoApprove: true }, // Enregistrement a posteriori
            conflicts: { checkMaxOverlap: false } // Pas de blocage
        },
        TRAINING: {
            counting: { method: "WEEKDAYS_IF_WORKING", excludePublicHolidays: true },
            balance: { deducts: false }, // Ou déduit d'un solde formation ?
            eligibility: { roles: null, minSeniorityMonths: 0 },
            request: { minNoticeDays: 30, requiresReason: true, allowHalfDays: false },
            approval: { autoApprove: false, requiredRole: "ADMIN_TOTAL" }, // Exemple : Admin Total pour formation
            conflicts: { checkMaxOverlap: true, maxOverlapSameRole: 1 }
        },
        MATERNITY: {
            counting: { method: "CONTINUOUS_ALL_DAYS", excludePublicHolidays: false },
            balance: { deducts: false },
            eligibility: { roles: null, minSeniorityMonths: 0 },
            request: { minNoticeDays: 0, requiresReason: false, allowHalfDays: false },
            approval: { autoApprove: true },
            conflicts: { checkMaxOverlap: false }
        },
        SPECIAL: { // Congé événement familial
            counting: { method: "WEEKDAYS_IF_WORKING", excludePublicHolidays: true },
            balance: { deducts: false },
            eligibility: { roles: null, minSeniorityMonths: 0 },
            request: { minNoticeDays: 3, requiresReason: true, allowHalfDays: false },
            approval: { autoApprove: true },
            conflicts: { checkMaxOverlap: false }
        },
        UNPAID: {
            counting: { method: "CONTINUOUS_ALL_DAYS", excludePublicHolidays: false }, // Ou autre méthode ?
            balance: { deducts: false },
            eligibility: { roles: null, minSeniorityMonths: 0 },
            request: { minNoticeDays: 14, requiresReason: true, allowHalfDays: false },
            approval: { autoApprove: false, requiredRole: "ADMIN_TOTAL" },
            conflicts: { checkMaxOverlap: true, maxOverlapSameRole: 1 }
        },
        OTHER: {
            counting: { method: "WEEKDAYS_IF_WORKING", excludePublicHolidays: true },
            balance: { deducts: false },
            eligibility: { roles: null, minSeniorityMonths: 0 },
            request: { minNoticeDays: 0, requiresReason: true, allowHalfDays: false },
            approval: { autoApprove: false, requiredRole: "ADMIN_PARTIEL" },
            conflicts: { checkMaxOverlap: true, maxOverlapSameRole: 1 }
        }
    };

    // Définir les types de congés à créer/mettre à jour
    const leaveTypesToSeed = [
        { code: 'ANNUAL_MAR', label: 'Congé Annuel (MAR)', description: 'Congés payés annuels pour Médecins Anesthésistes' },
        { code: 'ANNUAL_STAFF', label: 'Congé Annuel (IADE/SEC)', description: 'Congés payés annuels pour IADE et Secrétaires' },
        { code: 'RECOVERY_IADE', label: 'Récupération (IADE)', description: 'Récupération heures sup / astreintes IADE' },
        // { code: 'RECOVERY_MAR', label: 'Récupération (MAR)', description: 'Récupération astreintes MAR' }, // Si besoin
        { code: 'SICK', label: 'Maladie', description: 'Arrêt maladie' },
        { code: 'TRAINING', label: 'Formation', description: 'Congé pour formation professionnelle' },
        { code: 'MATERNITY', label: 'Maternité/Paternité', description: 'Congé maternité / paternité / adoption' },
        { code: 'SPECIAL', label: 'Congé Spécial', description: 'Congé pour événements familiaux' },
        { code: 'UNPAID', label: 'Sans Solde', description: 'Congé non rémunéré' },
        { code: 'OTHER', label: 'Autre', description: 'Autre type de congé (à préciser dans le motif)' },
    ];

    for (const typeData of leaveTypesToSeed) {
        const rules = leaveTypeRules[typeData.code as keyof typeof leaveTypeRules] ?? {}; // Récupérer les règles correspondantes

        await prisma.leaveTypeSetting.upsert({
            where: { code: typeData.code },
            update: {
                label: typeData.label,
                description: typeData.description,
                rules: rules,
                // Conserver les valeurs isActive/isUserSelectable existantes ou les mettre à jour si besoin
                // isActive: true, 
                // isUserSelectable: true,
            },
            create: {
                code: typeData.code,
                label: typeData.label,
                description: typeData.description,
                rules: rules,
                isActive: true,
                isUserSelectable: true,
            },
        });
        console.log(` Upserted leave type: ${typeData.label} (${typeData.code})`);
    }

    console.log("Leave Type Settings seeding finished.");

    console.log(`Seeding terminé.`);
}

main()
    .catch(async (e) => {
        console.error("ERREUR lors du seeding:", e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log("Prisma Client déconnecté.");
    }); 