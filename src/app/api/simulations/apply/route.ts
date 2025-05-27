import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { applySimulationService } from '@/services/simulations/applySimulationService';

jest.mock('@/lib/prisma');


const prisma = prisma;

/**
 * API pour appliquer un résultat de simulation au planning réel
 * POST /api/simulations/apply
 */
export async function POST(request: NextRequest) {
    try {
        // Vérifier l'authentification
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json(
                { error: 'Non autorisé' },
                { status: 401 }
            );
        }

        // Récupérer le corps de la requête
        const body = await request.json();
        const {
            simulationResultId,
            clearExistingAssignments = false,
            includeLeaves = false,
            includeOnCall = true,
            notes
        } = body;

        if (!simulationResultId) {
            return NextResponse.json(
                { error: 'L\'ID du résultat de simulation est requis' },
                { status: 400 }
            );
        }

        // Récupérer l'ID de l'utilisateur connecté
        const user = await prisma.user.findUnique({
            where: { email: session.user.email as string },
            select: { id: true }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Utilisateur non trouvé' },
                { status: 404 }
            );
        }

        // Vérifier que l'utilisateur a les droits pour appliquer une simulation
        const hasRights = await checkUserRightsForSimulationApply(user.id);
        if (!hasRights) {
            return NextResponse.json(
                { error: 'Vous n\'avez pas les droits pour appliquer une simulation au planning réel' },
                { status: 403 }
            );
        }

        // Appliquer la simulation au planning
        const result = await applySimulationService.applySimulationToPlanning(
            simulationResultId,
            {
                userId: user.id.toString(),
                clearExistingAssignments,
                includeLeaves,
                includeOnCall,
                notes
            }
        );

        if (!result.success) {
            return NextResponse.json(
                {
                    success: false,
                    error: result.error || 'Erreur lors de l\'application de la simulation',
                    conflicts: result.conflicts
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: result.message,
            data: {
                assignmentsCreated: result.assignmentsCreated,
                assignmentsUpdated: result.assignmentsUpdated,
                leavesCreated: result.leavesCreated,
                conflicts: result.conflicts.length
            }
        });
    } catch (error) {
        console.error('Erreur lors de l\'application de la simulation:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Erreur inconnue'
            },
            { status: 500 }
        );
    }
}

/**
 * Vérifie si l'utilisateur a les droits pour appliquer une simulation
 */
async function checkUserRightsForSimulationApply(userId: number): Promise<boolean> {
    try {
        // Vérifier si l'utilisateur a un rôle administrateur ou planificateur
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roles: true
            }
        });

        if (!user) return false;

        // Vérifier les rôles (vous devrez adapter cette logique à votre modèle de données)
        const allowedRoles = ['ADMIN', 'PLANNER', 'SUPER_USER'];

        // Si l'utilisateur a des rôles définis, vérifier s'il a un rôle autorisé
        if (user.roles && Array.isArray(user.roles)) {
            return user.roles.some((role: any) =>
                allowedRoles.includes(role.name || role.role || '')
            );
        }

        // Si pas de système de rôles clair, vérifiez le champ isAdmin ou équivalent
        return user.isAdmin === true;
    } catch (error) {
        console.error('Erreur lors de la vérification des droits:', error);
        return false;
    }
} 