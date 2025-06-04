import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Exporte les données actuelles vers des fichiers CSV
 * Plus facile à modifier que JSON
 */
async function exportToCSV(tablesToExport = []) {
    console.log("📊 Export vers CSV...");

    try {
        const exportDir = path.join(process.cwd(), 'exports', 'csv');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];

        const availableExports = {
            users: async () => {
                const users = await prisma.user.findMany({
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
                });

                const csvContent = [
                    // Headers
                    'nom,prenom,login,email,role,professionalRole,tempsPartiel,pourcentageTempsPartiel,dateEntree,dateSortie,actif,phoneNumber,alias,workPattern,joursTravaillesSemaineImpaire,joursTravaillesSemainePaire',
                    // Data
                    ...users.map(user => [
                        user.nom || '',
                        user.prenom || '',
                        user.login || '',
                        user.email || '',
                        user.role || '',
                        user.professionalRole || '',
                        user.tempsPartiel ? 'true' : 'false',
                        user.pourcentageTempsPartiel || '',
                        user.dateEntree ? user.dateEntree.toISOString().split('T')[0] : '',
                        user.dateSortie ? user.dateSortie.toISOString().split('T')[0] : '',
                        user.actif ? 'true' : 'false',
                        user.phoneNumber || '',
                        user.alias || '',
                        user.workPattern || '',
                        user.joursTravaillesSemaineImpaire || '',
                        user.joursTravaillesSemainePaire || ''
                    ].map(field => `"${field}"`).join(','))
                ].join('\n');

                const filePath = path.join(exportDir, `users-${timestamp}.csv`);
                fs.writeFileSync(filePath, csvContent);
                console.log(`   ✅ users: ${users.length} entrées → ${filePath}`);
                return users.length;
            },

            surgeons: async () => {
                const surgeons = await prisma.surgeon.findMany({
                    include: {
                        specialties: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                const csvContent = [
                    // Headers
                    'nom,prenom,email,phoneNumber,googleSheetName,status,specialtyNames',
                    // Data
                    ...surgeons.map(surgeon => [
                        surgeon.nom || '',
                        surgeon.prenom || '',
                        surgeon.email || '',
                        surgeon.phoneNumber || '',
                        surgeon.googleSheetName || '',
                        surgeon.status || 'ACTIF',
                        surgeon.specialties.map(s => s.name).join(';')
                    ].map(field => `"${field}"`).join(','))
                ].join('\n');

                const filePath = path.join(exportDir, `surgeons-${timestamp}.csv`);
                fs.writeFileSync(filePath, csvContent);
                console.log(`   ✅ surgeons: ${surgeons.length} entrées → ${filePath}`);
                return surgeons.length;
            },

            leaves: async () => {
                const leaves = await prisma.leave.findMany({
                    include: {
                        user: {
                            select: {
                                nom: true,
                                prenom: true,
                                professionalRole: true
                            }
                        }
                    }
                });

                const csvContent = [
                    // Headers
                    'userNom,userPrenom,userRole,startDate,endDate,typeCode,type,status,countedDays,reason,comment',
                    // Data
                    ...leaves.map(leave => [
                        leave.user.nom || '',
                        leave.user.prenom || '',
                        leave.user.professionalRole || '',
                        leave.startDate.toISOString().split('T')[0],
                        leave.endDate.toISOString().split('T')[0],
                        leave.typeCode || '',
                        leave.type || '',
                        leave.status || '',
                        leave.countedDays || '',
                        (leave.reason || '').replace(/"/g, '""'), // Escape quotes
                        (leave.comment || '').replace(/"/g, '""') // Escape quotes
                    ].map(field => `"${field}"`).join(','))
                ].join('\n');

                const filePath = path.join(exportDir, `leaves-${timestamp}.csv`);
                fs.writeFileSync(filePath, csvContent);
                console.log(`   ✅ leaves: ${leaves.length} entrées → ${filePath}`);
                return leaves.length;
            },

            specialties: async () => {
                const specialties = await prisma.specialty.findMany();

                const csvContent = [
                    'name,isPediatric',
                    ...specialties.map(specialty => [
                        specialty.name || '',
                        specialty.isPediatric ? 'true' : 'false'
                    ].map(field => `"${field}"`).join(','))
                ].join('\n');

                const filePath = path.join(exportDir, `specialties-${timestamp}.csv`);
                fs.writeFileSync(filePath, csvContent);
                console.log(`   ✅ specialties: ${specialties.length} entrées → ${filePath}`);
                return specialties.length;
            },

            leaveTypes: async () => {
                const leaveTypes = await prisma.leaveTypeSetting.findMany();

                const csvContent = [
                    'code,label,description,isActive,isUserSelectable',
                    ...leaveTypes.map(lt => [
                        lt.code || '',
                        lt.label || '',
                        (lt.description || '').replace(/"/g, '""'),
                        lt.isActive ? 'true' : 'false',
                        lt.isUserSelectable ? 'true' : 'false'
                    ].map(field => `"${field}"`).join(','))
                ].join('\n');

                const filePath = path.join(exportDir, `leave-types-${timestamp}.csv`);
                fs.writeFileSync(filePath, csvContent);
                console.log(`   ✅ leaveTypes: ${leaveTypes.length} entrées → ${filePath}`);
                return leaveTypes.length;
            }
        };

        // Tables à traiter
        const tablesToProcess = tablesToExport.length > 0
            ? tablesToExport
            : Object.keys(availableExports);

        console.log(`Tables à exporter: ${tablesToProcess.join(', ')}`);

        let totalExported = 0;
        for (const table of tablesToProcess) {
            if (availableExports[table]) {
                const count = await availableExports[table]();
                totalExported += count;
            } else {
                console.warn(`   ⚠️  Table inconnue: ${table}`);
            }
        }

        console.log(`\n✅ Export CSV terminé !`);
        console.log(`📁 Dossier: ${exportDir}`);
        console.log(`📊 Total: ${totalExported} entrées exportées`);
        console.log(`\n💡 Pour réimporter après modification:`);
        console.log(`   1. Modifiez les fichiers CSV dans ${exportDir}`);
        console.log(`   2. Copiez-les dans prisma/seed_data/`);
        console.log(`   3. Exécutez: npm run db:seed`);

        return exportDir;
    } catch (error) {
        console.error("❌ Erreur lors de l'export CSV:", error);
        throw error;
    }
}

async function main() {
    try {
        const args = process.argv.slice(2);
        const tablesToExport = args.length > 0
            ? args[0].split(',').map(t => t.trim())
            : [];

        await exportToCSV(tablesToExport);

        console.log(`\n📋 Tables disponibles pour export:`);
        console.log(`users, surgeons, leaves, specialties, leaveTypes`);
        console.log(`\n💡 Usage:`);
        console.log(`node scripts/export-to-csv.js                    # Toutes les tables`);
        console.log(`node scripts/export-to-csv.js users,leaves       # Tables spécifiques`);
    } catch (error) {
        console.error("❌ Erreur:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 