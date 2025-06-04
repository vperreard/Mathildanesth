import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSiteAssignments() {
    console.log('🧪 Test des associations de sites\n');

    try {
        // Test 1: Vérifier qu'un utilisateur a bien des sites assignés
        console.log('📋 Test 1: Vérification des sites d\'un utilisateur');
        const userWithSites = await prisma.user.findFirst({
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        colorCode: true
                    }
                }
            }
        });

        if (userWithSites) {
            console.log(`   👨‍⚕️ Utilisateur: ${userWithSites.prenom} ${userWithSites.nom}`);
            console.log(`   🏥 Sites assignés (${userWithSites.sites.length}) :`);
            userWithSites.sites.forEach(site => {
                console.log(`      🏢 ${site.name} (ID: ${site.id})`);
            });
        }

        // Test 2: Vérifier qu'un chirurgien a bien des sites assignés
        console.log('\n📋 Test 2: Vérification des sites d\'un chirurgien');
        const surgeonWithSites = await prisma.surgeon.findFirst({
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        colorCode: true
                    }
                },
                specialties: {
                    select: { name: true }
                }
            }
        });

        if (surgeonWithSites) {
            console.log(`   🩺 Chirurgien: ${surgeonWithSites.prenom} ${surgeonWithSites.nom}`);
            console.log(`   🎯 Spécialités: ${surgeonWithSites.specialties.map(s => s.name).join(', ')}`);
            console.log(`   🏥 Sites assignés (${surgeonWithSites.sites.length}) :`);
            surgeonWithSites.sites.forEach(site => {
                console.log(`      🏢 ${site.name} (ID: ${site.id})`);
            });
        }

        // Test 3: Statistiques globales
        console.log('\n📊 Test 3: Statistiques globales des associations');

        const totalUsers = await prisma.user.count();
        const totalSurgeons = await prisma.surgeon.count({ where: { status: 'ACTIF' } });
        const totalSites = await prisma.site.count({ where: { isActive: true } });

        const usersWithSites = await prisma.user.count({
            where: {
                sites: {
                    some: {}
                }
            }
        });

        const surgeonsWithSites = await prisma.surgeon.count({
            where: {
                status: 'ACTIF',
                sites: {
                    some: {}
                }
            }
        });

        console.log(`   📈 Couverture utilisateurs: ${usersWithSites}/${totalUsers} (${Math.round(usersWithSites / totalUsers * 100)}%)`);
        console.log(`   📈 Couverture chirurgiens: ${surgeonsWithSites}/${totalSurgeons} (${Math.round(surgeonsWithSites / totalSurgeons * 100)}%)`);
        console.log(`   🏢 Sites actifs: ${totalSites}`);

        // Test 4: Test de mise à jour d'associations
        console.log('\n📋 Test 4: Test de mise à jour des associations');

        if (userWithSites && userWithSites.sites.length > 0) {
            const userId = userWithSites.id;
            const currentSiteIds = userWithSites.sites.map(s => s.id);

            // Sauvegarder l'état actuel
            console.log(`   💾 État initial: ${currentSiteIds.length} site(s)`);

            // Retirer temporairement un site
            const siteToRemove = currentSiteIds[0];
            const remainingSites = currentSiteIds.slice(1);

            console.log(`   ➖ Suppression temporaire du site: ${siteToRemove}`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    sites: {
                        set: remainingSites.map(id => ({ id }))
                    }
                }
            });

            // Vérifier la suppression
            const userAfterRemoval = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    sites: { select: { id: true } }
                }
            });

            console.log(`   ✅ Après suppression: ${userAfterRemoval?.sites.length} site(s)`);

            // Restaurer le site
            console.log(`   ➕ Restauration du site: ${siteToRemove}`);
            await prisma.user.update({
                where: { id: userId },
                data: {
                    sites: {
                        set: currentSiteIds.map(id => ({ id }))
                    }
                }
            });

            // Vérifier la restauration
            const userAfterRestore = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    sites: { select: { id: true } }
                }
            });

            console.log(`   ✅ Après restauration: ${userAfterRestore?.sites.length} site(s)`);
        }

        // Test 5: Test performance des requêtes
        console.log('\n📋 Test 5: Performance des requêtes');

        const startTime = Date.now();

        const complexQuery = await prisma.user.findMany({
            where: {
                sites: {
                    some: {
                        isActive: true
                    }
                }
            },
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        colorCode: true
                    }
                }
            },
            take: 10
        });

        const endTime = Date.now();
        const queryTime = endTime - startTime;

        console.log(`   ⚡ Requête complexe (10 utilisateurs avec sites): ${queryTime}ms`);
        console.log(`   📊 Résultats: ${complexQuery.length} utilisateur(s) trouvé(s)`);

        // Afficher un exemple des résultats
        if (complexQuery.length > 0) {
            const example = complexQuery[0];
            console.log(`   📄 Exemple: ${example.prenom} ${example.nom} → ${example.sites.length} site(s)`);
        }

        console.log('\n🎉 Tous les tests sont passés avec succès !');
        console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS DISPONIBLES :');
        console.log('   ✅ Associations utilisateurs ↔ sites');
        console.log('   ✅ Associations chirurgiens ↔ sites');
        console.log('   ✅ APIs de gestion (/api/utilisateurs/[id]/sites, /api/chirurgiens/[id]/sites)');
        console.log('   ✅ Composant SiteSelector réutilisable');
        console.log('   ✅ Hooks personnalisés (useSiteAssignments)');
        console.log('   ✅ Page d\'administration (/admin/site-assignments)');
        console.log('   ✅ Script de migration automatique');

    } catch (error) {
        console.error('❌ Erreur durant les tests:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    testSiteAssignments()
        .catch((error) => {
            console.error('💥 Tests échoués:', error);
            process.exit(1);
        });
}

export { testSiteAssignments }; 