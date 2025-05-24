import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyData() {
    console.log('🔍 Vérification des données importées\n');

    try {
        // Vérification des spécialités
        const specialties = await prisma.specialty.findMany({
            orderBy: { name: 'asc' }
        });

        console.log(`🏥 Spécialités (${specialties.length}) :`);
        specialties.forEach(s => {
            const pediatric = s.isPediatric ? '👶' : '🧑';
            console.log(`   ${pediatric} ${s.name} (ID: ${s.id})`);
        });

        // Vérification des chirurgiens
        const surgeons = await prisma.surgeon.findMany({
            include: {
                specialties: true
            },
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' }
            ]
        });

        console.log(`\n👨‍⚕️ Chirurgiens (${surgeons.length}) :`);
        surgeons.slice(0, 10).forEach(s => {
            const specialtyNames = s.specialties.map(spec => spec.name).join(', ');
            console.log(`   ✅ ${s.prenom} ${s.nom} - ${specialtyNames || 'Aucune spécialité'}`);
        });

        if (surgeons.length > 10) {
            console.log(`   ... et ${surgeons.length - 10} autres chirurgiens`);
        }

        // Statistiques par spécialité
        const specialtyStats = await prisma.specialty.findMany({
            include: {
                _count: {
                    select: { surgeons: true }
                }
            },
            orderBy: { name: 'asc' }
        });

        console.log(`\n📊 Statistiques par spécialité :`);
        specialtyStats.forEach(s => {
            if (s._count.surgeons > 0) {
                console.log(`   🏥 ${s.name}: ${s._count.surgeons} chirurgien(s)`);
            }
        });

        // Sites et salles
        const sites = await prisma.site.findMany();
        const operatingSectors = await prisma.operatingSector.findMany();
        const operatingRooms = await prisma.operatingRoom.findMany();

        console.log(`\n🏢 Sites et salles :`);
        sites.forEach(site => {
            const siteSectors = operatingSectors.filter(sector => sector.siteId === site.id);
            const totalRooms = operatingRooms.filter(room => room.siteId === site.id).length;
            console.log(`   🏥 ${site.name}: ${siteSectors.length} secteur(s), ${totalRooms} salle(s)`);
        });

        console.log(`\n🎉 Vérification terminée avec succès !`);
        console.log(`   📈 Total en base :`);
        console.log(`     - ${specialties.length} spécialités`);
        console.log(`     - ${surgeons.length} chirurgiens`);
        console.log(`     - ${sites.length} sites`);
        console.log(`     - ${operatingSectors.length} secteurs opératoires`);
        console.log(`     - ${operatingRooms.length} salles d'opération`);

    } catch (error) {
        console.error('❌ Erreur durant la vérification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyData(); 