import fs from 'fs';
import path from 'path';

/**
 * Convertit un export JSON en fichier seed TypeScript
 * Usage: node scripts/create-seed-from-export.js <fichier-export.json>
 */
function createSeedFromExport(exportFilename) {
    try {
        const exportPath = path.join(process.cwd(), 'exports', exportFilename);

        if (!fs.existsSync(exportPath)) {
            throw new Error(`Fichier d'export non trouvé: ${exportPath}`);
        }

        console.log(`📁 Lecture de l'export: ${exportPath}`);
        const exportData = JSON.parse(fs.readFileSync(exportPath, 'utf-8'));

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const seedFilename = `seed-from-export-${timestamp}.ts`;
        const seedPath = path.join(process.cwd(), 'prisma', seedFilename);

        console.log(`🔄 Génération du seed: ${seedPath}`);

        // Générer le contenu du fichier seed
        let seedContent = `import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed généré automatiquement à partir de l'export: ${exportFilename}
 * Créé le: ${new Date().toLocaleString('fr-FR')}
 */
async function main() {
    console.log('🌱 Début du seeding depuis export...');

`;

        // Générer le code pour chaque table
        Object.entries(exportData).forEach(([tableName, data]) => {
            if (!Array.isArray(data) || data.length === 0) return;

            seedContent += `    // ===== ${tableName.toUpperCase()} =====\n`;
            seedContent += `    console.log('📊 Import ${tableName}...');\n`;

            switch (tableName) {
                case 'users':
                    seedContent += generateUsersSeeds(data);
                    break;
                case 'leaves':
                    seedContent += generateLeavesSeeds(data);
                    break;
                case 'surgeons':
                    seedContent += generateSurgeonsSeeds(data);
                    break;
                case 'specialties':
                    seedContent += generateSpecialtiesSeeds(data);
                    break;
                case 'leaveTypes':
                    seedContent += generateLeaveTypesSeeds(data);
                    break;
                case 'operatingRooms':
                    seedContent += generateOperatingRoomsSeeds(data);
                    break;
                case 'operatingSectors':
                    seedContent += generateOperatingSectorsSeeds(data);
                    break;
                default:
                    seedContent += generateGenericSeeds(tableName, data);
            }
            seedContent += '\n';
        });

        seedContent += `    console.log('✅ Seeding terminé avec succès !');
}

main()
    .catch((e) => {
        console.error('❌ Erreur during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
`;

        // Écrire le fichier seed
        fs.writeFileSync(seedPath, seedContent);

        console.log(`✅ Seed créé: ${seedPath}`);
        console.log(`\n🚀 Pour l'exécuter:`);
        console.log(`tsx ${seedPath}`);
        console.log(`\n📝 Ou ajoutez-le à package.json:`);
        console.log(`"seed:from-export": "tsx ./${path.relative(process.cwd(), seedPath)}"`);

        return seedPath;
    } catch (error) {
        console.error('❌ Erreur lors de la création du seed:', error);
        throw error;
    }
}

function generateUsersSeeds(users) {
    let code = `    const usersData = ${JSON.stringify(users, null, 8)};\n\n`;
    code += `    for (const userData of usersData) {\n`;
    code += `        const hashedPassword = await bcrypt.hash('motdepasse123', 10);\n`;
    code += `        \n`;
    code += `        await prisma.user.upsert({\n`;
    code += `            where: { login: userData.login },\n`;
    code += `            update: userData,\n`;
    code += `            create: {\n`;
    code += `                ...userData,\n`;
    code += `                password: hashedPassword\n`;
    code += `            }\n`;
    code += `        });\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${usersData.length} utilisateurs traités\`);\n`;
    return code;
}

function generateLeavesSeeds(leaves) {
    let code = `    const leavesData = ${JSON.stringify(leaves, null, 8)};\n\n`;
    code += `    for (const leaveData of leavesData) {\n`;
    code += `        // Recherche de l'utilisateur\n`;
    code += `        const user = await prisma.user.findFirst({\n`;
    code += `            where: {\n`;
    code += `                nom: leaveData.user.nom,\n`;
    code += `                prenom: leaveData.user.prenom\n`;
    code += `            }\n`;
    code += `        });\n`;
    code += `        \n`;
    code += `        // Recherche du type de congé\n`;
    code += `        const leaveType = await prisma.leaveTypeSetting.findFirst({\n`;
    code += `            where: { code: leaveData.leaveType.code }\n`;
    code += `        });\n`;
    code += `        \n`;
    code += `        if (user && leaveType) {\n`;
    code += `            await prisma.leave.create({\n`;
    code += `                data: {\n`;
    code += `                    userId: user.id,\n`;
    code += `                    leaveTypeId: leaveType.id,\n`;
    code += `                    startDate: new Date(leaveData.startDate),\n`;
    code += `                    endDate: new Date(leaveData.endDate),\n`;
    code += `                    status: leaveData.status,\n`;
    code += `                    workingDaysCount: leaveData.workingDaysCount,\n`;
    code += `                    description: leaveData.description,\n`;
    code += `                    metadata: leaveData.metadata\n`;
    code += `                }\n`;
    code += `            });\n`;
    code += `        }\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${leavesData.length} congés traités\`);\n`;
    return code;
}

function generateSurgeonsSeeds(surgeons) {
    let code = `    const surgeonsData = ${JSON.stringify(surgeons, null, 8)};\n\n`;
    code += `    for (const surgeonData of surgeonsData) {\n`;
    code += `        const surgeon = await prisma.surgeon.upsert({\n`;
    code += `            where: {\n`;
    code += `                nom_prenom: {\n`;
    code += `                    nom: surgeonData.nom,\n`;
    code += `                    prenom: surgeonData.prenom\n`;
    code += `                }\n`;
    code += `            },\n`;
    code += `            update: {\n`;
    code += `                email: surgeonData.email,\n`;
    code += `                phoneNumber: surgeonData.phoneNumber,\n`;
    code += `                googleSheetName: surgeonData.googleSheetName,\n`;
    code += `                status: surgeonData.status\n`;
    code += `            },\n`;
    code += `            create: {\n`;
    code += `                nom: surgeonData.nom,\n`;
    code += `                prenom: surgeonData.prenom,\n`;
    code += `                email: surgeonData.email,\n`;
    code += `                phoneNumber: surgeonData.phoneNumber,\n`;
    code += `                googleSheetName: surgeonData.googleSheetName,\n`;
    code += `                status: surgeonData.status || 'ACTIF'\n`;
    code += `            }\n`;
    code += `        });\n`;
    code += `        \n`;
    code += `        // Liaison avec les spécialités\n`;
    code += `        for (const specialty of surgeonData.specialties) {\n`;
    code += `            const specialtyRecord = await prisma.specialty.findFirst({\n`;
    code += `                where: { name: specialty.name }\n`;
    code += `            });\n`;
    code += `            \n`;
    code += `            if (specialtyRecord) {\n`;
    code += `                await prisma.surgeon.update({\n`;
    code += `                    where: { id: surgeon.id },\n`;
    code += `                    data: {\n`;
    code += `                        specialties: {\n`;
    code += `                            connect: { id: specialtyRecord.id }\n`;
    code += `                        }\n`;
    code += `                    }\n`;
    code += `                });\n`;
    code += `            }\n`;
    code += `        }\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${surgeonsData.length} chirurgiens traités\`);\n`;
    return code;
}

function generateSpecialtiesSeeds(specialties) {
    let code = `    const specialtiesData = ${JSON.stringify(specialties, null, 8)};\n\n`;
    code += `    for (const specialtyData of specialtiesData) {\n`;
    code += `        await prisma.specialty.upsert({\n`;
    code += `            where: { name: specialtyData.name },\n`;
    code += `            update: { isPediatric: specialtyData.isPediatric },\n`;
    code += `            create: specialtyData\n`;
    code += `        });\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${specialtiesData.length} spécialités traitées\`);\n`;
    return code;
}

function generateLeaveTypesSeeds(leaveTypes) {
    let code = `    const leaveTypesData = ${JSON.stringify(leaveTypes, null, 8)};\n\n`;
    code += `    for (const leaveTypeData of leaveTypesData) {\n`;
    code += `        await prisma.leaveTypeSetting.upsert({\n`;
    code += `            where: { code: leaveTypeData.code },\n`;
    code += `            update: leaveTypeData,\n`;
    code += `            create: leaveTypeData\n`;
    code += `        });\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${leaveTypesData.length} types de congés traités\`);\n`;
    return code;
}

function generateOperatingRoomsSeeds(rooms) {
    let code = `    const roomsData = ${JSON.stringify(rooms, null, 8)};\n\n`;
    code += `    for (const roomData of roomsData) {\n`;
    code += `        const sector = await prisma.operatingSector.findFirst({\n`;
    code += `            where: { name: roomData.sector.name }\n`;
    code += `        });\n`;
    code += `        \n`;
    code += `        if (sector) {\n`;
    code += `            await prisma.operatingRoom.upsert({\n`;
    code += `                where: { name: roomData.name },\n`;
    code += `                update: {\n`;
    code += `                    sectorId: sector.id,\n`;
    code += `                    isActive: roomData.isActive\n`;
    code += `                },\n`;
    code += `                create: {\n`;
    code += `                    name: roomData.name,\n`;
    code += `                    sectorId: sector.id,\n`;
    code += `                    isActive: roomData.isActive\n`;
    code += `                }\n`;
    code += `            });\n`;
    code += `        }\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${roomsData.length} salles d'opération traitées\`);\n`;
    return code;
}

function generateOperatingSectorsSeeds(sectors) {
    let code = `    const sectorsData = ${JSON.stringify(sectors, null, 8)};\n\n`;
    code += `    for (const sectorData of sectorsData) {\n`;
    code += `        await prisma.operatingSector.upsert({\n`;
    code += `            where: { name: sectorData.name },\n`;
    code += `            update: sectorData,\n`;
    code += `            create: sectorData\n`;
    code += `        });\n`;
    code += `    }\n`;
    code += `    console.log(\`   ✅ \${sectorsData.length} secteurs traités\`);\n`;
    return code;
}

function generateGenericSeeds(tableName, data) {
    let code = `    const ${tableName}Data = ${JSON.stringify(data, null, 8)};\n\n`;
    code += `    // ⚠️  Seed générique pour ${tableName} - À adapter selon le modèle\n`;
    code += `    console.log(\`   ℹ️  ${tableName}: \${${tableName}Data.length} entrées disponibles\`);\n`;
    code += `    // TODO: Implémenter le seed spécifique pour ${tableName}\n`;
    return code;
}

function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.error("❌ Usage: node scripts/create-seed-from-export.js <fichier-export.json>");
        console.log("📁 Fichiers disponibles dans exports/:");
        const exportDir = path.join(process.cwd(), 'exports');
        if (fs.existsSync(exportDir)) {
            const files = fs.readdirSync(exportDir).filter(f => f.endsWith('.json'));
            files.forEach(file => console.log(`   - ${file}`));
        }
        process.exit(1);
    }

    try {
        createSeedFromExport(args[0]);
    } catch (error) {
        console.error("❌ Erreur:", error.message);
        process.exit(1);
    }
}

main(); 