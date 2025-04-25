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
≥
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
    console.log("[SEED DEBUG] Début de la fonction main()");
    console.log(`Start seeding ...`);

    // 1. Seed Spécialités // Décommenter ce bloc
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

    // 2.b Ajout manuel d'un super admin (admin/admin)
    const adminLogin = 'admin';
    const adminPassword = 'admin';
    const adminEmail = 'admin@example.local';
    const adminExists = await prisma.user.findUnique({ where: { login: adminLogin } });
    if (!adminExists) {
        const hashedAdminPassword = await bcrypt.hash(adminPassword, saltRounds);
        await prisma.user.create({
            data: {
                nom: 'Super',
                prenom: 'Admin',
                login: adminLogin,
                email: adminEmail,
                password: hashedAdminPassword,
                role: 'ADMIN_TOTAL', // Note: Utilise string ici, car type Role non fiable
                professionalRole: 'MAR', // Note: Utilise string ici, car type ProfRole non fiable
                actif: true,
                mustChangePassword: false,
                tempsPartiel: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
        });
        console.log('Super admin (admin/admin) créé.');
    } else {
        console.log('Super admin déjà existant, non recréé.');
    }

    for (const userData of usersData) {
        // Utiliser directement les strings du CSV pour role/professionalRole ici
        const userRoleString = (userData as any).role; // Prend la valeur du CSV
        const userProfRoleString = (userData as any).professionalRole; // Prend la valeur du CSV

        if (!userData.login || !userData.password || !userRoleString || !userProfRoleString) {
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
            workMonday = false;
            workTuesday = false;
            workWednesday = false;
            workThursday = false;
            workFriday = false;

            if (joursDesc.includes("mois impairs")) {
                workPattern = WorkPatternType.ALTERNATING_MONTHS;
                workOnMonthType = WeekType.ODD;
                workMonday = true; workTuesday = true; workWednesday = true; workThursday = true; workFriday = true;
            } else if (joursDesc.includes("mois pair")) {
                workPattern = WorkPatternType.ALTERNATING_MONTHS;
                workOnMonthType = WeekType.EVEN;
                workMonday = true; workTuesday = true; workWednesday = true; workThursday = true; workFriday = true;
            } else if (joursDesc.includes("lundis- mardis")) {
                workPattern = WorkPatternType.SPECIFIC_DAYS;
                workMonday = true;
                workTuesday = true;
                workOnWeekType = WeekType.ALL;
            } else if (joursDesc.includes("jeudis- vendredis")) {
                workPattern = WorkPatternType.SPECIFIC_DAYS;
                workThursday = true;
                workFriday = true;
                workOnWeekType = WeekType.ALL;
            } else {
                console.warn(`WARN: Description joursTravailles non reconnue: '${userData.joursTravailles}' pour ${userData.login}. Utilisation de SPECIFIC_DAYS par défaut sans jours spécifiques.`);
                workPattern = WorkPatternType.SPECIFIC_DAYS;
                workOnWeekType = WeekType.ALL;
            }
            if (workPattern === WorkPatternType.SPECIFIC_DAYS) {
                if (joursDesc.includes("semaines paires")) {
                    workOnWeekType = WeekType.EVEN;
                } else if (joursDesc.includes("semaines impaires")) {
                    workOnWeekType = WeekType.ODD;
                }
            }

        } else if (!tempsPartiel) {
            workPattern = WorkPatternType.FULL_TIME;
            workMonday = true; workTuesday = true; workWednesday = true; workThursday = true; workFriday = true;
            workSaturday = false; workSunday = false;
            workOnWeekType = null;
            workOnMonthType = null;
        }

        try {
            const existingUser = await prisma.user.findUnique({ where: { login: userData.login } });

            // Simplification: on ne type plus explicitement avec UserCreate/UpdateInput
            // On fournit tous les champs requis par le modèle User
            const commonUserData = {
                nom: userData.nom || '',
                prenom: userData.prenom || '',
                login: userData.login,
                email: userData.email || `${userData.login}@example.local`,
                alias: userData.alias || null,
                phoneNumber: userData.phoneNumber || null,
                role: userRoleString as Role, // Cast nécessaire car le schéma attend l'enum
                professionalRole: userProfRoleString as ProfessionalRole, // Cast nécessaire
                tempsPartiel: tempsPartiel,
                pourcentageTempsPartiel: pourcentage,
                dateEntree: dateEntree,
                dateSortie: dateSortie,
                actif: actif,
                mustChangePassword: mustChangePassword, // Inclus dans create et update
                workPattern: workPattern,
                workOnMonthType: workOnMonthType,
                // Assurer que les champs Json ont une valeur par défaut si non présents dans CSV
                joursTravaillesSemaineImpaire: (userData as any).joursTravaillesSemaineImpaire || "[]",
                joursTravaillesSemainePaire: (userData as any).joursTravaillesSemainePaire || "[]",
            };

            const user = await prisma.user.upsert({
                where: { login: userData.login },
                update: {
                    ...commonUserData,
                    // password n'est pas mis à jour sauf si explicitement fourni/changé
                    // updatedAt est géré par Prisma
                },
                create: {
                    ...commonUserData,
                    password: hashedPassword, // Requis à la création
                    // createdAt est géré par Prisma
                },
            });

            if (existingUser) { usersUpdated++; } else { usersCreated++; }

            // Mettre à jour mustChangePassword pour l'admin total si nécessaire
            if (user.login === 'admin' && user.mustChangePassword) {
                await prisma.user.update({ where: { id: user.id }, data: { mustChangePassword: false } });
            }
        } catch (error: any) {
            // Tenter de donner plus d'infos sur l'erreur
            console.error(`Erreur lors de l'upsert de l'utilisateur ${userData.login}:`, error.message);
            if (error.code) console.error(`  -> Code Prisma: ${error.code}`);
            if (error.meta) console.error(`  -> Meta Prisma: ${JSON.stringify(error.meta)}`);
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
        // const status = (surgeonData.status?.toUpperCase() || 'ACTIF') as UserStatus; // Commenté car UserStatus non fiable
        const statusString = (surgeonData as any).status?.toUpperCase() || 'ACTIF'; // Utilise string
        const email = surgeonData.email || `${surgeonData.nom}.${surgeonData.prenom}@chir.example.local`.toLowerCase().replace(/\s+/g, '.');

        try {
            const existingSurgeon = await prisma.surgeon.findUnique({ where: { email: email } });

            // Simplification: Pas de type Prisma.SurgeonCreate/UpdateInput
            const commonSurgeonData = {
                nom: surgeonData.nom,
                prenom: surgeonData.prenom,
                email: email,
                phoneNumber: surgeonData.phoneNumber || null,
                status: statusString as UserStatus, // Cast string en enum
                specialties: specialtyIds.length > 0 ? { connect: specialtyIds } : undefined,
                googleSheetName: surgeonData.googleSheetName || null,
            };

            const surgeon = await prisma.surgeon.upsert({
                where: { email: email },
                update: { // Fournir tous les champs requis/modifiables
                    nom: surgeonData.nom,
                    prenom: surgeonData.prenom,
                    phoneNumber: surgeonData.phoneNumber || null,
                    status: statusString as UserStatus, // Cast
                    specialties: { set: specialtyIds }, // Utiliser set pour la mise à jour
                    googleSheetName: surgeonData.googleSheetName || null,
                },
                create: commonSurgeonData,
            });
            if (existingSurgeon) { surgeonsUpdated++; } else { surgeonsCreated++; }

        } catch (error: any) {
            console.error(`Erreur lors de l'upsert du chirurgien ${surgeonData.nom} ${surgeonData.prenom}:`, error.message);
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                console.error(`  -> Email potentiellement dupliqué: ${email}`);
            }
            if (error.code) console.error(`  -> Code Prisma: ${error.code}`);
            if (error.meta) console.error(`  -> Meta Prisma: ${JSON.stringify(error.meta)}`);
        }
    }
    console.log(`Surgeons seeding finished from ${surgeonsCsvPath}. ${surgeonsCreated} created, ${surgeonsUpdated} updated.`);

    // 4. Seed Secteurs d'opération
    console.log(`Seeding operating sectors...`);
    const sectorsData = [
        { name: 'Hyperaseptique', colorCode: '#3B82F6', maxRoomsPerSupervisor: 2, description: 'Salles 1-4' },
        { name: 'Secteur 5-8', colorCode: '#10B981', maxRoomsPerSupervisor: 2, description: 'Salles 5-8 et Césarienne' },
        { name: 'Secteur 9-12B', colorCode: '#F97316', maxRoomsPerSupervisor: 2, description: 'Salles 9-12 et 12bis' },
        { name: 'Ophtalmologie', colorCode: '#EC4899', maxRoomsPerSupervisor: 3, description: 'Salles Ophtalmologie' },
        { name: 'Endoscopie', colorCode: '#4F46E5', maxRoomsPerSupervisor: 2, description: 'Salles Endoscopie' },
    ];
    const seededSectors = new Map<string, number>();
    for (const sectorData of sectorsData) {
        try {
            const sector = await prisma.operatingSector.upsert({
                where: { name: sectorData.name },
                update: {
                    colorCode: sectorData.colorCode,
                    description: sectorData.description,
                    isActive: true,
                    rules: { maxRoomsPerSupervisor: sectorData.maxRoomsPerSupervisor }
                },
                create: {
                    name: sectorData.name,
                    colorCode: sectorData.colorCode,
                    description: sectorData.description,
                    isActive: true,
                    rules: { maxRoomsPerSupervisor: sectorData.maxRoomsPerSupervisor }
                },
            });
            seededSectors.set(sector.name, sector.id);
        } catch (error) {
            console.error(`Error upserting sector ${sectorData.name}:`, error);
        }
    }
    console.log(`Operating sectors seeding finished. ${seededSectors.size} sectors processed.`);

    // 5. Seed Salles d'opération
    console.log(`Seeding operating rooms...`);
    const roomsData = [
        // Hyperaseptique
        { name: 'Salle 1', number: '1', sectorName: 'Hyperaseptique' },
        { name: 'Salle 2', number: '2', sectorName: 'Hyperaseptique' },
        { name: 'Salle 3', number: '3', sectorName: 'Hyperaseptique' },
        { name: 'Salle 4', number: '4', sectorName: 'Hyperaseptique' },
        // Secteur 5-8
        { name: 'Salle 5', number: '5', sectorName: 'Secteur 5-8' },
        { name: 'Salle 6', number: '6', sectorName: 'Secteur 5-8' },
        { name: 'Salle 7', number: '7', sectorName: 'Secteur 5-8' },
        { name: 'Salle 8', number: '8', sectorName: 'Secteur 5-8' },
        // Secteur 9-12B
        { name: 'Salle 9', number: '9', sectorName: 'Secteur 9-12B' },
        { name: 'Salle 10', number: '10', sectorName: 'Secteur 9-12B' },
        { name: 'Salle 11', number: '11', sectorName: 'Secteur 9-12B' },
        { name: 'Salle 12B', number: '12B', sectorName: 'Secteur 9-12B' },
        // Ophtalmologie (Nouvelles salles demandées)
        { name: 'Salle 14', number: '14', sectorName: 'Ophtalmologie' },
        { name: 'Salle 15', number: '15', sectorName: 'Ophtalmologie' },
        { name: 'Salle 16', number: '16', sectorName: 'Ophtalmologie' },
        { name: 'Salle 17', number: '17', sectorName: 'Ophtalmologie' },
        // Endoscopie (Nouvelles salles demandées)
        { name: 'Endo 1', number: 'Endo 1', sectorName: 'Endoscopie' },
        { name: 'Endo 2', number: 'Endo 2', sectorName: 'Endoscopie' },
        { name: 'Endo 3', number: 'Endo 3', sectorName: 'Endoscopie' },
        { name: 'Endo 4', number: 'Endo 4', sectorName: 'Endoscopie' },
    ];

    let roomsProcessed = 0;
    for (const roomData of roomsData) {
        const sectorId = seededSectors.get(roomData.sectorName);
        if (!sectorId) {
            console.warn(`WARN: Sector '${roomData.sectorName}' not found for room '${roomData.name}'. Skipping room.`);
            continue;
        }

        try {
            await prisma.operatingRoom.upsert({
                where: { number: roomData.number },
                update: {
                    name: roomData.name,
                    sectorId: sectorId,
                    isActive: true,
                    supervisionRules: {}
                },
                create: {
                    name: roomData.name,
                    number: roomData.number,
                    sectorId: sectorId,
                    isActive: true,
                    supervisionRules: {}
                },
            });
            roomsProcessed++;
        } catch (error: any) {
            console.error(`Error upserting room ${roomData.name} (Number: ${roomData.number}):`, error.message);
            if (error.code === 'P2002') {
                console.error(`  -> Violation de contrainte unique. Vérifiez si le numéro '${roomData.number}' existe déjà ou si un autre champ unique est en conflit.`);
                if (error.meta?.target) {
                    console.error(`  -> Champ(s) en conflit: ${error.meta.target}`);
                }
            } else if (error.code === 'P2003') {
                console.error(`  -> Violation de clé étrangère. Le secteur ID '${sectorId}' existe-t-il vraiment dans OperatingSector?`);
            }
            if (error.code) console.error(`  -> Code Prisma: ${error.code}`);
            if (error.meta) console.error(`  -> Meta Prisma: ${JSON.stringify(error.meta)}`);
        }
    }
    console.log(`Operating rooms seeding finished. ${roomsProcessed} rooms processed.`);

    console.log(`Seeding finished.`);
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