import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const surgeons = await prisma.surgeon.findMany({
            include: {
                specialties: true
            }
        });
        return NextResponse.json(surgeons);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Erreur lors de la récupération des chirurgiens' }, { status: 500 });
    }
} 