// Script pour mettre à jour directement les displayOrder des secteurs
// Exécuter avec: node scripts/update-sector-display-order.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Définition des ordres souhaités par site
// Format: { siteId: { sectorId: displayOrder, ... }, ... }
const DISPLAY_ORDERS = {
    // Site Mathilda (remplacer par l'ID réel)
    '94cae7d3-7f25-41a7-b4a7-013b347f0a8f': {
        // Secteur aseptique
        1: 3,
        // Secteur intermédiaire
        2: 4,
        // Secteur septique
        3: 5,
        // Secteur ophtalmo
        4: 6,
        // Secteur endoscopie
        5: 7,
        // Secteur bloc
        6: 8,
        // Secteur ambulatoire
        7: 9,
        // Garde-Astreinte (remplacer par l'ID réel)
        16: 1,
        // Consultations Anesth (remplacer par l'ID réel)
        15: 2
    },
    // Site Europe (remplacer par l'ID réel)
    'fd57d1ad-a340-4cfa-ba78-0b49015c5b2b': {
        // Astreinte Cl Europe
        18: 1,
        // Bloc hospitalisation
        6: 3,
        // CS anesth Europe
        17: 2,
        // Bloc ambulatoire
        7: 4
    }
};

async function updateSectorDisplayOrder() {
    console.log('🔧 Mise à jour directe des displayOrder des secteurs...');

    try {
        // 1. Récupérer tous les secteurs
        const sectors = await prisma.operatingSector.findMany({
            include: { site: true }
        });

        console.log(`📊 ${sectors.length} secteurs trouvés`);

        // 2. Mettre à jour chaque secteur avec le displayOrder défini
        for (const sector of sectors) {
            const siteId = sector.siteId;
            const sectorId = sector.id;

            // Vérifier si un ordre est défini pour ce secteur
            if (siteId && DISPLAY_ORDERS[siteId] && DISPLAY_ORDERS[siteId][sectorId] !== undefined) {
                const newDisplayOrder = DISPLAY_ORDERS[siteId][sectorId];

                console.log(`⚙️ Mise à jour: Secteur "${sector.name}" (${sectorId}) du site "${sector.site?.name}" (${siteId})`);
                console.log(`   Ancien displayOrder: ${sector.displayOrder}, Nouveau: ${newDisplayOrder}`);

                // Mettre à jour le secteur
                await prisma.operatingSector.update({
                    where: { id: sectorId },
                    data: { displayOrder: newDisplayOrder }
                });
            } else {
                console.log(`⚠️ Pas d'ordre défini pour: Secteur "${sector.name}" (${sectorId}) du site "${sector.site?.name}" (${siteId})`);
            }
        }

        // 3. Vérifier les mises à jour
        const updatedSectors = await prisma.operatingSector.findMany({
            orderBy: [
                { siteId: 'asc' },
                { displayOrder: 'asc' },
                { name: 'asc' }
            ],
            include: { site: true }
        });

        console.log('\n📋 Résultat final:');
        updatedSectors.forEach(sector => {
            console.log(`- Site: ${sector.site?.name || 'Aucun'}, Secteur: ${sector.name}, displayOrder: ${sector.displayOrder}`);
        });

        console.log('\n✅ Mise à jour terminée avec succès!');

    } catch (error) {
        console.error('❌ Erreur lors de la mise à jour:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécuter la fonction principale
updateSectorDisplayOrder()
    .then(() => console.log('Script terminé'))
    .catch(e => console.error('Erreur fatale:', e)); 