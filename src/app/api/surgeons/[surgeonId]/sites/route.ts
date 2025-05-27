import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';


// GET /api/chirurgiens/[surgeonId]/sites - Récupérer les sites d'un chirurgien
export async function GET(
    request: NextRequest,
    { params }: { params: { surgeonId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
        }

        const surgeonId = parseInt(params.surgeonId);
        if (isNaN(surgeonId)) {
            return NextResponse.json({ error: 'ID chirurgien invalide' }, { status: 400 });
        }

        const surgeonWithSites = await prisma.surgeon.findUnique({
            where: { id: surgeonId },
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        colorCode: true,
                        isActive: true
                    }
                },
                specialties: {
                    select: {
                        id: true,
                        name: true,
                        isPediatric: true
                    }
                }
            }
        });

        if (!surgeonWithSites) {
            return NextResponse.json({ error: 'Chirurgien non trouvé' }, { status: 404 });
        }

        return NextResponse.json({
            surgeonId: surgeonWithSites.id,
            surgeonInfo: {
                nom: surgeonWithSites.nom,
                prenom: surgeonWithSites.prenom,
                email: surgeonWithSites.email,
                specialties: surgeonWithSites.specialties
            },
            sites: surgeonWithSites.sites,
            meta: {
                totalSites: surgeonWithSites.sites.length,
                totalSpecialties: surgeonWithSites.specialties.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[SURGEON_SITES_GET_ERROR]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des sites' },
            { status: 500 }
        );
    }
}

// PUT /api/chirurgiens/[surgeonId]/sites - Mettre à jour les sites d'un chirurgien
export async function PUT(
    request: NextRequest,
    { params }: { params: { surgeonId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
        }

        const surgeonId = parseInt(params.surgeonId);
        if (isNaN(surgeonId)) {
            return NextResponse.json({ error: 'ID chirurgien invalide' }, { status: 400 });
        }

        const body = await request.json();
        const { siteIds } = body;

        if (!Array.isArray(siteIds)) {
            return NextResponse.json({ error: 'siteIds doit être un tableau' }, { status: 400 });
        }

        // Vérifier que tous les sites existent
        const existingSites = await prisma.site.findMany({
            where: {
                id: { in: siteIds },
                isActive: true
            }
        });

        if (existingSites.length !== siteIds.length) {
            return NextResponse.json({
                error: 'Un ou plusieurs sites spécifiés n\'existent pas ou sont inactifs'
            }, { status: 400 });
        }

        // Mettre à jour les associations
        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
            data: {
                sites: {
                    set: siteIds.map((siteId: string) => ({ id: siteId }))
                }
            },
            include: {
                sites: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        colorCode: true
                    }
                },
                specialties: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            }
        });

        return NextResponse.json({
            message: 'Sites mis à jour avec succès',
            surgeon: {
                id: updatedSurgeon.id,
                nom: updatedSurgeon.nom,
                prenom: updatedSurgeon.prenom,
                sites: updatedSurgeon.sites,
                specialties: updatedSurgeon.specialties
            },
            meta: {
                totalSites: updatedSurgeon.sites.length,
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('[SURGEON_SITES_PUT_ERROR]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la mise à jour des sites' },
            { status: 500 }
        );
    }
}

// POST /api/chirurgiens/[surgeonId]/sites - Ajouter des sites à un chirurgien
export async function POST(
    request: NextRequest,
    { params }: { params: { surgeonId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
        }

        const surgeonId = parseInt(params.surgeonId);
        if (isNaN(surgeonId)) {
            return NextResponse.json({ error: 'ID chirurgien invalide' }, { status: 400 });
        }

        const body = await request.json();
        const { siteIds } = body;

        if (!Array.isArray(siteIds)) {
            return NextResponse.json({ error: 'siteIds doit être un tableau' }, { status: 400 });
        }

        // Ajouter les sites (sans supprimer les existants)
        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
            data: {
                sites: {
                    connect: siteIds.map((siteId: string) => ({ id: siteId }))
                }
            },
            include: {
                sites: true,
                specialties: true
            }
        });

        return NextResponse.json({
            message: 'Sites ajoutés avec succès',
            surgeon: {
                id: updatedSurgeon.id,
                nom: updatedSurgeon.nom,
                prenom: updatedSurgeon.prenom,
                sites: updatedSurgeon.sites,
                specialties: updatedSurgeon.specialties
            }
        });

    } catch (error) {
        console.error('[SURGEON_SITES_POST_ERROR]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de l\'ajout des sites' },
            { status: 500 }
        );
    }
}

// DELETE /api/chirurgiens/[surgeonId]/sites - Retirer un chirurgien de sites spécifiques
export async function DELETE(
    request: NextRequest,
    { params }: { params: { surgeonId: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Authentification requise' }, { status: 401 });
        }

        const surgeonId = parseInt(params.surgeonId);
        if (isNaN(surgeonId)) {
            return NextResponse.json({ error: 'ID chirurgien invalide' }, { status: 400 });
        }

        const body = await request.json();
        const { siteIds } = body;

        if (!Array.isArray(siteIds)) {
            return NextResponse.json({ error: 'siteIds doit être un tableau' }, { status: 400 });
        }

        // Retirer les sites spécifiés
        const updatedSurgeon = await prisma.surgeon.update({
            where: { id: surgeonId },
            data: {
                sites: {
                    disconnect: siteIds.map((siteId: string) => ({ id: siteId }))
                }
            },
            include: {
                sites: true
            }
        });

        return NextResponse.json({
            message: 'Sites retirés avec succès',
            surgeon: {
                id: updatedSurgeon.id,
                sites: updatedSurgeon.sites
            }
        });

    } catch (error) {
        console.error('[SURGEON_SITES_DELETE_ERROR]:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la suppression des sites' },
            { status: 500 }
        );
    }
} 