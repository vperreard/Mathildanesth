import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware/withAuth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateLeaveSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  typeCode: z.string().optional(),
  reason: z.string().optional(),
  isHalfDay: z.boolean().optional(),
  halfDayPeriod: z.enum(['AM', 'PM']).nullable().optional(),
  countedDays: z.number().positive().optional(),
});

export const PUT = withAuth(async (request: NextRequest, context: any) => {
  try {
    const { params } = context;
    const leaveId = params.leaveId;
    const userId = request.auth.userId;
    const userRole = request.auth.role;

    // Validation du corps de la requête
    const body = await request.json();
    const validatedData = updateLeaveSchema.parse(body);

    // Vérifier que le congé existe
    const existingLeave = await prisma.leave.findUnique({
      where: { id: leaveId },
      include: {
        user: true,
      },
    });

    if (!existingLeave) {
      return NextResponse.json({ error: 'Congé non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions
    const isOwner = existingLeave.userId === userId;
    const isAdmin = userRole === 'ADMIN_TOTAL' || userRole === 'ADMIN_PARTIEL';

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Non autorisé à modifier ce congé' }, { status: 403 });
    }

    // Vérifier que le congé n'est pas déjà validé (sauf pour les admins)
    if (!isAdmin && existingLeave.status === 'APPROVED') {
      return NextResponse.json(
        { error: 'Impossible de modifier un congé déjà validé' },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (validatedData.startDate) {
      updateData.startDate = new Date(validatedData.startDate);
    }

    if (validatedData.endDate) {
      updateData.endDate = new Date(validatedData.endDate);
    }

    if (validatedData.typeCode !== undefined) {
      updateData.typeCode = validatedData.typeCode;
    }

    if (validatedData.reason !== undefined) {
      updateData.reason = validatedData.reason;
    }

    if (validatedData.isHalfDay !== undefined) {
      updateData.isHalfDay = validatedData.isHalfDay;
    }

    if (validatedData.halfDayPeriod !== undefined) {
      updateData.halfDayPeriod = validatedData.halfDayPeriod;
    }

    if (validatedData.countedDays !== undefined) {
      updateData.countedDays = validatedData.countedDays;
    }

    // Mettre à jour le congé
    const updatedLeave = await prisma.leave.update({
      where: { id: leaveId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
          },
        },
        leaveType: true,
        validatedBy: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
    });

    // Créer une entrée d'audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_LEAVE',
        entityType: 'LEAVE',
        entityId: leaveId,
        userId: userId,
        details: {
          updatedFields: Object.keys(updateData),
          previousValues: existingLeave,
          newValues: updatedLeave,
        },
      },
    });

    return NextResponse.json(updatedLeave);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du congé:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur lors de la mise à jour du congé' }, { status: 500 });
  }
});
