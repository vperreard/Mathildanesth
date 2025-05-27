import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const prisma = new PrismaClient();

interface SurgeonCsvData {
    nom: string;
    prenom: string;
    email?: string;
    phoneNumber?: string;
    status: string;
    specialtyNames?: string;
    googleSheetName?: string;
}

// Liste des spécialités à créer
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

function safeLoadCsv<T>(filePath: string, defaultValue: T[] = []): T[] {
    try {
        if (!fs.existsSync(filePath)) {
            console.warn(`[IMPORT WARN] Fichier CSV non trouvé : ${filePath}`);
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
        console.error(`[IMPORT ERROR] Erreur lors du chargement de ${filePath}:`, error);
        return defaultValue;
    }
}

async function createSpecialties() {
    console.log('🏥 Création des spécialités chirurgicales...');

    for (const specialty of specialtiesToSeed) {
        try {
            const createdSpecialty = await prisma.specialty.upsert({
                where: { name: specialty.name },
                update: { isPediatric: specialty.isPediatric },
                create: {
                    name: specialty.name,
                    isPediatric: specialty.isPediatric
                }
            });
            console.log(`   ✅ Spécialité: ${createdSpecialty.name} (ID: ${createdSpecialty.id})`);
        } catch (error) {
            console.error(`   ❌ Erreur création spécialité ${specialty.name}:`, error);
        }
    }
}

async function processSurgeons(surgeonsData: SurgeonCsvData[]) {
    console.log('👨‍⚕️ Import des chirurgiens...');

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const surgeonData of surgeonsData) {
        try {
            // Traiter les spécialités (séparées par ';')
            const specialtyNames = surgeonData.specialtyNames
                ? surgeonData.specialtyNames.split(';').map(name => name.trim())
                : [];

            // Chercher les spécialités dans la base
            const specialties = await prisma.specialty.findMany({
                where: {
                    name: { in: specialtyNames }
                }
            });

            if (specialtyNames.length > 0 && specialties.length === 0) {
                console.warn(`   ⚠️  Aucune spécialité trouvée pour ${surgeonData.prenom} ${surgeonData.nom}: ${specialtyNames.join(', ')}`);
            }

            // Créer ou mettre à jour le chirurgien
            const surgeon = await prisma.surgeon.upsert({
                where: {
                    email: surgeonData.email || `${surgeonData.prenom.toLowerCase()}.${surgeonData.nom.toLowerCase()}@example.com`
                },
                update: {
                    nom: surgeonData.nom,
                    prenom: surgeonData.prenom,
                    phoneNumber: surgeonData.phoneNumber || null,
                    status: surgeonData.status === 'ACTIF' ? 'ACTIF' : 'INACTIF',
                    googleSheetName: surgeonData.googleSheetName || null,
                    specialties: {
                        set: specialties.map(s => ({ id: s.id }))
                    }
                },
                create: {
                    nom: surgeonData.nom,
                    prenom: surgeonData.prenom,
                    email: surgeonData.email || `${surgeonData.prenom.toLowerCase()}.${surgeonData.nom.toLowerCase()}@example.com`,
                    phoneNumber: surgeonData.phoneNumber || null,
                    status: surgeonData.status === 'ACTIF' ? 'ACTIF' : 'INACTIF',
                    googleSheetName: surgeonData.googleSheetName || null,
                    specialties: {
                        connect: specialties.map(s => ({ id: s.id }))
                    }
                },
                include: {
                    specialties: true
                }
            });

            const isNew = await prisma.surgeon.count({
                where: { id: surgeon.id }
            }) === 1;

            if (isNew) {
                imported++;
                console.log(`   ✅ Nouveau chirurgien: ${surgeon.prenom} ${surgeon.nom} (${surgeon.specialties.length} spécialités)`);
            } else {
                updated++;
                console.log(`   🔄 Mis à jour: ${surgeon.prenom} ${surgeon.nom} (${surgeon.specialties.length} spécialités)`);
            }

        } catch (error) {
            errors++;
            console.error(`   ❌ Erreur pour ${surgeonData.prenom} ${surgeonData.nom}:`, error);
        }
    }

    console.log(`\n📊 Résumé de l'import:`);
    console.log(`   ✅ Nouveaux chirurgiens: ${imported}`);
    console.log(`   🔄 Chirurgiens mis à jour: ${updated}`);
    console.log(`   ❌ Erreurs: ${errors}`);
    console.log(`   📈 Total traité: ${surgeonsData.length}`);
}

async function main() {
    console.log('🚀 Import des chirurgiens et spécialités MATHILDA\n');

    try {
        // Étape 1: Créer les spécialités
        await createSpecialties();

        // Étape 2: Charger les données des chirurgiens
        const surgeonsCsvPath = path.resolve(__dirname, '../prisma/seed_data/chirurgiens.csv');
        const surgeonsData = safeLoadCsv<SurgeonCsvData>(surgeonsCsvPath);

        if (surgeonsData.length === 0) {
            console.error('❌ Aucune donnée de chirurgien trouvée dans le CSV!');
            return;
        }

        console.log(`\n📋 ${surgeonsData.length} chirurgiens trouvés dans le CSV\n`);

        // Étape 3: Importer les chirurgiens
        await processSurgeons(surgeonsData);

        // Étape 4: Statistiques finales
        const totalSurgeons = await prisma.surgeon.count();
        const totalSpecialties = await prisma.specialty.count();

        console.log(`\n🎉 Import terminé avec succès!`);
        console.log(`   👨‍⚕️ Total chirurgiens en base: ${totalSurgeons}`);
        console.log(`   🏥 Total spécialités en base: ${totalSpecialties}`);

    } catch (error) {
        console.error('❌ Erreur durant l\'import:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Point d'entrée du script
if (require.main === module) {
    main()
        .catch((error) => {
            console.error('💥 Erreur fatale:', error);
            process.exit(1);
        });
}

export { main as importSurgeons }; 