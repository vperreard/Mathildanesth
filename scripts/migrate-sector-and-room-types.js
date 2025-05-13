/**
 * Ce script analyse les secteurs et salles existants pour leur attribuer automatiquement
 * une catégorie ou un type approprié en fonction de règles prédéfinies.
 */

// Charger les variables d'environnement
require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateSectorCategories() {
    console.log('🏥 Migration des catégories de secteurs...');

    // Récupérer tous les secteurs
    const sectors = await prisma.operatingSector.findMany();
    console.log(`Trouvé ${sectors.length} secteurs à analyser`);

    // Compteurs pour le rapport final
    let updated = 0;
    let unchanged = 0;

    for (const sector of sectors) {
        const name = sector.name.toLowerCase();
        let category = 'STANDARD'; // Valeur par défaut

        // Règles de détection basées sur le nom
        if (name.includes('endoscopie') || name.includes('endo')) {
            category = 'ENDOSCOPIE';
        } else if (name.includes('ophtalmo') || name.includes('ophtalmologie')) {
            category = 'OPHTALMOLOGIE';
        } else if (name.includes('hyperaseptique') || name.includes('hyper aseptique')) {
            category = 'HYPERASEPTIQUE';
        }

        // Si la catégorie est déjà définie et correcte, on ne fait rien
        if (sector.category === category) {
            unchanged++;
            continue;
        }

        // Mettre à jour la catégorie du secteur
        await prisma.operatingSector.update({
            where: { id: sector.id },
            data: { category }
        });

        console.log(`✅ Secteur "${sector.name}" (ID: ${sector.id}) assigné à la catégorie: ${category}`);
        updated++;
    }

    console.log(`\n📊 Rapport de migration des secteurs:`);
    console.log(`- ${updated} secteurs mis à jour`);
    console.log(`- ${unchanged} secteurs inchangés (déjà correctement catégorisés)`);
}

async function migrateRoomTypes() {
    console.log('\n🏥 Migration des types de salles...');

    // Récupérer toutes les salles
    const rooms = await prisma.operatingRoom.findMany({
        include: { sector: true }
    });
    console.log(`Trouvé ${rooms.length} salles à analyser`);

    // Compteurs pour le rapport final
    let updated = 0;
    let unchanged = 0;

    for (const room of rooms) {
        const name = room.name.toLowerCase();
        const number = (room.number || '').toLowerCase();
        let type = 'STANDARD'; // Valeur par défaut

        // Règles de détection basées sur le nom ou le numéro
        if (name.includes('fiv') || number.includes('fiv')) {
            type = 'FIV';
        } else if (name.includes('consult') || number.includes('cs')) {
            type = 'CONSULTATION';
        } else if (room.sector && room.sector.category === 'ENDOSCOPIE') {
            // Si la salle est dans un secteur d'endoscopie, on peut lui assigner un type spécial
            // Pour l'instant on reste sur STANDARD, mais on pourrait créer un type ENDOSCOPIE
        }

        // Si le type est déjà défini et correct, on ne fait rien
        if (room.type === type) {
            unchanged++;
            continue;
        }

        // Mettre à jour le type de la salle
        await prisma.operatingRoom.update({
            where: { id: room.id },
            data: { type }
        });

        console.log(`✅ Salle "${room.name}" (ID: ${room.id}) assignée au type: ${type}`);
        updated++;
    }

    console.log(`\n📊 Rapport de migration des salles:`);
    console.log(`- ${updated} salles mises à jour`);
    console.log(`- ${unchanged} salles inchangées (déjà correctement typées)`);
}

async function main() {
    console.log('🚀 Début de la migration des catégories et types...');

    try {
        await migrateSectorCategories();
        await migrateRoomTypes();

        console.log('\n✅ Migration terminée avec succès!');
    } catch (error) {
        console.error('❌ Erreur lors de la migration:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main(); 