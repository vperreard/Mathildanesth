import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createPaginator, createPaginationResponse } from '@/lib/pagination';
import { User } from '@prisma/client';

// Créer un paginateur optimisé pour les utilisateurs avec cache de 10 minutes
const userPaginator = createPaginator<User>(prisma, 'user', 10 * 60 * 1000);

// Champs à inclure dans les requêtes utilisateurs
const userInclude = {
    // Ajoutez ici les relations nécessaires selon vos besoins
    // assignments: {
    //   select: { id: true, startDate: true, endDate: true }
    // }
};

export async function GET(request: NextRequest) {
    const startTime = performance.now();

    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Extraire les paramètres de pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
        const sortBy = searchParams.get('sortBy') || 'nom';
        const sortOrder = (searchParams.get('sortOrder') || 'asc') as 'asc' | 'desc';
        const search = searchParams.get('search') || undefined;

        // Extraire les filtres spécifiques
        const role = searchParams.get('role');
        const isActive = searchParams.get('isActive');
        const siteId = searchParams.get('siteId');

        // Construire les filtres
        const filters: Record<string, any> = {};

        if (role) {
            filters.role = role;
        }

        if (isActive !== null) {
            filters.isActive = isActive === 'true';
        }

        if (siteId) {
            filters.siteId = parseInt(siteId);
        }

        // Champs de recherche pour les utilisateurs
        const searchFields = ['nom', 'prenom', 'email', 'login'];

        // Options de pagination
        const paginationOptions = {
            page,
            limit,
            sortBy,
            sortOrder,
            filters,
            search,
            searchFields
        };

        // Exécuter la pagination optimisée
        const result = await userPaginator.paginate(paginationOptions, userInclude);

        // Log des requêtes lentes
        const executionTime = performance.now() - startTime;
        if (executionTime > 1000) {
            console.warn(`⚠️ Requête utilisateurs lente: ${executionTime.toFixed(2)}ms`, {
                params: paginationOptions,
                cacheHit: result.performance.cacheHit,
            });
        }

        // Créer la réponse avec liens de pagination
        const response = createPaginationResponse(
            result,
            '/api/users',
            Object.fromEntries(searchParams.entries())
        );

        return NextResponse.json({
            success: true,
            ...response,
            meta: {
                executionTime: executionTime.toFixed(2),
                cacheHit: result.performance.cacheHit,
                totalQueries: result.performance.totalQueries
            }
        });

    } catch (error) {
        console.error('[API Users] Erreur lors de la récupération des utilisateurs:', error);

        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la récupération des utilisateurs',
            details: process.env.NODE_ENV === 'development' ? error : undefined,
        }, {
            status: 500
        });
    }
}

// Endpoint HEAD pour comptage rapide avec cache
export async function HEAD(request: NextRequest) {
    const startTime = performance.now();

    try {
        const url = new URL(request.url);
        const searchParams = url.searchParams;

        // Extraire les filtres
        const role = searchParams.get('role');
        const isActive = searchParams.get('isActive');
        const siteId = searchParams.get('siteId');

        // Construire les filtres
        const filters: Record<string, any> = {};

        if (role) {
            filters.role = role;
        }

        if (isActive !== null) {
            filters.isActive = isActive === 'true';
        }

        if (siteId) {
            filters.siteId = parseInt(siteId);
        }

        // Compter avec cache
        const countResult = await userPaginator.count(filters);
        const executionTime = performance.now() - startTime;

        return new NextResponse(null, {
            status: 200,
            headers: {
                'X-Total-Count': countResult.count.toString(),
                'X-Execution-Time': executionTime.toFixed(2),
                'X-Cache-Hit': countResult.performance.cacheHit.toString(),
                'Cache-Control': 'public, max-age=300', // 5 minutes
            },
        });

    } catch (error) {
        console.error('[API Users HEAD] Erreur:', error);
        return new NextResponse(null, { status: 500 });
    }
}

// Endpoint OPTIONS pour suggestions de recherche ultra-rapides
export async function OPTIONS(request: NextRequest) {
    const startTime = performance.now();

    try {
        const url = new URL(request.url);
        const query = url.searchParams.get('q');
        const field = url.searchParams.get('field') || 'nom';
        const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 20);

        if (!query || query.length < 2) {
            return NextResponse.json({
                suggestions: [],
                executionTime: (performance.now() - startTime).toFixed(2)
            });
        }

        // Obtenir les suggestions avec cache court
        const suggestions = await userPaginator.searchSuggestions(query, field, limit);
        const executionTime = performance.now() - startTime;

        return NextResponse.json({
            suggestions,
            executionTime: executionTime.toFixed(2),
            query,
            field
        }, {
            headers: {
                'Cache-Control': 'public, max-age=30', // 30 secondes pour les suggestions
            }
        });

    } catch (error) {
        console.error('[API Users OPTIONS] Erreur:', error);
        return NextResponse.json({
            suggestions: [],
            error: 'Erreur lors de la récupération des suggestions'
        }, { status: 500 });
    }
}

// Endpoint POST pour créer un utilisateur
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validation basique
        if (!body.nom || !body.prenom || !body.email || !body.login) {
            return NextResponse.json({
                success: false,
                error: 'Champs obligatoires manquants'
            }, { status: 400 });
        }

        // Vérifier l'unicité de l'email et du login
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: body.email },
                    { login: body.login }
                ]
            }
        });

        if (existingUser) {
            return NextResponse.json({
                success: false,
                error: 'Email ou login déjà utilisé'
            }, { status: 409 });
        }

        // Créer l'utilisateur
        const newUser = await prisma.user.create({
            data: {
                nom: body.nom,
                prenom: body.prenom,
                email: body.email,
                login: body.login,
                role: body.role || 'USER',
                // Ajoutez d'autres champs selon votre modèle
            },
            include: userInclude
        });

        // Invalider le cache des utilisateurs
        userPaginator.invalidateCache();

        return NextResponse.json({
            success: true,
            data: newUser
        }, { status: 201 });

    } catch (error) {
        console.error('[API Users POST] Erreur:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la création de l\'utilisateur'
        }, { status: 500 });
    }
}

// Endpoint PUT pour mise à jour en lot
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { ids, updates } = body;

        if (!Array.isArray(ids) || !updates) {
            return NextResponse.json({
                success: false,
                error: 'Format de données invalide'
            }, { status: 400 });
        }

        // Mise à jour en lot
        const result = await prisma.user.updateMany({
            where: {
                id: { in: ids }
            },
            data: updates
        });

        // Invalider le cache
        userPaginator.invalidateCache();

        return NextResponse.json({
            success: true,
            updatedCount: result.count
        });

    } catch (error) {
        console.error('[API Users PUT] Erreur:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la mise à jour'
        }, { status: 500 });
    }
}

// Endpoint DELETE pour suppression en lot
export async function DELETE(request: NextRequest) {
    try {
        const url = new URL(request.url);
        const idsParam = url.searchParams.get('ids');

        if (!idsParam) {
            return NextResponse.json({
                success: false,
                error: 'IDs manquants'
            }, { status: 400 });
        }

        const ids = idsParam.split(',').map(id => parseInt(id.trim()));

        // Suppression en lot
        const result = await prisma.user.deleteMany({
            where: {
                id: { in: ids }
            }
        });

        // Invalider le cache
        userPaginator.invalidateCache();

        return NextResponse.json({
            success: true,
            deletedCount: result.count
        });

    } catch (error) {
        console.error('[API Users DELETE] Erreur:', error);
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la suppression'
        }, { status: 500 });
    }
} 