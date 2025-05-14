import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, handleApiError } from '@/lib/apiUtils';

// GET /api/me/skills - Permet à l'utilisateur connecté de récupérer ses propres compétences
export async function GET(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!currentUser || !currentUser.id) {
            return NextResponse.json({ message: "Accès non autorisé. Utilisateur non connecté." }, { status: 401 });
        }

        const userSkills = await prisma.userSkill.findMany({
            where: { userId: currentUser.id },
            include: {
                skill: true, // Inclure les détails de la compétence
            },
            orderBy: {
                skill: { name: 'asc' } // Trier par nom de compétence
            }
        });

        return NextResponse.json(userSkills);
    } catch (error) {
        return handleApiError(error, "Erreur lors de la récupération de vos compétences.");
    }
} 