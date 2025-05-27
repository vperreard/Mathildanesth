import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { startOfWeek, endOfWeek, parseISO } from 'date-fns';
import { unstable_cache } from 'next/cache';

jest.mock('@/lib/prisma');


// Cache configuration
const CACHE_TAGS = ['planning', 'assignments', 'rooms', 'users'];
const CACHE_REVALIDATE = 300; // 5 minutes

// Optimized query with selective fields and includes
const getOptimizedPlanningData = unstable_cache(
    async (startDate: string, endDate: string, siteId?: number) => {
        const start = parseISO(startDate);
        const end = parseISO(endDate);

        // Parallel queries for better performance
        const [assignments, rooms, sectors, users] = await Promise.all([
            // Assignments with minimal includes
            prisma.assignment.findMany({
                where: {
                    date: {
                        gte: start,
                        lte: end
                    },
                    ...(siteId && {
                        room: {
                            sector: {
                                siteId
                            }
                        }
                    })
                },
                select: {
                    id: true,
                    date: true,
                    period: true,
                    userId: true,
                    roomId: true,
                    type: true,
                    status: true,
                    createdAt: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            type: true
                        }
                    },
                    room: {
                        select: {
                            id: true,
                            name: true,
                            sectorId: true
                        }
                    }
                },
                orderBy: [
                    { date: 'asc' },
                    { period: 'asc' }
                ]
            }),

            // Rooms with sectors
            prisma.operatingRoom.findMany({
                where: {
                    isActive: true,
                    ...(siteId && {
                        sector: {
                            siteId
                        }
                    })
                },
                select: {
                    id: true,
                    name: true,
                    sectorId: true,
                    maxSimultaneous: true,
                    sector: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                            displayOrder: true
                        }
                    }
                },
                orderBy: [
                    { sector: { displayOrder: 'asc' } },
                    { displayOrder: 'asc' }
                ]
            }),

            // Sectors
            prisma.operatingSector.findMany({
                where: {
                    isActive: true,
                    ...(siteId && { siteId })
                },
                select: {
                    id: true,
                    name: true,
                    color: true,
                    displayOrder: true,
                    category: true
                },
                orderBy: { displayOrder: 'asc' }
            }),

            // Active users only
            prisma.user.findMany({
                where: {
                    isActive: true,
                    ...(siteId && {
                        sites: {
                            some: {
                                siteId
                            }
                        }
                    })
                },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    type: true,
                    role: true,
                    skillLevels: {
                        select: {
                            level: true,
                            operatingSectorId: true
                        }
                    }
                },
                orderBy: [
                    { type: 'asc' },
                    { lastName: 'asc' }
                ]
            })
        ]);

        // Group assignments by room and period for faster client-side rendering
        const assignmentsByKey: Record<string, any[]> = {};
        assignments.forEach(assignment => {
            const key = `${assignment.date.toISOString()}-${assignment.period}-${assignment.roomId}`;
            if (!assignmentsByKey[key]) {
                assignmentsByKey[key] = [];
            }
            assignmentsByKey[key].push(assignment);
        });

        return {
            assignments,
            assignmentsByKey,
            rooms,
            sectors,
            users,
            metadata: {
                totalAssignments: assignments.length,
                dateRange: { start: startDate, end: endDate },
                cached: true,
                generatedAt: new Date().toISOString()
            }
        };
    },
    ['planning-data'],
    {
        revalidate: CACHE_REVALIDATE,
        tags: CACHE_TAGS
    }
);

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const searchParams = request.nextUrl.searchParams;
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const viewType = searchParams.get('viewType') || 'week';
        const siteId = searchParams.get('siteId');

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: 'Les dates de début et de fin sont requises' },
                { status: 400 }
            );
        }

        // Use cached data
        const data = await getOptimizedPlanningData(
            startDate,
            endDate,
            siteId ? parseInt(siteId) : undefined
        );

        // Set cache headers for browser
        const response = NextResponse.json(data);
        response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        response.headers.set('X-Cache-Status', 'HIT');

        return response;
    } catch (error) {
        console.error('Error fetching optimized planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération du planning' },
            { status: 500 }
        );
    }
}

// Batch update endpoint for optimistic updates
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { updates } = await request.json();

        if (!Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json(
                { error: 'Aucune mise à jour fournie' },
                { status: 400 }
            );
        }

        // Process updates in transaction for consistency
        const results = await prisma.$transaction(
            updates.map(update => 
                prisma.assignment.update({
                    where: { id: update.assignmentId },
                    data: update.changes,
                    select: {
                        id: true,
                        date: true,
                        period: true,
                        userId: true,
                        roomId: true,
                        status: true
                    }
                })
            )
        );

        // Invalidate cache
        // revalidateTag('planning');

        return NextResponse.json({
            success: true,
            updated: results.length,
            results
        });
    } catch (error) {
        console.error('Error updating planning:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la mise à jour du planning' },
            { status: 500 }
        );
    }
}