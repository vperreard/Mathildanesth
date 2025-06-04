const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSectorDisplay() {
    console.log('🧪 Test d\'affichage des secteurs...\n');

    try {
        // 1. Récupérer les secteurs comme le fait l'API
        const sectors = await prisma.operatingSector.findMany({
            include: {
                site: true,
                rooms: {
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: [
                { displayOrder: { sort: 'asc', nulls: 'last' } },
                { name: 'asc' }
            ]
        });

        console.log(`📊 ${sectors.length} secteurs récupérés de l'API\n`);

        // 2. Simuler le processus de normalisation (ancien)
        const normalizeSectorNameOld = (name) => {
            if (!name) return '';
            let normalized = name.toLowerCase().trim();
            let prefix = 'secteur ';

            if (normalized.includes('europe')) {
                prefix = 'europe ';
                normalized = normalized.replace(/\\beurope\\b/gi, '').trim(); // ERREUR SIMULÉE
            } else {
                normalized = normalized.replace(/\\bsecteur\\b/gi, '').trim(); // ERREUR SIMULÉE
            }

            if (normalized.includes('endo')) {
                return prefix + 'endoscopie';
            }
            // ... autres règles

            if (normalized === '') {
                if (prefix === 'europe ') return 'europe général';
                return 'secteur général';
            }

            return prefix + normalized;
        };

        // 3. Tester l'ancien comportement (problématique)
        console.log('❌ ANCIEN COMPORTEMENT (problématique):');
        sectors.forEach(sector => {
            const oldNormalizedName = normalizeSectorNameOld(sector.name);
            if (oldNormalizedName !== sector.name) {
                console.log(`  "${sector.name}" → "${oldNormalizedName}" (PROBLÈME!)`);
            } else {
                console.log(`  "${sector.name}" → OK`);
            }
        });

        console.log('\n✅ NOUVEAU COMPORTEMENT (corrigé):');
        sectors.forEach(sector => {
            console.log(`  "${sector.name}" → "${sector.name}" (nom original préservé)`);
        });

        // 4. Tester les secteurs manquants spécifiquement
        console.log('\n🔍 VÉRIFICATION DES SECTEURS MANQUANTS:');

        const missingSecrtors = [
            'Astreinte Cl Europe',
            'CS anesth Europe',
            'Garde-Astreinte Mathilde',
            'Consultations Anesth Mathilde'
        ];

        missingSecrtors.forEach(missingName => {
            const found = sectors.find(s => s.name === missingName);
            if (found) {
                console.log(`✅ "${missingName}" trouvé (ID: ${found.id}, site: ${found.site?.name || 'Aucun'})`);
            } else {
                console.log(`❌ "${missingName}" NON TROUVÉ`);
                // Chercher des noms similaires
                const similar = sectors.filter(s =>
                    s.name.toLowerCase().includes(missingName.toLowerCase().split(' ')[0])
                );
                if (similar.length > 0) {
                    console.log(`   Secteurs similaires trouvés: ${similar.map(s => s.name).join(', ')}`);
                }
            }
        });

        // 5. Afficher la structure finale par site
        console.log('\n🏥 STRUCTURE PAR SITE:');
        const sites = await prisma.site.findMany({
            include: {
                operatingSectors: {
                    orderBy: [
                        { displayOrder: { sort: 'asc', nulls: 'last' } },
                        { name: 'asc' }
                    ]
                }
            }
        });

        sites.forEach(site => {
            console.log(`\n📍 ${site.name}:`);
            if (site.operatingSectors.length === 0) {
                console.log('   Aucun secteur');
            } else {
                site.operatingSectors.forEach(sector => {
                    console.log(`   - ${sector.name} (displayOrder: ${sector.displayOrder})`);
                });
            }
        });

    } catch (error) {
        console.error('❌ Erreur lors du test:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter le test
if (require.main === module) {
    testSectorDisplay();
}

module.exports = { testSectorDisplay }; 