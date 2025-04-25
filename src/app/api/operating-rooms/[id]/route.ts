import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';

// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

interface Context {
    params: {
        id: string;
    };
}

// GET : Récupérer une salle spécifique
export async function GET(request: Request, context: Context) {
    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        const room = await prisma.operatingRoom.findUnique({
            where: { id: roomId },
            // Inclure le secteur si nécessaire
            // include: { sector: true }
        });

        if (!room) {
            return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
        }
        return NextResponse.json(room);
    } catch (error) {
        console.error(`Erreur GET /api/operating-rooms/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// PUT : Mettre à jour une salle spécifique
export async function PUT(request: Request, context: Context) {
    // Vérifier les permissions
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    let data: any;
    try {
        data = await request.json();
        const { name, number, sectorId, colorCode, isActive, supervisionRules } = data;

        // Vérifications de base
        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le nom de la salle est obligatoire.' }), { status: 400 });
        }

        if (!number || typeof number !== 'string' || number.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le numéro de la salle est obligatoire.' }), { status: 400 });
        }

        if (!sectorId || typeof sectorId !== 'string') {
            return new NextResponse(JSON.stringify({ message: 'L\'ID du secteur (sectorId) est obligatoire et doit être une chaîne de caractères.' }), { status: 400 });
        }

        // Convertir sectorId en nombre
        const sectorIdInt = parseInt(sectorId, 10);
        if (isNaN(sectorIdInt)) {
            return new NextResponse(JSON.stringify({ message: 'L\'ID du secteur (sectorId) doit être un nombre valide.' }), { status: 400 });
        }

        // Vérifier si la salle existe (avec le nom de modèle corrigé)
        const existingRoom = await prisma.operatingRoom.findUnique({
            where: { id: roomId }
        });
        if (!existingRoom) {
            return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
        }

        // Vérifier si un autre salle a déjà le nouveau numéro (sauf si c'est la salle actuelle)
        if (number && number !== existingRoom.number) {
            const roomWithSameNumber = await prisma.operatingRoom.findFirst({
                where: { number: number, NOT: { id: roomId } }
            });
            if (roomWithSameNumber) {
                return new NextResponse(JSON.stringify({ message: `Une autre salle (ID: ${roomWithSameNumber.id}) utilise déjà le numéro ${number}.` }), { status: 409 });
            }
        }

        // Mettre à jour la salle (avec le nom de modèle corrigé)
        const updatedRoom = await prisma.operatingRoom.update({
            where: { id: roomId },
            data: {
                name: name?.trim(),
                number: number?.trim(),
                sectorId: sectorIdInt, // Utiliser le nombre converti
                colorCode: colorCode,
                isActive: isActive,
                supervisionRules: supervisionRules
            },
        });

        return NextResponse.json(updatedRoom);
    } catch (error: any) {
        console.error(`Erreur PUT /api/operating-rooms/${roomId}:`, error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                // Gérer conflit sur contrainte unique (ex: number)
                return NextResponse.json({ error: `Le numéro de salle '${data?.number}' est déjà utilisé par une autre salle.` }, { status: 409 });
            } else if (error.code === 'P2003') {
                // Gérer violation clé étrangère (ex: sectorId)
                let fieldName = error.meta?.field_name;
                let failedValue = 'inconnue';
                if (typeof fieldName === 'string' && data && data[fieldName]) {
                    failedValue = data[fieldName];
                }
                return NextResponse.json({ error: `La valeur fournie pour le champ '${fieldName || 'inconnu'}' (valeur: ${failedValue}) n'est pas valide ou n'existe pas.` }, { status: 400 });
            } else if (error.code === 'P2025') {
                // Enregistrement à mettre à jour non trouvé (peut arriver si supprimé entre temps)
                return NextResponse.json({ message: 'Salle non trouvée pour la mise à jour.' }, { status: 404 });
            }
        }
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
}

// DELETE : Supprimer une salle spécifique
export async function DELETE(request: Request, context: Context) {
    // Vérifier les permissions (seul un admin total peut supprimer)
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    if (userRoleString !== 'ADMIN_TOTAL') {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé. Seul un administrateur total peut supprimer une salle.' }), { status: 403 });
    }

    const { id } = context.params;
    const roomId = parseInt(id);

    if (isNaN(roomId)) {
        return new NextResponse(JSON.stringify({ message: 'ID invalide' }), { status: 400 });
    }

    try {
        // Vérifier si la salle existe (avec le nom de modèle corrigé)
        const room = await prisma.operatingRoom.findUnique({
            where: { id: roomId }
        });
        if (!room) {
            return new NextResponse(JSON.stringify({ message: 'Salle non trouvée' }), { status: 404 });
        }

        // Supprimer la salle (avec le nom de modèle corrigé)
        await prisma.operatingRoom.delete({
            where: { id: roomId },
        });

        return new NextResponse(JSON.stringify({ message: 'Salle supprimée avec succès' }), { status: 200 });
    } catch (error) {
        console.error(`Erreur DELETE /api/operating-rooms/${id}:`, error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 