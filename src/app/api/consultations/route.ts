import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { z } from 'zod';
import { PrismaClient, Period } from '@prisma/client';

import { prisma } from "@/lib/prisma";

// Schéma de validation pour les paramètres de requête GET
const getQuerySchema = z.object({
    start: z.string().datetime({ message: 'La date de début doit être une date ISO valide' }),
    end: z.string().datetime({ message: 'La date de fin doit être une date ISO valide' }),
    userId: z.string().optional(),
    period: z.enum(['MATIN', 'APRES_MIDI', 'JOURNEE_ENTIERE']).optional(),
});

// Schéma de validation pour la création d'une consultation (POST)
const createConsultationSchema = z.object({
    date: z.string().datetime({ message: 'La date doit être une date ISO valide' }),
    userId: z.number().int().positive(),
    period: z.enum(['MATIN', 'APRES_MIDI', 'JOURNEE_ENTIERE']),
    notes: z.string().optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    specialtyId: z.number().int().positive().optional(),
    siteId: z.string().optional(),
});

// Schéma de validation pour la mise à jour d'une consultation (PATCH)
const updateConsultationSchema = z.object({
    id: z.string().uuid(),
    period: z.enum(['MATIN', 'APRES_MIDI', 'JOURNEE_ENTIERE']).optional(),
    notes: z.string().optional(),
    heureDebut: z.string().optional(),
    heureFin: z.string().optional(),
    specialtyId: z.number().int().positive().optional(),
    siteId: z.string().optional(),
});

/**
 * GET /api/consultations
 * Récupère les consultations entre deux dates, avec filtres optionnels
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const startParam = searchParams.get('start');
    const endParam = searchParams.get('end');
    const userIdParam = searchParams.get('userId');
    const periodParam = searchParams.get('period') as Period | null;

    // Validation des paramètres
    const validationResult = getQuerySchema.safeParse({
        start: startParam,
        end: endParam,
        userId: userIdParam,
        period: periodParam
    });

    if (!validationResult.success) {
        return NextResponse.json(
            { error: 'Paramètres de requête invalides', details: validationResult.error.errors },
            { status: 400 }
        );
    }

    const { start, end, userId, period } = validationResult.data;

    try {
        // Convertir les chaînes en objets Date
        const startDate = new Date(start);
        const endDate = new Date(end);

        // Construire les conditions de recherche
        const whereConditions: any = {
            date: {
                gte: startDate,
                lte: endDate,
            },
            type: 'CONSULTATION'
        };

        // Ajouter les filtres optionnels
        if (userId) {
            whereConditions.userId = parseInt(userId, 10);
        }

        if (period) {
            whereConditions.period = period;
        }

        // Récupérer les consultations depuis la base de données
        const consultations = await prisma.attribution.findMany({
            where: whereConditions,
            include: {
                user: true,
                specialty: true,
                site: true
            },
            orderBy: [
                { date: 'asc' },
                { period: 'asc' }
            ]
        });

        return NextResponse.json({ consultations });

    } catch (error: unknown) {
        logger.error('Erreur API [GET /api/consultations]:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur serveur lors de la récupération des consultations.', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST /api/consultations
 * Crée une nouvelle consultation
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json();

        // Validation des données
        const validationResult = createConsultationSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const consultationData = validationResult.data;

        // Conversion de la date
        const date = new Date(consultationData.date);

        // Création de la consultation
        const consultation = await prisma.attribution.create({
            data: {
                date,
                userId: consultationData.userId,
                type: 'CONSULTATION',
                period: consultationData.period,
                notes: consultationData.notes,
                heureDebut: consultationData.heureDebut,
                heureFin: consultationData.heureFin,
                specialtyId: consultationData.specialtyId,
                siteId: consultationData.siteId,
                statut: 'PREVU'
            },
            include: {
                user: true,
                specialty: true,
                site: true
            }
        });

        return NextResponse.json({ consultation }, { status: 201 });
    } catch (error: unknown) {
        logger.error('Erreur API [POST /api/consultations]:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur serveur lors de la création de la consultation.', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/consultations
 * Met à jour une consultation existante
 */
export async function PATCH(request: NextRequest) {
    try {
        const data = await request.json();

        // Validation des données
        const validationResult = updateConsultationSchema.safeParse(data);

        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Données invalides', details: validationResult.error.errors },
                { status: 400 }
            );
        }

        const { id, ...updateData } = validationResult.data;

        // Vérifier si la consultation existe et est de type CONSULTATION
        const existingConsultation = await prisma.attribution.findFirst({
            where: {
                id,
                type: 'CONSULTATION'
            }
        });

        if (!existingConsultation) {
            return NextResponse.json(
                { error: 'Consultation non trouvée' },
                { status: 404 }
            );
        }

        // Mise à jour de la consultation
        const updatedConsultation = await prisma.attribution.update({
            where: { id },
            data: updateData,
            include: {
                user: true,
                specialty: true,
                site: true
            }
        });

        return NextResponse.json({ consultation: updatedConsultation });
    } catch (error: unknown) {
        logger.error('Erreur API [PATCH /api/consultations]:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur serveur lors de la mise à jour de la consultation.', details: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/consultations
 * Supprime une consultation
 */
export async function DELETE(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json(
            { error: 'ID de consultation manquant' },
            { status: 400 }
        );
    }

    try {
        // Vérifier si la consultation existe et est de type CONSULTATION
        const existingConsultation = await prisma.attribution.findFirst({
            where: {
                id,
                type: 'CONSULTATION'
            }
        });

        if (!existingConsultation) {
            return NextResponse.json(
                { error: 'Consultation non trouvée' },
                { status: 404 }
            );
        }

        // Suppression de la consultation
        await prisma.attribution.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        logger.error('Erreur API [DELETE /api/consultations]:', error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { error: 'Erreur serveur lors de la suppression de la consultation.', details: error.message },
            { status: 500 }
        );
    }
} 