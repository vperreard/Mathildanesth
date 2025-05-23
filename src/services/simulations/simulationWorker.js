// Worker pour le traitement parallèle des simulations
const workerpool = require('workerpool');

/**
 * Traite un segment de simulation
 * @param {Object} params Les paramètres de la tranche de simulation
 */
function processSimulationChunk(params) {
    console.log(`Worker: Traitement de la période du ${params.startDate} au ${params.endDate}`);

    // Simuler un délai de traitement
    return new Promise((resolve) => {
        setTimeout(() => {
            const startDate = new Date(params.startDate);
            const endDate = new Date(params.endDate);
            const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

            // Génération de résultats de simulation factices pour cette période
            const result = {
                simulatedPeriod: {
                    from: params.startDate,
                    to: params.endDate,
                    totalDays: days
                },
                staffingCoverage: {
                    overall: Math.floor(Math.random() * 10) + 85, // 85-95%
                    byDay: generateDailyStaffingCoverage(startDate, days)
                },
                leaveRequests: {
                    totalRequested: Math.floor(Math.random() * 10) + 5,
                    approved: Math.floor(Math.random() * 7) + 3,
                    rejected: Math.floor(Math.random() * 3),
                    approvalRate: Math.floor(Math.random() * 20) + 70 // 70-90%
                },
                shiftDistribution: generateShiftDistribution(),
                conflicts: {
                    total: Math.floor(Math.random() * 5) + 1,
                    byPriority: {
                        high: Math.floor(Math.random() * 2),
                        medium: Math.floor(Math.random() * 2) + 1,
                        low: Math.floor(Math.random() * 2)
                    },
                    resolved: Math.floor(Math.random() * 3),
                    unresolved: Math.floor(Math.random() * 2)
                }
            };

            console.log(`Worker: Traitement terminé pour la période du ${params.startDate} au ${params.endDate}`);
            resolve(result);
        }, 1000);
    });
}

/**
 * Génère les données de couverture quotidienne
 * @param {Date} startDate Date de début
 * @param {number} days Nombre de jours
 */
function generateDailyStaffingCoverage(startDate, days) {
    const coverage = [];
    const date = new Date(startDate);

    for (let i = 0; i < days; i++) {
        const dayOfWeek = date.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        coverage.push({
            date: new Date(date).toISOString().split('T')[0],
            coverage: isWeekend ?
                Math.floor(Math.random() * 15) + 75 : // 75-90% pour les weekends
                Math.floor(Math.random() * 15) + 85, // 85-100% pour les jours de semaine
            required: isWeekend ? 5 : 10,
            actual: isWeekend ? 4 : 9
        });

        date.setDate(date.getDate() + 1);
    }

    return coverage;
}

/**
 * Génère la distribution des postes
 */
function generateShiftDistribution() {
    const users = [
        'Sophie Martin',
        'Thomas Bernard',
        'Marie Dupont',
        'François Leroy',
        'Camille Dubois'
    ];

    return users.map(user => ({
        userName: user,
        morningShifts: Math.floor(Math.random() * 3) + 1,
        afternoonShifts: Math.floor(Math.random() * 3) + 1,
        nightShifts: Math.floor(Math.random() * 2),
        weekendShifts: Math.floor(Math.random() * 1),
        totalHours: Math.floor(Math.random() * 20) + 10
    }));
}

// Créer un worker et enregistrer la fonction pubblique
workerpool.worker({
    processSimulationChunk
}); 