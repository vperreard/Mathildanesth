import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { AbsenceType, AbsenceStatus } from '@/types/absence';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: 'Non autorisé' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const absences = await prisma.absence.findMany({
                    where: {
                        userId: session.user.id,
                    },
                    orderBy: {
                        startDate: 'desc',
                    },
                });
                return res.status(200).json(absences);
            } catch (error) {
                console.error('Erreur lors de la récupération des absences:', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

        case 'POST':
            try {
                const { startDate, endDate, type, reason } = req.body;

                // Vérification des chevauchements
                const overlappingAbsence = await prisma.absence.findFirst({
                    where: {
                        userId: session.user.id,
                        OR: [
                            {
                                AND: [
                                    { startDate: { lte: new Date(startDate) } },
                                    { endDate: { gte: new Date(startDate) } },
                                ],
                            },
                            {
                                AND: [
                                    { startDate: { lte: new Date(endDate) } },
                                    { endDate: { gte: new Date(endDate) } },
                                ],
                            },
                        ],
                    },
                });

                if (overlappingAbsence) {
                    return res.status(400).json({ message: 'Chevauchement avec une absence existante' });
                }

                const absence = await prisma.absence.create({
                    data: {
                        userId: session.user.id,
                        startDate: new Date(startDate),
                        endDate: new Date(endDate),
                        type: type as AbsenceType,
                        reason,
                        status: 'PENDING' as AbsenceStatus,
                    },
                });

                return res.status(201).json(absence);
            } catch (error) {
                console.error('Erreur lors de la création de l\'absence:', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

        default:
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).json({ message: `Méthode ${req.method} non autorisée` });
    }
} 