import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkUserRole, UserRole } from '@/lib/auth-utils';
import { TeamConfiguration } from '@/types/team-configuration';

jest.mock('@/lib/prisma');


// GET /api/admin/team-configurations
export async function GET(request: Request) {
    const authCheck = await checkUserRole(['ADMIN_TOTAL', 'ADMIN_PARTIEL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        return new NextResponse(
            JSON.stringify({ message: 'Accès non autorisé' }),
            { status: 403 }
        );
    }

    try {
        // Récupérer l'ID spécifié dans la URL s'il y en a un
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (id) {
            // Récupérer une configuration spécifique
            const config = await prisma.teamConfiguration.findUnique({
                where: { id }
            });

            if (!config) {
                return new NextResponse(
                    JSON.stringify({ message: 'Configuration non trouvée' }),
                    { status: 404 }
                );
            }

            return NextResponse.json(config);
        }

        // Récupérer toutes les configurations
        const configs = await prisma.teamConfiguration.findMany({
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(configs);
    } catch (error) {
        console.error("Erreur GET /api/admin/team-configurations:", error);
        return new NextResponse(
            JSON.stringify({ message: 'Erreur interne du serveur' }),
            { status: 500 }
        );
    }
}

// POST /api/admin/team-configurations
export async function POST(request: Request) {
    const authCheck = await checkUserRole(['ADMIN_TOTAL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        return new NextResponse(
            JSON.stringify({ message: 'Accès non autorisé' }),
            { status: 403 }
        );
    }

    try {
        const body = await request.json() as TeamConfiguration;
        const { name, description, gardes, consultations, bloc, conges, ...rest } = body;

        // Validation de base
        if (!name) {
            return new NextResponse(
                JSON.stringify({ message: 'Le nom est obligatoire' }),
                { status: 400 }
            );
        }

        if (!gardes || !consultations || !bloc || !conges) {
            return new NextResponse(
                JSON.stringify({ message: 'Les configurations de base sont obligatoires' }),
                { status: 400 }
            );
        }

        // Si cette nouvelle configuration est définie comme par défaut,
        // on désactive toutes les autres configurations par défaut
        if (rest.isDefault) {
            await prisma.teamConfiguration.updateMany({
                where: { isDefault: true },
                data: { isDefault: false }
            });
        }

        // Créer la nouvelle configuration
        const newConfig = await prisma.teamConfiguration.create({
            data: {
                name,
                description,
                gardes,
                consultations,
                bloc,
                conges,
                ...rest
            }
        });

        return NextResponse.json(newConfig, { status: 201 });
    } catch (error) {
        console.error("Erreur POST /api/admin/team-configurations:", error);
        return new NextResponse(
            JSON.stringify({ message: 'Erreur interne du serveur' }),
            { status: 500 }
        );
    }
}

// PUT /api/admin/team-configurations/:id
export async function PUT(request: Request) {
    const authCheck = await checkUserRole(['ADMIN_TOTAL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        return new NextResponse(
            JSON.stringify({ message: 'Accès non autorisé' }),
            { status: 403 }
        );
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new NextResponse(
                JSON.stringify({ message: 'ID de configuration manquant' }),
                { status: 400 }
            );
        }

        const body = await request.json() as Partial<TeamConfiguration>;
        const { isDefault, ...updateData } = body;

        // Vérifier que la configuration existe
        const existingConfig = await prisma.teamConfiguration.findUnique({
            where: { id }
        });

        if (!existingConfig) {
            return new NextResponse(
                JSON.stringify({ message: 'Configuration non trouvée' }),
                { status: 404 }
            );
        }

        // Si cette configuration est définie comme par défaut,
        // on désactive toutes les autres configurations par défaut
        if (isDefault) {
            await prisma.teamConfiguration.updateMany({
                where: {
                    isDefault: true,
                    id: { not: id }
                },
                data: { isDefault: false }
            });
        }

        // Mettre à jour la configuration
        const updatedConfig = await prisma.teamConfiguration.update({
            where: { id },
            data: {
                ...updateData,
                isDefault: isDefault ?? existingConfig.isDefault,
                updatedAt: new Date()
            }
        });

        return NextResponse.json(updatedConfig);
    } catch (error) {
        console.error("Erreur PUT /api/admin/team-configurations:", error);
        return new NextResponse(
            JSON.stringify({ message: 'Erreur interne du serveur' }),
            { status: 500 }
        );
    }
}

// DELETE /api/admin/team-configurations/:id
export async function DELETE(request: Request) {
    const authCheck = await checkUserRole(['ADMIN_TOTAL'] as UserRole[]);

    if (!authCheck.hasRequiredRole) {
        return new NextResponse(
            JSON.stringify({ message: 'Accès non autorisé' }),
            { status: 403 }
        );
    }

    try {
        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return new NextResponse(
                JSON.stringify({ message: 'ID de configuration manquant' }),
                { status: 400 }
            );
        }

        // Vérifier que la configuration existe
        const existingConfig = await prisma.teamConfiguration.findUnique({
            where: { id }
        });

        if (!existingConfig) {
            return new NextResponse(
                JSON.stringify({ message: 'Configuration non trouvée' }),
                { status: 404 }
            );
        }

        // Si c'est la configuration par défaut, empêcher la suppression
        if (existingConfig.isDefault) {
            return new NextResponse(
                JSON.stringify({ message: 'Impossible de supprimer la configuration par défaut' }),
                { status: 400 }
            );
        }

        // Supprimer la configuration
        await prisma.teamConfiguration.delete({
            where: { id }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("Erreur DELETE /api/admin/team-configurations:", error);
        return new NextResponse(
            JSON.stringify({ message: 'Erreur interne du serveur' }),
            { status: 500 }
        );
    }
} 