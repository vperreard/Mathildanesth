import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { userSkillParamsSchema } from '@/lib/schemas/skillSchemas';
import { getCurrentUser, isAdmin, handleApiError } from '@/lib/apiUtils';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string; skillId: string }> }) {
    try {
        const currentUser = await getCurrentUser();
        if (!isAdmin(currentUser)) {
            return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
        }

        const resolvedParams = await params;
        const validation = userSkillParamsSchema.safeParse(resolvedParams);
        if (!validation.success) {
            return NextResponse.json({ message: "Identifiants invalides.", errors: validation.error.flatten().fieldErrors }, { status: 400 });
        }
        const { userId, skillId } = validation.data;

        await prisma.userSkill.delete({
            where: {
                userId_skillId: { userId, skillId },
            },
        });

        return NextResponse.json({ message: "Compétence retirée de l'utilisateur avec succès." }, { status: 200 });
    } catch (error: unknown) {
        // Gérer spécifiquement l'erreur P2025 (Record to delete not found) de Prisma
        if ((error as any).code === 'P2025') {
            return NextResponse.json({ message: "L'association compétence-utilisateur non trouvée." }, { status: 404 });
        }
        return handleApiError(error, "Erreur lors du retrait de la compétence de l'utilisateur.");
    }
} 