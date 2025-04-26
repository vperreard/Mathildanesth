const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const prisma = new PrismaClient();
const saltRounds = 10;

// Chemins des fichiers CSV
const usersCsvPath = path.join(__dirname, 'seed_data', 'users.csv');
const surgeonsCsvPath = path.join(__dirname, 'seed_data', 'surgeons.csv');
const specialtySeparator = ';';

// Spécialités à créer
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

function parseCsv(filePath) {
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
    return records;
}

async function main() {
    console.log(`Start seeding ...`);

    // 1. Seed Spécialités
    console.log(`Seeding specialties...`);
    const seededSpecialties = new Map();
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
    const usersData = parseCsv(usersCsvPath);
    let usersCreated = 0;
    let usersUpdated = 0;

    for (const userData of usersData) {
        if (!userData.login || !userData.password || !userData.role || !userData.professionalRole) {
            console.warn(`WARN: Skipping user row due to missing essential data:`, userData);
            continue;
        }

        const hashedPassword = await bcrypt.hash(userData.password, saltRounds);
        const tempsPartiel = userData.tempsPartiel?.toLowerCase() === 'true';
        const actif = userData.actif?.toLowerCase() === 'true';
        const mustChangePassword = userData.mustChangePassword?.toLowerCase() === 'true';
        const pourcentage = tempsPartiel && userData.pourcentageTempsPartiel ? parseFloat(userData.pourcentageTempsPartiel) : null;

        try {
            const existingUser = await prisma.user.findUnique({ where: { login: userData.login } });

            const commonUserData = {
                nom: userData.nom || '',
                prenom: userData.prenom || '',
                login: userData.login,
                email: userData.email || `${userData.login}@example.local`,
                role: userData.role,
                professionalRole: userData.professionalRole,
                tempsPartiel: tempsPartiel,
                pourcentageTempsPartiel: pourcentage,
                actif: actif,
                mustChangePassword: mustChangePassword,
            };

            const user = await prisma.user.upsert({
                where: { login: userData.login },
                update: commonUserData,
                create: {
                    ...commonUserData,
                    password: hashedPassword,
                },
            });

            if (existingUser) { usersUpdated++; } else { usersCreated++; }
        } catch (error) {
            console.error(`Erreur lors de l'upsert de l'utilisateur ${userData.login}:`, error);
        }
    }
    console.log(`Users seeding finished. ${usersCreated} created, ${usersUpdated} updated.`);

    // 3. Seed Chirurgiens depuis CSV
    console.log(`Seeding surgeons from ${surgeonsCsvPath}...`);
    const surgeonsData = parseCsv(surgeonsCsvPath);
    let surgeonsCreated = 0;
    let surgeonsUpdated = 0;

    for (const surgeonData of surgeonsData) {
        if (!surgeonData.nom || !surgeonData.prenom) {
            console.warn(`WARN: Skipping surgeon row due to missing nom/prenom:`, surgeonData);
            continue;
        }

        const specialtyIds = (surgeonData.specialtyNames || '')
            .split(specialtySeparator)
            .map(name => name.trim())
            .filter(name => seededSpecialties.has(name))
            .map(name => ({ id: seededSpecialties.get(name) }));

        const email = surgeonData.email || `${surgeonData.nom}.${surgeonData.prenom}@chir.example.local`.toLowerCase().replace(/\s+/g, '.');

        try {
            const existingSurgeon = await prisma.surgeon.findUnique({ where: { email: email } });

            const commonSurgeonData = {
                nom: surgeonData.nom,
                prenom: surgeonData.prenom,
                email: email,
                phoneNumber: surgeonData.phoneNumber || null,
                status: surgeonData.status || 'ACTIF',
                specialties: specialtyIds.length > 0 ? { connect: specialtyIds } : undefined,
                googleSheetName: surgeonData.googleSheetName || null,
            };

            const surgeon = await prisma.surgeon.upsert({
                where: { email: email },
                update: {
                    ...commonSurgeonData,
                    specialties: { set: specialtyIds },
                },
                create: commonSurgeonData,
            });

            if (existingSurgeon) { surgeonsUpdated++; } else { surgeonsCreated++; }
        } catch (error) {
            console.error(`Erreur lors de l'upsert du chirurgien ${surgeonData.nom} ${surgeonData.prenom}:`, error);
        }
    }
    console.log(`Surgeons seeding finished. ${surgeonsCreated} created, ${surgeonsUpdated} updated.`);

    // 4. Seed Secteurs d'opération
    console.log(`Seeding operating sectors...`);
    const sectorsData = [
        { name: 'Hyperaseptique', colorCode: '#3B82F6', maxRoomsPerSupervisor: 2, description: 'Salles 1-4' },
        { name: 'Secteur 5-8', colorCode: '#10B981', maxRoomsPerSupervisor: 2, description: 'Salles 5-8 et Césarienne' },
        { name: 'Secteur 9-12B', colorCode: '#F97316', maxRoomsPerSupervisor: 2, description: 'Salles 9-12 et 12bis' },
        { name: 'Ophtalmologie', colorCode: '#EC4899', maxRoomsPerSupervisor: 3, description: 'Salles Ophtalmologie' },
        { name: 'Endoscopie', colorCode: '#4F46E5', maxRoomsPerSupervisor: 2, description: 'Salles Endoscopie' },
    ];

    for (const sectorData of sectorsData) {
        try {
            await prisma.operatingSector.upsert({
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
        } catch (error) {
            console.error(`Error upserting sector ${sectorData.name}:`, error);
        }
    }
    console.log(`Operating sectors seeding finished.`);

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
        // Ophtalmologie
        { name: 'Salle 14', number: '14', sectorName: 'Ophtalmologie' },
        { name: 'Salle 15', number: '15', sectorName: 'Ophtalmologie' },
        { name: 'Salle 16', number: '16', sectorName: 'Ophtalmologie' },
        { name: 'Salle 17', number: '17', sectorName: 'Ophtalmologie' },
        // Endoscopie
        { name: 'Endo 1', number: 'Endo 1', sectorName: 'Endoscopie' },
        { name: 'Endo 2', number: 'Endo 2', sectorName: 'Endoscopie' },
        { name: 'Endo 3', number: 'Endo 3', sectorName: 'Endoscopie' },
        { name: 'Endo 4', number: 'Endo 4', sectorName: 'Endoscopie' },
    ];

    for (const roomData of roomsData) {
        try {
            const sector = await prisma.operatingSector.findUnique({
                where: { name: roomData.sectorName }
            });

            if (!sector) {
                console.warn(`WARN: Sector '${roomData.sectorName}' not found for room '${roomData.name}'. Skipping room.`);
                continue;
            }

            await prisma.operatingRoom.upsert({
                where: { number: roomData.number },
                update: {
                    name: roomData.name,
                    sectorId: sector.id,
                    isActive: true,
                    supervisionRules: {}
                },
                create: {
                    name: roomData.name,
                    number: roomData.number,
                    sectorId: sector.id,
                    isActive: true,
                    supervisionRules: {}
                },
            });
        } catch (error) {
            console.error(`Error upserting room ${roomData.name}:`, error);
        }
    }
    console.log(`Operating rooms seeding finished.`);

    console.log(`Seeding finished.`);
}

main()
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    }); 