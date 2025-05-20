import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { Prisma, LeaveStatus, Role as UserRolePrisma, Leave as PrismaLeave, LeaveType, NotificationType } from '@prisma/client'; // Importer PrismaLeave et Prisma, LeaveType, NotificationType
import { z } from 'zod';
import { calculateCountedDays } from '@/modules/leaves/utils/dateCalculations';
import { LeaveQueryCacheService } from '@/modules/leaves/services/LeaveQueryCacheService';
import { LeaveEvent } from '@/modules/leaves/types/cache'; // Importer directement de types/cache
import { parseISO } from 'date-fns'; // Importer parseISO
import { getSession } from 'next-auth/react'; // Importer getSession
import { createNotification } from '@/lib/notifications'; // Ajout de createNotification
// import { getSession } from 'next-auth/react'; // Ou une autre méthode pour obtenir la session

// Schéma de validation pour la mise à jour d'un congé
const updateLeaveSchema = z.object({
    startDate: z.string().optional(), // Dates en format ISO string
    endDate: z.string().optional(),
    typeCode: z.string().min(1, "Le type de congé est requis.").optional(),
    reason: z.string().optional().nullable(),
    comment: z.string().optional().nullable(),
    isHalfDay: z.boolean().optional(),
    halfDayPeriod: z.enum(['AM', 'PM']).optional().nullable(),
}).refine(data => {
    if (data.startDate && !data.endDate && !data.isHalfDay) return false; // Si startDate est fourni, endDate doit l'être aussi (sauf si demi-journée)
    if (!data.startDate && data.endDate && !data.isHalfDay) return false; // Si endDate est fourni, startDate doit l'être aussi (sauf si demi-journée)
    return true;
}, {
    message: "startDate and endDate must be provided together if one is present and not a half-day update.",
    path: ["startDate", "endDate"],
}).refine(data => {
    if (data.startDate && data.endDate) {
        try {
            return parseISO(data.endDate) >= parseISO(data.startDate);
        } catch (e) { return false; }
    }
    return true;
}, {
    message: "endDate must be after or equal to startDate.",
    path: ["endDate"],
}).refine(data => {
    if (data.isHalfDay) {
        if (data.startDate && data.endDate && data.startDate !== data.endDate) return false; // Pour demi-journée, dates doivent être identiques si fournies
        if (!data.halfDayPeriod) return false; // halfDayPeriod requis pour demi-journée
    }
    return true;
}, {
    message: "For half-day leaves, startDate and endDate must be the same if provided, and halfDayPeriod is required.",
    path: ["isHalfDay"],
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { leaveId } = req.query;

    if (typeof leaveId !== 'string') {
        return res.status(400).json({ error: 'Leave ID must be a string.' });
    }

    const session = await getSession({ req });
    if (!session || !session.user) { // Vérifier aussi session.user
        return res.status(401).json({ error: 'Unauthorized: Not authenticated' });
    }
    // @ts-ignore // Supposer que session.user.role existe et est compatible
    const userRole: UserRolePrisma = session.user.role as UserRolePrisma;
    // @ts-ignore // Supposer que session.user.id existe et est une string
    const requestingUserIdString: string = session.user.id as string;
    const requestingUserId: number = parseInt(requestingUserIdString, 10); // Convertir en nombre

    if (isNaN(requestingUserId)) {
        return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const existingLeave = await prisma.leave.findUnique({ where: { id: leaveId } });
    if (!existingLeave) {
        return res.status(404).json({ error: 'Leave not found.' });
    }

    if (req.method === 'GET') {
        try {
            const leave = await prisma.leave.findUnique({
                where: { id: leaveId },
                include: {
                    user: { // Inclure les informations de l'utilisateur
                        select: {
                            id: true,
                            nom: true,
                            prenom: true,
                            email: true,
                        },
                    },
                    // On pourrait aussi inclure le libellé du type de congé si LeaveTypeSetting est lié directement
                    // ou faire un second appel pour récupérer le label depuis LeaveTypeSetting basé sur leave.typeCode
                },
            });

            if (!leave) {
                return res.status(404).json({ error: 'Leave not found.' });
            }

            // Vérification fine des permissions
            if (leave.userId !== requestingUserId && userRole !== UserRolePrisma.ADMIN_TOTAL && userRole !== UserRolePrisma.ADMIN_PARTIEL) {
                return res.status(403).json({ error: 'Forbidden: You can only view your own leaves or have admin/partial admin rights.' });
            }

            // Pour obtenir le label du type de congé, on peut faire un appel séparé
            // ou modifier le schéma pour avoir une relation directe facile à inclure.
            // Pour l'instant, on retourne le code.
            // Un enrichissement côté client ou via un service dédié peut être fait.
            let leaveTypeLabel = leave.typeCode; // Default to code
            try {
                const leaveTypeSetting = await prisma.leaveTypeSetting.findFirst({
                    where: { code: leave.typeCode },
                    select: { label: true }
                });
                if (leaveTypeSetting && leaveTypeSetting.label) {
                    leaveTypeLabel = leaveTypeSetting.label;
                }
            } catch (e: any) { // Typer l'erreur pour le logger
                logger.warn(`Could not fetch label for leaveTypeCode: ${leave.typeCode}`, { error: e });
            }

            return res.status(200).json({ ...leave, leaveTypeLabel });

        } catch (error: any) { // Typer l'erreur pour le logger
            logger.error(`Error fetching leave ${leaveId}:`, { error });
            return res.status(500).json({ error: 'Internal server error retrieving leave.' });
        }
    } else if (req.method === 'PUT') {
        try {
            // Vérifier les permissions de modification
            if (existingLeave.userId !== requestingUserId && userRole !== UserRolePrisma.ADMIN_TOTAL && userRole !== UserRolePrisma.ADMIN_PARTIEL) {
                return res.status(403).json({ error: 'Forbidden: You can only update your own leaves or have admin/partial admin rights.' });
            }
            if (existingLeave.status !== LeaveStatus.PENDING) {
                // Les admins/admins partiels peuvent modifier même si approuvé/rejeté.
                if (userRole !== UserRolePrisma.ADMIN_TOTAL && userRole !== UserRolePrisma.ADMIN_PARTIEL) {
                    return res.status(403).json({ error: `Leave cannot be updated by you as its status is ${existingLeave.status}.` });
                }
            }

            const validationResult = updateLeaveSchema.safeParse(req.body);
            if (!validationResult.success) {
                return res.status(400).json({ error: "Validation failed", details: validationResult.error.flatten() });
            }
            const updateData = validationResult.data;

            // Préparer les données pour la mise à jour
            const dataToUpdate: Prisma.LeaveUpdateInput = {};
            let datesChanged = false;

            const newStartDate = updateData.startDate ? parseISO(updateData.startDate) : existingLeave.startDate;
            const newEndDate = updateData.endDate ? parseISO(updateData.endDate) : existingLeave.endDate;

            const currentIsHalfDay = existingLeave.isHalfDay ?? false;
            const newIsHalfDay = updateData.isHalfDay !== undefined ? updateData.isHalfDay : currentIsHalfDay;

            let currentHalfDayPeriodTyped: 'AM' | 'PM' | undefined = undefined;
            if (existingLeave.halfDayPeriod === 'AM' || existingLeave.halfDayPeriod === 'PM') {
                currentHalfDayPeriodTyped = existingLeave.halfDayPeriod;
            }

            let newHalfDayPeriodTyped: 'AM' | 'PM' | undefined = undefined;
            if (newIsHalfDay) {
                // Zod garantit que updateData.halfDayPeriod est 'AM', 'PM', null ou undefined.
                // Si null, on prend currentHalfDayPeriodTyped. Si undefined, aussi.
                newHalfDayPeriodTyped = updateData.halfDayPeriod === 'AM' || updateData.halfDayPeriod === 'PM'
                    ? updateData.halfDayPeriod
                    : currentHalfDayPeriodTyped;
            }

            if (updateData.startDate || updateData.endDate || updateData.isHalfDay !== undefined) {
                datesChanged = true;
                dataToUpdate.startDate = newStartDate;
                dataToUpdate.endDate = newEndDate;
                dataToUpdate.isHalfDay = newIsHalfDay;
                // Stocker null si newHalfDayPeriodTyped est undefined, sinon la valeur.
                dataToUpdate.halfDayPeriod = newHalfDayPeriodTyped === undefined ? null : newHalfDayPeriodTyped;

                if (newIsHalfDay && newStartDate.getTime() !== newEndDate.getTime()) {
                    return res.status(400).json({ error: "For half-day leaves, startDate and endDate must be the same." });
                }
            }

            if (updateData.typeCode && updateData.typeCode !== existingLeave.typeCode) {
                const leaveTypeSetting = await prisma.leaveTypeSetting.findFirst({
                    where: { code: updateData.typeCode, isActive: true, isUserSelectable: true },
                });
                if (!leaveTypeSetting) {
                    return res.status(400).json({ error: `Invalid or non-selectable leave typeCode: ${updateData.typeCode}.` });
                }
                dataToUpdate.typeCode = updateData.typeCode;
                dataToUpdate.type = updateData.typeCode as LeaveType;
            }

            if (typeof updateData.reason !== 'undefined') dataToUpdate.reason = updateData.reason;
            if (typeof updateData.comment !== 'undefined') dataToUpdate.comment = updateData.comment;

            // Recalculer countedDays si les dates ou les options de demi-journée ont changé
            if (datesChanged || (newIsHalfDay !== currentIsHalfDay)) {
                const publicHolidays = (await prisma.publicHoliday.findMany({
                    where: { date: { gte: newStartDate, lte: newEndDate } },
                    select: { date: true }
                })).map(ph => ph.date);
                dataToUpdate.countedDays = calculateCountedDays(
                    newStartDate, // Utiliser newStartDate directement
                    newEndDate,   // Utiliser newEndDate directement
                    true,
                    publicHolidays,
                    newIsHalfDay,
                    newHalfDayPeriodTyped
                );
                if (dataToUpdate.countedDays <= 0 && !newIsHalfDay) {
                    return res.status(400).json({ error: 'Leave period results in 0 counted days.' });
                }
                if (newIsHalfDay && dataToUpdate.countedDays === 0) {
                    return res.status(400).json({ error: 'Half-day leave falls on a non-working day.' });
                }
            }

            // Vérifier les conflits si les dates ont changé
            if (datesChanged) {
                const conflictingLeaves = await prisma.leave.count({
                    where: {
                        id: { not: leaveId },
                        userId: existingLeave.userId,
                        status: { notIn: [LeaveStatus.CANCELLED, LeaveStatus.REJECTED] },
                        startDate: { lte: newEndDate },
                        endDate: { gte: newStartDate },
                    },
                });
                if (conflictingLeaves > 0) {
                    return res.status(409).json({ error: 'Leave request conflicts with an existing leave for this user.' });
                }
            }

            // Mettre à jour le statut à PENDING lors d'une modification par l'utilisateur
            // Si un admin modifie, les règles peuvent être différentes.
            const previousStatus = existingLeave.status;
            let newStatus = previousStatus;

            // Si l'utilisateur modifie sa propre demande PENDING, elle reste PENDING.
            // Si un admin modifie une demande PENDING (ou autre statut) de l'utilisateur, elle repasse en PENDING.
            if (requestingUserId === existingLeave.userId) {
                if (previousStatus === LeaveStatus.PENDING) {
                    newStatus = LeaveStatus.PENDING;
                }
                // Si l'utilisateur modifie une demande déjà approuvée/rejetée, cela ne devrait pas être permis par la logique de permission plus haut.
                // Mais par sécurité, on la repasse PENDING.
                else {
                    newStatus = LeaveStatus.PENDING;
                }
            } else { // Un admin modifie
                newStatus = LeaveStatus.PENDING; // Modification par un admin remet en PENDING pour re-validation/soumission.
            }
            dataToUpdate.status = newStatus;

            const updatedLeave = await prisma.leave.update({ // Retiré le typage PrismaLeave explicite
                where: { id: leaveId },
                data: dataToUpdate,
                // include: { user: { select: {id: true, prenom: true, nom: true } } } // Commenté pour éviter erreur de type si l'outil ne le gère pas bien
            });

            // Notification si un admin a modifié la demande de l'utilisateur
            // On utilise updatedLeave.userId qui est toujours présent.
            if (requestingUserId !== updatedLeave.userId) {
                const adminUser = await prisma.user.findUnique({ where: { id: requestingUserId }, select: { prenom: true, nom: true } });
                const adminName = adminUser ? `${adminUser.prenom} ${adminUser.nom}`.trim() : 'un administrateur'; // Attention aux backticks ici
                const notificationMessage = `Votre demande de congé a été modifiée par ${adminName} et est en attente de validation. Nouveau statut: ${updatedLeave.status}.`;
                const linkToLeave = `/mes-conges?leaveId=${updatedLeave.id}`;

                await createNotification({
                    userId: updatedLeave.userId, // Utiliser directement updatedLeave.userId
                    type: NotificationType.LEAVE_REQUEST_STATUS_CHANGED,
                    message: notificationMessage,
                    link: linkToLeave,
                    triggeredByUserId: requestingUserId,
                });
            }

            // Invalider le cache

            // Invalider le cache
            const cacheService = LeaveQueryCacheService.getInstance();
            const affectedYears = new Set([
                // @ts-ignore - Contournement pour erreur de type persistante
                (updatedLeave.startDate as Date).getFullYear(),
                // @ts-ignore - Contournement pour erreur de type persistante
                (updatedLeave.endDate as Date).getFullYear()
            ]);
            affectedYears.forEach(year => {
                cacheService.invalidateCache(LeaveEvent.BALANCE_UPDATED, { userId: existingLeave.userId.toString(), year });
            });

            return res.status(200).json(updatedLeave);

        } catch (error: any) {
            logger.error(`Error updating leave ${leaveId}:`, { error });
            if (error instanceof z.ZodError) { // Should be caught by safeParse, but as a safeguard
                return res.status(400).json({ error: "Validation failed on update", details: error.flatten() });
            }
            // Renvoyer l'erreur spécifique si elle vient d'une condition métier (ex: 409 Conflict)
            if (error.message && (res.statusCode === 400 || res.statusCode === 403 || res.statusCode === 404 || res.statusCode === 409)) {
                return res.status(res.statusCode).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Internal server error updating leave.' });
        }
    } else if (req.method === 'DELETE') {
        try {
            // Vérifier les permissions d'annulation
            if (existingLeave.userId !== requestingUserId && userRole !== UserRolePrisma.ADMIN_TOTAL && userRole !== UserRolePrisma.ADMIN_PARTIEL) {
                return res.status(403).json({ error: 'Forbidden: You can only cancel your own leaves or have admin/partial admin rights.' });
            }

            // Un congé ne peut être annulé que s'il est PENDING ou APPROVED.
            if (existingLeave.status !== LeaveStatus.PENDING && existingLeave.status !== LeaveStatus.APPROVED) {
                return res.status(400).json({
                    error: `Cannot cancel leave with status ${existingLeave.status}. Only PENDING or APPROVED leaves can be cancelled.`
                });
            }

            const updatedLeave: PrismaLeave = await prisma.leave.update({
                where: { id: leaveId },
                data: {
                    status: LeaveStatus.CANCELLED
                }
            });

            // Notification si le congé est annulé
            if (updatedLeave.status === LeaveStatus.CANCELLED && existingLeave.userId) {
                // Déterminer qui a annulé
                let cancellerName = 'Quelqu\'un';
                if (session && session.user && typeof session.user.name === 'string') { // Vérifier que session.user.name est une string
                    cancellerName = session.user.name;
                }

                // Éviter de notifier l'utilisateur s'il a annulé lui-même.
                // La notification est plus pertinente si un admin annule pour l'utilisateur.
                if (requestingUserId !== existingLeave.userId) {
                    const notificationMessage = `Votre demande de congé du ${new Date(updatedLeave.startDate).toLocaleDateString('fr-FR')} au ${new Date(updatedLeave.endDate).toLocaleDateString('fr-FR')} a été annulée par ${cancellerName}.`;
                    const linkToLeave = `/mes-conges?leaveId=${updatedLeave.id}`;
                    await createNotification({
                        userId: existingLeave.userId,
                        type: NotificationType.LEAVE_REQUEST_STATUS_CHANGED,
                        message: notificationMessage,
                        link: linkToLeave,
                        triggeredByUserId: requestingUserId,
                    });
                }
            }

            return res.status(200).json({
                message: 'Leave successfully cancelled',
                leave: updatedLeave
            });
            // Invalidation du cache (similaire à PUT)
            const cacheService = LeaveQueryCacheService.getInstance();
            const affectedYears = new Set([
                // @ts-ignore - Contournement pour erreur de type persistante
                (updatedLeave.startDate as Date).getFullYear(),
                // @ts-ignore - Contournement pour erreur de type persistante
                (updatedLeave.endDate as Date).getFullYear()
            ]);
            affectedYears.forEach(year => {
                cacheService.invalidateCache(LeaveEvent.BALANCE_UPDATED, { userId: existingLeave.userId.toString(), year });
                // On pourrait aussi invalider plus largement si nécessaire, ex: listes
                // cacheService.invalidateCache(LeaveEvent.LEAVE_LIST_UPDATED, { userId: existingLeave.userId.toString(), year });
            });

            return res.status(200).json({
                message: 'Leave successfully cancelled',
                leave: updatedLeave
            });

        } catch (error: any) {
            logger.error(`Error cancelling leave ${leaveId}:`, { error });
            return res.status(500).json({ error: 'Internal server error cancelling leave.' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
} 