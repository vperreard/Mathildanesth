import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createSkillSchema } from '@/lib/schemas/skillSchemas';
import { getCurrentUser, isAdmin, handleApiError } from '@/lib/apiUtils';

// GET /api/skills - Liste toutes les compétences avec cache et optimisations
export async function GET(request: NextRequest) {
    try {
        // Cache de 5 minutes pour les compétences (rarement modifiées)
        const skills = await prisma.skill.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                description: true,
                category: true,
                isActive: true,
                createdAt: true
            }
        });

        const response = NextResponse.json(skills);
        
        // Headers de cache pour optimiser les performances
        response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
        response.headers.set('X-Total-Count', skills.length.toString());
        
        return response;
    } catch (error: unknown) {
        return handleApiError(error, "Erreur lors de la récupération des compétences.");
    }
}

// POST /api/skills - Crée une nouvelle compétence (admin only)
export async function POST(request: NextRequest) {
    try {
        const currentUser = await getCurrentUser();

        if (!isAdmin(currentUser)) {
            return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
        }

        const body = await request.json();
        const validation = createSkillSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                message: "Données invalides.",
                errors: validation.error.flatten().fieldErrors
            }, { status: 400 });
        }

        const { name, description } = validation.data;

        // Vérifier qu'une compétence avec le même nom n'existe pas déjà
        const existingSkill = await prisma.skill.findFirst({
            where: { name: { equals: name, mode: 'insensitive' } }
        });

        if (existingSkill) {
            return NextResponse.json({
                message: "Une compétence avec ce nom existe déjà."
            }, { status: 409 });
        }

        const newSkill = await prisma.skill.create({
            data: {
                name,
                description
            }
        });

        return NextResponse.json(newSkill, { status: 201 });
    } catch (error: unknown) {
        return handleApiError(error, "Erreur lors de la création de la compétence.");
    }
} 