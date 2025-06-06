import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { prisma } from '@/lib/prisma';
import { getServerSession } from '@/lib/auth/migration-shim';
import { authOptions } from '@/lib/auth/migration-shim';
import { z } from 'zod';
import { LeaveType, LeaveStatus } from '@prisma/client';

const createAbsenceSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  type: z.nativeEnum(LeaveType),
  reason: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId =
      typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;
    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const absences = await prisma.absence.findMany({
      where: {
        userId,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    return NextResponse.json(absences);
  } catch (error: unknown) {
    logger.error('Erreur lors de la récupération des absences:', { error: error });
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = createAbsenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { startDate, endDate, type, reason } = validationResult.data;
    const userId =
      typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;

    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    // Vérification des chevauchements
    const overlappingAbsence = await prisma.absence.findFirst({
      where: {
        userId,
        OR: [
          {
            AND: [
              { startDate: { lte: new Date(startDate) } },
              { endDate: { gte: new Date(startDate) } },
            ],
          },
          {
            AND: [
              { startDate: { lte: new Date(endDate) } },
              { endDate: { gte: new Date(endDate) } },
            ],
          },
        ],
      },
    });

    if (overlappingAbsence) {
      return NextResponse.json(
        { message: 'Chevauchement avec une absence existante' },
        { status: 400 }
      );
    }

    const absence = await prisma.absence.create({
      data: {
        userId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        type,
        reason,
        status: LeaveStatus.PENDING,
      },
    });

    return NextResponse.json(absence, { status: 201 });
  } catch (error: unknown) {
    logger.error("Erreur lors de la création de l'absence:", { error: error });
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
