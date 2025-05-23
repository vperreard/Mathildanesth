/**
 * Exemple d'utilisation du modèle Assignment pour les consultations
 * 
 * Ce fichier montre comment utiliser le modèle Assignment pour gérer les consultations
 * médicales avec des créneaux matin/après-midi, sans nécessairement avoir un lieu physique.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function exempleGestionConsultations() {
    try {
        // 1. Créer une activité de type CONSULTATION
        const activiteConsultation = await prisma.activityType.create({
            data: {
                name: 'Consultation Anesthésie',
                code: 'CONSULT_ANESTH',
                description: 'Consultations d\'anesthésie pré-opératoires',
                category: 'CONSULTATION',
                color: '#4B9CD3',
                icon: 'CalendarIcon',
                isActive: true,
                defaultPeriod: 'MATIN',  // Période par défaut (peut être changée)
                defaultDurationHours: 4.0
            }
        });

        console.log('Activité de consultation créée:', activiteConsultation);

        // 2. Créer des affectations de consultation pour plusieurs médecins sur le même créneau
        const date = new Date('2025-05-25T00:00:00.000Z');  // Date pour les consultations

        // Créer 3 consultations pour 3 médecins différents sur le même créneau du matin
        const consultationsMatin = await Promise.all([1, 2, 3].map(userId =>
            prisma.assignment.create({
                data: {
                    date,
                    userId,
                    type: 'CONSULTATION',
                    period: 'MATIN',
                    notes: `Consultation programmée pour l'utilisateur ${userId}`,
                    heureDebut: '08:30',
                    heureFin: '12:30',
                    statut: 'PREVU'
                }
            })
        ));

        console.log(`${consultationsMatin.length} consultations du matin créées`);

        // Créer 2 consultations pour 2 médecins différents sur le même créneau de l'après-midi
        const consultationsApresMidi = await Promise.all([4, 5].map(userId =>
            prisma.assignment.create({
                data: {
                    date,
                    userId,
                    type: 'CONSULTATION',
                    period: 'APRES_MIDI',
                    notes: `Consultation programmée pour l'utilisateur ${userId}`,
                    heureDebut: '13:30',
                    heureFin: '17:30',
                    statut: 'PREVU'
                }
            })
        ));

        console.log(`${consultationsApresMidi.length} consultations de l'après-midi créées`);

        // 3. Récupérer toutes les consultations pour une date donnée
        const toutesConsultations = await prisma.assignment.findMany({
            where: {
                date,
                type: 'CONSULTATION'
            },
            include: {
                user: true
            },
            orderBy: {
                period: 'asc'
            }
        });

        console.log('Toutes les consultations pour la date:', toutesConsultations.length);

        // 4. Regrouper les consultations par période (matin/après-midi)
        const consultationsParPeriode = toutesConsultations.reduce((acc, curr) => {
            const periode = curr.period || 'NON_SPECIFIE';
            if (!acc[periode]) acc[periode] = [];
            acc[periode].push(curr);
            return acc;
        }, {});

        console.log('Consultations par période:');
        Object.keys(consultationsParPeriode).forEach(periode => {
            console.log(`- ${periode}: ${consultationsParPeriode[periode].length} consultations`);
        });

        return {
            activiteConsultation,
            consultationsMatin,
            consultationsApresMidi,
            toutesConsultations,
            consultationsParPeriode
        };

    } catch (error) {
        console.error('Erreur lors de la gestion des consultations:', error);
        throw error;
    }
}

// Fonction pour vérifier si un utilisateur a une consultation à une date et période donnée
async function utilisateurAConsultation(userId, date, period) {
    const consultation = await prisma.assignment.findFirst({
        where: {
            userId,
            date,
            type: 'CONSULTATION',
            period
        }
    });

    return !!consultation;
}

// Fonction pour obtenir le nombre de consultations par période
async function nombreConsultationsParPeriode(date) {
    const stats = await prisma.assignment.groupBy({
        by: ['period'],
        where: {
            date,
            type: 'CONSULTATION'
        },
        _count: {
            id: true
        }
    });

    return stats.reduce((acc, stat) => {
        if (stat.period) {
            acc[stat.period] = stat._count.id;
        }
        return acc;
    }, {});
}

// Pour exécuter l'exemple
if (require.main === module) {
    exempleGestionConsultations()
        .then(result => {
            console.log('Exemple terminé avec succès');
        })
        .catch(err => {
            console.error('Erreur dans l\'exemple:', err);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}

module.exports = {
    exempleGestionConsultations,
    utilisateurAConsultation,
    nombreConsultationsParPeriode
}; 