import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignDefaultSites() {
    console.log('🏥 Association par défaut des sites aux utilisateurs et chirurgiens\n');

    try {
        // Récupérer tous les sites actifs
        const sites = await prisma.site.findMany({
            where: { isActive: true },
            select: { id: true, name: true }
        });

        if (sites.length === 0) {
            console.log('❌ Aucun site actif trouvé dans la base de données');
            return;
        }

        console.log(`📋 ${sites.length} site(s) actif(s) trouvé(s) :`);
        sites.forEach(site => {
            console.log(`   🏢 ${site.name} (ID: ${site.id})`);
        });

        const allSiteIds = sites.map(site => site.id);

        // Traiter les utilisateurs
        console.log('\n👨‍⚕️ Association des utilisateurs aux sites...');

        const users = await prisma.user.findMany({
            include: {
                sites: { select: { id: true } }
            }
        });

        console.log(`📊 ${users.length} utilisateur(s) trouvé(s)`);

        let usersUpdated = 0;
        let usersAlreadyAssigned = 0;

        for (const user of users) {
            const currentSiteIds = user.sites.map(site => site.id);

            // Si l'utilisateur n'a aucun site assigné, lui assigner tous les sites
            if (currentSiteIds.length === 0) {
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        sites: {
                            connect: allSiteIds.map(siteId => ({ id: siteId }))
                        }
                    }
                });

                usersUpdated++;
                console.log(`   ✅ ${user.prenom} ${user.nom} - assigné à ${allSiteIds.length} site(s)`);
            } else {
                usersAlreadyAssigned++;
                console.log(`   ⏭️  ${user.prenom} ${user.nom} - déjà assigné à ${currentSiteIds.length} site(s)`);
            }
        }

        // Traiter les chirurgiens
        console.log('\n🩺 Association des chirurgiens aux sites...');

        const surgeons = await prisma.surgeon.findMany({
            where: { status: 'ACTIF' },
            include: {
                sites: { select: { id: true } },
                specialties: { select: { name: true } }
            }
        });

        console.log(`📊 ${surgeons.length} chirurgien(s) actif(s) trouvé(s)`);

        let surgeonsUpdated = 0;
        let surgeonsAlreadyAssigned = 0;

        for (const surgeon of surgeons) {
            const currentSiteIds = surgeon.sites.map(site => site.id);

            // Si le chirurgien n'a aucun site assigné, lui assigner tous les sites
            if (currentSiteIds.length === 0) {
                await prisma.surgeon.update({
                    where: { id: surgeon.id },
                    data: {
                        sites: {
                            connect: allSiteIds.map(siteId => ({ id: siteId }))
                        }
                    }
                });

                surgeonsUpdated++;
                const specialtyNames = surgeon.specialties.map(s => s.name).join(', ');
                console.log(`   ✅ ${surgeon.prenom} ${surgeon.nom} (${specialtyNames}) - assigné à ${allSiteIds.length} site(s)`);
            } else {
                surgeonsAlreadyAssigned++;
                console.log(`   ⏭️  ${surgeon.prenom} ${surgeon.nom} - déjà assigné à ${currentSiteIds.length} site(s)`);
            }
        }

        // Résumé final
        console.log('\n📊 RÉSUMÉ DE L\'ASSOCIATION :');
        console.log(`   🏢 Sites disponibles: ${sites.length}`);
        console.log(`   👨‍⚕️ Utilisateurs mis à jour: ${usersUpdated}/${users.length}`);
        console.log(`   🩺 Chirurgiens mis à jour: ${surgeonsUpdated}/${surgeons.length}`);
        console.log(`   ⏭️  Déjà assignés: ${usersAlreadyAssigned + surgeonsAlreadyAssigned}`);

        // Vérification finale
        console.log('\n🔍 Vérification des associations...');

        const usersWithSites = await prisma.user.findMany({
            include: {
                _count: { select: { sites: true } }
            }
        });

        const surgeonsWithSites = await prisma.surgeon.findMany({
            where: { status: 'ACTIF' },
            include: {
                _count: { select: { sites: true } }
            }
        });

        const usersWithoutSites = usersWithSites.filter(u => u._count.sites === 0);
        const surgeonsWithoutSites = surgeonsWithSites.filter(s => s._count.sites === 0);

        if (usersWithoutSites.length === 0 && surgeonsWithoutSites.length === 0) {
            console.log('   ✅ Tous les utilisateurs et chirurgiens sont assignés à au moins un site');
        } else {
            console.log(`   ⚠️  ${usersWithoutSites.length} utilisateur(s) et ${surgeonsWithoutSites.length} chirurgien(s) sans site`);
        }

        // Statistiques par site
        console.log('\n🏥 STATISTIQUES PAR SITE :');

        for (const site of sites) {
            const usersCount = await prisma.user.count({
                where: {
                    sites: { some: { id: site.id } }
                }
            });

            const surgeonsCount = await prisma.surgeon.count({
                where: {
                    status: 'ACTIF',
                    sites: { some: { id: site.id } }
                }
            });

            console.log(`   🏢 ${site.name}: ${usersCount} utilisateur(s), ${surgeonsCount} chirurgien(s)`);
        }

        console.log('\n🎉 Association terminée avec succès !');

    } catch (error) {
        console.error('❌ Erreur durant l\'association:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Option pour forcer la réassociation (même si déjà assigné)
async function forceAssignAllSites() {
    console.log('🔄 FORCE: Réassociation de TOUS les utilisateurs et chirurgiens à TOUS les sites\n');

    try {
        const sites = await prisma.site.findMany({
            where: { isActive: true },
            select: { id: true }
        });

        if (sites.length === 0) {
            console.log('❌ Aucun site actif trouvé');
            return;
        }

        const allSiteIds = sites.map(site => site.id);

        // Force update users
        const users = await prisma.user.findMany();

        for (const user of users) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    sites: {
                        set: allSiteIds.map(siteId => ({ id: siteId }))
                    }
                }
            });
        }

        // Force update surgeons
        const surgeons = await prisma.surgeon.findMany({
            where: { status: 'ACTIF' }
        });

        for (const surgeon of surgeons) {
            await prisma.surgeon.update({
                where: { id: surgeon.id },
                data: {
                    sites: {
                        set: allSiteIds.map(siteId => ({ id: siteId }))
                    }
                }
            });
        }

        console.log(`✅ ${users.length} utilisateurs et ${surgeons.length} chirurgiens forcés à tous les sites`);

    } catch (error) {
        console.error('❌ Erreur durant la réassociation forcée:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

// Point d'entrée du script
if (require.main === module) {
    const args = process.argv.slice(2);
    const forceMode = args.includes('--force');

    if (forceMode) {
        forceAssignAllSites()
            .catch((error) => {
                console.error('💥 Erreur fatale:', error);
                process.exit(1);
            });
    } else {
        assignDefaultSites()
            .catch((error) => {
                console.error('💥 Erreur fatale:', error);
                process.exit(1);
            });
    }
}

export { assignDefaultSites, forceAssignAllSites }; 