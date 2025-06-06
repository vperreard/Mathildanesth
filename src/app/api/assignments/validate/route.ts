import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { RuleEngine } from '@/modules/rules/engine/rule-engine';
import { prisma } from '@/lib/prisma';
import { RuleEvaluationContext } from '@/modules/rules/types/rule';
import { Attribution as AppAssignment } from '@/types/attribution'; // Renommer pour clarté

const ruleEngine = new RuleEngine();

// Type interne pour la validation, s'assurer qu'il a les champs nécessaires
interface AssignmentForValidation extends AppAssignment {
    date: string | Date; // Accepter string ou Date
    roomId?: number | string | null; // Rendre optionnel et accepter string ou number
    userId: string; // Mettre en string pour correspondre à AppAssignment
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        // Utiliser le type interne avec les champs requis
        const assignmentsToValidate: AssignmentForValidation[] = body.attributions;

        if (!assignmentsToValidate || !Array.isArray(assignmentsToValidate)) {
            return NextResponse.json({ error: 'Format de données invalide.' }, { status: 400 });
        }

        const validAssignments = assignmentsToValidate.filter(a => a.date && a.userId);
        if (validAssignments.length === 0) {
            return NextResponse.json({ error: 'Aucune affectation valide à traiter.' }, { status: 400 });
        }

        const startDate = validAssignments.reduce((min, a) => (new Date(a.date) < min ? new Date(a.date) : min), new Date());
        const endDate = validAssignments.reduce((max, a) => (new Date(a.date) > max ? new Date(a.date) : max), new Date(0));

        // Convertir les userId en nombres pour la requête Prisma
        const userIds = [...new Set(validAssignments.map(a => Number(a.userId)).filter(id => !isNaN(id)))];
        const roomIds = [...new Set(validAssignments.map(a => a.roomId).filter(id => id != null).map(id => Number(id)).filter(id => !isNaN(id)))];

        const users = await prisma.user.findMany({ where: { id: { in: userIds } } });
        const rooms = await prisma.operatingRoom.findMany({ where: { id: { in: roomIds } } });

        const context: RuleEvaluationContext = {
            attributions: validAssignments, // Utiliser les affectations filtrées
            startDate: startDate,
            endDate: endDate,
            medecins: users.map(u => ({
                id: String(u.id),
                firstName: u.prenom,
                lastName: u.nom,
                department: u.departmentId || 'N/A',
                // Retirer specialty car il n'existe pas sur le type User de Prisma
                speciality: 'N/A', // Mettre une valeur par défaut ou supprimer si non requis par RuleContext
                qualifications: []
            })),
            rooms: rooms.map(r => ({
                id: String(r.id), // Convertir en string si nécessaire par RuleContext
                name: r.name,
                sector: String(r.sectorId) || 'N/A', // Utiliser sectorId, convertir en string
                capacity: 1, // Garder une valeur par défaut ou utiliser un champ réel si disponible
                equipment: []
            })),
        };

        const validationResult = await ruleEngine.evaluate(context);

        return NextResponse.json(validationResult);

    } catch (error: unknown) {
        logger.error('Erreur API [POST /api/affectations/validate]:', { error: error });
        return NextResponse.json(
            { error: 'Erreur serveur lors de la validation des affectations.', details: error.message },
            { status: 500 }
        );
    }
} 