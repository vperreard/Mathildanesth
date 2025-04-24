import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
// import { Prisma } from '@prisma/client'; // Pas besoin d'importer Prisma ou LeaveStatus pour l'instant

// Placeholder pour le nombre total de jours de congé alloués par an
// TODO: Remplacer par une logique métier réelle (ex: basé sur le profil utilisateur, règles, etc.)
const TOTAL_ANNUAL_LEAVE_DAYS = 25;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        res.setHeader('Allow', ['GET']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { userId, year } = req.query;

    if (!userId || !year) {
        return res.status(400).json({ error: 'userId and year parameters are required' });
    }

    const userIdInt = parseInt(userId as string, 10);
    const targetYear = parseInt(year as string, 10);

    if (isNaN(userIdInt) || isNaN(targetYear)) {
        return res.status(400).json({ error: 'userId and year must be valid numbers' });
    }

    try {
        // Calculer les dates de début et de fin de l'année cible
        const startDate = new Date(targetYear, 0, 1); // 1er Janvier
        const endDate = new Date(targetYear, 11, 31, 23, 59, 59, 999); // 31 Décembre

        // Récupérer tous les congés approuvés de l'utilisateur qui chevauchent l'année cible
        // Note: Un congé peut chevaucher deux années. Ici, on compte tous les jours
        // des congés approuvés qui commencent ou finissent dans l'année.
        // Une logique plus fine pourrait être nécessaire pour proratiser.
        const approvedLeaves = await prisma.leave.findMany({
            where: {
                userId: userIdInt,
                status: 'APPROVED',
                // Prend les congés qui ont au moins un jour dans l'année cible
                OR: [
                    { // Commence dans l'année
                        startDate: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    { // Finit dans l'année
                        endDate: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                    { // Chevauche toute l'année
                        startDate: { lte: startDate },
                        endDate: { gte: endDate }
                    }
                ],
            },
        });

        // Sommer les jours comptés pour ces congés
        // TODO: Affiner la logique si un congé chevauche plusieurs années
        // Pour l'instant, on somme simplement les jours des congés touchant l'année.
        const usedDays = approvedLeaves.reduce((sum, leave) => sum + leave.countedDays, 0);

        const totalDays = TOTAL_ANNUAL_LEAVE_DAYS; // Utilisation du placeholder
        const remainingDays = totalDays - usedDays;

        return res.status(200).json({
            userId: userIdInt,
            year: targetYear,
            totalDays,
            usedDays,
            remainingDays,
            // leaves: approvedLeaves // Optionnel: retourner les congés pour debug
        });

    } catch (error) {
        console.error("Erreur API /api/leaves/balance:", error);
        return res.status(500).json({ error: 'Erreur serveur lors du calcul du solde de congés', details: error.message });
    }
} 