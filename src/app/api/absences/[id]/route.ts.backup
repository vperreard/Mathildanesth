import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth/authOptions';
import { prisma } from '@/lib/prisma';
import { LeaveType, LeaveStatus } from '@prisma/client';
import { z } from 'zod';

const updateAbsenceSchema = z.object({
  status: z.nativeEnum(LeaveStatus).optional(),
  typeDetail: z.string().optional(),
  impactPlanning: z.boolean().optional(),
  priority: z.number().optional(),
  comment: z.string().optional(),
  notify: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const resolvedParams = await params;
    const absenceId = resolvedParams.id;
    const userId =
      typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;

    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
    });

    if (!absence) {
      return NextResponse.json({ message: 'Absence non trouvée' }, { status: 404 });
    }

    if (absence.userId !== userId) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }

    return NextResponse.json(absence);
  } catch (error: unknown) {
    logger.error("Erreur lors de la récupération de l'absence:", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const resolvedParams = await params;
    const absenceId = resolvedParams.id;
    const userId =
      typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;

    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const body = await request.json();
    const validationResult = updateAbsenceSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
    });

    if (!absence) {
      return NextResponse.json({ message: 'Absence non trouvée' }, { status: 404 });
    }

    if (absence.userId !== userId) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }

    const { status, comment } = validationResult.data;

    const updatedAbsence = await prisma.absence.update({
      where: { id: absenceId },
      data: {
        ...(status && { status }),
        ...(comment !== undefined && { comment }),
      },
    });

    return NextResponse.json(updatedAbsence);
  } catch (error: unknown) {
    logger.error("Erreur lors de la mise à jour de l'absence:", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const resolvedParams = await params;
    const absenceId = resolvedParams.id;
    const userId =
      typeof session.user.id === 'string' ? parseInt(session.user.id) : session.user.id;

    if (typeof userId !== 'number' || isNaN(userId)) {
      return NextResponse.json({ error: 'ID utilisateur invalide' }, { status: 400 });
    }

    const absence = await prisma.absence.findUnique({
      where: { id: absenceId },
    });

    if (!absence) {
      return NextResponse.json({ message: 'Absence non trouvée' }, { status: 404 });
    }

    if (absence.userId !== userId) {
      return NextResponse.json({ message: 'Non autorisé' }, { status: 403 });
    }

    await prisma.absence.delete({
      where: { id: absenceId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error: unknown) {
    logger.error("Erreur lors de la suppression de l'absence:", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
