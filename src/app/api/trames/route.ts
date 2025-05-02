import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

// GET /api/trames - Récupérer toutes les trames
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const trames = await prisma.trameAffectation.findMany({
            orderBy: { updatedAt: 'desc' },
            include: {
                periods: {
                    include: {
                        assignments: {
                            include: {
                                posts: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(trames);
    } catch (error) {
        console.error('Erreur lors de la récupération des trames:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des trames' },
            { status: 500 }
        );
    }
}

// POST /api/trames - Créer une nouvelle trame
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession();
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const body = await request.json();

        // Génération de tous les IDs nécessaires pour prisma
        const trameId = uuidv4();

        // Création de la trame
        const trame = await prisma.trameAffectation.create({
            data: {
                id: trameId,
                name: body.name,
                description: body.description,
                weekType: body.weekType,
                dayType: body.dayType,
                isActive: body.isActive,
                isLocked: body.isLocked,
                version: 1,
                createdBy: session.user?.email || null,
                periods: {
                    create: body.periods.map((period: any) => {
                        const periodId = uuidv4();
                        return {
                            id: periodId,
                            name: period.name,
                            startTime: period.startTime,
                            endTime: period.endTime,
                            color: period.color,
                            isActive: period.isActive,
                            isLocked: period.isLocked,
                            assignments: {
                                create: period.assignments.map((assignment: any) => {
                                    const assignmentId = uuidv4();
                                    return {
                                        id: assignmentId,
                                        type: assignment.type,
                                        name: assignment.name,
                                        duration: assignment.duration,
                                        isActive: assignment.isActive,
                                        posts: {
                                            create: assignment.posts.map((post: any) => {
                                                const postId = uuidv4();
                                                return {
                                                    id: postId,
                                                    type: post.type,
                                                    name: post.name,
                                                    required: post.required,
                                                    maxCount: post.maxCount,
                                                    minCount: post.minCount
                                                };
                                            })
                                        }
                                    };
                                })
                            }
                        };
                    })
                }
            },
            include: {
                periods: {
                    include: {
                        assignments: {
                            include: {
                                posts: true
                            }
                        }
                    }
                },
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        });

        return NextResponse.json(trame, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création de la trame:', error);
        return NextResponse.json(
            { error: 'Erreur serveur lors de la création de la trame' },
            { status: 500 }
        );
    }
} 