import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const siteId = searchParams.get('siteId');

        const sectors = await prisma.operatingSector.findMany({
            where: siteId ? { siteId } : undefined,
            include: {
                site: true,
                rooms: {
                    orderBy: { displayOrder: 'asc' }
                }
            },
            orderBy: [
                { displayOrder: { sort: 'asc', nulls: 'last' } },
                { name: 'asc' }
            ]
        });

        return NextResponse.json(sectors);
    } catch (error) {
        console.error('Erreur lors de la récupération des secteurs opératoires:', error);
        return NextResponse.json({ error: 'Erreur lors de la récupération des secteurs opératoires' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
        }

        const data = await request.json();
        const { name, siteId, description, colorCode, isActive, displayOrder, category } = data;

        if (!name || !siteId) {
            return NextResponse.json({ error: 'Nom et site requis' }, { status: 400 });
        }

        const newSector = await prisma.operatingSector.create({
            data: {
                name,
                siteId,
                description,
                colorCode,
                isActive: isActive !== undefined ? isActive : true,
                displayOrder,
                category,
                rules: data.rules || {}
            },
            include: {
                site: true
            }
        });

        return NextResponse.json(newSector, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du secteur:', error);
        return NextResponse.json({
            error: 'Erreur lors de la création du secteur',
            details: error instanceof Error ? error.message : 'Erreur inconnue'
        }, { status: 500 });
    }
}
