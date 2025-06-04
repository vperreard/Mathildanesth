// prisma/seed-leaves-test.ts
// Script pour créer des congés test réalistes pour les MARS et IADES (juin-septembre 2025)

import { PrismaClient, ProfessionalRole, LeaveType, LeaveStatus } from '@prisma/client';

const prisma = new PrismaClient();

// Période des vacances d'été officielles
const SUMMER_VACATION_START = new Date('2025-07-04');
const SUMMER_VACATION_END = new Date('2025-08-31');

// Fonction utilitaire pour ajouter des jours à une date
function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

// Fonction utilitaire pour calculer les jours ouvrés entre deux dates
function calculateWorkingDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
        const dayOfWeek = current.getDay();
        // Compter seulement les jours de semaine (1-5 = lundi-vendredi)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    return count;
}

// Fonction pour générer une date aléatoire dans une plage
function getRandomDateInRange(start: Date, end: Date): Date {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const randomTime = startTime + Math.random() * (endTime - startTime);
    return new Date(randomTime);
}

// Fonction pour obtenir un administrateur pour approuver les congés
async function getApprover() {
    const admin = await prisma.user.findFirst({
        where: {
            role: {
                in: ['ADMIN_TOTAL', 'ADMIN_PARTIEL']
            }
        }
    });
    return admin;
}

// Données de congés prédéfinies pour chaque utilisateur
const leaveData = [
    // MARS - 3 semaines sur l'été en moyenne
    {
        nom: 'BEGHIN',
        prenom: 'Charles-Edward',
        leaves: [
            { startDate: '2025-07-07', endDate: '2025-07-25', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-16', endDate: '2025-06-20', type: 'ANNUAL', description: 'Long week-end de juin' }, // 1 semaine
            { startDate: '2025-09-08', endDate: '2025-09-09', type: 'RECOVERY', description: 'Récupération' }, // 2 jours
        ]
    },
    {
        nom: 'BITNER',
        prenom: 'Arnaud',
        leaves: [
            { startDate: '2025-07-14', endDate: '2025-08-01', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-02', endDate: '2025-06-06', type: 'ANNUAL', description: 'Congé début juin' }, // 1 semaine
            { startDate: '2025-09-22', endDate: '2025-09-24', type: 'TRAINING', description: 'Formation continue' }, // 3 jours
        ]
    },
    {
        nom: 'BRIEL',
        prenom: 'Anca',
        leaves: [
            { startDate: '2025-08-04', endDate: '2025-08-22', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-23', endDate: '2025-06-27', type: 'ANNUAL', description: 'Congé fin juin' }, // 1 semaine
            { startDate: '2025-09-15', endDate: '2025-09-16', type: 'SPECIAL', description: 'Congé personnel' }, // 2 jours
        ]
    },
    {
        nom: 'DEHEDIN',
        prenom: 'Bénédicte',
        leaves: [
            { startDate: '2025-07-21', endDate: '2025-08-08', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-09', endDate: '2025-06-13', type: 'ANNUAL', description: 'Congé juin' }, // 1 semaine
            { startDate: '2025-09-01', endDate: '2025-09-03', type: 'RECOVERY', description: 'Récupération de garde' }, // 3 jours
        ]
    },
    {
        nom: 'GIRARD',
        prenom: 'Emmanuel',
        leaves: [
            { startDate: '2025-07-28', endDate: '2025-08-15', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-30', endDate: '2025-07-04', type: 'ANNUAL', description: 'Pont juillet' }, // 1 semaine
            { startDate: '2025-09-29', endDate: '2025-09-30', type: 'RECOVERY', description: 'Récupération' }, // 2 jours
        ]
    },
    {
        nom: 'ELHOR',
        prenom: 'Mustapha',
        leaves: [
            { startDate: '2025-08-11', endDate: '2025-08-29', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-05', endDate: '2025-06-06', type: 'SPECIAL', description: 'Congé personnel' }, // 2 jours
            { startDate: '2025-09-11', endDate: '2025-09-12', type: 'TRAINING', description: 'Formation DPC' }, // 2 jours
        ]
    },
    {
        nom: 'ELIE',
        prenom: 'Thomas',
        leaves: [
            { startDate: '2025-07-07', endDate: '2025-07-25', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-19', endDate: '2025-06-20', type: 'ANNUAL', description: 'Long week-end' }, // 2 jours
            { startDate: '2025-09-04', endDate: '2025-09-05', type: 'RECOVERY', description: 'Récupération' }, // 2 jours
        ]
    },
    {
        nom: 'HATAHET',
        prenom: 'Ziad',
        leaves: [
            { startDate: '2025-08-04', endDate: '2025-08-22', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-12', endDate: '2025-06-13', type: 'SPECIAL', description: 'Congé familial' }, // 2 jours
            { startDate: '2025-09-18', endDate: '2025-09-19', type: 'TRAINING', description: 'Formation sécurité' }, // 2 jours
        ]
    },
    {
        nom: 'LACROIX',
        prenom: 'Boris', // MAR
        leaves: [
            { startDate: '2025-07-14', endDate: '2025-08-01', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-26', endDate: '2025-06-27', type: 'ANNUAL', description: 'Week-end prolongé' }, // 2 jours
            { startDate: '2025-09-25', endDate: '2025-09-26', type: 'SPECIAL', description: 'Congé personnel' }, // 2 jours
        ]
    },
    {
        nom: 'LAVABRE',
        prenom: 'Olivier',
        leaves: [
            { startDate: '2025-08-18', endDate: '2025-09-05', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-16', endDate: '2025-06-17', type: 'SPECIAL', description: 'Congé personnel' }, // 2 jours
            { startDate: '2025-09-22', endDate: '2025-09-23', type: 'RECOVERY', description: 'Récupération' }, // 2 jours
        ]
    },
    {
        nom: 'LOGEAY',
        prenom: 'Mathilde',
        leaves: [
            { startDate: '2025-07-21', endDate: '2025-08-08', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-09', endDate: '2025-06-13', type: 'ANNUAL', description: 'Congé juin' }, // 1 semaine
            { startDate: '2025-09-15', endDate: '2025-09-16', type: 'TRAINING', description: 'DPC anesthésie' }, // 2 jours
        ]
    },
    {
        nom: 'MAILHÉ',
        prenom: 'Alexandre',
        leaves: [
            { startDate: '2025-07-28', endDate: '2025-08-15', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-23', endDate: '2025-06-27', type: 'ANNUAL', description: 'Congé fin juin' }, // 1 semaine
            { startDate: '2025-09-11', endDate: '2025-09-12', type: 'TRAINING', description: 'Formation continue' }, // 2 jours
        ]
    },
    {
        nom: 'NAFEH',
        prenom: 'Samer',
        leaves: [
            { startDate: '2025-08-11', endDate: '2025-08-29', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-05', endDate: '2025-06-06', type: 'SPECIAL', description: 'Congé familial' }, // 2 jours
            { startDate: '2025-09-25', endDate: '2025-09-26', type: 'RECOVERY', description: 'Récupération garde' }, // 2 jours
        ]
    },
    {
        nom: 'SACUTO',
        prenom: 'Yann',
        leaves: [
            { startDate: '2025-07-07', endDate: '2025-07-25', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-12', endDate: '2025-06-13', type: 'ANNUAL', description: 'Pont juin' }, // 2 jours
            { startDate: '2025-09-08', endDate: '2025-09-10', type: 'TRAINING', description: 'Formation gestion' }, // 3 jours
        ]
    },

    // IADES - 3 semaines sur l'été en moyenne
    {
        nom: 'LACROIX',
        prenom: 'Alexandre', // IADE
        leaves: [
            { startDate: '2025-07-07', endDate: '2025-07-25', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-12', endDate: '2025-06-13', type: 'SPECIAL', description: 'Mariage ami' }, // 2 jours
            { startDate: '2025-09-04', endDate: '2025-09-05', type: 'RECOVERY', description: 'Récupération week-end' }, // 2 jours
        ]
    },
    {
        nom: 'PERREARD-LENFANT',
        prenom: 'Barbara',
        leaves: [
            { startDate: '2025-08-04', endDate: '2025-08-22', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-19', endDate: '2025-06-20', type: 'ANNUAL', description: 'Long week-end' }, // 2 jours
            { startDate: '2025-09-18', endDate: '2025-09-19', type: 'TRAINING', description: 'Congrès SFAR' }, // 2 jours
        ]
    },
    {
        nom: 'BORGNET',
        prenom: 'Guillaume',
        leaves: [
            { startDate: '2025-07-21', endDate: '2025-08-08', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-02', endDate: '2025-06-06', type: 'ANNUAL', description: 'Congé début juin' }, // 1 semaine
            { startDate: '2025-09-08', endDate: '2025-09-10', type: 'TRAINING', description: 'Formation échographie' }, // 3 jours
        ]
    },
    {
        nom: 'GICQUEL',
        prenom: 'Guillaume',
        leaves: [
            { startDate: '2025-08-18', endDate: '2025-09-05', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-16', endDate: '2025-06-17', type: 'SPECIAL', description: 'Congé personnel' }, // 2 jours
            { startDate: '2025-09-22', endDate: '2025-09-23', type: 'RECOVERY', description: 'Récupération' }, // 2 jours
        ]
    },
    {
        nom: 'LEGAY',
        prenom: 'Marlène',
        leaves: [
            { startDate: '2025-07-28', endDate: '2025-08-15', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-09', endDate: '2025-06-13', type: 'ANNUAL', description: 'Congé juin' }, // 1 semaine
            { startDate: '2025-09-15', endDate: '2025-09-16', type: 'TRAINING', description: 'DPC anesthésie' }, // 2 jours
        ]
    },
    {
        nom: 'JOMOTTE',
        prenom: 'Morgane',
        leaves: [
            { startDate: '2025-07-14', endDate: '2025-08-01', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-23', endDate: '2025-06-27', type: 'ANNUAL', description: 'Congé fin juin' }, // 1 semaine
            { startDate: '2025-09-11', endDate: '2025-09-12', type: 'TRAINING', description: 'Formation continue' }, // 2 jours
        ]
    },
    {
        nom: 'LAMAS',
        prenom: 'Nathalie',
        leaves: [
            { startDate: '2025-08-11', endDate: '2025-08-29', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-05', endDate: '2025-06-06', type: 'SPECIAL', description: 'Congé familial' }, // 2 jours
            { startDate: '2025-09-25', endDate: '2025-09-26', type: 'RECOVERY', description: 'Récupération garde' }, // 2 jours
        ]
    },
    {
        nom: 'BOY',
        prenom: 'Vincent',
        leaves: [
            { startDate: '2025-07-21', endDate: '2025-08-08', type: 'ANNUAL', description: 'Vacances d\'été principales' }, // 3 semaines
            { startDate: '2025-06-12', endDate: '2025-06-13', type: 'ANNUAL', description: 'Pont juin' }, // 2 jours
            { startDate: '2025-09-08', endDate: '2025-09-10', type: 'TRAINING', description: 'Formation gestion' }, // 3 jours
        ]
    },
];

async function seedLeaves() {
    console.log('🌱 Début du seed des congés test...');

    // Obtenir un approbateur
    const approver = await getApprover();
    if (!approver) {
        console.error('❌ Aucun administrateur trouvé pour approuver les congés');
        return;
    }

    console.log(`👤 Approbateur sélectionné: ${approver.prenom} ${approver.nom}`);

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const userData of leaveData) {
        try {
            // Trouver l'utilisateur par nom ET prénom pour éviter les conflits
            const user = await prisma.user.findFirst({
                where: {
                    nom: userData.nom,
                    prenom: userData.prenom
                }
            });

            if (!user) {
                console.warn(`⚠️  Utilisateur ${userData.prenom} ${userData.nom} non trouvé`);
                continue;
            }

            console.log(`\n👤 Traitement des congés pour ${user.prenom} ${user.nom} (${user.professionalRole})`);

            for (const leaveInfo of userData.leaves) {
                const startDate = new Date(leaveInfo.startDate);
                const endDate = new Date(leaveInfo.endDate);
                const countedDays = calculateWorkingDays(startDate, endDate);

                // Vérifier si le congé existe déjà
                const existingLeave = await prisma.leave.findFirst({
                    where: {
                        userId: user.id,
                        startDate: startDate,
                        endDate: endDate
                    }
                });

                if (existingLeave) {
                    console.log(`   ⏭️  Congé du ${leaveInfo.startDate} au ${leaveInfo.endDate} déjà existant`);
                    totalSkipped++;
                    continue;
                }

                // Créer le congé
                await prisma.leave.create({
                    data: {
                        userId: user.id,
                        startDate: startDate,
                        endDate: endDate,
                        typeCode: leaveInfo.type,
                        type: leaveInfo.type as LeaveType,
                        status: LeaveStatus.APPROVED, // Congés validés par défaut
                        reason: leaveInfo.description,
                        comment: `Congé test généré automatiquement - ${leaveInfo.description}`,
                        requestDate: new Date(),
                        approvalDate: new Date(),
                        approvedById: approver.id,
                        countedDays: countedDays,
                        calculationDetails: {
                            method: 'WEEKDAYS_IF_WORKING',
                            startDate: startDate.toISOString(),
                            endDate: endDate.toISOString(),
                            totalDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1,
                            weekendDays: Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 - countedDays,
                            workingDays: countedDays
                        }
                    }
                });

                console.log(`   ✅ Congé créé: ${leaveInfo.startDate} au ${leaveInfo.endDate} (${countedDays} jours) - ${leaveInfo.description}`);
                totalCreated++;
            }
        } catch (error) {
            console.error(`❌ Erreur lors de la création des congés pour ${userData.prenom} ${userData.nom}:`, error);
        }
    }

    console.log(`\n📊 Résumé:`);
    console.log(`   ✅ Congés créés: ${totalCreated}`);
    console.log(`   ⏭️  Congés ignorés (déjà existants): ${totalSkipped}`);
    console.log(`   📅 Période couverte: juin - septembre 2025`);
    console.log(`   🏖️  Vacances officielles: 4 juillet - 31 août 2025`);
}

async function main() {
    try {
        await seedLeaves();
        console.log('\n🎉 Seed des congés test terminé avec succès !');
    } catch (error) {
        console.error('❌ Erreur lors du seed des congés test:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Exécution du script
main(); 