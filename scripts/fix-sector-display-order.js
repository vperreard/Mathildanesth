// Script pour corriger les valeurs displayOrder des secteurs
// Exécuter avec: node scripts/fix-sector-display-order.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSectorDisplayOrder() {
    console.log('🔧 Début de la correction des displayOrder des secteurs...');

    try {
        // 1. Récupérer tous les sites
        const sites = await prisma.site.findMany({
            include: {
                operatingSectors: {
                    orderBy: { name: 'asc' }
                }
            }
        });

        console.log(`📊 ${sites.length} sites trouvés`);

        // 2. Pour chaque site, réorganiser les secteurs par ordre alphabétique
        for (const site of sites) {
            console.log(`\n🏥 Site: ${site.name} (${site.id}) - ${site.operatingSectors.length} secteurs`);

            // Utiliser une transaction pour garantir l'atomicité
            await prisma.$transaction(async (tx) => {
                // Réinitialiser d'abord tous les displayOrder à null pour éviter les conflits
                await Promise.all(site.operatingSectors.map(sector =>
                    tx.operatingSector.update({
                        where: { id: sector.id },
                        data: { displayOrder: null }
                    })
                ));

                // Ensuite, définir les nouveaux displayOrder basés sur l'ordre alphabétique
                await Promise.all(site.operatingSectors.map((sector, index) => {
                    console.log(`  - Secteur: ${sector.name} - Nouvel ordre: ${index} (ancien: ${sector.displayOrder})`);
                    return tx.operatingSector.update({
                        where: { id: sector.id },
                        data: { displayOrder: index }
                    });
                }));
            });

            console.log(`✅ Secteurs du site ${site.name} réorganisés avec succès`);
        }

        // 3. Vérifier les secteurs sans site (siteId = null)
        const noSiteSectors = await prisma.operatingSector.findMany({
            where: { siteId: null },
            orderBy: { name: 'asc' }
        });

        if (noSiteSectors.length > 0) {
            console.log(`\n🏢 Secteurs sans site: ${noSiteSectors.length} secteurs`);

            await prisma.$transaction(async (tx) => {
                // Réinitialiser d'abord
                await Promise.all(noSiteSectors.map(sector =>
                    tx.operatingSector.update({
                        where: { id: sector.id },
                        data: { displayOrder: null }
                    })
                ));

                // Puis définir les nouveaux displayOrder
                await Promise.all(noSiteSectors.map((sector, index) => {
                    console.log(`  - Secteur: ${sector.name} - Nouvel ordre: ${index} (ancien: ${sector.displayOrder})`);
                    return tx.operatingSector.update({
                        where: { id: sector.id },
                        data: { displayOrder: index }
                    });
                }));
            });

            console.log(`✅ Secteurs sans site réorganisés avec succès`);
        }

        console.log('\n🎉 Migration terminée avec succès !');

        // Statistiques finales
        const stats = await prisma.operatingSector.groupBy({
            by: ['displayOrder'],
            _count: { id: true }
        });

        console.log('\n📈 Statistiques finales des displayOrder:');
        stats.forEach(stat => {
            console.log(`  - displayOrder=${stat.displayOrder}: ${stat._count.id} secteurs`);
        });

    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter la fonction principale
fixSectorDisplayOrder()
    .then(() => console.log('Script terminé'))
    .catch(e => console.error('Erreur fatale:', e)); 