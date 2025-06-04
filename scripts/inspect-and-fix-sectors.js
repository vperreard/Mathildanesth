const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectSectors() {
    console.log('🔍 Inspection des secteurs opératoires...\n');

    try {
        // 1. Récupérer tous les secteurs avec leurs sites
        const sectors = await prisma.operatingSector.findMany({
            include: {
                site: true,
                rooms: true
            },
            orderBy: [
                { siteId: 'asc' },
                { name: 'asc' }
            ]
        });

        console.log(`📊 ${sectors.length} secteurs trouvés total\n`);

        // 2. Grouper par site
        const sectorsBySite = {};
        const problematicSectors = [];

        sectors.forEach(sector => {
            const siteId = sector.siteId || 'sans-site';
            const siteName = sector.site?.name || 'Aucun site';

            if (!sectorsBySite[siteId]) {
                sectorsBySite[siteId] = {
                    siteName,
                    sectors: []
                };
            }

            sectorsBySite[siteId].sectors.push(sector);

            // Détecter les secteurs problématiques
            if (sector.name.includes('europe europe') ||
                sector.name.includes('secteur secteur') ||
                sector.name.match(/(\w+)\s+\1/)) { // Mots dupliqués
                problematicSectors.push(sector);
            }
        });

        // 3. Afficher les secteurs par site
        for (const [siteId, siteData] of Object.entries(sectorsBySite)) {
            console.log(`🏥 Site: ${siteData.siteName} (${siteId})`);
            siteData.sectors.forEach(sector => {
                console.log(`  - ${sector.name} (ID: ${sector.id}, displayOrder: ${sector.displayOrder}, salles: ${sector.rooms.length})`);
            });
            console.log('');
        }

        // 4. Identifier les secteurs problématiques
        if (problematicSectors.length > 0) {
            console.log('⚠️  SECTEURS PROBLÉMATIQUES DÉTECTÉS:\n');
            problematicSectors.forEach(sector => {
                console.log(`❌ Secteur "${sector.name}" (ID: ${sector.id})`);
                console.log(`   Site: ${sector.site?.name || 'Aucun'}`);
                console.log(`   Salles: ${sector.rooms.length}`);
                console.log('');
            });
        }

        // 5. Proposer des corrections
        console.log('🔧 SUGGESTIONS DE CORRECTION:\n');

        const corrections = [];

        problematicSectors.forEach(sector => {
            let suggestedName = sector.name;

            // Corriger les doublons "europe europe"
            suggestedName = suggestedName.replace(/europe\s+europe/gi, 'europe');

            // Corriger les doublons "secteur secteur"  
            suggestedName = suggestedName.replace(/secteur\s+secteur/gi, 'secteur');

            // Nettoyer les espaces multiples
            suggestedName = suggestedName.replace(/\s+/g, ' ').trim();

            if (suggestedName !== sector.name) {
                corrections.push({
                    id: sector.id,
                    oldName: sector.name,
                    newName: suggestedName
                });

                console.log(`📝 Secteur ID ${sector.id}:`);
                console.log(`   Ancien: "${sector.name}"`);
                console.log(`   Nouveau: "${suggestedName}"`);
                console.log('');
            }
        });

        // 6. Retourner les données pour correction
        return { sectors, problematicSectors, corrections };

    } catch (error) {
        console.error('❌ Erreur lors de l\'inspection:', error);
        throw error;
    }
}

async function fixSectors(corrections) {
    if (!corrections || corrections.length === 0) {
        console.log('✅ Aucune correction nécessaire.');
        return;
    }

    console.log(`🔧 Application de ${corrections.length} corrections...\n`);

    try {
        for (const correction of corrections) {
            console.log(`Correction du secteur ID ${correction.id}: "${correction.oldName}" → "${correction.newName}"`);

            await prisma.operatingSector.update({
                where: { id: correction.id },
                data: { name: correction.newName }
            });
        }

        console.log('\n✅ Toutes les corrections ont été appliquées avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors de la correction:', error);
        throw error;
    }
}

async function main() {
    try {
        const { corrections } = await inspectSectors();

        if (corrections.length > 0) {
            console.log('\n💡 Voulez-vous appliquer ces corrections automatiquement?');
            console.log('   Pour appliquer les corrections, exécutez:');
            console.log('   node scripts/inspect-and-fix-sectors.js --fix\n');

            // Si l'argument --fix est passé, appliquer les corrections
            if (process.argv.includes('--fix')) {
                await fixSectors(corrections);
            }
        } else {
            console.log('✅ Aucun secteur problématique détecté.');
        }

    } catch (error) {
        console.error('❌ Erreur:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le script
if (require.main === module) {
    main();
}

module.exports = { inspectSectors, fixSectors }; 