import { NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { headers } from 'next/headers';

// Helper pour vérifier les rôles admin
const hasRequiredRole = (): boolean => {
    const headersList = headers();
    const userRoleString = headersList.get('x-user-role');
    return !!userRoleString && ['ADMIN_TOTAL', 'ADMIN_PARTIEL'].includes(userRoleString);
};

// --- GET : Lister toutes les spécialités ---
export async function GET() {
    try {
        const specialties = await prisma.specialty.findMany({
            include: {
                surgeons: {
                    select: {
                        id: true,
                        nom: true,
                        prenom: true,
                        status: true
                    },
                    where: {
                        status: 'ACTIF'
                    },
                    orderBy: [
                        { nom: 'asc' },
                        { prenom: 'asc' }
                    ]
                }
            },
            orderBy: {
                name: 'asc' // Trier par nom pour la liste déroulante
            }
        });
        return NextResponse.json(specialties);
    } catch (error) {
        logger.error("Erreur GET /api/specialties:", error);
        return NextResponse.json(
            { error: 'Erreur interne du serveur lors de la récupération des spécialités.' },
            { status: 500 }
        );
    }
}

// --- POST : Créer une nouvelle spécialité ---
export async function POST(request: Request) {
    // Seul un admin peut créer
    if (!hasRequiredRole()) {
        return new NextResponse(JSON.stringify({ message: 'Accès non autorisé' }), { status: 403 });
    }

    try {
        const body = await request.json();
        const { name, isPediatric } = body;

        if (!name || typeof name !== 'string' || name.trim() === '') {
            return new NextResponse(JSON.stringify({ message: 'Le nom de la spécialité est obligatoire.' }), { status: 400 });
        }

        const formattedName = name.trim();

        const newSpecialty = await prisma.specialty.create({
            data: {
                name: formattedName,
                isPediatric: typeof isPediatric === 'boolean' ? isPediatric : false,
            },
        });
        return new NextResponse(JSON.stringify(newSpecialty), { status: 201 });

    } catch (error: any) {
        if (error.code === 'P2002') { // Contrainte unique sur le nom
            return new NextResponse(JSON.stringify({ message: 'Ce nom de spécialité existe déjà.' }), { status: 409 });
        }
        logger.error("Erreur POST /api/specialties:", error);
        return new NextResponse(JSON.stringify({ message: 'Erreur interne du serveur' }), { status: 500 });
    }
} 