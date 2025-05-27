import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

jest.mock('@/lib/prisma');


// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- PUT : Modifier une spécialité ---
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const specialtyId = parseInt(params.id, 10);
    if (isNaN(specialtyId)) {
        return new NextResponse(JSON.stringify({ message: 'ID spécialité invalide' }), { status: 400 });
    }

    try {
        const body = await request.json();
        const { name, isPediatric } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le nom de la spécialité est obligatoire.' }), { status: 400 });
        }

        const formattedName = name.trim();

        const updatedSpecialty = await prisma.specialty.update({
            where: { id: specialtyId },
            data: {
                name: formattedName,
                isPediatric: typeof isPediatric === 'boolean' ? isPediatric : undefined,
            },
        });

        return NextResponse.json(updatedSpecialty);

    } catch (error: any) {
        if (error.code === 'P2002') { // Contrainte unique sur le nom
            return new NextResponse(JSON.stringify({ message: 'Ce nom de spécialité existe déjà.' }), { status: 409 });
        }
        if (error.code === 'P2025') { // Enregistrement non trouvé
            return new NextResponse(JSON.stringify({ message: 'Spécialité non trouvée' }), { status: 404 });
        }
        console.error(`Erreur PUT /api/specialties/${specialtyId}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// --- DELETE : Supprimer une spécialité ---
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const specialtyId = parseInt(params.id, 10);
    if (isNaN(specialtyId)) {
        return new NextResponse(JSON.stringify({ message: 'ID spécialité invalide' }), { status: 400 });
    }

    try {
        // Important: La suppression échouera si des chirurgiens sont encore liés à cette spécialité
        // en raison de la relation many-to-many. Il faudrait idéalement vérifier cela
        // ou informer l'utilisateur de délier les chirurgiens d'abord.
        // Pour l'instant, on laisse Prisma gérer l'erreur P2014 (relation constraint).
        await prisma.specialty.delete({
            where: { id: specialtyId },
        });
        return new NextResponse(null, { status: 204 }); // No Content

    } catch (error: any) {
        if (error.code === 'P2025') { // Enregistrement non trouvé
            return new NextResponse(JSON.stringify({ message: 'Spécialité non trouvée' }), { status: 404 });
        }
        // Gérer l'erreur si la spécialité est encore utilisée (contrainte de relation)
        if (error.code === 'P2014' || (error.code === 'P2003' && error.message.includes('constraint'))) {
            return new NextResponse(JSON.stringify({ message: 'Impossible de supprimer: cette spécialité est utilisée par au moins un chirurgien.' }), { status: 409 }); // Conflict
        }
        console.error(`Erreur DELETE /api/specialties/${specialtyId}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 