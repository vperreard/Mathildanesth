import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { userIdSchema, assignSkillSchema } from '@/lib/schemas/skillSchemas';
import { getCurrentUser, isAdmin, handleApiError } from '@/lib/apiUtils';

jest.mock('@/lib/prisma');


interface UserSkillsParams {
    params: {
        userId: string;
    };
}

// GET /api/utilisateurs/[userId]/skills - Liste les compétences d'un utilisateur spécifique (admin)
export async function GET(request: NextRequest, { params }: UserSkillsParams) {
    try {
        const currentUser = await getCurrentUser();
        if (!isAdmin(currentUser)) {
            // Un utilisateur normal ne devrait pas pouvoir lister les compétences d'un autre via cette route.
            // Il utilisera /api/me/skills
            return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
        }

        const { userId } = userIdSchema.parse(params);

        const userSkills = await prisma.userSkill.findMany({
            where: { userId },
            include: {
                skill: true, // Inclure les détails de la compétence
            },
            orderBy: {
                skill: { name: 'asc' }
            }
        });

        if (!userSkills) { // Peut arriver si l'utilisateur n'existe pas, bien que findMany retourne []
            // Pour être précis, vérifier si l'utilisateur lui-même existe pourrait être fait avant
            const userExists = await prisma.user.findUnique({ where: { id: userId } });
            if (!userExists) {
                return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
            }
        }

        return NextResponse.json(userSkills);
    } catch (error) {
        return handleApiError(error, "Erreur lors de la récupération des compétences de l'utilisateur.");
    }
}

// POST /api/utilisateurs/[userId]/skills - Assigne une compétence à un utilisateur
export async function POST(request: NextRequest, { params }: UserSkillsParams) {
    try {
        const currentUser = await getCurrentUser();
        if (!isAdmin(currentUser)) {
            return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
        }

        const { userId } = userIdSchema.parse(params);
        const body = await request.json();
        const validation = assignSkillSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ message: "Données invalides.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }

        const { skillId } = validation.data;

        // Vérifier si l'utilisateur et la compétence existent
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
        }

        const skillExists = await prisma.skill.findUnique({ where: { id: skillId } });
        if (!skillExists) {
            return NextResponse.json({ message: "Compétence non trouvée." }, { status: 404 });
        }

        const existingUserSkill = await prisma.userSkill.findUnique({
            where: {
                userId_skillId: { userId, skillId },
            },
        });

        if (existingUserSkill) {
            return NextResponse.json({ message: "Cette compétence est déjà assignée à l'utilisateur." }, { status: 409 });
        }

        const newUserSkill = await prisma.userSkill.create({
            data: {
                userId,
                skillId,
                assignedBy: currentUser.id, // ID de l'admin qui assigne
            },
            include: { // Inclure les détails de la compétence pour la réponse
                skill: true,
            }
        });

        return NextResponse.json(newUserSkill, { status: 201 });
    } catch (error) {
        return handleApiError(error, "Erreur lors de l'assignation de la compétence à l'utilisateur.");
    }
} 