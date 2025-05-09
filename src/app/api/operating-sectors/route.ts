import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-utils';
import { headers } from 'next/headers';
import { BlocPlanningService } from '@/modules/planning/bloc-operatoire/services/blocPlanningService';
import { OperatingSectorSchema } from '@/modules/planning/bloc-operatoire/models/BlocModels';

const prisma = new PrismaClient();
const planningService = new BlocPlanningService();

// GET tous les secteurs
export async function GET() {
    try {
        // Utiliser le système JWT personnalisé au lieu de next-auth
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = headers();
            const userRole = headersList.get('x-user-role');

            // Si nous sommes en développement et que le rôle admin est fourni dans l'en-tête
            if (process.env.NODE_ENV === 'development' && userRole === 'ADMIN_TOTAL') {
                console.log('[DEV MODE] Authentification par en-tête uniquement pour GET /api/operating-sectors');
            } else {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
        }

        // Utiliser le service qui ordonne correctement les secteurs
        const sectors = await planningService.getAllOperatingSectors();

        // Journalisation pour le débogage
        console.log(`GET /api/operating-sectors: ${sectors.length} secteurs triés par displayOrder et site récupérés`);

        return NextResponse.json(sectors);
    } catch (error) {
        console.error('Erreur lors de la récupération des secteurs opératoires:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des secteurs opératoires' }, { status: 500 });
    }
}

// POST pour créer un nouveau secteur
export async function POST(request: Request) {
    try {
        // Vérifier l'authentification et les permissions
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour POST /api/operating-sectors');
        }

        const body = await request.json();
        const result = OperatingSectorSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json({ error: 'Données invalides', details: result.error.format() }, { status: 400 });
        }

        // Utiliser la méthode createOperatingSector du service BlocPlanningService
        const sector = await planningService.createOperatingSector(result.data);
        return NextResponse.json(sector, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création d\'un secteur opératoire:', error);
        return NextResponse.json({ error: 'Erreur lors de la création d\'un secteur opératoire' }, { status: 500 });
    }
}

// PUT pour mettre à jour un secteur existant
export async function PUT(request: NextRequest) {
    try {
        // Vérifier l'authentification et les permissions
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour PUT /api/operating-sectors');
        }

        const data = await request.json();

        if (!data.id) {
            return NextResponse.json({ error: 'ID du secteur requis' }, { status: 400 });
        }

        // Convertir l'ID en nombre si nécessaire
        const sectorId = parseInt(data.id, 10);
        if (isNaN(sectorId)) {
            return NextResponse.json({ error: 'ID du secteur invalide' }, { status: 400 });
        }

        // Utiliser la méthode updateOperatingSector du service BlocPlanningService
        const updatedSector = await planningService.updateOperatingSector(sectorId, {
            name: data.name,
            colorCode: data.colorCode,
            isActive: data.isActive,
            description: data.description
        });

        return NextResponse.json(updatedSector);
    } catch (error) {
        console.error('Erreur lors de la mise à jour du secteur:', error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour du secteur' }, { status: 500 });
    }
}

// DELETE pour supprimer un secteur
export async function DELETE(request: NextRequest) {
    try {
        // Vérifier l'authentification et les permissions
        const authResult = await verifyAuthToken();

        if (!authResult.authenticated) {
            // Vérifier si l'en-tête x-user-role est présent (pour le développement)
            const headersList = headers();
            const userRole = headersList.get('x-user-role');

            if (process.env.NODE_ENV !== 'development' || userRole !== 'ADMIN_TOTAL') {
                return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
            }
            console.log('[DEV MODE] Authentification par en-tête uniquement pour DELETE /api/operating-sectors');
        }

        const url = new URL(request.url);
        const idStr = url.searchParams.get('id');

        if (!idStr) {
            return NextResponse.json({ error: 'ID du secteur requis' }, { status: 400 });
        }

        // Convertir l'ID en nombre
        const id = parseInt(idStr, 10);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'ID du secteur invalide' }, { status: 400 });
        }

        // Utiliser la méthode deleteOperatingSector du service BlocPlanningService
        await planningService.deleteOperatingSector(id);

        return NextResponse.json({ message: 'Secteur supprimé avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression du secteur:', error);
        return NextResponse.json({ error: 'Erreur lors de la suppression du secteur' }, { status: 500 });
    }
} 