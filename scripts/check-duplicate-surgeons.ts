import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDuplicateSurgeons() {
    try {
        console.log('🔍 Recherche des chirurgiens en double...\n');

        // Récupérer tous les chirurgiens avec leurs relations
        const allSurgeons = await prisma.surgeon.findMany({
            include: {
                specialties: true,
                sites: true,
                user: true
            },
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' }
            ]
        });

        // Grouper par nom + prénom pour identifier les doublons
        const surgeonGroups = new Map<string, typeof allSurgeons>();
        
        allSurgeons.forEach(surgeon => {
            const key = `${surgeon.nom?.toLowerCase()}_${surgeon.prenom?.toLowerCase()}`;
            if (!surgeonGroups.has(key)) {
                surgeonGroups.set(key, []);
            }
            surgeonGroups.get(key)!.push(surgeon);
        });

        // Identifier les groupes avec des doublons
        const duplicates = Array.from(surgeonGroups.entries())
            .filter(([_, surgeons]) => surgeons.length > 1)
            .map(([key, surgeons]) => ({ key, surgeons }));

        if (duplicates.length === 0) {
            console.log('✅ Aucun doublon trouvé !');
            return;
        }

        console.log(`⚠️  ${duplicates.length} groupe(s) de doublons trouvé(s):\n`);

        // Afficher les détails de chaque groupe de doublons
        for (const { key, surgeons } of duplicates) {
            console.log(`\n📋 Groupe: ${surgeons[0].prenom} ${surgeons[0].nom}`);
            console.log('─'.repeat(50));
            
            surgeons.forEach((surgeon, index) => {
                console.log(`\n  ${index + 1}. ID: ${surgeon.id}`);
                console.log(`     Statut: ${surgeon.status}`);
                console.log(`     Email: ${surgeon.email || 'Non défini'}`);
                console.log(`     Téléphone: ${surgeon.phoneNumber || 'Non défini'}`);
                console.log(`     Utilisateur lié: ${surgeon.userId ? `Oui (ID: ${surgeon.userId})` : 'Non'}`);
                console.log(`     Spécialités: ${surgeon.specialties.map(s => s.name).join(', ') || 'Aucune'}`);
                console.log(`     Sites: ${surgeon.sites.map(s => s.name).join(', ') || 'Aucun'}`);
                console.log(`     Créé le: ${surgeon.createdAt ? new Date(surgeon.createdAt).toLocaleDateString('fr-FR') : 'Non défini'}`);
                console.log(`     Modifié le: ${surgeon.updatedAt ? new Date(surgeon.updatedAt).toLocaleDateString('fr-FR') : 'Non défini'}`);
            });

            // Recommandation
            console.log('\n  💡 Recommandation:');
            const hasUserLinked = surgeons.some(s => s.userId !== null);
            const activeSurgeon = surgeons.find(s => s.status === 'ACTIF');
            const surgeonWithMostData = surgeons.reduce((prev, current) => {
                const prevScore = (prev.specialties.length * 2) + prev.sites.length + (prev.userId ? 5 : 0);
                const currentScore = (current.specialties.length * 2) + current.sites.length + (current.userId ? 5 : 0);
                return currentScore > prevScore ? current : prev;
            });

            if (hasUserLinked) {
                const linkedSurgeon = surgeons.find(s => s.userId !== null)!;
                console.log(`     Conserver le chirurgien ID ${linkedSurgeon.id} (lié à un utilisateur)`);
            } else if (activeSurgeon) {
                console.log(`     Conserver le chirurgien ID ${activeSurgeon.id} (statut ACTIF)`);
            } else {
                console.log(`     Conserver le chirurgien ID ${surgeonWithMostData.id} (plus de données)`);
            }
        }

        console.log('\n\n📝 Pour supprimer les doublons, utilisez le script:');
        console.log('   npm run cleanup:surgeons');
        console.log('\n⚠️  ATTENTION: Vérifiez bien les données avant de supprimer !');

    } catch (error) {
        console.error('❌ Erreur lors de la vérification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Fonction pour nettoyer les doublons (à utiliser avec précaution)
async function cleanupDuplicateSurgeons(dryRun = true) {
    try {
        console.log(dryRun ? '🔍 Mode simulation (dry run)...\n' : '🗑️  Suppression des doublons...\n');

        const allSurgeons = await prisma.surgeon.findMany({
            include: {
                specialties: true,
                sites: true,
                user: true
            },
            orderBy: [
                { nom: 'asc' },
                { prenom: 'asc' }
            ]
        });

        const surgeonGroups = new Map<string, typeof allSurgeons>();
        
        allSurgeons.forEach(surgeon => {
            const key = `${surgeon.nom?.toLowerCase()}_${surgeon.prenom?.toLowerCase()}`;
            if (!surgeonGroups.has(key)) {
                surgeonGroups.set(key, []);
            }
            surgeonGroups.get(key)!.push(surgeon);
        });

        const duplicates = Array.from(surgeonGroups.entries())
            .filter(([_, surgeons]) => surgeons.length > 1);

        let totalDeleted = 0;

        for (const [key, surgeons] of duplicates) {
            // Trier pour garder le meilleur candidat
            const sorted = surgeons.sort((a, b) => {
                // Priorité 1: Lié à un utilisateur
                if (a.userId && !b.userId) return -1;
                if (!a.userId && b.userId) return 1;
                
                // Priorité 2: Statut ACTIF
                if (a.status === 'ACTIF' && b.status !== 'ACTIF') return -1;
                if (a.status !== 'ACTIF' && b.status === 'ACTIF') return 1;
                
                // Priorité 3: Plus de données (spécialités + sites)
                const scoreA = a.specialties.length + a.sites.length;
                const scoreB = b.specialties.length + b.sites.length;
                if (scoreA !== scoreB) return scoreB - scoreA;
                
                // Priorité 4: Date de création (plus ancien)
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
            });

            const toKeep = sorted[0];
            const toDelete = sorted.slice(1);

            console.log(`\n📋 ${toKeep.prenom} ${toKeep.nom}`);
            console.log(`   ✅ Garder: ID ${toKeep.id}`);
            
            for (const surgeon of toDelete) {
                console.log(`   ❌ Supprimer: ID ${surgeon.id}`);
                
                if (!dryRun) {
                    // Fusionner les données avant de supprimer
                    const sitesToAdd = surgeon.sites.filter(
                        site => !toKeep.sites.some(s => s.id === site.id)
                    );
                    const specialtiesToAdd = surgeon.specialties.filter(
                        spec => !toKeep.specialties.some(s => s.id === spec.id)
                    );

                    if (sitesToAdd.length > 0 || specialtiesToAdd.length > 0) {
                        await prisma.surgeon.update({
                            where: { id: toKeep.id },
                            data: {
                                sites: {
                                    connect: sitesToAdd.map(s => ({ id: s.id }))
                                },
                                specialties: {
                                    connect: specialtiesToAdd.map(s => ({ id: s.id }))
                                }
                            }
                        });
                        console.log(`   📎 Fusionné: ${sitesToAdd.length} sites, ${specialtiesToAdd.length} spécialités`);
                    }

                    // Supprimer le doublon
                    await prisma.surgeon.delete({
                        where: { id: surgeon.id }
                    });
                    totalDeleted++;
                }
            }
        }

        console.log(`\n✅ ${dryRun ? 'Simulation terminée' : 'Nettoyage terminé'}`);
        console.log(`   ${totalDeleted} chirurgien(s) ${dryRun ? 'à supprimer' : 'supprimé(s)'}`);

        if (dryRun) {
            console.log('\n💡 Pour exécuter réellement la suppression, ajoutez --execute');
        }

    } catch (error) {
        console.error('❌ Erreur lors du nettoyage:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécution selon les arguments
const args = process.argv.slice(2);
if (args.includes('--cleanup')) {
    const execute = args.includes('--execute');
    cleanupDuplicateSurgeons(!execute);
} else {
    checkDuplicateSurgeons();
}