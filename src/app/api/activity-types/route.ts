import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyAuthToken } from '@/lib/auth-server-utils';
import type { AuthResult } from '@/lib/auth-client-utils';

const prisma = new PrismaClient();

// Récupérer tous les types d'activité
export async function GET(req: NextRequest) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');

        if (!authToken) {
            return NextResponse.json(
                { error: 'Non autorisé - Token manquant' },
                { status: 401 }
            );
        }

        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated) {
            return NextResponse.json(
                { error: authResult.error || 'Non autorisé - Token invalide' },
                { status: 401 }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const active = searchParams.get('active');
        const code = searchParams.get('code');

        let where: any = {};

        if (active === 'true') {
            where.isActive = true;
        } else if (active === 'false') {
            where.isActive = false;
        }

        if (code) {
            where.code = code;
        }

        const activityTypes = await prisma.activityType.findMany({
            where,
            orderBy: {
                name: 'asc',
            },
        });

        return NextResponse.json(activityTypes);
    } catch (error) {
        console.error('Erreur lors de la récupération des types d\'activité:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la récupération des types d\'activité' },
            { status: 500 }
        );
    }
}

// Créer un nouveau type d'activité
export async function POST(req: NextRequest) {
    try {
        const authToken = req.headers.get('Authorization')?.replace('Bearer ', '');

        if (!authToken) {
            return NextResponse.json(
                { error: 'Non autorisé - Token manquant' },
                { status: 401 }
            );
        }

        const authResult: AuthResult = await verifyAuthToken(authToken);
        if (!authResult.authenticated || !authResult.role || !["ADMIN_TOTAL", "ADMIN_PARTIEL"].includes(authResult.role)) {
            return NextResponse.json(
                { error: authResult.error || 'Non autorisé ou droits insuffisants' },
                { status: 401 }
            );
        }

        const data = await req.json();

        if (!data.name || !data.code) {
            return NextResponse.json(
                { error: 'Le nom et le code sont requis' },
                { status: 400 }
            );
        }

        const existingType = await prisma.activityType.findFirst({
            where: {
                code: data.code,
            },
        });

        if (existingType) {
            return NextResponse.json(
                { error: 'Un type d\'activité avec ce code existe déjà' },
                { status: 400 }
            );
        }

        const newActivityType = await prisma.activityType.create({
            data: {
                name: data.name,
                code: data.code,
                description: data.description || null,
                category: data.category,
                icon: data.icon || null,
                color: data.color || null,
                isActive: data.isActive !== undefined ? data.isActive : true,
                defaultDurationHours: data.defaultDurationHours !== undefined ? data.defaultDurationHours : null,
                defaultPeriod: data.defaultPeriod !== undefined ? data.defaultPeriod : null,
            },
        });

        return NextResponse.json(newActivityType, { status: 201 });
    } catch (error) {
        console.error('Erreur lors de la création du type d\'activité:', error);
        return NextResponse.json(
            { error: 'Erreur lors de la création du type d\'activité' },
            { status: 500 }
        );
    }
} 