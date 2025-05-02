import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { AbsenceStatus } from '@/types/absence';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: 'Non autorisé' });
    }

    const { id } = req.query;
    const absenceId = parseInt(id as string);

    if (isNaN(absenceId)) {
        return res.status(400).json({ message: 'ID invalide' });
    }

    switch (req.method) {
        case 'GET':
            try {
                const absence = await prisma.plannedAbsence.findUnique({
                    where: { id: absenceId },
                });

                if (!absence) {
                    return res.status(404).json({ message: 'Absence non trouvée' });
                }

                if (absence.userId !== session.user.id) {
                    return res.status(403).json({ message: 'Non autorisé' });
                }

                return res.status(200).json(absence);
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'absence:', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

        case 'PATCH':
            try {
                const { status, typeDetail, impactPlanning, priority, comment, notify } = req.body;

                const absence = await prisma.plannedAbsence.findUnique({
                    where: { id: absenceId },
                });

                if (!absence) {
                    return res.status(404).json({ message: 'Absence non trouvée' });
                }

                if (absence.userId !== session.user.id) {
                    return res.status(403).json({ message: 'Non autorisé' });
                }

                const updatedAbsence = await prisma.plannedAbsence.update({
                    where: { id: absenceId },
                    data: {
                        status: status as AbsenceStatus,
                        typeDetail: typeDetail || absence.typeDetail,
                        impactPlanning: impactPlanning ?? absence.impactPlanning,
                        priority: priority ?? absence.priority,
                        comment: comment || absence.comment,
                        notify: notify ?? absence.notify,
                    },
                });

                return res.status(200).json(updatedAbsence);
            } catch (error) {
                console.error('Erreur lors de la mise à jour de l\'absence:', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

        case 'DELETE':
            try {
                const absence = await prisma.plannedAbsence.findUnique({
                    where: { id: absenceId },
                });

                if (!absence) {
                    return res.status(404).json({ message: 'Absence non trouvée' });
                }

                if (absence.userId !== session.user.id) {
                    return res.status(403).json({ message: 'Non autorisé' });
                }

                await prisma.plannedAbsence.delete({
                    where: { id: absenceId },
                });

                return res.status(204).end();
            } catch (error) {
                console.error('Erreur lors de la suppression de l\'absence:', error);
                return res.status(500).json({ message: 'Erreur serveur' });
            }

        default:
            res.setHeader('Allow', ['GET', 'PATCH', 'DELETE']);
            return res.status(405).json({ message: `Méthode ${req.method} non autorisée` });
    }
} 